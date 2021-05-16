'use strict';
const Kugou = require( '../controllers/Kugou' );
const db = require( '../util/db' );
const moment = require( 'moment-timezone' );

function _getToday() {
    return moment().tz( 'Asia/Shanghai' ).format().substring( 0, 10 );
}
function expired( data ) {
    if( !data ) {
        return true;
    }
    const lastUpdate = data.timestamp;
    const now = Date.now();
    const bExpired = ( now - lastUpdate ) > 60*60*1000; //1hour
    return bExpired;
}

const _getMeta = async ( req ) => {
    let bToday = !req.query.date;
    let data = null;
    if( bToday ) {
        data = global.kugouMeta;
    }
    if( !data ) {
        data = await db.findKugouMetaByDate( global.client, _getToday() );
        if( bToday ) {
            if( !data ) {
                data = await Kugou.updateMeta();
            }
            global.kugouMeta = data;
        }
    }
    return data;
};

const _getHonors = async ( req ) => {
    let bToday = !req.query.date;
    let data = null;
    if( bToday ) {
        data = global.kugouHonors;
    }
    if( !data ) {
        data = await db.findKugouHonors( global.client );
        if( bToday ) {
            if( !data ) {
                data = await Kugou.updateHonors();
            }
            global.kugouHonors = data;
        }
    }
    return data;
};

const _getCharts = async () => {
    let data = global.kugouCharts;
    if( expired( data ) ) {
        data = await Kugou.getCharts();
        global.kugouCharts = data;
    }
    return data;
};

module.exports = {
    '/meta': async ( req, res ) => {
        const data = await _getMeta( req );
        res.send({
            data
        });
    },
    '/honors': async ( req, res ) => {
        const data = await _getHonors( req );
        res.send({
            data
        });
    },
    '/charts': async ( req, res ) => {
        try {
            const data = await _getCharts();
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
    '/report': async ( req, res ) => {
        try {
            const[ overview, honors ] = await Promise.all( [
                _getMeta( req ),
                _getHonors( req )
            ] );
            res.send({
                data: {
                    overview: overview.data,
                    honors: honors.data
                }
            });
        } catch( err ) {
            res.status( 500 ).send( err );
        }
    },
    '/test': async ( req, res ) => {
        const data = {};//await Kugou.getSingerInfo();
        res.send( data );
    }
};
