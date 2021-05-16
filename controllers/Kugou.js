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
            title: filename.replace( /^.*-\s/, '' ),
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

    records.forEach( ( details ) => {
        let cur = [];
        if( typeof details.data.info_list.map === 'function' ) {
            cur = details.data.info_list.map( ({ src_type, highest_ranking, hash, audio_name, accumulated_days }) => {
                return{ src_type, highest_ranking, hash, audio_name, accumulated_days };
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
    await db.updateKugouMeta( client, _getToday(), data );
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

module.exports = {
    getSingerInfo,
    getHonors,
    getSongs,
    updateMeta,
    updateHonors
};
