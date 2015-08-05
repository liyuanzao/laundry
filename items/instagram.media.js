'use strict';

var Autolinker = require('autolinker'); // https://github.com/gregjacobs/Autolinker.js

// Item which describes an Instagram object
ns('Items.Instagram', global);
Items.Instagram.Media = function(config) {
    this.type = null;
    this.comments = null;
    this.likes = 0;
    this.image = null;
    this.caption = null;
    this.authorpic = null;

    Item.call(this, config);
    this.className = Helpers.buildClassName(__filename);
};

Items.Instagram.Media.prototype = Object.create(Item.prototype);
Items.Instagram.Media.className = Helpers.buildClassName(__filename);

// Given a collection of API responses, perform downloads and construct Item objects.
Items.Instagram.Media.download = function(jobName, objects, params, callback) {
    Item.download(jobName, Items.Instagram.Media, objects, params, callback);
};

// An object passed to async.parallel() which handles downloading of files.
Items.Instagram.Media.downloadLogic = function(prefix, obj, oldKeys, newKeys, params) {
    return {
        image: function(callback) {
            var target = prefix + '/' + obj.id + '.jpg';
            newKeys.push(target);
            Helpers.uploadUrl(obj.images.standard_resolution.url, target, oldKeys, false, callback);
        },
        video: function(callback) {
            var target = prefix + '/' + obj.id + '.mp4';
            newKeys.push(target);
            Helpers.uploadUrl(obj.videos ? obj.videos.standard_resolution.url : null, target, oldKeys, false, callback);
        }
    };
};

// Construct an Item given an API response and any upload info.
Items.Instagram.Media.factory = function(post, uploads) {
    var item = new Items.Instagram.Media({
        tags: post.tags,
        type: post.type,
        comments: post.comments,
        date: moment.unix(post.created_time),
        url: post.link,
        likes: post.likes,
        image: uploads.image.newUrl,
        video: uploads.video.newUrl,
        caption: post.caption ? post.caption.text : null,
        author: post.user.username,
        authorpic: post.user.profile_picture,
        mediaUrl: uploads.video.newUrl
    });

    item.title = item.author;
    if (item.caption) {
        item.title += ': ' + Helpers.shortenString(item.caption, 30);
    }

    if (!item.video) {
        item.description = util.format('<p><a href="%s"><img src="%s" width="640" height="640"/></a></p>', item.url, item.image);
    } else {
        item.description = Item.buildVideo(item.video, item.image);
    }

    if (item.caption) {
        item.description += util.format('<p>%s</p>', Items.Instagram.Media.linkify(item.caption));
    }

    if (item.likes.data.length) {
        item.description += util.format('<p>%d likes: ', item.likes.count);
        item.likes.data.forEach(function(like, index, list) {
            item.description += util.format('<a href="http://instagram.com/%s">%s</a>', like.username, like.username);
            if (index < list.length - 1) {
                item.description += ', ';
            }
        });
        item.description += '</p>';
    }

    if (item.comments.data.length) {
        item.description += util.format('<p>%d comments:</p>', item.comments.count);
        item.comments.data.forEach(function(comment) {
            item.description += util.format('<p><strong><a href="http://instagram.com/%s">%s</a>:</strong> %s</p>', comment.from.username, comment.from.username, Items.Instagram.Media.linkify(comment.text));
        });
    }

    return item;
};

// Link usernames, tags, and urls.
Items.Instagram.Media.linkify = function(str) {
    str = str.replace(/@([\w.]+)/g, '<a href="http://instagram.com/$1">@$1</a>');
    str = str.replace(/#([\w]+)/g, '<a href="https://instagram.com/explore/tags/$1/">#$1</a>');
    str = Autolinker.link(str);
    return str;
};

module.exports = Items.Instagram.Media;
