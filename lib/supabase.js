require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

let client = null;
if (url && anonKey) {
  client = createClient(url, anonKey);
}

function getSupabase() {
  return client;
}

module.exports = { getSupabase };
