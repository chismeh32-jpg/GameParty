"""Descarga de la wiki la lista de colecciones, sus páginas y las fotos de estudio."""
import json, os, re
from wk import api, allq

# Fotos de estudio («Doll stockphotography - …»)
stock = allq({'action': 'query', 'list': 'allimages', 'aiprefix': 'Doll_stockphotography', 'ailimit': 500, 'aiprop': 'url|size'}, 'allimages')
json.dump(stock, open('stock.json', 'w'))
# Colecciones
m = allq({'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:Doll_assortments', 'cmlimit': 500}, 'categorymembers')
titles = sorted(x['title'] for x in m if x['ns'] == 0)
extra = ['Skulltimate Secrets: Monster Mysteries', 'Skulltimate Secrets: Garden Mysteries', 'Picture Day', 'Skulltimate Secrets: Hauntlywood Mysteries']
os.makedirs('pages', exist_ok=True)
for t in titles + extra:
    fn = 'pages/' + re.sub(r'[^A-Za-z0-9]+', '_', t) + '.txt'
    if os.path.exists(fn): continue
    d = api({'action': 'parse', 'page': t, 'prop': 'wikitext', 'redirects': 1})
    if 'error' in d: continue
    open(fn, 'w').write(d['parse']['title'] + '\n' + d['parse']['wikitext']['*'])
print(len(stock), 'fotos de estudio,', len(titles), 'colecciones')
