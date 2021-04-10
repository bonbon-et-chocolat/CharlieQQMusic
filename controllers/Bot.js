'use strict';
const db = require( '../util/db' );
const request  = require( '../util/request' );

async function _get( url ){
    return request({
        url: url,
        data: {}
    });
}

async function addWords( data ) {
    return db.addBotWords( global.client, data );
}

async function getData() {
    return db.findAllBotComments( global.client );
}

async function ping() {
    await _get( 'https://hotpot-bot.herokuapp.com/' );
}
module.exports = {
    addWords,
    getData,
    ping
};
