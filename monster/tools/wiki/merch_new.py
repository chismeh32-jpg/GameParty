import json, re, collections
E = json.load(open('entries_base.json'))
G = json.load(open('merch_groups.json'))
def nl(s):
    s = re.sub(r'<[^>]+>|\(doll assortment\)|"?wave \d+"?|\s+dolls$', '', s, flags=re.I)
    return re.sub(r'[^a-z0-9]', '', s.lower())
def nf(f): return re.sub(r'[\s_]+', ' ', f.strip().lower())
def ck(n):
    n = re.sub(r'\s*\(.*?\)\s*$', '', n).lower()
    return {'twyla boogeyman': 'twyla', 'gillington webber': 'gil', 'gil webber': 'gil', 'c.a. cupid': 'cupid'}.get(n, n.split()[0])
# Clave de colección: nombre de página normalizado (las sublíneas «X - Y» y «X: Y» igual)
canon = {}
for x in E:
    for n in (x['page'], x['line']): canon.setdefault(nl(n), nl(x['page']))
canon['sandiegocomicconinternationaldolls'] = nl('SDCC'); canon['exclusivascomiccon'] = nl('SDCC')
def lk(*names):
    for n in names:
        if nl(n) in canon: return canon[nl(n)]
    return nl(names[0])
codes = set(x['code'] for x in E if x.get('code'))
files = set(nf(x['file']) for x in E)
have = collections.Counter()
for x in E:
    have[(ck(x['chars'][0]), lk(x['page']))] += 1
cand = collections.defaultdict(list)
dup = collections.Counter()
for k, rs in G.items():
    r0 = rs[0]
    if any(c in codes for r in rs for c in r['codes']): dup['código'] += 1; continue
    if any(nf(r['file']) in files for r in rs): dup['foto'] += 1; continue
    chars = sorted(set(r['char'] for r in rs))
    key = (ck(chars[0]), lk(r0['section'], r0['line']))
    cand[key].append({'chars': chars, 'gen': r0['gen'], 'year': r0['year'], 'line': r0['line'], 'section': r0['section'], 'sub': r0['sub'], 'code': r0['codes'][0] if r0['codes'] else None, 'file': r0['file']})
new = []
for key, lst in cand.items():
    # Las de la página de colección sin código cuentan como ya tenidas
    already = have[key]
    # ¿cuántas de esa colección y personaje ya se emparejaron por código o foto? se descuentan de "already"
    matched = sum(1 for k2, rs in G.items() for r in rs[:1] if (ck(sorted(set(z['char'] for z in rs))[0]), lk(r['section'], r['line'])) == key and (any(c in codes for z in rs for c in z['codes']) or any(nf(z['file']) in files for z in rs)))
    free = max(0, already - matched)
    lst.sort(key=lambda r: (r['year'] or '9999'))
    if free: dup['personaje+colección'] += min(free, len(lst))
    new += lst[free:]
print('ya estaban:', dict(dup), '| nuevas:', len(new))
json.dump(new, open('merch_newdolls.json', 'w'), indent=0)
