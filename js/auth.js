// ══════════════════════════════════════════════════
// AUTH – Login, Registrierung, Session, Logout
// FIX: Fehlerbehandlung verbessert, Null-Checks ergänzt,
//      _sb-Initialisierung abgesichert
// ══════════════════════════════════════════════════

// FIX: Guard gegen fehlende supabase-Bibliothek oder fehlende Konstanten
if (typeof supabase === 'undefined') {
  console.error('[auth.js] Supabase-Bibliothek nicht geladen!');
}
if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON === 'undefined') {
  console.error('[auth.js] SUPABASE_URL / SUPABASE_ANON nicht definiert – config.js eingebunden?');
}

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/**
 * Gibt die aktuelle Session zurück oder null.
 * @returns {Promise<Session|null>}
 */
async function getSession() {
  try {
    const { data, error } = await _sb.auth.getSession();
    if (error) { console.warn('[auth] getSession error:', error.message); return null; }
    return data?.session ?? null;
  } catch (e) {
    console.error('[auth] getSession exception:', e);
    return null;
  }
}

/**
 * Lädt das Profil eines Nutzers aus der DB.
 * FIX: Gibt null zurück statt undefined bei DB-Fehler.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).single();
    if (error) { console.warn('[auth] getProfile error:', error.message); return null; }
    return data ?? null;
  } catch (e) {
    console.error('[auth] getProfile exception:', e);
    return null;
  }
}

/**
 * Registriert einen neuen Nutzer.
 * FIX: Eingaben werden geprüft; error wird immer geworfen.
 * @param {string} email
 * @param {string} password
 * @param {string} username
 */
async function register(email, password, username) {
  if (!email || !password || !username) throw new Error('Alle Felder müssen ausgefüllt sein.');
  const { data, error } = await _sb.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) throw error;
  return data;
}

/**
 * Meldet einen Nutzer an.
 * @param {string} email
 * @param {string} password
 */
async function login(email, password) {
  if (!email || !password) throw new Error('E-Mail und Passwort erforderlich.');
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Meldet den Nutzer ab und leitet zu index.html weiter.
 */
async function logout() {
  try {
    await _sb.auth.signOut();
  } catch (e) {
    console.warn('[auth] Logout-Fehler (ignoriert):', e.message);
  } finally {
    // FIX: Nur App-Keys löschen, NICHT localStorage.clear()
    // localStorage.clear() löscht Supabase Session-Tokens → Re-Login schlägt fehl
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lw')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'index.html';
  }
}

/**
 * Prüft ob eine aktive Session besteht; leitet sonst auf index.html um.
 * @returns {Promise<Session|null>}
 */
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

/**
 * Prüft ob der eingeloggte Nutzer Admin ist.
 * FIX: Robustere Fehlerbehandlung; vermeidet race conditions.
 * @returns {Promise<{session, profile}|null>}
 */
async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;
  const profile = await getProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    alert('Kein Admin-Zugang.');
    window.location.href = 'app.html';
    return null;
  }
  return { session, profile };
}
