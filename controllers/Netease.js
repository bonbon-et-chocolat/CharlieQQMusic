'use strict';
const moment = require('moment-timezone');
const db = require("../util/db");
const { playlist_detail, artist_top_song, artists } = require('NeteaseCloudMusicApi')

const ID = 1030001;
const ChartConfig = {
    // 飙升榜
    UP_CHART: 19723756, 
    // 热歌榜
    HOT_CHART: 3778678, 
    // 新歌榜
    NEW_CHART: 3779629,
    // 黑胶VIP爱听榜
    VIP_CHART: 5453912201,
    // 云音乐ACG榜
    ACG_CHART: 71385702,
    // 动画榜
    ANIME_CHART: 3001835560,
    // 欧美榜
    ACG_UP_CHART: 3001795926,
    // 韩国榜
    GUFENG_CHART: 5059642708,
    // 潜力爆款榜
    POTENTIAL_CHART: 5338990334
};

function _getToday() {
    return moment().tz('Asia/Shanghai').format().substring(0, 10);
}

function isZhouShen(ar) {
    return ar.some( a => a.id === ID);
}
// for report
function formatResult(result) {
    const {tracks, id: listID, name: title, description: intro, updateTime} = result.body.playlist;
    const song = tracks.map( ({name, id, ar}, index ) => {
        if( isZhouShen(ar)) {
            return {
                name,
                id,
                rank: index+1
            }
        }
        return null;
    }).filter( x => x!==null);
    return {
        listID,
        title,
        intro,
        updateTime: moment.tz(updateTime, 'Asia/Shanghai').format(),
        song
    };
}
async function updateCharts() {
    let client = null;
    try {
        client = await db.connect();
        const toplists = Object.values(ChartConfig);
        const promises = toplists.map(l => {
            return playlist_detail({
                id: l
            });
        })
        const results_raw = await Promise.all(promises);
        const result = {
            data: results_raw.map(formatResult).filter(x=>x.song.length>0),
            updatedAt: moment().tz('Asia/Shanghai').format()
        }
        await db.updateNeteaseRanks(client, _getToday(), result);
        global.neteaseRanks = result;
        return result;
    } catch (error) {
        console.log(error)
    } finally {
        if( client ) {
            await client.close();
        }
    }
}

async function getExistingChartData( date=_getToday() ){
    let client = null;
    try {
        client = await db.connect();
        const data = await db.getNeteaseRanksByDate(client, date);
        return data;
    } catch (error) {
        console.log(error)
    } finally {
        if( client ) {
            await client.close();
        }
    }
}

async function getHotSongs(){
    try {
        const songs = await artist_top_song({
            id: ID
        });
        return songs.body.songs.map( ({name, id, mv}, index) => {
            return {
                rank: index+1,
                title: name,
                id,
                mv
            }
        });
    } catch (error) {
        console.log(error)
    }
}
module.exports = {
    updateCharts,
    getExistingChartData,
    getHotSongs
}
