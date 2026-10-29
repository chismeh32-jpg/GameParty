import json, re, collections
E = json.load(open('entries_base.json'))
N = json.load(open('merch_newdolls.json'))
def nl(s):
    s = re.sub(r'<[^>]+>|\(doll assortment\)|"?wave \d+"?', '', s, flags=re.I)
    return re.sub(r'[^a-z0-9]', '', s.lower())
pagemap = {}
for x in E:
    pagemap.setdefault(nl(x['page']), x['page'])
    pagemap.setdefault(nl(x['line']), x['page'])
pagemap['sandiegocomicconinternationaldolls'] = 'SDCC'
sdcc_have = {tuple(sorted(x['chars'])) for x in E if x['page'] == 'SDCC'}
SHORT = {'Frankie': 'Frankie Stein', 'Ghoulia': 'Ghoulia Yelps', 'Robecca': 'Robecca Steam', 'Djinni': 'Djinni Grant', 'Kieran': 'Kieran Valentine', 'Hexiciah': 'Hexiciah Steam', 'Manny': 'Manny Taur', 'Iris': 'Iris Clops'}
sdcc_have = {tuple(sorted(SHORT.get(c, c) for c in t)) for t in sdcc_have}
years_by_line = collections.defaultdict(list)
for x in N:
    if x['year']: years_by_line[nl(x['section'])].append(int(x['year']))
added = []
for x in N:
    sec = re.sub(r'\s+', ' ', x['section']).strip()
    sub = x['sub']
    w = re.search(r'"?(Wave \d+)"?', sec)
    if w: sub = w.group(1); sec = sec.replace(w.group(0), '').strip()
    if sec.lower().startswith('playset'):
        page, line, sub = 'Playsets', 'Muñecas con playset', re.sub(r'^Playset:\s*', '', sec)
    else:
        key = nl(sec)
        page = pagemap.get(key)
        if not page:
            page = re.sub(r'\s+dolls$', '', sec, flags=re.I)
            pagemap[key] = page
        line = page
    if page == 'SDCC':
        if tuple(sorted(x['chars'])) in sdcc_have: continue
        line = 'Exclusivas Comic-Con'
        sub = f"Comic-Con {x['year']}" if x['year'] else 'Comic-Con'
    year = x['year'] or (str(min(years_by_line[nl(x['section'])])) if years_by_line[nl(x['section'])] else None)
    added.append({'page': page, 'line': line, 'chars': x['chars'], 'gen': x['gen'], 'year': year, 'file': x['file'], 'sub': sub, 'code': x['code'], 'merch': True})
json.dump(E + added, open('entries.json', 'w'), indent=0)
print('añadidas', len(added), 'total', len(E) + len(added))
c = collections.Counter(a['page'] for a in added)
print(c.most_common(60))
