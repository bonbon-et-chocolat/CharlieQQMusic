'use strict';
const request  = require('../util/request');
const moment = require('moment-timezone');

async function _getChannel() { 
    return request({
        url: 'https://api.bilibili.com/x/web-interface/web/channel/featured/list?channel_id=751970&filter_type=0&page_size=100',
        data: {}
    });
}

async function getChannel() {
    const results = await _getChannel();
    return{
        updatedAt: Date.now(),
        data: results.data.list.map( ({name, view_count, like_count, bvid }) => {
            return{
                title: name,
                view_count,
                like_count,
                bvid
            }
        })
    };
}

async function getUploaded() {
    const results = await request({
        url: 'https://api.bilibili.com/x/space/arc/search?mid=3404595&ps=30&tid=0&pn=1&keyword=&order=click&jsonp=jsonp',
        data: {}
    });
    return{
        updatedAt: Date.now(),
        data: results.data.list.vlist.map( ({title, play, comment, bvid }) => {
            return{
                title,
                view_count: play,
                comment_count: comment,
                bvid
            }
        })
    };
}

module.exports = {
    getChannel,
    getUploaded
}