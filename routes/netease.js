'use strict';
const Netease = require( '../controllers/Netease' );


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
    '/songs': async ( req, res ) => {
        try {
            let data = global.neteaseSongs;
            if( expired( data ) ) {
                data = await Netease.getHotSongs();
                global.neteaseSongs = data;
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
    '/ranks': async ( req, res ) => {
        try {
            let data = global.neteaseRanks || await Netease.getExistingChartData();
            global.neteaseRanks = data;
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
    '/lists': async ( req, res )=>{
        try {
            let data = global.neteasePlaylists;
            if( expired( data ) ) {
                data = await Netease.getReportData();
                global.neteasePlaylists = data;
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
    }
};
