'use strict';
const request  = require( '../util/request' );
const moment = require( 'moment-timezone' );
const db = require( '../util/db' );

const MID = '003fA5G40k6hKc';
const PAGES = [ 1, 2, 3, 4, 5 ];
const NUM = 100;
const LVREN = '003zysEj2zeF4I';
const PIAOYANG = '003P20Zd3RYfoI';
const JINGYU = 101806738;
const BUSHUOHUA = 202837607;
async function search( req ){
    let{
        pageNo = 1,
        pageSize = 20,
        key,
        t // 0：单曲，2：歌单，7：歌词，8：专辑，9：歌手，12：mv
    } = req.query;
    const url = 'http://c.y.qq.com/soso/fcgi-bin/client_search_cp';

    let data = {
        format: 'json', // 返回json格式
        n: pageSize, // 一页显示多少条信息
        p: pageNo, // 第几页
        w: key, // 搜索关键词
        cr: 1, // 不知道这个参数什么意思，但是加上这个参数你会对搜索结果更满意的
        g_tk: 5381,
        t
    };

    const result = await request({
        url,
        method: 'get',
        data,
        headers: {
            Referer: 'https://y.qq.com'
        }
    });
    return result;
}

function _getToday() {
    return moment().tz( 'Asia/Shanghai' ).format().substring( 0, 10 );
}
function _getYesterday() {
    return moment().tz( 'Asia/Shanghai' ).subtract( 1, 'days' ).format().substring( 0, 10 );
}

