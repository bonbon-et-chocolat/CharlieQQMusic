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
    return db.addBotComments( global.client, data );
}

async function getData() {
    const client = global.client;
    const[ comments, categories ] = await Promise.all( [
        db.findAllBotComments( client ),
        db.findAllBotCategories( client )
    ] );
    let words = [];
    let emoji = [];
    comments.forEach( ({ content, tag, isEmoji, _id }) => {
        let targetArray = isEmoji ? emoji : words;
        let tagInfo = {};
        if( categories[tag] ) {
            tagInfo = {
                name: categories[tag].name,
                description: categories[tag].description
            };
        }
        targetArray.push({
            _id,
            content,
            tag: tagInfo
        });
    });

    let aCategories = [];
    for( const[ key, value ] of Object.entries( categories ) ) {
        aCategories.push( Object.assign({}, value, { id: key }) );
    }
    return({
        data: [
            {
                type: '文字',
                data: words
            },
            {
                type: '表情',
                data: emoji
            }
        ],
        categories: aCategories
    });
}

async function deleteComment( id ) {
    await db.deleteBotComment( global.client, id );
}

async function ping() {
    await _get( 'https://hotpot-lala.herokuapp.com/' );
}
module.exports = {
    addWords,
    getData,
    deleteComment,
    ping
};
