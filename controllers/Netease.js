'use strict';
const moment = require( 'moment-timezone' );
const db = require( '../util/db' );
const{ playlist_detail, artist_top_song, search } = require( 'NeteaseCloudMusicApi' );

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

const HotPlaylists = [
    2129920743,
    3205269853,
    2507444104,
    50577102
];

function _getToday() {
    return moment().tz( 'Asia/Shanghai' ).format().substring( 0, 10 );
}
function _getYesterday() {
    return moment().tz( 'Asia/Shanghai' ).subtract( 1, 'days' ).format().substring( 0, 10 );
}

async function getOldPlayCounts( client, date=_getToday(), bReadCache=true ) {
    const cachekey = date+'neteasehistory';
    let cached = global[ cachekey ];
    if( bReadCache && cached ) {
        return cached;
    }
    let result = await db.findNeteasePlaylistData( client, date );
    if( !result ) {
        result = await updateYesterday();
    }
    if( bReadCache ) {
        global[ cachekey ] = result;
    }
    return result;
}

function isZhouShen( ar ) {
    return ar.some( a => a.id === ID );
}
// for report
function formatResult( result ) {
    const{ tracks, id: listID, name: title, description: intro, updateTime } = result.body.playlist;
    const song = tracks.map( ({ name, id, ar }, index ) => {
        if( isZhouShen( ar ) ) {
            return{
                name,
                id,
                rank: index+1
            };
        }
        return null;
    }).filter( x => x!==null );
    return{
        listID,
        title,
        intro,
        updateTime: moment.tz( updateTime, 'Asia/Shanghai' ).format(),
        song
    };
}
async function updateCharts() {
    let client = global.client;
    try {
        const toplists = Object.values( ChartConfig );
        const promises = toplists.map( l => {
            return playlist_detail({
                id: l
            });
        });
        const results_raw = await Promise.all( promises );
        const result = {
            data: results_raw.map( formatResult ).filter( x=>x.song.length>0 ),
            updatedAt: moment().tz( 'Asia/Shanghai' ).format()
        };
        await db.updateNeteaseRanks( client, _getToday(), result );
        global.neteaseRanks = result;
        return result;
    } catch( error ) {
        console.log( error );
    }
}

async function getExistingChartData( date=_getToday() ){
    let client = global.client;
    try {
        const data = await db.getNeteaseRanksByDate( client, date );
        return data;
    } catch( error ) {
        console.log( error );
    }
}

async function getHotSongs(){
    try {
        const songs = await artist_top_song({
            id: ID
        });
        return songs.body.songs.map( ({ name, id, mv }, index ) => {
            return{
                rank: index+1,
                title: name,
                id,
                mv
            };
        });
    } catch( error ) {
        console.log( error );
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

async function getReportData( date=_getToday() ) {
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

async function updateYesterday() {
    let client = global.client;
    const date = _getToday();
    const cachekey = date+'neteasehistory';

    const yesterday = _getYesterday()+'neteasehistory';
    global[yesterday]=null;

    try {
        const[ history, current ] = await Promise.all( [
            getOldPlayCounts( client, _getYesterday(), false ),
            getPlaylists()
        ] );
        const data = formatPlaylist( history, current, true );
        data.updatedAt = date;
        await db.updateNeteasePlaylistData( client, date, data );
        global[ cachekey ] = data;
    } catch( err ) {
        console.log( err.stack );
    }
}

async function getPlaylists() {
    try {
        const promises = HotPlaylists.map( l => {
            return playlist_detail({
                id: l
            });
        });
        const results_raw = await Promise.all( promises );
        return results_raw.map( ( x )=>{
            return x.body.playlist;
        });
    } catch( error ) {
        console.log( error );
        return{};
    }
}

async function searchPlaylists(){
    try {
        const songs = await search({
            keywords: '周深',
            type: 1000
        });
        return songs.body.result.playlists;
    } catch( error ) {
        console.log( error );
    }
}
module.exports = {
    updateCharts,
    getExistingChartData,
    getHotSongs,
    searchPlaylists,
    getPlaylists,
    getReportData,
    updateYesterday
};