async function _getHitSongs({ mid=MID }) {

    let pages = PAGES;
    if( mid!==MID ) {
        pages = [ 1 ];
    }
    const songs = await Promise.all( pages.map( async ( page ) => {
        return request({
            url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
            data: {
                data: JSON.stringify({
                    comm: {
                        ct: 24,
                        cv: 0
                    },
                    singer: {
                        method: 'GetSingerSongList',
                        module: 'musichall.song_list_server',
                        param: {
                            singerMid: mid,
                            'begin': ( page - 1 ) * NUM,
                            num: NUM,
                            order: 1
                        }
                    }
                })
            }
        });
    }) );

    let result = [];

    songs.forEach( ( cur ) => {
        if( cur && cur.singer ) {
            result = result.concat( cur.singer.data.songList.filter( ( song )=> {

                return song.songInfo.title.indexOf( '伴奏' )===-1
                // eslint-disable-next-line max-len
                && ( song.songInfo.fnote===0 || song.songInfo.fnote===4001 || song.songInfo.fnote===4009 || song.songInfo.mid === LVREN || song.songInfo.id === JINGYU || song.songInfo.mid === PIAOYANG )
                && song.songInfo.action
                && song.songInfo.action.msgdown!==3
                && song.songInfo.album.time_public
                && song.songInfo.album.time_public !== '1990-01-01';
            }) );
        }
    });

    if( mid === MID ) {
        result.push(
            { // eslint-disable-next-line max-len
                songInfo: { 'id': JINGYU, 'type': 0, 'mid': '004AkQIa1JTR6p', 'name': '化身孤岛的鲸', 'title': '化身孤岛的鲸', 'subtitle': '化身孤岛的鲸', 'singer': [ { 'id': 199509, 'mid': '003fA5G40k6hKc', 'name': '周深', 'title': '周深', 'type': 0, 'uin': 0, 'pmid': '' } ], 'album': { 'id': 1137013, 'mid': '0042uUzs3DnbSF', 'name': '化身孤岛的鲸 周深翻唱精选Vol. 1', 'title': '化身孤岛的鲸 周深翻唱精选Vol. 1', 'subtitle': '化身孤岛的鲸 周深翻唱精选Vol. 1', 'time_public': '2014-04-23', 'pmid': '001vLwvq0xltN3_1' }, 'mv': { 'id': 0, 'vid': '', 'name': '', 'title': '', 'vt': 0 }, 'interval': 234, 'isonly': 1, 'language': 0, 'genre': 0, 'index_cd': 0, 'index_album': 1, 'time_public': '2014-04-23', 'status': 0, 'fnote': 4009, 'file': { 'media_mid': '000qUMkO3ukMC2', 'size_24aac': 0, 'size_48aac': 1414660, 'size_96aac': 2855672, 'size_192ogg': 4981553, 'size_192aac': 5625508, 'size_128mp3': 3758899, 'size_320mp3': 9396959, 'size_ape': 0, 'size_flac': 25411006, 'size_dts': 0, 'size_try': 960887, 'try_begin': 0, 'try_end': 0, 'url': '', 'size_hires': 0, 'hires_sample': 0, 'hires_bitdepth': 0, 'b_30s': 0, 'e_30s': 60000, 'size_96ogg': 2579798 }, 'pay': { 'pay_month': 0, 'price_track': 0, 'price_album': 0, 'pay_play': 0, 'pay_down': 0, 'pay_status': 0, 'time_free': 0 }, 'action': { 'switch': 1, 'msgid': 23, 'alert': 24, 'icons': 9977724, 'msgshare': 0, 'msgfav': 0, 'msgdown': 0, 'msgpay': 0 }, 'ksong': { 'id': 16695069, 'mid': '0000jrm43kvAdx' }, 'volume': { 'gain': -8.239, 'peak': 0.99, 'lra': 12.65 }, 'label': '0', 'url': '', 'bpm': 0, 'version': 0, 'trace': '', 'data_type': 0, 'modify_stamp': 0, 'pingpong': '', 'aid': 0, 'ppurl': '', 'tid': 0, 'ov': 0, 'sa': 0, 'es': '' }
            }
        );
        result.push(

            {
                songInfo: {
                    id: BUSHUOHUA,
                    'mid': '002ZnGIx1nSo9C',
                    'name': '不说话',
                    'title': '不说话',
                    'subtitle': '不说话',
                    'singer': [
                        {
                            'id': 199509,
                            'mid': '003fA5G40k6hKc',
                            'name': '周深'
                        }
                    ],
                    time_public: '2017-09-23',
                    fnote: 4009,
                    'album': { 'id': 2258846, 'mid': '004AB2hd4JzGhE',
                               'name': '大护法 电影原声音乐大碟', 'title': '大护法 电影原声音乐大碟', 'subtitle': '大护法》电影概念曲', 'time_public': '2017-09-23'
                    }
                }
            }
        );
    }

    return result;
}

async function _getTotalListenCount({ mid=MID }) {
    const singermid=mid, num=NUM, page=1;
    const result = await request({
        url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
        data: {
            data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 0
                },
                singer: {
                    method: 'get_singer_detail_info',
                    module: 'music.web_singer_info_svr',
                    param: {
                        sort: 5,
                        singermid,
                        sin: ( page - 1 ) * num,
                        num
                    }
                }
            })
        }
    });
    const{ songlist, extras } = result.singer.data;
    let weeklyListenCount = {};
    songlist.forEach( ( o, i ) => {
        weeklyListenCount[o.mid] = extras[i] ? extras[i].listen_count : null;
    });

    return{
        weeklyListenCount,
        fansCount: result.singer.data.singer_info.fans
    };
}

async function _getHitInfo( songMidList ) {
    const requestCount = songMidList.length/10;
    const lists = [];
    for( let i=0; i<requestCount; i++ ) {
        lists.push( songMidList.slice( i*10, i*10+10 ) );
    }

    const results = await Promise.all( lists.map( async ( list ) => {
        return request({
            url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
            data: {
                data: JSON.stringify({
                    comm: {
                        ct: 24,
                        cv: 0
                    },
                    singer: {
                        method: 'GetPlayTopData',
                        module: 'music.musicToplist.PlayTopInfoServer',
                        param: {
                            songMidList: list
                        }
                    }
                })
            }
        });
    }) );

    return results.reduce( ( val, cur ) => {
        if( cur && cur.singer ) {
            return Object.assign( val, cur.singer.data.data );
        }
    }, {});
}

