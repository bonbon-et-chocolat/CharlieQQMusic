'use strict';
const db = require( '../util/db' );

async function addWords( data ) {
    return db.addBotWords( global.client, data );
}

async function getData() {
    return db.findAllBotComments( global.client );
}
module.exports = {
    addWords,
    getData
};
