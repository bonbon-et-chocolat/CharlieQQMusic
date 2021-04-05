'use strict';
const Bot = require( '../controllers/Bot' );

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
    '/list': async ( req, res ) => {
        try {
            let data = global.botCache;
            if( expired( data ) ) {
                data = await Bot.getData();
                global.botCache = data;
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
    '/add': async ( req, res )=> {
        try {
            const data = await Bot.addWord( req.body );
            res.send( data );
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    }
};
