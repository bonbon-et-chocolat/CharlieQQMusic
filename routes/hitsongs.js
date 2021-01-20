const request  = require('../util/request');
const moment = require('moment-timezone');
const fs = require('fs')
const db = require("../util/db");

const fsPromises = fs.promises;

const pathToCache = './public/cache';
const MID = '003fA5G40k6hKc';
const PAGES = [1,2,3,4];
const NUM = 100;

function formatNumberWithCommas(x) {
    try{
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err) {
        return '-';
    }
}

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
            result = result.concat(cur.singer.data.songList);
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

function _getReportData({ hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp }) {
    let totalListenCount = 0;
    const details = hitSongs.map( ( {songInfo:song} ) => {
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
    }).sort(_sortByFavCount);
    return{
        timestamp,
        updatedAt,
        totalListenCount,
        fansCount: weeklyListenCountInfo.fansCount,
        details,
    };
}

function _staleData(input) {
    const THREASHOLD = 1000 * 60 * 60 * 8; //hours
    const cutoff = Date.now() - THREASHOLD;
    return input < cutoff;
}

async function _getExistingData( req, client ) {
    const date = req.query.date ? req.query.date : moment().tz('Asia/Shanghai').format().substring(0, 10);
    const result = await db.findByDate( client, date );
    if( !result ) {
        throw new Error ('not_found');
    } else {
        return result;
    }
}

async function _getResponseData( req ) {
    const updatedAt = moment().tz('Asia/Shanghai').format();
    const [hitSongs, weeklyListenCountInfo] = await Promise.all([_getHitSongs(req.query), _getTotalListenCount(req.query)]);
    const songIdList = hitSongs.map( song => song.songInfo.id);
    const songMidList = hitSongs.map( song => song.songInfo.mid);
    const [ hitInfo, favInfo ] = await Promise.all([_getHitInfo(songMidList), _getFavInfo({ v_songId: songIdList })]);
    return _getReportData( { hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp: Date.now() } );
}
module.exports = {

    '/cache': async (req, res) => {
        const updatedAt = moment().tz('Asia/Shanghai').format();
        const date = updatedAt.substring(0, 10);
        let data = null;
        try {
            // reuse existing data if last updated less than 12 hours ago
            const archived = await fsPromises.readFile(`${pathToCache}/${date}.json`);
            data = JSON.parse( archived );
            if( _staleData(data.timestamp)) {
                throw new Error ('Data needs an update.');
            }
        } catch (err) {
            const [hitSongs, weeklyListenCountInfo] = await Promise.all([_getHitSongs(req.query), _getTotalListenCount(req.query)]);
            const songIdList = hitSongs.map( song => song.songInfo.id);
            const songMidList = hitSongs.map( song => song.songInfo.mid);
            const [ hitInfo, favInfo ] = await Promise.all([_getHitInfo(songMidList), _getFavInfo({ v_songId: songIdList })]);
            const timestamp = Date.now();
            data = _getReportData( { hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, timestamp } );
            await fsPromises.writeFile(`${pathToCache}/${date}.json`, JSON.stringify(data), { flag: 'w+' } );
        }
        
        if( req.query.format === 'json' ) {
            return res.send({
                data,
                result: data.details.length
            })
        }
        res.render('hitsongs', {
            data,
            util: {
                formatNumberWithCommas
            }
        });
    },

    '/': async (req, res) => {
        let data = null;
        let client = null;
        let _id = null;
        try {
            client = await db.connect();
            data = await _getExistingData( req, client );
            if(!req.query.date && _staleData(data.timestamp)) {
                _id = data._id;
                throw new Error( 'stale_data' );
            }
        } catch (err) {
            if( err.message === 'not_found' && req.query.date ) {
                await client.close();
                return res.status(404).send({error: 'Not Found'});
            }
            data = await _getResponseData( req );
            if(_id) {
                await db.updateOneById( client, _id, data );
            } else {
                await db.insertOne( client, data );
            }
        } finally {
            if( client ) {
                await client.close();
            }
        }
        
        if( req.query.format === 'json' ) {
            return res.send({
                data,
                result: data.details.length
            })
        }
        res.render('hitsongs', {
            data,
            util: {
                formatNumberWithCommas
            }
        });
    }
}