async function _getFavInfo( param ) {
    const result = await request({
        url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
        data: {
            data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 0
                },
                singer: {
                    method: 'GetSongFansNumberById',
                    module: 'music.musicasset.SongFavRead',
                    param
                }
            })
        }
    });
    return result.singer.data.m_numbers;
}

function _sortByFavCount({ favCount: favA }, { favCount: favB }) {
    if( favA > favB ) return-1;
    else return 1;
}

function _getLiveData({ hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp }) {
    let totalListenCount = 0;
    const details =
    hitSongs
    .map( ({ songInfo: song }) => {
        const formatted = ( ({ id, mid, title }) => ({ id, mid, title }) )( song );
        let{ record, score, listenCnt } = hitInfo[song.mid] || {};
        formatted.timePublic = song.album.time_public;
        formatted.record = record ? record.data : undefined;
        formatted.score = score;
        if( formatted.mid === '004OQ5Mt0EmEzv' && !score ) {
            formatted.score = 431900;
            listenCnt = '40w+';
            formatted.record = [];
        }
        if( formatted.mid === LVREN && !score ) {
            formatted.score =87359;
            listenCnt = '1w+';
            formatted.record = [];
        }
        if( formatted.mid === '000kj4lV0HPCMz' && !score ) { //yishujia
            formatted.score = 87359;
            listenCnt = '10w+';
            formatted.record = [];
        }
        if( formatted.mid === '001DhP7M1fhLVC' && !score ) {
            formatted.score = 87359;
            listenCnt = '10w+';
            formatted.record = [];
        }
        if( listenCnt ) {
            let[ count ] = listenCnt.match( /\d+/g );
            formatted.hitListenCount = parseInt( count );
            totalListenCount += formatted.hitListenCount;
        }

        formatted.favCount = favInfo[song.id];
        return formatted;
    })
    .sort( _sortByFavCount );
    return{
        timestamp,
        updatedAt,
        totalListenCount,
        fansCount: weeklyListenCountInfo.fansCount,
        details
    };
}

async function getExistingData( client, query={}, suppressError=false ) {
    const date = query.date ? query.date : moment().tz( 'Asia/Shanghai' ).format().substring( 0, 10 );
    const result = await db.findByDate( client, date );
    if( !result && !suppressError ) {
        throw new Error ( 'Not found.' );
    }
    return result;
}

async function getLiveData( query={}) {
    const updatedAt = moment().tz( 'Asia/Shanghai' ).format();
    const[ hitSongs, weeklyListenCountInfo ] = await Promise.all( [ _getHitSongs( query ), _getTotalListenCount( query ) ] );
    const songIdList = hitSongs.map( song => song.songInfo.id );
    const songMidList = hitSongs.map( song => song.songInfo.mid );
    const[ hitInfo, favInfo ] = await Promise.all( [ _getHitInfo( songMidList ), _getFavInfo({ v_songId: songIdList }) ] );
    return _getLiveData({ hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp: Date.now() });
}

async function getYesterday( client, date=_getToday(), bReadCache=true ) {
    const cachekey = date+'qqhistory';
    let cached = global[ cachekey ];
    if( bReadCache && cached ) {
        return cached;
    }
    let result = await db.findQQHistoryData( client, date ) || {};
    if( bReadCache ) {
        global[ cachekey ] = result.data;
    }
    if( !result.data ) {
        await updateYesterday();
    }
    return global[ cachekey ];
}

