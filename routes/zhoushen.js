const request  = require('../util/request');
const moment = require('moment-timezone');
const fs = require('fs')
const path = require('path');;
const fsPromises = fs.promises;

const pathToCache = './public/cache';

function _numberWithCommas(x) {
    try{
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err) {
        return '无数据';
    }
}

function _getTableBody( data ) {
    const transformed = data.map( ({title, favCount, timePublic, score='无数据', hitListenCount='无数据',weeklyListenCount }, index) => {
        return `<li class="list-li">
            <span class="list-span index">${index+1}</span>
            <span class="list-span song">${title}</span>
            <span class="list-span song">${_numberWithCommas(favCount)}</span>
            <span class="list-span song">${_numberWithCommas(weeklyListenCount)}</span>
            <span class="list-span song">${_numberWithCommas(score)}</span>
            <span class="list-span last">${hitListenCount}</span>
            <span class="list-span song">${timePublic}</span>
        </li>`;
    });
    return transformed.join('\n');
}
async function writeHtmlFromJson(data) {
    const listHeader = `<ul class="list-ul list-title">
                            <li class="list-li">
                                <span class="list-span index">序号</span>
                                <span class="list-span song">歌曲</span>
                                <span class="list-span song">收藏</span>
                                <span class="list-span song">总收听量</span>
                                <span class="list-span song">巅峰指数</span>
                                <span class="list-span last">收听人数</span>
                                <span class="list-span song">发行日期</span>
                            </li>
                        </ul>`;
    let listBody = _getTableBody( data.details );
    let header = `<!DOCTYPE html>
                        <html>
                            <head>
                                <title>周深QQ音乐数据</title>
                                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                                <style>
                                    * {
                                        box-sizing: border-box;
                                        font-family: "microsoft yahei", arial, sans-serif;
                                    }

                                    body {
                                        margin: 0;
                                        padding: 0;
                                        background: url(../img/hotpot.png);
                                        background-size: repeat;
                                    }

                                    /*light skin*/

                                    .scroll-skin-light::-webkit-scrollbar {
                                        width: 4px;
                                        height: 4px;
                                        background-color: #f5f5f5;
                                    }

                                    .scroll-skin-light::-webkit-scrollbar-track {
                                        border-radius: 2px;
                                        background-color: #f5f5f5;
                                    }

                                    .scroll-skin-light::-webkit-scrollbar-thumb {
                                        border-radius: 2px;
                                        background-color: #d5e3ff;
                                    }


                                    .content {
                                        /*padding: 20px;*/
                                    }

                                    .title {
                                        font-size: 16px;
                                        background: rgb(102, 146, 228);
                                        border-radius: 0 0 15px 15px;
                                        line-height: 50px;
                                        padding: 0 20px;
                                        color: #fff;
                                        /*font-family: "microsoft yahei";*/
                                    }

                                    .ad {
                                        font-size: 16px;
                                        padding: 0 20px;
                                        color: rgb(102, 146, 228);
                                    }

                                    .time,
                                    .fans,
                                    .num {
                                        text-align: right;
                                        margin: 10px 20px;
                                        font-size: 14px;
                                        color: rgb(102, 146, 228);
                                    }

                                    .table-title {
                                        font-size: 16px;
                                        margin: 0 0 0 20px;
                                        color: rgb(102, 146, 228);
                                    }

                                    .title-tip {
                                        font-size: 12px;
                                        color: #a9b3c0;
                                        padding: 0 20px;
                                    }

                                    .list-ul {
                                        padding: 0;
                                        margin: 0;
                                        height: auto;
                                        opacity: 0.78;
                                    }
                                    .list-title{
                                        border-top:1px solid #B2D4FF;
                                    }
                                    .list-title .list-span{
                                        color: rgb(102, 146, 228);
                                    }
                                    .list-li {
                                        list-style: none;
                                        opacity 0.9;
                                        background: #fff;
                                        border-bottom: 1px solid #B2D4FF;
                                        line-height: 40px;
                                        font-size: 14px;
                                        color: #5a6a7c;
                                    }
                                    .list-li:nth-child(even){
                                        color: #fff;
                                        background:rgb(168 178 198) ;
                                    }
                                    .list-li::after {
                                        content: '';
                                        display: table;
                                        clear: both;
                                    }

                                    .list-span{
                                        float: left;
                                        display: block;
                                        border-right: 1px solid #B2D4FF;
                                        padding: 0 10px;
                                        height: 40px;
                                        overflow: hidden;
                                        text-align: center;
                                    }
                                    .index{
                                        width: 80px;
                                    }
                                    .song{
                                        width: calc(20% - 45px);
                                        text-overflow: ellipsis;
                                    }
                                    .last{
                                        width: 100px;
                                        
                                    }
                                    .list-span:last-child{
                                        border-right: none;
                                    }
                                </style>
                            </head>`;
    const body = `<body class="scroll-skin-light">
                    <div class="content">
                    <div class="title">Charlie's hit songs on QQ music</div>
                    <div class="ad">广告位：<a class="ad" href="https://www.douban.com/group/696317">欢迎加入：豆瓣小组 辣锅纯辣锅🔥</a></div>
                    <p class="time">更新时间（每日中午12时更新一次）：${data.date}</p>
                    <p class="fans">粉丝总数：${_numberWithCommas(data.fansCount)}</p>
                    <p class="num">过去24小时总收听人数：${data.totalListenCount}</p><br>
                    <p class="title-tip">周深歌曲收藏量Top${data.details.length} (巅峰指数、收听人数为过去24小时数据；总收听量统计方法未知，推测为过去7-10天累计; 过去24小时收听人数小于1万人则无收听数据)：</p>

                    ${listHeader}
                    <ul class="list-ul" id="my_table">
                        ${listBody}
                    </ul>
                </body>`;
    const footer = `<footer>
                        <p class="ad">灵感来源：<a class="ad" href="https://github.com/jsososo/QQMusicApi">jsososo/QQMusicApi</a></p>
                    </footer>`
    let html = header + body + footer + '</html>';
    return html;
}

