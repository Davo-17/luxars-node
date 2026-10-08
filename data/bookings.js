const { getMongoDb } = require('../lib/mongodb');

let bookingIdCounter = 1000;

const occupiedSlots = [
  { photographerId: 1, date: '2026-05-15', time: '14:00' },
  { photographerId: 3, date: '2026-05-20', time: '10:00' },
  { photographerId: 2, date: '2026-06-01', time: '16:00' }
];

const reservations = [];

async function nextId() {
  const db = getMongoDb();
  if (db) {
    const result = await db.collection('counters').findOneAndUpdate(
      { _id: 'bookings' },
      { $setOnInsert: { sequence: 1000 }, $inc: { sequence: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const counter = result && (result.value || result);
    return 'RES-' + counter.sequence;
  }

  bookingIdCounter += 1;
  return 'RES-' + bookingIdCounter;
}

async function isSlotOccupied(photographerId, date, time) {
  const db = getMongoDb();
  if (db) {
    const activeBooking = await db.collection('bookings').findOne({
      photographerId,
      date,
      time,
      status: 'Confirmada'
    });
    if (activeBooking) return true;
    return Boolean(await db.collection('blocked_slots').findOne({ photographerId, date, time }));
  }

  return occupiedSlots.some(
    s => s.photographerId === photographerId && s.date === date && s.time === time
  );
}

async function findByUser(userId) {
  const db = getMongoDb();
  if (db) {
    return db.collection('bookings').find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  return reservations.filter(r => r.userId === userId);
}

async function findById(id) {
  const db = getMongoDb();
  if (db) return db.collection('bookings').findOne({ id });

  return reservations.find(r => r.id === id);
}

async function save(booking) {
  const db = getMongoDb();
  if (db) {
    await db.collection('bookings').insertOne(booking);
    return;
  }

  reservations.push(booking);
  occupiedSlots.push({
    photographerId: booking.photographerId,
    date: booking.date,
    time: booking.time
  });
}

async function cancel(id) {
  const db = getMongoDb();
  if (db) {
    const result = await db.collection('bookings').updateOne(
      { id, status: { $ne: 'Cancelada' } },
      { $set: { status: 'Cancelada' } }
    );
    return result.modifiedCount ? findById(id) : null;
  }

  const booking = reservations.find(r => r.id === id);
  if (!booking) return null;
  booking.status = 'Cancelada';
  freeSlot(booking.photographerId, booking.date, booking.time);
  return booking;
}

function freeSlot(photographerId, date, time) {
  const idx = occupiedSlots.findIndex(
    s => s.photographerId === photographerId && s.date === date && s.time === time
  );
  if (idx !== -1) occupiedSlots.splice(idx, 1);
}

module.exports = { nextId, isSlotOccupied, findByUser, findById, save, cancel };
