// mongodb driver
const MongoClient = require('mongodb').MongoClient;

const URI = process.env.DB_URL;
const DB = {
    qq: 'qq',
    bili: 'bilibili',
    netease: 'netease'
};
const COLLECTION = {
    songs: 'songs',
    videos: 'videos',
    channel: 'channel',
    history: 'history',
    ranks: 'ranks',
    summary: 'summary',
    lastUpdate: 'lastUpdate'
};

//generic
async function connect ( uri=URI ) {
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    return client;
}

async function findAll( client, db=DB.qq, collection=COLLECTION.songs ) {
    return client.db(db)
    .collection(collection)
    .find({}).toArray();
}

async function _find( client, query, db=DB.qq, collection=COLLECTION.songs ) {
    return client.db(db)
    .collection(collection)
    .findOne(query);
}

async function findByDate( client, sDate, db=DB.qq, collection=COLLECTION.songs ) {
    return _find( client, {updatedAt: new RegExp(sDate)}, db, collection);
}

async function insertOne( client, data, db=DB.qq, collection=COLLECTION.songs  ) {
    return client.db(db)
    .collection(collection)
    .insertOne( data );
}

async function upsertOne( client, query, data, db=DB.qq, collection=COLLECTION.songs  ) {
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


async function updateOneById( client, _id, data, db=DB.qq, collection=COLLECTION.songs  ) {
    return client.db(db)
    .collection(collection)
    .updateOne( {_id }, {$set: data} );
}

async function upsertOneByDate( client, sDate, data, db=DB.qq, collection=COLLECTION.songs ) {
    return upsertOne( client, {updatedAt: new RegExp(sDate)}, data, db, collection );
}

//qq
async function updateYesterdayFavData( client, data ) {
    return upsertOne( client, {tag: 'yesterday'}, data, DB.qq, COLLECTION.lastUpdate );
}

async function findYesterdayFavData( client ) {
    return client.db(DB.qq)
    .collection(COLLECTION.lastUpdate)
    .findOne({
        tag: 'yesterday'
    });
}

async function updateSummary( client, data ) {
    return upsertOne( client, {tag: 'summary'}, data, DB.qq, COLLECTION.summary );
}

async function updateCharts( client, data ) {
    return upsertOne( client, {tag: 'charts'}, data, DB.qq, COLLECTION.ranks );
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
    return _find( client, {tag: 'charts'}, DB.qq, COLLECTION.ranks );
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
    updateCharts,
    getNeteaseRanksByDate,
    updateNeteaseRanks
};
