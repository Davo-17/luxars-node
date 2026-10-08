const store = require('../data/bookings');
const photographers = require('../data/photographers');
const { getMongoDb } = require('../lib/mongodb');

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>"';&\\]/g, '').trim();
}

function detectSQLInjection(str) {
  const sqlPatterns = /('|--|;|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bUNION\b|\bSELECT\b|\bOR\b|\bAND\b|\bEXEC\b|\bxp_)/i;
  return sqlPatterns.test(str);
}

async function create(req, res) {
  const { photographerId, date, time, eventType, location, notes } = req.body || {};
  const numericPhotographerId = Number(photographerId);

  // Campos obligatorios
  if (!photographerId || !date || !time || !eventType || !location) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse.' });
  }

  const db = getMongoDb();
  const photographer = db
    ? await db.collection('photographers').findOne(
      { id: numericPhotographerId },
      { projection: { _id: 0 } }
    )
    : photographers.find(p => p.id === numericPhotographerId);
  if (!photographer) {
    return res.status(400).json({ error: 'Fotografo no encontrado.' });
  }

  // Sanitizar
  const safeLocation = sanitize(location);
  const safeNotes = sanitize(notes);
  const safeEventType = sanitize(eventType);

  // Deteccion de inyeccion SQL
  if (detectSQLInjection(safeLocation) || detectSQLInjection(safeNotes) || detectSQLInjection(safeEventType)) {
    return res.status(400).json({ error: 'Datos invalidos detectados. Verifica la informacion.' });
  }

  // Formato de fecha y hora
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Fecha invalida. Usa el formato AAAA-MM-DD.' });
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: 'Hora invalida. Usa el formato HH:MM.' });
  }

  // Solo reservas del ano actual y no en el pasado
  const currentYear = new Date().getFullYear();
  const year = Number(date.split('-')[0]);
  if (year !== currentYear) {
    return res.status(400).json({ error: 'Solo se permiten reservas en el ano actual (' + currentYear + ').' });
  }

  const selectedDate = new Date(date + 'T' + time);
  const now = new Date();
  if (selectedDate < now) {
    return res.status(400).json({ error: 'No puedes reservar una fecha u hora anterior al momento actual.' });
  }
  if (Math.abs(selectedDate - now) < 60000) {
    return res.status(400).json({ error: 'No puedes reservar para el mismo minuto en que realizas la reserva.' });
  }

  // Disponibilidad: slot ocupado
  if (await store.isSlotOccupied(numericPhotographerId, date, time)) {
    return res.status(409).json({ error: 'Este horario ya no se encuentra disponible.' });
  }

  // Disponibilidad: reserva activa propia en el mismo horario
  const userBookings = await store.findByUser(req.user.id);
  const ownOccupied = userBookings.some(
    r => r.photographerId === numericPhotographerId && r.date === date && r.time === time && r.status !== 'Cancelada'
  );
  if (ownOccupied) {
    return res.status(409).json({ error: 'Ya tienes una reserva activa en este horario con este fotografo.' });
  }

  const booking = {
    id: await store.nextId(),
    userId: req.user.id,
    userName: req.user.name,
    photographerId: numericPhotographerId,
    photographerName: photographer.name,
    photographerAvatar: photographer.avatar,
    photographerSpecialty: photographer.specialty,
    date,
    time,
    eventType: safeEventType,
    location: safeLocation,
    notes: safeNotes,
    price: photographer.price,
    status: 'Confirmada',
    createdAt: new Date().toISOString()
  };

  try {
    await store.save(booking);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ error: 'Este horario ya no se encuentra disponible.' });
    }
    throw error;
  }
  return res.status(201).json({ booking });
}

async function listMine(req, res) {
  const mine = await store.findByUser(req.user.id);
  return res.json({ bookings: mine });
}

async function cancel(req, res) {
  const booking = await store.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Reserva no encontrada.' });
  }
  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'No puedes cancelar una reserva que no es tuya.' });
  }
  if (booking.status === 'Cancelada') {
    return res.status(400).json({ error: 'Esta reserva ya esta cancelada.' });
  }

  const canceledBooking = await store.cancel(req.params.id);
  if (!canceledBooking) {
    return res.status(400).json({ error: 'Esta reserva ya esta cancelada.' });
  }
  return res.json({ booking: canceledBooking });
}

module.exports = { create, listMine, cancel };
