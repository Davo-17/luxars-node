const { getSupabase } = require('../lib/supabase');

// Usuarios de prueba para el modo demo (cuando no hay Supabase configurado).
const DEMO_USERS = [
  { id: 'demo-admin', email: 'admin@luxars.com', name: 'Admin LuxArs', role: 'admin' },
  { id: 'demo-foto', email: 'foto@luxars.com', name: 'Fotografo Test', role: 'photographer' },
  { id: 'demo-cliente', email: 'cliente@luxars.com', name: 'Cliente Test', role: 'client' }
];

async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  // Modo Supabase: valida el JWT del cliente
  if (token) {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(401).json({ error: 'Supabase no configurado. Revisa el .env.' });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Sesion invalida o expirada.' });
    }
    const user = data.user;
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    req.user = {
      id: user.id,
      email: user.email,
      name: (profile && profile.name) || user.email.split('@')[0],
      role: (profile && profile.role) || 'client',
      avatar: profile && profile.avatar_url
    };
    return next();
  }

  // Modo demo: header x-demo-user con el email de prueba
  const demoEmail = req.headers['x-demo-user'];
  if (demoEmail) {
    const demo = DEMO_USERS.find(u => u.email === demoEmail);
    if (demo) {
      req.user = demo;
      return next();
    }
  }

  return res.status(401).json({ error: 'Debes iniciar sesion para acceder a este recurso.' });
}

module.exports = { requireAuth };