async function updateYesterday() {
    let client = global.client;
    const date = _getToday();
    const cachekey = date+'qqhistory';

    try {
        const[ history, current ] = await Promise.all( [
            db.findQQHistoryData( client, _getYesterday() ),
            getLiveData()
        ] );
        const data = {};
        current.details.forEach( ({ id, favCount }) => {
            let oldFav = history.data[id] ? history.data[id].favCount : 0;
            data[id] = {
                favCount: favCount,
                inc: favCount - oldFav
            };
        });
        await db.updateQQHistoryData( client, date, {
            updatedAt: date,
            timestamp: Date.now(),
            data
        });
        global[ cachekey ] = data;
    } catch( err ) {
        console.log( err.stack );
    }
}

function _combine( today, yesterday ){
    today.details.forEach( song => {
        let oldData = yesterday&&yesterday[song.id] || {
            favCount: 0,
            inc: 0
        };
        song.increase = song.favCount - oldData.favCount;
        song.yesterdayInc = oldData.inc;
    });
    return today;
}

async function updateReportData( bUpdateDB=true ) {
    let client = global.client;
    let data = null;
    const curDate = _getToday();
    try {
        const[ yesterday, today ] = await Promise.all( [
            getYesterday( client ),
            getLiveData()
        ] );
        data = _combine( today, yesterday );
        if( bUpdateDB ){
            await db.upsertOneByDate( client, curDate, data );
        }
    } catch( err ) {
        console.log( err.stack );
    }
    global.reportData = data;
    console.log( `Updated data for ${new Date()}` );
    return data;
}

async function getOldPlayCounts( client, date=_getToday(), bReadCache=true ) {
    const cachekey = date+'qqlisthistory';
    let cached = global[ cachekey ];
    if( bReadCache && cached ) {
        return cached;
    }
    let result = await db.findQQPlaylistData( client, date );
    if( !result ) {
        result = await updateYesterdayPlaylist();
    }
    if( bReadCache ) {
        global[ cachekey ] = result;
    }
    return result;
}

async function updateYesterdayPlaylist() {
    let client = global.client;
    const date = _getToday();
    const cachekey = date+'qqlisthistory';

    try {
        const[ history, current ] = await Promise.all( [
            getOldPlayCounts( client, _getYesterday(), false ),
            getPlaylists()
        ] );
        const data = formatPlaylist( history, current, true );
        data.updatedAt = date;
        await db.updateQQPlaylistData( client, date, data );
        global[ cachekey ] = data;
    } catch( err ) {
        console.log( err.stack );
    }
}

function formatPlaylist( history, results, bPersist ) {
    if( bPersist ) {
        let result = {};
        results.forEach( ({ id, name, playCount })=>{
            result[id] = {
                name,
                listID: id,
                playCount,
                increase: playCount - history.data[id].playCount
            };
        });
        return{
            data: result
        };
    }
    return results.map( ({ id, name, playCount }) => {
        return{
            title: name,
            playCount,
            listID: id,
            increase: playCount - history.data[id].playCount,
            previous_increase: history.data[id] ? history.data[id].increase : 0
        };
    });
}

async function getPlaylistReportData( req, date=_getToday() ) {
    let client = global.client;
    try {
        const[ history, current ] = await Promise.all( [
            getOldPlayCounts( client, date ),
            getPlaylists()
        ] );
        const data = formatPlaylist( history, current );
        return data;
    } catch( err ) {
        console.log( err.stack );
    }
}

async function getPlaylists() {
    const results_raw = await request({
        url: 'http://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg',
        data: {
            type: 1,
            utf8: 1,
            disstid: [ 7503734031, 7520517030, 7039448240, 7337210245 ], // 歌单的id 团建 7937853998, 7912406056
            loginUin: 0
        },
        headers: {
            Referer: 'https://y.qq.com/n/yqq/playlist'
        }
    });
    const results = results_raw.cdlist.map( ({ visitnum, dissname, disstid })=> {
        return{
            playCount: visitnum,
            name: dissname,
            id: disstid
        };
    });
    return results;
}
module.exports = {
    getLiveData,
    getExistingData,
    updateReportData,
    getPlaylistReportData,
    updateYesterday,
    updateYesterdayPlaylist,
    search,
    getPlaylists
};
