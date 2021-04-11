'use strict';
// mongodb driver
const MongoClient = require( 'mongodb' ).MongoClient;
const ObjectID = require( 'mongodb' ).ObjectID;

const URI = process.env.DB_URL;
const DB = {
    qq: 'qq',
    bili: 'bilibili',
    netease: 'netease',
    bot: 'bot'
};
const COLLECTION = {
    songs: 'songs',
    videos: 'videos',
    channel: 'channel',
    history: 'history',
    ranks: 'ranks',
    summary: 'summary',
    lastUpdate: 'lastUpdate',
    playlist: 'playlist',
    comments: 'commentsV2',
    categories: 'categories'
};

//generic
async function connect( uri=URI ) {
    const client = new MongoClient( uri, { useUnifiedTopology: true });
    await client.connect();
    return client;
}

async function findAll( client, db=DB.qq, collection=COLLECTION.songs ) {
    return client.db( db )
    .collection( collection )
    .find({}).toArray();
}

async function _find( client, query, db=DB.qq, collection=COLLECTION.songs ) {
    return client.db( db )
    .collection( collection )
    .findOne( query );
}

async function findByDate( client, sDate, db=DB.qq, collection=COLLECTION.songs ) {
    return _find( client, { updatedAt: new RegExp( sDate ) }, db, collection );
}

async function insertOne( client, data, db=DB.qq, collection=COLLECTION.songs  ) {
    return client.db( db )
    .collection( collection )
    .insertOne( data );
}

async function upsertOne( client, query, data, db=DB.qq, collection=COLLECTION.songs  ) {
    return client.db( db )
    .collection( collection )
    .updateOne(
        query,
        {
            $set: data
        },
        {
            upsert: true
        }
    );
}


async function updateOneById( client, _id, data, db=DB.qq, collection=COLLECTION.songs  ) {
    return client.db( db )
    .collection( collection )
    .updateOne({ _id }, { $set: data });
}

async function upsertOneByDate( client, sDate, data, db=DB.qq, collection=COLLECTION.songs ) {
    return upsertOne( client, { updatedAt: new RegExp( sDate ) }, data, db, collection );
}

//qq
async function updateYesterdayFavData( client, data ) {
    return upsertOne( client, { tag: 'yesterday' }, data, DB.qq, COLLECTION.lastUpdate );
}

async function findQQHistoryData( client, sDate ) {
    return findByDate( client, sDate, DB.qq, COLLECTION.history );
}

async function updateQQHistoryData( client, sDate, data ) {
    return upsertOneByDate( client, sDate, data, DB.qq, COLLECTION.history );
}

async function updateSummary( client, data ) {
    return upsertOne( client, { tag: 'summary' }, data, DB.qq, COLLECTION.summary );
}

async function findSummary( client ) {
    return _find( client, { tag: 'summary' }, DB.qq, COLLECTION.summary );
}

async function updateCharts( client, data ) {
    return upsertOne( client, { tag: 'charts' }, data, DB.qq, COLLECTION.ranks );
}

async function findQQPlaylistData( client, sDate ) {
    return findByDate( client, sDate, DB.qq, COLLECTION.playlist );
}
async function updateQQPlaylistData( client, sDate, data ) {
    return upsertOneByDate( client, sDate, data, DB.qq, COLLECTION.playlist );
}
//BILIBILI
async function findBiliVideoData( client, sDate ) {
    return findByDate( client, sDate, DB.bili, COLLECTION.videos );
}

async function findBiliChannelData( client, sDate ) {
    return findByDate( client, sDate, DB.bili, COLLECTION.channel );
}

async function findBiliHistoryData( client, sDate ) {
    return findByDate( client, sDate, DB.bili, COLLECTION.history );
}

async function findOneChart( client ) {
    return _find( client, { tag: 'charts' }, DB.qq, COLLECTION.ranks );
}

async function updateBiliHistoryData( client, sDate, data ) {
    return upsertOneByDate( client, sDate, data, DB.bili, COLLECTION.history );
}

async function getNeteaseRanksByDate( client, sDate ) {
    return findByDate( client, sDate, DB.netease, COLLECTION.ranks );
}

async function updateNeteaseRanks( client, sDate, data ) {
    return upsertOneByDate( client, sDate, data, DB.netease, COLLECTION.ranks );
}

async function findNeteasePlaylistData( client, sDate ) {
    return findByDate( client, sDate, DB.netease, COLLECTION.playlist );
}
async function updateNeteasePlaylistData( client, sDate, data ) {
    return upsertOneByDate( client, sDate, data, DB.netease, COLLECTION.playlist );
}

//bot
async function findAllBotComments( client ) {
    return client.db( DB.bot )
    .collection( COLLECTION.comments )
    .find({}).toArray();
}

async function addBotComments( client, comments ) {
    return client.db( DB.bot )
    .collection( COLLECTION.comments )
    .insertMany( comments );
}

async function deleteBotComment( client, id ) {
    return client.db( DB.bot )
    .collection( COLLECTION.comments )
    .deleteOne({ _id: new ObjectID( id ) });
}

async function findAllBotCategories( client ) {
    const result = await client.db( DB.bot )
    .collection( COLLECTION.categories )
    .find({}).toArray();
    return result[0].list;
}
module.exports = {
    connect,
    findAll,
    insertOne,
    upsertOne,
    updateOneById,
    findByDate,
    findOneChart,
    findQQHistoryData,
    findBiliHistoryData,
    findBiliVideoData,
    findBiliChannelData,
    updateBiliHistoryData,
    updateQQHistoryData,
    upsertOneByDate,
    updateYesterdayFavData,
    updateSummary,
    updateCharts,
    getNeteaseRanksByDate,
    updateNeteaseRanks,
    findNeteasePlaylistData,
    updateNeteasePlaylistData,
    findQQPlaylistData,
    updateQQPlaylistData,
    findSummary,
    findAllBotComments,
    addBotComments,
    findAllBotCategories,
    deleteBotComment
};
