const photographers = require('../data/photographers');
const { getMongoDb } = require('../lib/mongodb');

// Normaliza para comparar sin tildes: "Gastronomia" == "Gastronomia" (de "Gastronomia")
function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

async function list(req, res) {
  const { specialty, maxPrice } = req.query;
  const db = getMongoDb();
  let result = db
    ? await db.collection('photographers').find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray()
    : photographers;

  if (specialty) {
    const wanted = normalize(specialty);
    result = result.filter(p => normalize(p.specialty) === wanted);
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const price = Number(maxPrice);
    if (!Number.isNaN(price)) {
      result = result.filter(p => p.price <= price);
    }
  }

  return res.json(result);
}

async function create(req, res) {
  if (!req.user || (req.user.role !== 'photographer' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Solo fotografos pueden crear un perfil.' });
  }

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const specialty = typeof body.specialty === 'string' ? body.specialty.trim() : '';
  const price = Number(body.price);
  if (!name || !specialty || body.price === undefined || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Nombre, especialidad y un precio mayor que cero son obligatorios.' });
  }

  const optionalTextFields = ['avatar', 'bio', 'location', 'experience', 'deliveries'];
  const photographer = {
    name,
    specialty,
    price,
    rating: 0,
    portfolio: [],
    userId: req.user.id
  };

  for (const field of optionalTextFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string') {
        return res.status(400).json({ error: `El campo ${field} debe ser texto.` });
      }
      photographer[field] = body[field].trim();
    } else if (field !== 'avatar') {
      photographer[field] = '';
    }
  }

  if (body.portfolio !== undefined) {
    if (!Array.isArray(body.portfolio) || !body.portfolio.every(url => typeof url === 'string' && isHttpUrl(url))) {
      return res.status(400).json({ error: 'El portafolio debe ser una lista de URLs HTTP o HTTPS.' });
    }
    photographer.portfolio = body.portfolio;
  }

  if (photographer.avatar && !isHttpUrl(photographer.avatar)) {
    return res.status(400).json({ error: 'El avatar debe ser una URL HTTP o HTTPS.' });
  }

  const db = getMongoDb();
  if (db) {
    const collection = db.collection('photographers');
    const lastPhotographer = await collection.findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
    photographer.id = lastPhotographer ? lastPhotographer.id + 1 : 1;
    try {
      await collection.insertOne(photographer);
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(409).json({ error: 'No se pudo asignar un identificador unico al fotografo.' });
      }
      throw error;
    }
  } else {
    photographer.id = photographers.reduce((maxId, current) => Math.max(maxId, current.id), 0) + 1;
    photographers.push(photographer);
  }

  return res.status(201).json({ photographer });
}

async function detail(req, res) {
  const id = Number(req.params.id);
  const db = getMongoDb();
  const photographer = db
    ? await db.collection('photographers').findOne({ id }, { projection: { _id: 0 } })
    : photographers.find(p => p.id === id);
  if (!photographer) {
    return res.status(404).json({ error: 'Fotografo no encontrado.' });
  }
  return res.json(photographer);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { list, detail, create };
