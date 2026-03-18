// ══════════════════════════════════════════════════
// DB – Spielstände & AutoSave
// FIX: Fehlerbehandlung bei allen DB-Operationen,
//      Eingabevalidierung, konsistente Rückgabewerte
// ══════════════════════════════════════════════════

/**
 * Speichert den AutoSave-Stand eines Nutzers (upsert).
 * FIX: Fehler wird geloggt statt still verschluckt.
 */
async function dbAutoSave(userId, style, resources, curLevels) {
  if (!userId) { console.warn('[db] dbAutoSave: userId fehlt'); return; }
  const { error } = await _sb.from('autosave').upsert(
    {
      user_id:    userId,
      style:      style      ?? 'hq',
      resources:  resources  ?? {},
      cur_levels: curLevels  ?? {},
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[db] dbAutoSave error:', error.message);
}

/**
 * Lädt den AutoSave-Stand eines Nutzers.
 * FIX: Gibt null zurück (statt undefined) wenn kein Eintrag.
 */
async function dbLoadAutoSave(userId) {
  if (!userId) return null;
  const { data, error } = await _sb.from('autosave').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') { // PGRST116 = kein Eintrag
    console.error('[db] dbLoadAutoSave error:', error.message);
  }
  return data ?? null;
}

/**
 * Speichert einen benannten Spielstand (Insert oder Update).
 * FIX: Fehler werden geworfen damit der Aufrufer reagieren kann.
 * @returns {Promise<string|null>} ID des gespeicherten Stands
 */
async function dbSaveState(userId, name, style, resources, curLevels) {
  if (!userId) throw new Error('userId fehlt');
  if (!name || !name.trim()) throw new Error('Name darf nicht leer sein.');

  // Prüfen ob Name bereits existiert → updaten
  const { data: existing, error: findErr } = await _sb
    .from('game_states')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name.trim())
    .maybeSingle(); // FIX: maybeSingle() statt single() – wirft keinen Fehler wenn nichts gefunden

  if (findErr) throw findErr;

  if (existing) {
    const { error } = await _sb.from('game_states').update({
      style,
      resources:  resources  ?? {},
      cur_levels: curLevels  ?? {},
      updated_at: new Date().toISOString()
    }).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await _sb.from('game_states').insert({
    user_id:    userId,
    name:       name.trim(),
    style:      style      ?? 'hq',
    resources:  resources  ?? {},
    cur_levels: curLevels  ?? {}
  }).select().single();
  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Lädt alle Spielstände eines Nutzers.
 * FIX: Immer Array zurückgeben, nie undefined/null.
 */
async function dbLoadStates(userId) {
  if (!userId) return [];
  const { data, error } = await _sb
    .from('game_states')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) { console.error('[db] dbLoadStates error:', error.message); return []; }
  return data ?? [];
}

/**
 * Löscht einen Spielstand anhand seiner ID.
 * FIX: Prüft auf gültige ID.
 */
async function dbDeleteState(id) {
  if (!id) { console.warn('[db] dbDeleteState: id fehlt'); return; }
  const { error } = await _sb.from('game_states').delete().eq('id', id);
  if (error) console.error('[db] dbDeleteState error:', error.message);
}

/**
 * Admin: Lädt alle Profile, AutoSaves und Spielstände.
 * FIX: Parallele Anfragen mit Promise.all; Fehler im Einzelnen abgefangen.
 */
async function dbAdminLoadAll() {
  const [p, s, g] = await Promise.all([
    _sb.from('profiles').select('*').order('created_at'),
    _sb.from('autosave').select('*'),
    _sb.from('game_states').select('*').order('updated_at', { ascending: false })
  ]);
  if (p.error) console.error('[db] profiles:', p.error.message);
  if (s.error) console.error('[db] autosave:', s.error.message);
  if (g.error) console.error('[db] game_states:', g.error.message);
  return {
    profiles: p.data ?? [],
    saves:    s.data ?? [],
    states:   g.data ?? []
  };
}
