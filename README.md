# 🌑 Last War – Upgrade-Planer

**Multi-User Web-App · Supabase Auth · Season 1–4 · Level 1–35**

Ein cloudbasierter Upgrade-Planer für *Last War: Survival*. Nutzer können ihre verfügbaren Rohstoffe und aktuellen Gebäudelevel eingeben und erhalten eine priorisierte Liste der nächsten sinnvollen Upgrades – abgestimmt auf ihren Spielstil. Alle Daten werden automatisch in der Cloud gespeichert und sind nach jedem Login sofort wiederhergestellt.

---

## 🚀 Live-Demo

Deployed auf Vercel: `https://last-war-upgrade-planer.vercel.app`

---

## ✨ Features

### Upgrade-Planer
- Eingabe verfügbarer Rohstoffe (Nahrung, Eisen, Gold, Öl, Stein, Quarz)
- Ist-Stand aller Gebäude (aktuelles Level)
- Berechnung aller finanzierbaren Upgrades in Echtzeit
- Priorisierung nach Score, Kosten oder Name
- Anzeige nicht finanzierbarer Upgrades mit fehlenden Ressourcen

### Spielstile
| Stil | Fokus |
|------|-------|
| 🏰 HQ-Rush | Hauptquartier zuerst |
| ⚖️ Balanced | Ausgewogen |
| 🌱 Eco | Ressourcen-Gebäude |
| ⚔️ Militär | Kampf-Gebäude |
| 🌑 S4-Fokus | Season-4-Gebäude |

### Season-Auswahl
| Season | Max Level | Öl | Quarz | S4-Gebäude |
|--------|-----------|-----|-------|------------|
| S1 | 25 | ❌ | ❌ | ❌ |
| S2 | 30 | ❌ | ❌ | ❌ |
| S3 | 35 | ✅ | ❌ | ❌ |
| S4 | 35 | ✅ | ✅ | ✅ |

### Cloud-Sync
- AutoSave: Alle Eingaben werden automatisch in Supabase gespeichert
- Benannte Spielstände: Manuelles Speichern & Laden über Supabase `game_states`
- Nach Logout und erneutem Login sind alle Daten sofort wiederhergestellt
- Profil-Dropdown für schnellen Stand-Wechsel

### Fortschritts-Tracker
- Übersicht aller Gebäude mit Fortschrittsbalken
- Gesamtfortschritt in Prozent
- Direktes Hoch-/Runterstufen per Button

### Kostentabelle (Editor)
- Alle Upgrade-Kosten bearbeitbar
- Neue Gebäude hinzufügbar
- Änderungen lokal gespeichert, Reset auf Standardwerte möglich

### Export / Import
- **JSON-Export**: Kompletter Backup aller Stände (Cloud + lokale DB)
- **JSON-Import**: Wiederherstellen eines Backups inkl. Supabase-Sync
- **CSV-Export**: Aktuelle Berechnungsergebnisse als Tabelle

### Admin-Dashboard (`/admin.html`)
- Übersicht aller registrierten Nutzer
- Nutzer zu Admin befördern / degradieren
- AutoSave und Spielstände aller Nutzer einsehen
- **🔍 Als Nutzer öffnen**: Admin kann den Planer im Kontext eines anderen Nutzers öffnen, dessen Daten einsehen und optimieren – mit lila Banner und Rückkehr-Button

---

## 🏗️ Projektstruktur

```
/
├── index.html              # Login & Registrierung
├── app.html                # Haupt-App (Planer, Tracker, Editor)
├── admin.html              # Admin-Dashboard
├── vercel.json             # Deployment-Konfiguration
├── js/
│   ├── config.js           # Supabase URL & Anon-Key
│   ├── auth.js             # Login, Registrierung, Session, Logout
│   └── db.js               # AutoSave, Spielstände, Admin-Funktionen
├── last_war_builder_v4.2.html   # Legacy (Referenz)
└── last_war_builder_v4.3.html   # Legacy (Referenz)
```

> **Hinweis:** `app.html` und `admin.html` sind self-contained (keine externen JS-Dateien nötig). Die Dateien im `js/`-Ordner dienen als eigenständige Module für zukünftige Erweiterungen.

---

## ⚙️ Setup

### 1. Supabase-Projekt anlegen

