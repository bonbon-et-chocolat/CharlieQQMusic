'use strict';
const Bili = require( '../controllers/Bili' );

function expired( data ) {
    if( !data ) {
        return true;
    }
    const lastUpdate = data.updatedAt;
    const now = Date.now();
    const bExpired = ( now - lastUpdate ) > 60*60*5;
    return bExpired;
}
module.exports = {
    '/report': async ( req, res ) => {
        try {
            let data = global.biliCache;
            if( expired( data ) ) {
                data = await Bili.getReportData();
                global.biliCache = data;
            }

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
    '/updateYesterday': async ( req, res )=> {
        try {
            const data = await Bili.updateYesterday();
            res.send( data );
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    }
};
