'use strict';
const request  = require( '../util/request' );
const md5 = require( 'md5' );

const moment = require( 'moment-timezone' );
const db = require( '../util/db' );

function _getToday() {
    return moment().tz( 'Asia/Shanghai' ).format().substring( 0, 10 );
}
function _getYesterday() {
    return moment().tz( 'Asia/Shanghai' ).subtract( 1, 'days' ).format().substring( 0, 10 );
}

function getSongTitle( filename ) {
    return filename.replace( /^.*-\s/, '' );
}
const ChartConfig = {
    // 酷狗飙升榜
    UP_CHART: 6666,
    // 酷狗TOP500
    TOP_CHART: 8888,
    // 酷狗专辑畅销榜
    BEST_SELL_CHART: 30946,
    // 酷狗雷达榜
    LD_CHART: 37361,
    // 网络红歌榜
    INFLUENCER_CHART: 23784,
    // DJ热歌榜
    DJ_CHART: 24971,
    // 会员专享热歌榜
    MENBER_CHART: 35811,
    // 华语新歌榜
    HY_NEW_CHART: 31308,
    // 欧美新歌榜
    OM_NEW_CHART: 31310,
    // 韩国新歌榜
    KOREA_NEW_CHART: 31311,
    // 日本新歌榜
    JAPAN_NEW_CHART: 31312,
    // 粤语新歌榜
    CANTO_NEW_CHART: 31313,
    // ACG新歌榜
    ACG_NEW_CHART: 33162,
    // 酷狗分享榜
    SHARE_CHART: 21101,
    // 酷狗说唱榜
    RAP_CHART: 44412,
    // 国风新歌榜
    CHINOISERIE_NEW_CHART: 33161,
    // 综艺新歌榜
    SHOW_CHART: 46910,
    // 影视金曲榜
    TV_CHART: 33163,
    // 欧美金曲榜
    OM_HOT_CHART: 33166,
    // 粤语金曲榜
    CANTO_HOT_CHART: 33165
};

const singer_id = '169967';
// year listener, song count
async function _getSingerInfo(){
    const url = 'http://mobilecdngz.kugou.com/api/v3/singer/info';
    let query = {
        singerid: singer_id,
        singername: '周深',
        version: 10329,
        plat: 2,
        with_listener_index: 1
    };

    const{ data } = await request({
        url,
        method: 'get',
        data: query
    });
    return data;
}

// fan count
async function _getFans(){
    const url = 'https://gateway.kugou.com/api/v3/search/keyword_recommend_multi';
    let query = {
        apiver: 14,
        osversion: '6.0.1',
        plat: 0,
        nocorrect: 0,
        version: 0,
        userid: 0,
        keyword: '周深'
    };

    const{ data } = await request({
        url,
        method: 'get',
        data: query,
        headers: {
            'x-router': 'msearch.kugou.com'
        }
    });
    return data.info[0].extra;
}

// song meta
async function _getSongs(){
    const url = 'http://mobilecdnbj.kugou.com/api/v3/singer/song';
    let query = {
        singerid: singer_id,
        page: 1,
        pagesize: 100,
        sorttype: 0,
        area_code: 1
    };

    const{ data } = await request({
        url,
        method: 'get',
        data: query
    });
    return data.info.map( ({ filename, album_id, album_audio_id, audio_id, hash }, index ) => {
        return{
            index: index+1,
            title: getSongTitle( filename ),
            album_id, album_audio_id, audio_id, hash
        };
    });
}

async function _getSongRankTop( songIds=[ {
    album_audio_id: 38641536
}, {
    album_audio_id: 264086632
} ] ){
    const url = 'https://gateway.kugou.com/container/v1/rank/top';
    let query = {
        appid: 1005,
        clienttime: Date.now(),
        clientver: 10359,
        data: songIds,
        key: '',
        'mid': '147210170508080006059062317931575972186'
    };

    const{ data } = await request({
        url,
        method: 'post',
        data: query,
        headers: {
            'x-router': 'kmr.service.kugou.com'
        }
    });
    return data;
}
async function getSingerInfo() {
    const[ {
        year_listener
    }, {
        singer_energy_rank,
        singer_fans_count
    } ] = await Promise.all( [
        _getSingerInfo(),
        _getFans()
    ] );

    return{
        data: {
            year_listener,
            singer_energy_rank,
            singer_fans_count,
            updatedAt: moment().tz( 'Asia/Shanghai' ).format()
        }
    };
}

async function getSongs() {
    const songs = await _getSongs();

    const[ a, b, c, d, e ] = songs.map( ({ album_audio_id }) => {
        return{ album_audio_id };
    });
    let rank = await _getSongRankTop( [ a, b, c, d, e ] );

    return{
        songs,
        rank
    };
}

