const request  = require('../util/request');
const moment = require('moment-timezone');
const fs = require('fs')
const fsPromises = fs.promises;

const pathToCache = './public/cache';

function formatNumberWithCommas(x) {
    try{
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err) {
        return '-';
    }
}

async function _getHitSongs () {
    const pages = [1,2,3,4];

    const songs = await Promise.all(pages.map(async (page) => {
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
                        singerMid: '003fA5G40k6hKc',
                        'begin':  (page - 1) * 100,
                        num: 100,
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

async function _getTotalListenCount () {
    const singermid='003fA5G40k6hKc', num=100, page=1;
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
        formatted.hitListenCount = listenCnt;
        formatted.weeklyListenCount = weeklyListenCountInfo.weeklyListenCount[song.mid];
        if( listenCnt ) {
            let [ count ] = listenCnt.match(/\d+/g);
            totalListenCount += parseInt( count );
        }
        formatted.favCount = favInfo[song.id];
        return formatted;
    }).sort(_sortByFavCount);
    return{
        timestamp,
        updatedAt,
        totalListenCount: totalListenCount + 'w+',
        fansCount: weeklyListenCountInfo.fansCount,
        details,
    };
}

function _staleData(input) {
    const TWO_HOURS = 1000 * 60 * 60 * 2;
    const cutoff = Date.now() - TWO_HOURS;
    return input < cutoff;
}

module.exports = {

    '/': async (req, res) => {
        const updatedAt = moment().tz('Asia/Shanghai').format();
        const date = updatedAt.substring(0, 10);
        let json = null;
        try {
            // reuse existing data if last updated less than 12 hours ago
            const archived = await fsPromises.readFile(`${pathToCache}/${date}.json`);
            json = JSON.parse( archived );
            if( _staleData(json.timestamp)) {
                throw new Error ('Data needs an update.');
            }
        } catch (err) {
            const [hitSongs, weeklyListenCountInfo] = await Promise.all([_getHitSongs(), _getTotalListenCount()]);
            const songIdList = hitSongs.map( song => song.songInfo.id);
            const songMidList = hitSongs.map( song => song.songInfo.mid);
            const [ hitInfo, favInfo ] = await Promise.all([_getHitInfo(songMidList), _getFavInfo({ v_songId: songIdList })]);
            const time = Date.now();
            json = _getReportData( { hitSongs, hitInfo, favInfo, weeklyListenCountInfo, updatedAt, time } );
            await fsPromises.writeFile(`${pathToCache}/${date}.json`, JSON.stringify(json), { flag: 'w+' } );
        }
        
        if( req.query.format === 'json' ) {
            return res.send({
                json,
                updatedAt,
                result: json.details.length
            })
        }
        res.render('hitsongs', {
            data: json,
            util: {
                formatNumberWithCommas
            }
        });
    }
}
