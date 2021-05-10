'use strict';
const Netease = require( '../controllers/Netease' );


function expired( data, lastUpdate ) {
    if( !data || !lastUpdate ) {
        return true;
    }
    const now = Date.now();
    const bExpired = ( now - lastUpdate ) > 60*60*5;
    return bExpired;
}

module.exports = {
    '/songs': async ( req, res ) => {
        try {
            let data = global.neteaseSongs;
            let ts = global.neteaseSongs_updatedAt;
            if( expired( data, ts ) ) {
                data = await Netease.getHotSongs();
                global.neteaseSongs = data;
                global.neteaseSongs_updatedAt = Date.now();
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
            let ts = global.neteasePlaylists_updatedAt;
            if( expired( data, ts ) ) {
                data = await Netease.getReportData();
                global.neteasePlaylists = data;
                global.neteasePlaylists_updatedAt = Date.now();
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