async function _getHonorWall() {
    const url = 'https://h5activity.kugou.com/v1/query_singer_honour_wall';
    const ts = Date.now();
    const HASH = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt';
    const original = `${HASH}clienttime=${ts}clientver=20000dfid=-mid=${ts}singer_id=169967srcappid=2919uuid=${ts}${HASH}`;
    let query = {
        singer_id,
        srcappid: '2919',
        clientver: '20000',
        clienttime: ts,
        mid: ts,
        uuid: ts,
        dfid: '-',
        signature: md5( original ).toUpperCase()
    };

    return request({
        url,
        method: 'get',
        data: query
    });
}
async function getHonors() {
    // meta
    const meta = await _getHonorWall();
    const total = meta.data.honour_num;
    // details
    let pageMax = Math.ceil( total/20 );
    let curPage = 1;
    let pages = [ curPage ];
    while( curPage < pageMax ) {
        pages.push( curPage+1 );
        curPage++;
    }
    const overview = meta.data.top500[0];
    const records = await Promise.all( pages.map( async ( page ) => {
        const url = 'https://h5activity.kugou.com/v1/query_singer_honour_detail';
        const ts = Date.now();
        const HASH = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt';
        const original = `${HASH}clienttime=${ts}clientver=20000dfid=-mid=${ts}page=${page}singer_id=169967srcappid=2919uuid=${ts}${HASH}`;
        let query = {
            singer_id,
            srcappid: '2919',
            clientver: '20000',
            page,
            clienttime: ts,
            mid: ts,
            uuid: ts,
            dfid: '-',
            signature: md5( original ).toUpperCase()
        };

        return request({
            url,
            method: 'get',
            data: query
        });
    }) );

    let result = [];
    let hashMap = {};
    records.forEach( ( details ) => {
        let cur = [];
        if( typeof details.data.info_list.map === 'function' ) {
            cur = details.data.info_list.map( ({ src_type, highest_ranking, hash, audio_name, accumulated_days, album_id, album_audio_id }) => {
                return{ src_type, highest_ranking, hash, audio_name, accumulated_days, album_id, album_audio_id };
            }).filter( ({ hash }) => {
                let isNewEntry = hashMap[hash] !== true;
                hashMap[hash] = true;
                return isNewEntry;
            });
        }
        result = result.concat( cur );
    });

    const updatedAt = moment().tz( 'Asia/Shanghai' ).format();
    return{
        data: {
            overview,
            details: result,
            updatedAt
        },
        tag: 'honors'
    };
}

async function updateMeta() {
    let client = global.client;
    let data = await getSingerInfo();
    await db.updateKugouMeta( client, _getToday(), {
        data,
        updatedAt: moment().tz( 'Asia/Shanghai' ).format()
    });
    global.kugouMeta = data;
    return data;
}

async function updateHonors() {
    let client = global.client;
    let data = await getHonors();
    await db.updateKugouHonors( client, data );
    global.kugouHonors = data;
    return data;
}

async function getChartSongs( chartID=8888 ) {
    // chart meta
    let[ meta, songs ] = await Promise.all( [
        request({
            url: 'http://mobilecdnbj.kugou.com/api/v3/rank/info',
            method: 'get',
            data: {
                version: 9108,
                rankid: chartID
            }
        }),
        request({
            url: 'http://mobilecdnbj.kugou.com/api/v3/rank/song',
            method: 'get',
            data: {
                version: 9108,
                rankid: chartID,
                page: 1,
                pagesize: 500
            }
        })
    ] );
    let songList =[];
    let ts = null;
    if( songs.data && songs.data.info && typeof songs.data.info.map === 'function' ) {
        ts = songs.data.timestamp;
        songList = songs.data.info
        .map( ( song, index ) => {
            return{
                title: song.filename,
                rank: index+1
            };
        })
        .filter( song => song.title.includes( '周深' ) )
        .map( ( song ) => {
            song.title = getSongTitle( song.title );
            return song;
        });
    }
    return{
        timestamp: ts,
        listID: chartID,
        title: meta.data.rankname,
        intro: meta.data.intro,
        song: songList
    };
}

async function getCharts( chartIds = Object.values( ChartConfig ), time = moment().tz( 'Asia/Shanghai' ).format( 'YYYY-MM-DD' ) ) {
    let results = await Promise.all( chartIds.map( async ( id ) => {
        return getChartSongs( id );
    }) );
    results = results.filter( chart => chart.song.length > 0 );
    return{
        updatedAt: time,
        data: results
    };
}

module.exports = {
    getSingerInfo,
    getHonors,
    getSongs,
    getChartSongs,
    getCharts,
    updateMeta,
    updateHonors
};
