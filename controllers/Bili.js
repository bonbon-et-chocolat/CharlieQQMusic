'use strict';
const request  = require( '../util/request' );
const moment = require( 'moment-timezone' );
const db = require( '../util/db' );
const CHANNEL_META = 'https://api.bilibili.com/x/web-interface/web/channel/detail?channel_id=751970';
const CHANNEL_FEATURED = 'https://api.bilibili.com/x/web-interface/web/channel/featured/list?channel_id=751970&filter_type=0&page_size=30';
const UPLOADED = 'https://api.bilibili.com/x/space/arc/search?mid=3404595&ps=30&tid=0&pn=1&keyword=&order=click&jsonp=jsonp';
const FOLLOWERS = 'https://api.bilibili.com/x/relation/stat?vmid=3404595&jsonp=jsonp';
const{ Builder, By, until } = require( 'selenium-webdriver' );
const chrome = require( 'selenium-webdriver/chrome' );

async function _get( url ){
    return request({
        url: url,
        data: {}
    });
}

function _getToday() {
    return moment().tz( 'Asia/Shanghai' ).format().substring( 0, 10 );
}
function _getYesterday() {
    return moment().tz( 'Asia/Shanghai' ).subtract( 1, 'days' ).format().substring( 0, 10 );
}
async function getOldViewCounts( client, date=_getToday(), bReadCache=true ) {
    const cachekey = date+'bilihistory';
    let cached = global[ cachekey ];
    if( bReadCache && cached ) {
        return cached;
    }
    let result = await db.findBiliHistoryData( client, date );
    if( !result ) {
        result = await updateYesterday();
    }
    if( bReadCache ) {
        global[ cachekey ] = result;
    }
    return result;
}

