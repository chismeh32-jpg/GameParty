import json, re, glob
from parse2 import char_links, HEAD, pages as PARSED, pick  # reutiliza el análisis
LINK = re.compile(r'\[\[([^\]|#]+?)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]')
def norm_char(n):
    n = re.sub(r'/merchandise$', '', n.strip())
    n = re.sub(r'\s*\([^)]*\)\s*$', '', n).strip()
    return n
def rel_links(cap):
    out = []
    for target, anchor, label in LINK.findall(cap):
        if '/merchandise' in target or re.search(r'\(G\d\)', target):
            out.append((norm_char(target), (re.search(r'\((G\d)\)', target) or [None, None])[1], anchor))
    return out
entries = []
for title, p in PARSED.items():
    raw = open('pages/' + re.sub(r'[^A-Za-z0-9]+', '_', title) + '.txt').read().split('\n', 1)[1]
    if p['models']:
        for m in p['models']:
            if not m['img']: continue
            from parse2 import FUSION
            fz = FUSION.get(tuple(m['chars'][:2]))
            entries.append({'page': title, 'line': p['name'], 'chars': [fz] if fz else [norm_char(c) for c in m['chars']], 'gen': m['gen'], 'year': p['years'][0] if p['years'] else None, 'file': m['img'], 'sub': m['anchor'], 'code': m['code']})
        continue
    # Páginas de "lanzamientos": cada foto de la galería es una muñeca o un set
    heads = [(mm.start(), mm.group(2)) for mm in HEAD.finditer(raw)]
    def head_at(pos):
        h = ''
        for pp, t in heads:
            if pp <= pos: h = t
            else: break
        return h
    for g in re.finditer(r'<gallery[^>]*>(.*?)</gallery>', raw, re.S):
        hd = head_at(g.start())
        if re.search(r'art|logo|promo|packag|concept|gallery|ad\b', hd, re.I) and not re.search(r'release|doll|wave|core|student|signature|runway', hd, re.I):
            continue
        for l in g.group(1).split('\n'):
            l = l.strip()
            if not l or '|' not in l: continue
            f, cap = l.split('|', 1)
            f = re.sub(r'^(File|Image):', '', f.strip())
            links = rel_links(cap)
            if not links: continue
            yr = re.findall(r'(20\d\d)', re.sub(r'\[\[[^\]]*\]\]', '', cap))
            sub = re.search(r"'''([^']+)'''", re.sub(r'\[\[[^\]]*\]\]', '', cap))
            entries.append({'page': title, 'line': p['name'], 'chars': [c[0] for c in links], 'gen': next((c[1] for c in links if c[1]), None), 'year': yr[-1] if yr else (p['years'][0] if p['years'] else None), 'file': f, 'sub': (sub.group(1).title() if sub else '') or hd, 'code': None})
    # Tablas (líneas G3 como Faboolous Friends)
    for mm in re.finditer(r'\[\[file:([^|\]]+)[^\]]*\]\]\s*\n\|([^\n]*)', raw, re.I):
        links = rel_links(mm.group(2))
        if not links: continue
        hd = head_at(mm.start())
        entries.append({'page': title, 'line': p['name'], 'chars': [c[0] for c in links], 'gen': next((c[1] for c in links if c[1]), None), 'year': p['years'][0] if p['years'] else None, 'file': mm.group(1).strip(), 'sub': hd, 'code': None})
# Líneas sin página: Basic y School's Out desde las fotos de estudio
stock = json.load(open('stock.json'))
for x in stock:
    n = x['name'][len('Doll_stockphotography_-_'):].rsplit('.', 1)[0].replace('_', ' ')
    m = re.match(r'SDCC (20\d\d) (.+?)(?: (I|II))?$', n)
    if m:
        chars = [c.strip() for c in m.group(2).split(' and ')]
        if len(chars) == 1 and len(chars[0].split()) == 1: pass
        entries.append({'page': 'SDCC', 'line': 'Exclusivas Comic-Con', 'chars': chars, 'gen': 'G1', 'year': m.group(1), 'file': x['name'].replace('_', ' '), 'sub': 'Comic-Con ' + m.group(1), 'code': None})
    for pre, line, year in [('Basic ', 'Basic', '2010'), ("School's Out ", "School's Out", '2011')]:
        if n.startswith(pre):
            rest = re.sub(r' (I|II|III|1|2)$', '', n[len(pre):])
            if re.search(r'wave|Groupshot', rest): continue
            chars = [c.strip() for c in rest.split(' and ')]
            entries.append({'page': line, 'line': line, 'chars': chars, 'gen': 'G1', 'year': year, 'file': x['name'].replace('_', ' '), 'sub': '', 'code': None, 'short': True})
# Quitar duplicados: la misma foto en la página madre y en la sublínea
def spec(t): return (' - ' in t or ': ' in t) * 2 + ('(doll assortment)' not in t)
best = {}
for x in entries:
    k = x['file'].replace('_', ' ').lower()
    if k not in best or spec(x['page']) > spec(best[k]['page']): best[k] = x
seen = set(); out = []
for x in entries:
    k = x['file'].replace('_', ' ').lower()
    if best[k] is x and k not in seen: seen.add(k); out.append(x)
entries = [x for x in out if x['page'] not in ('Faboolous Pets (doll assortment)',)]
json.dump(entries, open('entries.json', 'w'), indent=0)
print(len(entries))
