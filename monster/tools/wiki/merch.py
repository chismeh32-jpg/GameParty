import json, os, re
from wk import api
LINK = re.compile(r'\[\[([^\]|#]+?)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]')
os.makedirs('merch', exist_ok=True)
targets = set()
for y in range(2010, 2027):
    d = api({'action': 'parse', 'page': f'Dolls/{y}', 'prop': 'wikitext'})
    if 'error' in d: continue
    for t, a, l in LINK.findall(d['parse']['wikitext']['*']):
        if t.endswith('/merchandise'): targets.add(t.strip())
print(len(targets), 'páginas de personajes')
for t in sorted(targets):
    fn = 'merch/' + re.sub(r'[^A-Za-z0-9]+', '_', t) + '.txt'
    if os.path.exists(fn): continue
    d = api({'action': 'parse', 'page': t, 'prop': 'wikitext', 'redirects': 1})
    if 'error' in d: print('falta', t); continue
    open(fn, 'w').write(d['parse']['title'] + '\n' + d['parse']['wikitext']['*'])
print(len(os.listdir('merch')))
