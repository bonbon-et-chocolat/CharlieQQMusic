'use strict';
const request  = require('../util/request');
const moment = require('moment-timezone');
const db = require("../util/db");

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

async function updateChannel( client, date ) {
    const {data:channel} = await getChannel();
    let result = {};
    channel.forEach( ({bvid, view_count}) => {
        result[bvid] = view_count;
    });
    await db.updateBiliChannelData( client, date, { updatedAt: date, "data": result });
}

async function updateUploaded( client, date ) {
    const {data:uploaded} = await getUploaded();
    let result = {};
    uploaded.forEach( ({bvid, view_count}) => {
        result[bvid] = view_count;
    });
    await db.updateBiliVideoData( client, date, { updatedAt: date, "data": result });
}
async function updateYesterday() {
    let client = null;
    const date = moment().tz('Asia/Shanghai').format().substring(0, 10);
    try{
        client = await db.connect();
        await updateChannel(client, date);
        await updateUploaded(client, date);
    } catch( err ) {
        console.log( err.stack );
    } finally {
        if( client ) {
            await client.close();
        }
    }
}

module.exports = {
    getChannel,
    getUploaded,
    updateYesterday
}