1. Unter [supabase.com](https://supabase.com) ein neues Projekt erstellen
2. Unter **Project Settings → API** folgende Werte notieren:
   - `Project URL`
   - `anon` (public) Key

### 2. Datenbank einrichten

Im **SQL Editor** von Supabase ausführen:

```sql
-- Tabellen
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.autosave (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  style      TEXT DEFAULT 'hq',
  resources  JSONB DEFAULT '{}',
  cur_levels JSONB DEFAULT '{}',
  season     TEXT DEFAULT 's4',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.game_states (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  style      TEXT DEFAULT 'hq',
  resources  JSONB DEFAULT '{}',
  cur_levels JSONB DEFAULT '{}',
  season     TEXT DEFAULT 's4',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autosave    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "autosave_all"    ON public.autosave    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_states_all" ON public.game_states FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin-Policies
CREATE POLICY "autosave_admin"    ON public.autosave    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "game_states_admin" ON public.game_states FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_admin"    ON public.profiles    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger: Profil bei Registrierung automatisch anlegen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Supabase-Zugangsdaten eintragen

In `js/config.js` (und inline in `app.html` / `admin.html` / `index.html`):

```js
const SUPABASE_URL  = 'https://DEIN-PROJEKT.supabase.co';
const SUPABASE_ANON = 'DEIN-ANON-KEY';
```

### 4. Ersten Admin anlegen

Nach der Registrierung im SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'deine@email.de');
```

---

## 🚢 Deployment (Vercel)

```bash
# Repository klonen
git clone https://github.com/pgastrop/last-war-upgrade-planer.git
cd last-war-upgrade-planer

# Änderungen deployen
git add .
git commit -m "Beschreibung"
git push
```

Vercel deployed automatisch bei jedem Push auf `main`.

### Lokale Entwicklung

Da die App reines HTML/CSS/JS ohne Build-System ist, genügt ein einfacher HTTP-Server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Dann unter `http://localhost:8080` öffnen.

---

## 🔐 Sicherheit

- **Supabase Auth** für Registrierung, Login und Session-Management
- **Row Level Security (RLS)** – jeder Nutzer sieht nur eigene Daten
- **Content-Security-Policy** Header in allen HTML-Seiten
- **HTTP Security-Header** in `vercel.json` (X-Frame-Options, Referrer-Policy etc.)
- **HTML-Escaping** aller dynamisch erzeugten Inhalte (XSS-Schutz)
- **Admin-Impersonation** nur per `sessionStorage` (kein `localStorage`, kein URL-Parameter)
- Passwort-Mindestlänge: 8 Zeichen

---

## 📡 Technologie-Stack

| Technologie | Verwendung |
|-------------|-----------|
| Vanilla HTML/CSS/JS | Frontend (kein Framework, kein Build-Step) |
| [Supabase](https://supabase.com) | Auth, PostgreSQL-Datenbank, RLS |
| [Vercel](https://vercel.com) | Hosting (Static) |
| Supabase JS SDK v2 | Client-Bibliothek (CDN) |

---

## 📋 Datenbank-Schema

```
profiles
  id          UUID (FK → auth.users)
  username    TEXT
  role        TEXT  ('user' | 'admin')
  created_at  TIMESTAMPTZ

autosave                        ← Ein Eintrag pro Nutzer (AutoSave)
  id          UUID
  user_id     UUID (FK → auth.users)
  style       TEXT  ('hq' | 'balanced' | 'eco' | 'mil' | 's4')
  resources   JSONB ({food, iron, gold, oil, stone, quartz})
  cur_levels  JSONB ({hq: 25, barracks: 22, ...})
  season      TEXT  ('s1' | 's2' | 's3' | 's4')
  updated_at  TIMESTAMPTZ

game_states                     ← Benannte Spielstände (beliebig viele)
  id          UUID
  user_id     UUID (FK → auth.users)
  name        TEXT
  style       TEXT
  resources   JSONB
  cur_levels  JSONB
  season      TEXT
  updated_at  TIMESTAMPTZ
```

---

## 🗺️ URLs

| URL | Beschreibung | Zugang |
|-----|-------------|--------|
| `/` | Login & Registrierung | Öffentlich |
| `/app.html` | Upgrade-Planer | Eingeloggt |
| `/admin.html` | Admin-Dashboard | Nur Admins |

---

## 📝 Changelog

### v8.0 (aktuell)
- Feature: Admin kann Nutzer-Profile öffnen und für sie optimieren
- Feature: Season-Auswahl (S1/S2/S3/S4) pro Nutzer mit Cloud-Sync
- Fix: Spielstil-Buttons (Event-Delegation statt direkter Listener)
- Fix: Doppelte `loadState()`-Funktion entfernt
- Fix: Export/Import auf Supabase umgestellt

### v7.0
- Fix: Session-Timing nach Logout/Login (`onAuthStateChange`)
- Fix: `localStorage.clear()` durch gezieltes Key-Löschen ersetzt
- Fix: Spielstände komplett auf Supabase umgestellt (kein localStorage mehr)

### v6.0
- Fix: Cloud-Sync AutoSave & Spielstände nach Logout/Login
- Fix: `cloudLoadAutoSave` überschrieb sich selbst durch falschen Init-Order

### v5.0 (Original)
- Supabase Auth, Multi-User, Admin-Dashboard

---

## 📄 Lizenz

Privates Projekt – alle Rechte vorbehalten.  
Spieledaten basieren auf verifizierten Werten von [cpt-hedge.com](https://cpt-hedge.com).
