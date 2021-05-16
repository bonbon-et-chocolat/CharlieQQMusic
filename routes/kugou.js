'use strict';
const Kugou = require( '../controllers/Kugou' );

module.exports = {
    '/': async ( req, res ) => {
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
        res.send({
            data
        });
    },
    '/honors': async ( req, res ) => {
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
        res.send({
            data
        });
    }
};
