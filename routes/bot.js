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
    '/list': async ( req, res ) => {
        try {
            let data = global.botCache;
            if( expired( data ) ) {
                data = await Bot.getData();
                global.botCache = data;
            }
            res.render( 'bot', {
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
            // await Bot.addWords({
            //     tag: '脂粉',
            //     words: []
            // });
            // await Bot.addWords({
            //     tag: '自带表情',
            //     words: []
            // });
            // await Bot.addWords({
            //     tag: '卖萌',
            //     words: []
            // });
            // await Bot.addWords({
            //     tag: '暴躁',
            //     words: []
            // });
            let data = await Bot.getData();
            res.send( data );
        } catch( err ) {
            res.render( 'error', {
                message: '找不到数据',
                error: err
            });
        }
    }
};
