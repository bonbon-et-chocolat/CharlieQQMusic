'use strict';
const db = require( '../util/db' );
const Songs = require( '../controllers/Songs' );

function formatNumberWithCommas( x ) {
    try {
        return x.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
    } catch( err ) {
        return'-';
    }
}

async function _getData( req ) {
    let bToday = !req.query.date;
    let data = null;
    if( bToday ) {
        data = global.reportData;
    }
    if( !data ) {
        const client = global.client;
        data = await Songs.getExistingData( client, req.query, true  );
        if( bToday ) {
            if( !data ) {
                data = await Songs.updateReportData();
            }
            global.reportData = data;
        }
    }
    return data;
}

module.exports = {
    '/': async ( req, res ) => {
        try {
            let data = await _getData( req );
            if( req.query.format === 'json' ) {
                res.send({
                    data,
                    result: data.details.length
                });
            } else {
                res.render( 'hitsongs', {
                    data,
                    name: '周深',
                    util: {
                        formatNumberWithCommas
                    }
                });
            }
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    },
    '/forceupdatecache': async ( req, res ) => {
        try {
            const client = global.client;
            let data = await Songs.getExistingData( client, req.query  );
            global.reportData = data;
            res.send({});
        } catch( err ) {
            let data = await Songs.updateReportData();
            global.reportData = data;
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    },
    '/inc': async ( req, res )=>{
        const client = global.client;
        let{ details } = await Songs.getExistingData( client, req.query  );

        let{ data } = await db.findYesterdayFavData( client );

        let data1 = {};
        details.forEach( ({ id, favCount }) => {
            data1[id] = {
                favCount: data[id],
                inc: data[id]-favCount
            };
        });
        await db.updateQQHistoryData( client, req.query.date, {
            date: req.query.date,
            updatedAt: req.query.date,
            timestamp: Date.now(),
            data: data1
        });
        res.send({ data1 });
    },
    '/fav/report': async ( req, res ) => {
        try {
            const start = '2021-05-01';
            const end = '2021-05-31';
            const month = 'may';
            const client = global.client;
            const lastMonth = await db.findSummary( client );
            let data1 = await Songs.getExistingData( client,  { date: start });
            let data2 = await Songs.getExistingData( client,  { date: end });

            let existing = {};
            let minMap = {};
            data1.details.forEach( x=> {
                minMap[x.mid] = x.favCount;
            });
            lastMonth.data.forEach( x=> {
                existing[x.mid] = x;
            });
            data2.details.forEach( x=> {
                if( !existing[x.mid] ) {
                    existing[x.mid] = {
                        mid: x.mid,
                        title: x.title,
                        timePublic: x.timePublic
                    };
                }
                const song = existing[x.mid];
                song.favCount = x.favCount;
                song.favCountMin = minMap[x.mid] ? minMap[x.mid] : 0;
                if( song.favCountMin === 0 && song.timePublic < start ) {
                    song.favCountMin = song.favCount;
                }
                song[month] = song.favCount-song.favCountMin;
                delete song.diff;
            });

            const data = Object.values( existing ).sort( ( song1, song2 ) => {
                if( song1[month] > song2[month] ) return-1;
                else return 1;
            });
            db.updateSummary( client, {
                tag: 'summary',
                data
            });
            res.send({
                data
            });
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    },
    '/zhouxingzhuikeai': async ( req, res )=>{
        try {
            req.query.t=9;
            const result = await Songs.search( req );
            const mid = result.data.singer.list[0].singerMID;
            const data = await Songs.getLiveData({
                mid
            });
            res.render( 'hitsongs', {
                data,
                name: req.query.key,
                util: {
                    formatNumberWithCommas
                }
            });
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    },
    '/lists': async ( req, res )=>{
        try {
            const data = await Songs.getPlaylistReportData( req );

            res.send({
                data
            });
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    }
};
