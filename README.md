# 🌑 Last War – Upgrade-Planer v5.0

Multi-User Web-App mit Supabase Auth · Season 4 · Level 1–35

## Setup

### 1. Supabase
1. [supabase.com](https://supabase.com) → Projekt öffnen
2. **SQL Editor** → Inhalt von `supabase_setup.sql` einfügen → Run
3. **Project Settings → API** → URL + anon key kopieren
4. In `js/config.js` eintragen

### 2. Ersten Admin setzen
Nach erster Registrierung im Supabase SQL Editor:
```sql
update public.profiles set role = 'admin' where username = 'DEIN_USERNAME';
```

### 3. Deployment
```bash
cd C:\lws
xcopy /E /I /Y lws_v5\* .
git add .
git commit -m "v5.0: Supabase Auth, Multi-User, Admin-Dashboard"
git push
```

## URLs
- `/` → Login / Registrierung
- `/app.html` → Upgrade-Planer (nur eingeloggt)
- `/admin.html` → Admin-Dashboard (nur Admins)
