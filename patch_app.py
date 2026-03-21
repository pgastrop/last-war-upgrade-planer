#!/usr/bin/env python3
# patch_app.py – Patcht C:\lws\app.html mit korrigierter DEFAULT_DB
# Ausführen: python patch_app.py

import re, sys, os

html_path = os.path.join(os.path.dirname(__file__), 'app.html')

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Finde DEFAULT_DB Block
start = html.find('const DEFAULT_DB=[')
if start < 0:
    print("FEHLER: 'const DEFAULT_DB=[' nicht gefunden!"); sys.exit(1)

# Finde Ende des Blocks: ];\n gefolgt von Leerzeile + Kommentar
m = re.search(r'\];\s*\n\s*\n// ════', html[start:])
if not m:
    print("FEHLER: Ende des DEFAULT_DB-Blocks nicht gefunden!"); sys.exit(1)

end = start + m.start() + 2  # Position direkt nach ];

db_path = os.path.join(os.path.dirname(__file__), 'DEFAULT_DB.js')
with open(db_path, 'r', encoding='utf-8') as f:
    new_db = f.read()

html_new = html[:start] + new_db + html[end:]

# Backup
with open(html_path + '.bak', 'w', encoding='utf-8') as f:
    f.write(html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_new)

old_count = html.count('{l:')
new_count = html_new.count('{l:')
print(f"✅ app.html gepatcht!")
print(f"   Level-Einträge vorher: {old_count}")
print(f"   Level-Einträge nachher: {new_count}")
print(f"   Backup: app.html.bak")