async function _getData() {
    const[
        channelMeta,
        featured,
        uploaded,
        followers
    ] = await Promise.all( [
        _get( CHANNEL_META ),
        _get( CHANNEL_FEATURED ),
        _get( UPLOADED ),
        _get( FOLLOWERS )
    ] );

    return{
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
    if( typeof yesterday === 'object' ) {
        yesterday = yesterday.data;
    }
    if( n % 1 !== 0 || yesterday%1 !==0 ) {
        return Number( ( n-yesterday ).toFixed( 1 ) );
    }
    return n - yesterday;
}

async function getReportData( date=_getToday() ) {
    let client = global.client;
    const[ history, current ] = await Promise.all( [
        getOldViewCounts( client, date ),
        _getData()
    ] );
    const data = _formatData( history, current );
    return data;
}

function formatFeatured( results, history, bPersist ) {
    if( bPersist ) {
        let result = {};
        results.data.list.forEach( ({ view_count, bvid }) => {
            let data = Number( view_count.match( /\d+\.*\d+/g ) );
            result[bvid] = {
                data: data,
                increase: _getDiff( data, history.featured[bvid] )
            };
        });
        return result;
    }
    return results.data.list.map( ({ name, view_count, like_count, bvid }) => {
        view_count = Number( view_count.match( /\d+\.*\d+/g ) );
        return{
            title: name,
            view_count,
            like_count,
            bvid,
            increase: _getDiff( view_count, history.featured[bvid] ),
            previous_increase: history.featured[bvid] ? history.featured[bvid].increase : 0
        };
    });
}

function formatUploaded( results, history, bPersist ) {
    if( bPersist ) {
        let result = {};
        results.data.list.vlist.forEach( ({ bvid, play }) => {
            result[bvid] = {
                data: play,
                increase: _getDiff( play, history.uploaded[bvid] )
            };
        });
        return result;
    }
    return results.data.list.vlist.map( ({ title, play, comment, bvid }) => {
        return{
            title,
            view_count: play,
            comment_count: comment,
            bvid,
            increase: _getDiff( play, history.uploaded[bvid] ),
            previous_increase: history.uploaded[bvid] ? history.uploaded[bvid].increase : 0
        };
    });
}

function formatChannelMeta( results, history ) {
    let{ archive_count, featured_count, subscribed_count, view_count } = results.data;
    const video_count = Number( archive_count.match( /\d+\.*\d+/g ) );//视频总数,
    view_count = Number( view_count.match( /\d+\.*\d+/g ) );//观看
    return{
        video_count, //视频总数
        featured_count, //精选视频
        subscribed_count, //订阅
        view_count, //观看
        subscribed_increase: _getDiff( subscribed_count, history.channelMeta.subscribed_count ) //订阅增长
    };
}

function formatUpStats( followers, history ) {
    return{
        followers: followers.data.follower,
        increase: _getDiff( followers.data.follower, history.upstats.followers )
    };
}

function _formatData( history, { channelMeta, featured, uploaded, followers }, bPersist ) {
    return{
        timestamp: Date.now(),
        channelMeta: formatChannelMeta( channelMeta, history ),
        featured: formatFeatured( featured, history, bPersist ),
        uploaded: formatUploaded( uploaded, history, bPersist ),
        upstats: formatUpStats( followers, history )
    };
}
async function updateYesterday() {
    let client = global.client;
    const date = _getToday();
    const cachekey = date+'bilihistory';

    try {
        const[ history, current ] = await Promise.all( [
            getOldViewCounts( client, _getYesterday(), false ),
            _getData()
        ] );
        const data = _formatData( history, current, true );
        data.updatedAt = date;
        await db.updateBiliHistoryData( client, date, data );
        global[ cachekey ] = data;
    } catch( err ) {
        console.log( err.stack );
    }
}

async function getVideoID( bvid ) {
    const cidResp = await _get( `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}` );
    const cid = cidResp.data[0].cid;
    return cid;
}

async function getVideoStat( bvid='BV1EK4y197wF', cid ) {
    if( !cid ) {
        cid = await getVideoID( bvid );
    }
    const result = await _get( `https://api.bilibili.com/x/web-interface/view?cid=${cid}&bvid=${bvid}` );
    const stat = result.data.stat;
    const prev = global[bvid];
    stat.increase = stat.view - prev;
    global[bvid] = stat.view;
    try {
        const count = await getWatchCount( bvid );
        stat.watchers = count;
    } catch( e ) {
        stat.watchers = 0;
    }
    return stat;
}

const findElement = async ( driver ) => {
    const xpath = '//div/span[@class="bilibili-player-video-info-people-number" and text() != "1"]';
    const element = driver.wait( until.elementLocated( By.xpath( xpath ) ), 20000 );
    const result = await element.getText();
    return Number( result );
};
function createChrome() {
    try {

        let options = new chrome.Options();
        //Below arguments are critical for Heroku deployment
        options.addArguments( '--disable-gpu' );
        options.addArguments( '--no-sandbox' );
        options.addArguments( '--headless' );
        return new Builder()
        .forBrowser( 'chrome' )
        .setChromeOptions( options )
        .build();
    } catch( e ) {
        console.log( e );
    }
}
async function getWatchCount( bvid ) {
    let driver = createChrome();
    if( !driver ) {
        return 0;
    }
    try {
        console.log( bvid );
        driver.get( `https://www.bilibili.com/video/${bvid}` );
        return findElement( driver );
    } catch( e ) {
        return e;
    } finally{
        driver.quit();
    }
}

async function getStats() {
    const ts = Date.now();
    const[ wy, zs ] = await Promise.all( [
        getVideoStat( 'BV1C44y1B7Sb', '356293048' ),
        getVideoStat( 'BV1EK4y197wF', '355999502' )
    ] );
    await db.updateWYStats( global.client, wy, ts );
    await db.updateZSStats( global.client, zs, ts );
    return{
        wy,
        zs
    };
}

module.exports = {
    getReportData,
    updateYesterday,
    getOldViewCounts,
    getVideoStat,
    getStats,
    getWatchCount
};
