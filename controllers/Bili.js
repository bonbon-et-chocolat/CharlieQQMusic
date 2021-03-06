'use strict';
const request  = require('../util/request');
const moment = require('moment-timezone');
const db = require("../util/db");
const CHANNEL_META = 'https://api.bilibili.com/x/web-interface/web/channel/detail?channel_id=751970';
const CHANNEL_FEATURED = 'https://api.bilibili.com/x/web-interface/web/channel/featured/list?channel_id=751970&filter_type=0&page_size=30';
const UPLOADED = 'https://api.bilibili.com/x/space/arc/search?mid=3404595&ps=30&tid=0&pn=1&keyword=&order=click&jsonp=jsonp';
const FOLLOWERS = 'https://api.bilibili.com/x/relation/stat?vmid=3404595&jsonp=jsonp';
async function _get( url ){
    return request({
        url: url,
        data: {}
    });
}
async function getOldViewCounts( client, date= moment().tz('Asia/Shanghai').format().substring(0, 10) ) {
    const cachekey = date+'bilihistory';
    let cached = global[ cachekey ];
    if(cached) {
        return cached;
    }
    const result = await db.findBiliHistoryData(client, date);
    global[ cachekey ] = result;
    return result;
}

async function _getData() { 
    const [
        channelMeta,
        featured,
        uploaded,
        followers
    ] = await Promise.all([
        _get( CHANNEL_META ),
        _get( CHANNEL_FEATURED ),
        _get( UPLOADED ),
        _get( FOLLOWERS )
    ]);

    return {
        channelMeta,
        featured,
        uploaded,
        followers
    };
}

function _getDiff( n, yesterday ) {
    if( !yesterday ) {
        return 0;
    }
    if( Number(n) === n && n % 1 !== 0 ) {
        return Number((n-yesterday).toFixed(1));
    }
    return n - yesterday;
}

async function getReportData( date= moment().tz('Asia/Shanghai').format().substring(0, 10) ) {
    const client = await db.connect();
    const [ history, current ] = await Promise.all([
        getOldViewCounts( client, date ),
        _getData()
    ]);
    const data = _formatData( history, current );
    return data;
}

function formatFeatured(results, history) {
    return results.data.list.map( ({name, view_count, like_count, bvid }) => {
        view_count = Number(view_count.match(/\d+\.*\d+/g));
        return{
            title: name,
            view_count,
            like_count,
            bvid,
            increase: _getDiff( view_count, history.featured[bvid] )
        }
    });
}

function formatUploaded(results, history) {
    return results.data.list.vlist.map( ({title, play, comment, bvid }) => {
        return{
            title,
            view_count: play,
            comment_count: comment,
            bvid,
            increase: _getDiff( play, history.uploaded[bvid] )
        }
    })
}

function formatChannelMeta(results, history) {
    let { archive_count, featured_count, subscribed_count, view_count } = results.data;
    const video_count = Number(archive_count.match(/\d+\.*\d+/g));//视频总数,
    view_count = Number(view_count.match(/\d+\.*\d+/g));//观看
    return {
        video_count,//视频总数
        featured_count, //精选视频
        subscribed_count,//订阅
        view_count,//观看
        subscribed_increase: _getDiff( subscribed_count, history.channelMeta.subscribed_count ) //订阅增长
    }
}

function formatUpStats( followers, history ) {
    return {
        followers: followers.data.follower,
        increase: _getDiff( followers.data.follower, history.upstats.followers )
    }
}

function _formatData( history, {channelMeta, featured, uploaded, followers}) {
    return{
        updatedAt: Date.now(),
        channelMeta: formatChannelMeta( channelMeta, history ),
        featured: formatFeatured( featured, history ),
        uploaded: formatUploaded( uploaded, history ),
        upstats: formatUpStats( followers, history )
    }
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
    getReportData,
    updateYesterday,
    getOldViewCounts
}
