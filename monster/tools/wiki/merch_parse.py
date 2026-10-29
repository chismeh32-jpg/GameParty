import json, re, glob, collections
HEAD = re.compile(r'^(=+)\s*(.*?)\s*\1\s*$', re.M)
FILE = re.compile(r'(?:\[\[)?(?:File|Image):([^|\]\n]+\.(?:jpe?g|png|gif|webp))', re.I)
def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
def base(title):
    t = title.replace('/merchandise', '')
    gen = re.search(r'\((G\d)\)', t)
    return re.sub(r'\s*\([^)]*\)\s*$', '', t).strip(), gen.group(1) if gen else None
recs = []
for fn in sorted(glob.glob('merch/*.txt')):
    title, text = open(fn).read().split('\n', 1)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    char, gen = base(title)
    heads = [(m.start(), len(m.group(1)), m.group(2)) for m in HEAD.finditer(text)]
    # secciones de nivel 2 válidas
    def ctx(pos):
        h2 = h3 = ''
        for p, lv, t in heads:
            if p > pos: break
            if lv == 2: h2, h3 = t, ''
            elif lv >= 3: h3 = t
        return h2, h3
    blocks = []
    for m in re.finditer(r'\{\{dolldataI\|(.*?)\}\}', text, re.S):
        inner = m.group(1)
        yr = re.search(r'Dolls/(20\d\d)', inner)
        f = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', inner).split('|')
        line = re.sub(r"<[^>]+>|'+", '', f[0]).strip()
        codes = re.findall(r'\b([A-Z][A-Z0-9]{3,5})\b', f[3] if len(f) > 3 else '')
        blocks.append((m.start(), m.end(), line, yr.group(1) if yr else None, codes))
    for m in re.finditer(r'\{\{Dolldata\s*\n(.*?)\n\}\}', text, re.S):
        b = m.group(1)
        g = lambda k: (re.search(r'\|\s*' + k + r'\s*=\s*([^\n]*)', b, re.I) or [None, ''])[1].strip()
        line = re.sub(r"\[\[|\]\]|'+", '', g('linename') or g('line')).split('|')[-1].strip()
        yr = re.search(r'(20\d\d)', g('release'))
        codes = re.findall(r'\b([A-Z][A-Z0-9]{3,5})\b', g('Model'))
        blocks.append((m.start(), m.end(), line, yr.group(1) if yr else None, codes))
    blocks.sort()
    for i, (s, e, line, yr, codes) in enumerate(blocks):
        h2, h3 = ctx(s)
        if re.search(r'unreleased|playset|costume|merchandise|gallery|other', h2, re.I) and not re.search(r'doll', h2, re.I): continue
        if re.search(r'unreleased', h2, re.I): continue
        prev_end = blocks[i - 1][1] if i else max([p for p, lv, t in heads if p < s] or [0])
        sec_start = max([p for p, lv, t in heads if p < s] or [0])
        before = text[max(prev_end, sec_start):s]
        nxt = blocks[i + 1][0] if i + 1 < len(blocks) else len(text)
        after = text[e:min(nxt, min([p for p, lv, t in heads if p > s] or [len(text)]))]
        files = FILE.findall(before) or FILE.findall(after)
        if not files: continue
        stock = [f for f in files if 'stockphotography' in f.lower()]
        ones = [f for f in files if re.search(r'1\.\w+$', f)]
        f = (stock or ones or files)[0].strip()
        sub = ''
        w = re.search(r'"(Wave \d+)"', h3)
        if w: sub = w.group(1)
        recs.append({'char': char, 'gen': gen, 'section': h3, 'line': line or h3, 'year': yr, 'codes': codes, 'file': f, 'sub': sub, 'page': title})
json.dump(recs, open('merch_recs.json', 'w'), indent=0)
print('bloques con foto:', len(recs))
# agrupar por código (packs)
by = collections.OrderedDict()
for r in recs:
    k = r['codes'][0] if r['codes'] else ('nocode', r['char'], r['line'], r['year'], r['file'])
    by.setdefault(k if isinstance(k, str) else json.dumps(k), []).append(r)
print('muñecas/sets distintos:', len(by))
json.dump(by, open('merch_groups.json', 'w'), indent=0)
