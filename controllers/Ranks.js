'use strict';
const request  = require( '../util/request' );
const moment = require( 'moment-timezone' );
const db = require( '../util/db' );

const ChartConfig = {
    // 飙升榜
    UP_CHART: 62,
    // 热歌榜
    HOT_CHART: 26,
    // 新歌榜
    NEW_CHART: 27,
    // 流行指数榜
    POP_CHART: 4,
    // 内地榜
    AREA_MAINLAND_CHART: 5,
    // 香港地区榜
    AREA_HK_CHART: 59,
    // 台湾地区榜
    AREA_TW_CHART: 61,
    // 欧美榜
    AREA_EUAM_CHART: 3,
    // 韩国榜
    AREA_KOREA_CHART: 16,
    // 日本榜
    AREA_JP_CHART: 17,
    // Q音快手榜
    KS_CHART: 74,
    // 抖音排行榜
    DY_CHART: 60,
    // 综艺新歌榜
    SHOW_CHART: 64,
    // 影视金曲榜
    TV_CHART: 29,
    // 说唱榜
    RAP_CHART: 58,
    // 电音榜
    ELE_CHART: 57,
    // 动漫音乐榜
    CARTOON_CHART: 72,
    // 游戏音乐榜
    GAME_CHART: 73,
    // K歌金曲榜
    KTV_CHART: 36,
    // 美国公告牌榜
    BILLBOARD_CHART: 108,
    // 美国iTunes榜
    ITUNES_CHART: 123,
    // 韩国Melon榜
    MELON_CHART: 129,
    // 英国UK榜
    UK_CHART: 107,
    // 日本公信榜
    ORICON_CHART: 105,
    // JOOX本地音乐热播榜
    JOOX_CHART: 126,
    // 香港商台榜
    FM903_CHART: 114,
    // 台湾KKBOX榜
    KKBOX_CHART: 127,
    // Youtube音乐排行榜
    YOUTUBE_CHART: 128,
    // 听歌识曲榜
    IDENTIFY_CHART: 67
};

const dayCharts = [
    // 100首
    ChartConfig.UP_CHART,
    ChartConfig.NEW_CHART,
    ChartConfig.POP_CHART,
    ChartConfig.IDENTIFY_CHART
];

const weekCharts = [
    // 周四更新，300首
    ChartConfig.HOT_CHART,
    ChartConfig.DY_CHART,
    ChartConfig.KS_CHART,
    // 周四更新，100首
    ChartConfig.AREA_MAINLAND_CHART,
    // ChartConfig.AREA_HK_CHART,
    // ChartConfig.AREA_TW_CHART,
    // ChartConfig.AREA_EUAM_CHART,
    // ChartConfig.AREA_KOREA_CHART,
    // ChartConfig.AREA_JP_CHART,
    ChartConfig.SHOW_CHART,
    ChartConfig.TV_CHART,
    ChartConfig.CARTOON_CHART,
    ChartConfig.GAME_CHART,
    // 周四更新，50首
    //ChartConfig.RAP_CHART,
    //ChartConfig.ELE_CHART,
    ChartConfig.KTV_CHART
    // 周日更新，100首
    // ChartConfig.BILLBOARD_CHART,
    // 周一更新，
    // ChartConfig.ITUNES_CHART,
    // ChartConfig.MELON_CHART,
    // 周一更新，40首
    // ChartConfig.UK_CHART,
    // 周三更新，
    // ChartConfig.ORICON_CHART,
    // 周四更新，
    //ChartConfig.JOOX_CHART,
    // 周六更新，20首
    //ChartConfig.FM903_CHART,
    // 周五更新，
    //ChartConfig.KKBOX_CHART,
    // 周一更新，
    //ChartConfig.YOUTUBE_CHART
];

async function _getChart({ id = 4, pageNo = 1, pageSize = 100, period, time }) {
    let timeType = dayCharts.indexOf( id )> -1 ? 'YYYY-MM-DD': 'YYYY_W';
    let postPeriod = ( period || moment( time ).tz( 'Asia/Shanghai' ).format( timeType ) );

    const reqFunc = async () => request({
        url: 'http://u.y.qq.com/cgi-bin/musicu.fcg',
        data: {
            data: JSON.stringify({
                g_tk: 5381,
                comm: {
                    ct: 24,
                    cv: 0
                },
                detail: {
                    method: 'GetDetail',
                    module: 'musicToplist.ToplistInfoServer',
                    'param': {
                        'topId': Number( id ),
                        'offset': ( pageNo - 1 ) * pageSize,
                        'num': Number( pageSize ),
                        'period': postPeriod
                    }
                }
            })
        }
    });
    let result = await reqFunc();
    if( result.detail.data.data.period !== postPeriod ) {
        postPeriod = result.detail.data.data.period;
        result = await reqFunc();
    }
    const data = result.detail.data.data;
    if( data ) {
        return{
            listID: Number( id ),
            title: data.title,
            intro: data.intro,
            song: data.song.filter( s => s.singerName.includes( '周深' ) ).map( s=> {
                return{
                    rank: s.rank,
                    title: s.title
                };
            })
        };
    }
}

async function getCharts( chartIds = dayCharts.concat( weekCharts ), time = moment().tz( 'Asia/Shanghai' ).format( 'YYYY-MM-DD' ) ) {
    let results = await Promise.all( chartIds.map( async ( id ) => {
        return _getChart({ id });
    }) );
    results = results.filter( chart => chart.song.length > 0 );
    return{
        updatedAt: time,
        data: results
    };
}

async function getExistingChartData() {
    let client = global.client;
    try {
        const data = await db.findOneChart( client );
        return data;
    } catch( err ) {
        console.log( err.stack );
    }
}

async function updateCharts( chartIds, time ) {
    let client = global.client;
    try {
        const data = await getCharts( chartIds, time );
        await db.updateCharts( client, data );
        global.rankData = data;
        return data;
    } catch( err ) {
        console.log( err.stack );
    }
}

module.exports = {
    getCharts,
    getExistingChartData,
    updateCharts
};
