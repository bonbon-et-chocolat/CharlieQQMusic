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

async function findByDate( client, sDate ) {
    return _find( client, {updatedAt: new RegExp(sDate)});
}

async function insertOne( client, data, db=DB, collection=COLLECTION  ) {
    return client.db(db)
    .collection(collection)
    .insertOne( data );
}

async function updateOneById( client, _id, data, db=DB, collection=COLLECTION  ) {
    return client.db(db)
    .collection(collection)
    .updateOne( {_id }, {$set: data} );
}

module.exports = {
    connect,
    findByDate,
    insertOne,
    updateOneById
};
