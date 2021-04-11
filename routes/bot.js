'use strict';
const Bot = require( '../controllers/Bot' );

function expired( data ) {
    if( !data ) {
        return true;
    }
    const lastUpdate = data.updatedAt;
    const now = Date.now();
    const bExpired = ( now - lastUpdate ) > 60*5;
    return bExpired;
}
module.exports = {
    '/ping': async ( req, res ) => {
        try {
            await Bot.ping();
            res.send({});
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    },
    '/': async ( req, res ) => {
        try {
            const data = await Bot.getData();
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
            await Bot.addWords( req.body.data );
            res.send({});
        } catch( err ) {
            res.status( 400 );
        }
    },
    '/delete': async ( req, res )=> {
        try {
            await Bot.deleteComment( req.body.id );
            res.send({});
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    }
};
