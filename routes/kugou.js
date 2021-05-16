'use strict';
const Kugou = require( '../controllers/Kugou' );

const _getMeta = async ( req ) => {
    let bToday = !req.query.date;
    let data = null;
    if( bToday ) {
        data = global.kugouMeta;
    }
    if( !data ) {
        data = await Kugou.getSingerInfo();
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
        data = await Kugou.getHonors();
        if( bToday ) {
            if( !data ) {
                data = await Kugou.updateHonors();
            }
            global.kugouHonors = data;
        }
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
    }
};
