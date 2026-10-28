import json, re, glob
LINK = re.compile(r'\[\[([^\]|#]+?)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]')
HEAD = re.compile(r'^(=+)\s*(.*?)\s*\1\s*$', re.M)
def base_name(t):
    t = re.sub(r'/merchandise$', '', t.strip())
    return re.sub(r'\s*\(G\d\)\s*$', '', t).strip()
def gen_of(t):
    m = re.search(r'\((G\d)\)', t); return m.group(1) if m else None
def char_links(s):
    out = []
    for target, anchor, label in LINK.findall(s):
        if '/merchandise' in target or re.search(r'\(G\d\)', target):
            out.append((base_name(target), gen_of(target), (anchor or '').strip()))
    return out
pages = {}
for fn in sorted(glob.glob('pages/*.txt')):
    raw = open(fn).read()
    title, text = raw.split('\n', 1)
    i = text.find('{{Infobox Dollassortment')
    first_head = HEAD.search(text, i if i >= 0 else 0)
    info = text[i:first_head.start()] if i >= 0 and first_head else (text[i:] if i >= 0 else '')
    name = re.search(r'\|\s*name\s*=\s*([^\n|]+)', info)
    name = re.sub(r'<br\s*/?>', ' ', name.group(1)).strip() if name else title
    date = re.search(r'\|\s*date\s*=\s*([^\n]+)', info)
    years = sorted(set(re.findall(r'(20\d\d)', date.group(1)))) if date else []
    models = []
    for mm in re.finditer(r'\|\s*model\d+\s*=\s*(.*?)(?=\|\s*model\d+\s*=|\}\}|\n\|\s*[a-z_]+\s*=|\Z)', info, re.S):
        s = mm.group(1).strip()
        links = char_links(s)
        if not links: continue
        code = re.match(r"\s*'*([A-Z0-9]{4,6})", s)
        models.append({'raw': re.sub(r'\s+', ' ', s)[:160], 'chars': [l[0] for l in links], 'gen': next((l[1] for l in links if l[1]), None), 'anchor': links[0][2], 'code': code.group(1) if code else None, 'pack': len(links) > 1})
    # Imágenes con su sección
    heads = [(m.start(), m.group(2)) for m in HEAD.finditer(text)]
    def heading_at(pos):
        h = ''
        for p, t in heads:
            if p <= pos: h = t
            else: break
        return h
    imgs = []
    for mm in re.finditer(r'\|\s*file\d+\s*=\s*([^\n|]+)(?:\s*\|\s*caption\d*\s*=\s*([^\n]*))?', text):
        imgs.append({'file': mm.group(1).strip(), 'cap': mm.group(2) or '', 'head': heading_at(mm.start())})
    for g in re.finditer(r'<gallery[^>]*>(.*?)</gallery>', text, re.S):
        hd = heading_at(g.start())
        for l in g.group(1).split('\n'):
            l = l.strip()
            if not l or l.startswith('<'): continue
            parts = l.split('|', 1)
            f = re.sub(r'^(File|Image|Archivo):', '', parts[0].strip())
            imgs.append({'file': f, 'cap': parts[1] if len(parts) > 1 else '', 'head': hd})
    pages[title] = {'name': name, 'years': years, 'models': models, 'imgs': imgs}
BAD_HEAD = re.compile(r'art|logo|promo|packag|box|ad|commercial|concept|reference|stock|fiction', re.I)
FUSION = {('Draculaura', 'Robecca Steam'): 'dracubecca', ('Clawdeen Wolf', 'Venus McFlytrap'): 'clawvenus', ('Cleo de Nile', 'Toralei Stripe'): 'cleolei', ('Lagoona Blue', 'Jinafire Long'): 'lagoonafire'}
ALIAS = {'gillington': 'gil', 'c.a.': 'cupid'}
def pick(page, m):
    first = m['chars'][0].split()[0].lower()
    first = ALIAS.get(first, first)
    toks = [ALIAS.get(t.lower(), t.lower()) for t in m['chars'][0].split() if len(t) > 3] + [first]
    fus = FUSION.get(tuple(m['chars'][:2]))
    if fus: toks = [fus]; first = fus
    # Colección de una sola muñeca: su foto es la primera
    if len(page['models']) == 1 and page['imgs']:
        good = [im for im in page['imgs'] if not BAD_HEAD.search(im['head'] or '') or re.search(r'doll', im['head'] or '', re.I)]
        if good: return good[0]['file']
    cands = []
    for im in page['imgs']:
        if BAD_HEAD.search(im['head'] or '') and not re.search(r'doll', im['head'] or '', re.I): continue
        f = im['file'].lower().replace('_', ' ')
        caplinks = char_links(im['cap'])
        capnames = [c[0] for c in caplinks]
        score = 0
        if m['chars'][0] in capnames and not fus: score += 10
        elif any(t in f or t in im['cap'].lower() for t in toks): score += 6
        elif m['pack'] and len(m['chars']) > 2 and 'pack' in f: score += 5
        else: continue
        if m['pack'] and all(c.split()[0].lower() in (f + im['cap'].lower()) for c in m['chars']): score += 5
        if not m['pack'] and re.search(r'pack|\band\b|&', f): score -= 4
        if m['anchor'] and any(c[2] and c[2].lower() == m['anchor'].lower() for c in caplinks): score += 4
        if m['anchor'] and im['head'] and im['head'].lower() in m['anchor'].lower(): score += 2
        if re.search(r'\b(ii|iii|iv|2|3)\b(?=\.\w+$)', f): score -= 1
        if re.search(r'box|nrfb|package|packaging|art|sketch', f): score -= 3
        if 'stockphotography' in f: score += 2
        cands.append((score, im['file']))
    cands.sort(key=lambda x: -x[0])
    return cands[0][1] if cands else None
res = {}
for t, p in pages.items():
    used = set()
    for m in p['models']:
        f = pick(p, m)
        m['img'] = f
    res[t] = p
json.dump(res, open('parsed2.json', 'w'))
tot = sum(len(p['models']) for p in res.values()); got = sum(1 for p in res.values() for m in p['models'] if m['img'])
print('models', tot, 'with image', got)
for t, p in res.items():
    if not p['models']: print('NOMODELS', t, len(p['imgs']))