async function _getHitSongs () {
    const singerMid='003fA5G40k6hKc', num=100, page=1;
    const result = await request({
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
                    singerMid,
                    'begin':  (page - 1) * num,
                    num,
                    order: 1
                }
            }
            })
        }
    });
    return result.singer.data;
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
function _getReportData({ hitSongs, hitInfo, favInfo, weeklyListenCountInfo, date }) {
    let totalListenCount = 0;
    const songlist = hitSongs.songList;
    const details = songlist.map( ( {songInfo:song} ) => {
        const formatted = (({ mid, title }) => ({ mid, title }))(song);
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
    data = {
        date,
        totalListenCount: totalListenCount + 'w+',
        fansCount: weeklyListenCountInfo.fansCount,
        details,
    };
    return data;
}
module.exports = {

    '/hitsongs': async (req, res) => {
        const timestamp = moment().tz('Asia/Shanghai').format();
        const date = timestamp.substring(0, 10);
        let json = null;
        try {
            const archived = await fsPromises.readFile(`${pathToCache}/${date}.json`);
            json = JSON.parse( archived );
        } catch (err) {
            const [hitSongs, weeklyListenCountInfo] = await Promise.all([_getHitSongs( req.query ), _getTotalListenCount()]);
            const songIdList = hitSongs.songList.map( song => song.songInfo.id);
            const songMidList = hitSongs.songList.map( song => song.songInfo.mid);
            const [ hitInfo, favInfo ] = await Promise.all([_getHitInfo(songMidList), _getFavInfo({ v_songId: songIdList })]);
            json = _getReportData( { hitSongs, hitInfo, favInfo, weeklyListenCountInfo, date } );
            await fsPromises.writeFile(`${pathToCache}/${data.date}.json`, JSON.stringify(json), { flag: 'wx' } );
        }
        
        if( req.query.format === 'json' ) {
            return res.send({
                json,
                result: json.details.length
            })
        }
        html = await writeHtmlFromJson( json );
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.end(html);
    }
}
