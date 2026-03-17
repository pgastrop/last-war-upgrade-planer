// ══════════════════════════════════════════════════
// AUTH – Login, Registrierung, Session, Logout
// ══════════════════════════════════════════════════
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

async function getSession(){
  const { data } = await _sb.auth.getSession();
  return data.session;
}

async function getProfile(userId){
  const { data } = await _sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function register(email, password, username){
  const { data, error } = await _sb.auth.signUp({
    email, password,
    options: { data: { username } }
  });
  if(error) throw error;
  return data;
}

async function login(email, password){
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

async function logout(){
  await _sb.auth.signOut();
  window.location.href = 'index.html';
}

async function requireAuth(){
  const session = await getSession();
  if(!session){
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

async function requireAdmin(){
  const session = await requireAuth();
  if(!session) return null;
  const profile = await getProfile(session.user.id);
  if(!profile || profile.role !== 'admin'){
    alert('Kein Admin-Zugang.');
    window.location.href = 'app.html';
    return null;
  }
  return { session, profile };
}
