const { MongoClient } = require('mongodb');
const photographers = require('../data/photographers');

const blockedSlots = [
  { photographerId: 1, date: '2026-05-15', time: '14:00' },
  { photographerId: 3, date: '2026-05-20', time: '10:00' },
  { photographerId: 2, date: '2026-06-01', time: '16:00' }
];

let client;
let database;

function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

function getMongoDb() {
  return database || null;
}

async function connectMongo() {
  if (!isMongoConfigured()) return false;

  client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    database = client.db(process.env.MONGODB_DB || undefined);

    const photographerCollection = database.collection('photographers');
    await photographerCollection.createIndex({ id: 1 }, { unique: true });
    await photographerCollection.bulkWrite(photographers.map(photographer => ({
      updateOne: {
        filter: { id: photographer.id },
        update: { $setOnInsert: photographer },
        upsert: true
      }
    })));

    const bookings = database.collection('bookings');
    await bookings.createIndex({ id: 1 }, { unique: true });
    await bookings.createIndex(
      { photographerId: 1, date: 1, time: 1 },
      { unique: true, partialFilterExpression: { status: 'Confirmada' } }
    );
    await bookings.createIndex({ userId: 1, createdAt: -1 });

    const blocked = database.collection('blocked_slots');
    await blocked.createIndex(
      { photographerId: 1, date: 1, time: 1 },
      { unique: true }
    );
    await blocked.bulkWrite(blockedSlots.map(slot => ({
      updateOne: {
        filter: slot,
        update: { $setOnInsert: slot },
        upsert: true
      }
    })));

    return true;
  } catch (error) {
    await client.close().catch(closeError => {
      console.error('[LuxArs] No se pudo cerrar la conexión fallida de MongoDB:', closeError);
    });
    client = null;
    database = null;
    throw error;
  }
}

async function closeMongo() {
  if (client) await client.close();
  client = null;
  database = null;
}

module.exports = { connectMongo, getMongoDb, isMongoConfigured, closeMongo };
