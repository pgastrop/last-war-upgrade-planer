// ══════════════════════════════════════════════════
// DB – Spielstände & AutoSave
// ══════════════════════════════════════════════════

async function dbAutoSave(userId, style, resources, curLevels){
  await _sb.from('autosave').upsert({
    user_id: userId, style,
    resources, cur_levels: curLevels,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

async function dbLoadAutoSave(userId){
  const { data } = await _sb.from('autosave').select('*').eq('user_id', userId).single();
  return data;
}

async function dbSaveState(userId, name, style, resources, curLevels){
  // Prüfen ob Name bereits existiert → updaten
  const { data: existing } = await _sb.from('game_states')
    .select('id').eq('user_id', userId).eq('name', name).single();
  if(existing){
    await _sb.from('game_states').update({
      style, resources, cur_levels: curLevels,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id);
    return existing.id;
  }
  const { data } = await _sb.from('game_states').insert({
    user_id: userId, name, style,
    resources, cur_levels: curLevels
  }).select().single();
  return data?.id;
}

async function dbLoadStates(userId){
  const { data } = await _sb.from('game_states')
    .select('*').eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return data || [];
}

async function dbDeleteState(id){
  await _sb.from('game_states').delete().eq('id', id);
}

// Admin: alle Nutzer + deren letzten AutoSave
async function dbAdminLoadAll(){
  const { data: profiles } = await _sb.from('profiles').select('*').order('created_at');
  const { data: saves }    = await _sb.from('autosave').select('*');
  const { data: states }   = await _sb.from('game_states').select('*').order('updated_at', { ascending: false });
  return { profiles: profiles||[], saves: saves||[], states: states||[] };
}
