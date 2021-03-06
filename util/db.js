// mongodb driver
const MongoClient = require('mongodb').MongoClient;

const URI = process.env.DB_URL;
const DB = "qq";
const COLLECTION = "songs";

async function connect ( uri=URI ) {
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    return client;
}

async function _find( client, query, db=DB, collection=COLLECTION ) {
    return client.db(db)
    .collection(collection)
    .findOne(query);
}

async function findByDate( client, sDate, db=DB, collection=COLLECTION ) {
    return _find( client, {updatedAt: new RegExp(sDate)}, db, collection);
}

async function findBiliVideoData( client, sDate ) {
    return findByDate( client, sDate, 'bilibili', 'videos' );
}

async function findBiliChannelData( client, sDate ) {
    return findByDate( client, sDate, 'bilibili', 'channel' );
}

async function findBiliHistoryData( client, sDate ) {
    return findByDate( client, sDate, 'bilibili', 'history' );
}

async function findOneChart( client ) {
    return _find( client, {tag: 'charts'}, DB, 'ranks' );
}

async function findAll( client, db=DB, collection=COLLECTION ) {
    return client.db(db)
    .collection(collection)
    .find({}).toArray();
}

async function insertOne( client, data, db=DB, collection=COLLECTION  ) {
    return client.db(db)
    .collection(collection)
    .insertOne( data );
}

async function upsertOne( client, query, data, db=DB, collection=COLLECTION  ) {
    return client.db(db)
    .collection(collection)
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

async function upsertOneByDate( client, sDate, data, db=DB, collection=COLLECTION ) {
    return upsertOne( client, {updatedAt: new RegExp(sDate)}, data, db, collection );
}

async function updateYesterdayFavData( client, data ) {
    return upsertOne( client, {tag: 'yesterday'}, data, DB, 'lastUpdate' );
}

async function updateBiliHistoryData( client, sDate, data ) {
    return upsertOneByDate( client, {updatedAt: new RegExp(sDate)}, data, 'bilibili', 'history' );
}

async function updateSummary( client, data ) {
    return upsertOne( client, {tag: 'summary'}, data, DB, 'summary' );
}

async function updateCharts( client, data ) {
    return upsertOne( client, {tag: 'charts'}, data, DB, 'ranks' );
}

async function findYesterdayFavData( client ) {
    return client.db(DB)
    .collection('lastUpdate')
    .findOne({
        tag: 'yesterday'
    });
}

async function updateOneById( client, _id, data, db=DB, collection=COLLECTION  ) {
    return client.db(db)
    .collection(collection)
    .updateOne( {_id }, {$set: data} );
}

module.exports = {
    connect,
    findAll,
    insertOne,
    upsertOne,
    updateOneById,
    findByDate,
    findOneChart,
    findBiliHistoryData,
    findBiliVideoData,
    findBiliChannelData,
    updateBiliHistoryData,
    upsertOneByDate,
    updateYesterdayFavData,
    findYesterdayFavData,
    updateSummary,
    updateCharts
};
