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
        updatedAt: moment().tz('Asia/Shanghai'),
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

module.exports = {
    getChannel
}
