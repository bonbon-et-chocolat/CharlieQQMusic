'use strict';
const request  = require('../util/request');
const moment = require('moment-timezone');
const db = require("../util/db");

const MID = '003fA5G40k6hKc';
const PAGES = [1,2,3,4];
const NUM = 100;

async function _getHitSongs ({mid=MID}) {
    const songs = await Promise.all(PAGES.map(async (page) => {
        return request({
            url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
            data: {
                data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 0
                },
                singer: {
                    method: "GetSingerSongList",
                    module: "musichall.song_list_server",
                    param: {
                        singerMid: mid,
                        'begin':  (page - 1) * NUM,
                        num: NUM,
                        order: 1
                    }
                }
                })
            }
        });
    }));

    let result = [];
    songs.forEach((cur) => {
        if(cur && cur.singer) {
            result = result.concat(cur.singer.data.songList.filter( (song)=> {
                return song.songInfo.title.indexOf('伴奏')===-1
                && (song.songInfo.fnote===4001 || song.songInfo.fnote===4009)
                && song.songInfo.album.time_public
                && song.songInfo.album.time_public !== '1990-01-01'; }));
        }
    });
    return result;
}

async function _getTotalListenCount ({mid=MID}) {
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
                method: "get_singer_detail_info",
                module: "music.web_singer_info_svr",
                param: {
                    sort: 5,
                    singermid,
                    sin:  (page - 1) * num,
                    num,
                }
            }
            })
        }
    });
    const { songlist, extras } = result.singer.data;
    let weeklyListenCount = {};
    songlist.forEach((o, i) => {
        weeklyListenCount[o.mid] = extras[i] ? extras[i].listen_count : null;
    });

    return{
        weeklyListenCount,
        fansCount: result.singer.data.singer_info.fans,
    };
}

async function _getHitInfo(songMidList) {
    const requestCount = songMidList.length/10;
    const lists = [];
    for(let i=0; i<requestCount; i++ ) {
        lists.push(songMidList.slice(i*10, i*10+9));
    }

    const results = await Promise.all(lists.map(async (list) => {
        return request({
            url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
            data: {
                data: JSON.stringify({
                    comm: {
                        ct: 24,
                        cv: 0
                    },
                    singer: {
                        method: "GetPlayTopData",
                        module: "music.musicToplist.PlayTopInfoServer",
                        param: {
                            songMidList: list
                        }
                    }
                })
            }
        });
    }));

    return results.reduce((val, cur) => {
        if(cur && cur.singer) {
            return Object.assign(val, cur.singer.data.data);
        }
    },{});
}

async function _getFavInfo(param) {
    const result = await request({
        url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
        data: {
            data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 0
                },
                singer: {
                    method: "GetSongFansNumberById",
                    module: "music.musicasset.SongFavRead",
                    param
                }
            })
        }
    })
    return result.singer.data.m_numbers;
}

function _sortByFavCount( {favCount: favA}, {favCount: favB}) {
    if (favA > favB) return -1;
    else return 1;
}

function _getLiveData({ hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp }) {
    let totalListenCount = 0;
    const details =
    hitSongs
    .map( ( {songInfo:song} ) => {
        const formatted = (({ id, mid, title }) => ({ id, mid, title }))(song);
        const { record, score, listenCnt } = hitInfo[song.mid] || {};
        formatted.timePublic = song.album.time_public;
        formatted.record = record ? record.data : undefined;
        formatted.score = score;
        formatted.weeklyListenCount = weeklyListenCountInfo.weeklyListenCount[song.mid];
        if( listenCnt ) {
            let [ count ] = listenCnt.match(/\d+/g);
            formatted.hitListenCount = parseInt( count );
            totalListenCount += formatted.hitListenCount;
        }
        formatted.favCount = favInfo[song.id];
        return formatted;
    })
    .sort(_sortByFavCount);
    return{
        timestamp,
        updatedAt,
        totalListenCount,
        fansCount: weeklyListenCountInfo.fansCount,
        details,
    };
}

async function getExistingData( client, query={} ) {
    const date = query.date ? query.date : moment().tz('Asia/Shanghai').format().substring(0, 10);
    const result = await db.findByDate( client, date );
    if( !result ) {
        throw new Error ('Not found.');
    }
    return result;
}

async function getLiveData( query={} ) {
    const updatedAt = moment().tz('Asia/Shanghai').format();
    const [hitSongs, weeklyListenCountInfo] = await Promise.all([_getHitSongs(query), _getTotalListenCount(query)]);
    const songIdList = hitSongs.map( song => song.songInfo.id);
    const songMidList = hitSongs.map( song => song.songInfo.mid);
    const [ hitInfo, favInfo ] = await Promise.all([_getHitInfo(songMidList), _getFavInfo({ v_songId: songIdList })]);
    return _getLiveData( { hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp: Date.now() } );
}

async function updateReportData() {
    let client = null;
    const {cache} = global;
    try{
        client = await db.connect();
        const data = await getLiveData();
        const date = moment().tz('Asia/Shanghai').format().substring(0, 10);
        await db.upsertOneByDate( client, date, data );
        cache.set( 'Songs', data );
        console.log( `Updated data for ${date}` );
        return data;
    } catch( err ) {
        console.log( err.stack );
    } finally {
        if( client ) {
            await client.close();
        }
    }
}

module.exports = {
    getLiveData,
    getExistingData,
    updateReportData
}
