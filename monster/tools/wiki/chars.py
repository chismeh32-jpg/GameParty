import json, re
from wk import api
e = json.load(open('entries.json'))
names = sorted(set(n for x in e for n in x['chars']))
out = {}
for n in names:
    d = None
    for t in (n + ' (G1)', n, n + ' (G3)', n + ' (G2)'):
        d = api({'action': 'parse', 'page': t, 'prop': 'wikitext', 'redirects': 1, 'section': 0})
        if 'error' not in d: break
    if 'error' in d: out[n] = None; continue
    w = d['parse']['wikitext']['*']
    def field(k):
        m = re.search(r'\|\s*' + k + r'\s*=\s*(.*?)(?=\n\||\|[a-z_?]+\s*=|\}\}\s*$)', w, re.S | re.I)
        if not m: return ''
        v = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', m.group(1))
        v = re.sub(r'<br\s*/?>', ', ', v); v = re.sub(r'<[^>]+>|\{\{[^}]*\}\}|\'\'+', '', v)
        return re.sub(r'\s+', ' ', v).strip()[:120]
    out[n] = {'page': d['parse']['title'], 'species': field('species'), 'pronouns': field('pronouns'), 'parents': field('parents'), 'age': field('age')}
json.dump(out, open('chars.json', 'w'), indent=1)
for n, v in out.items(): print(n, '|', v and v['species'], '|', v and v['pronouns'], '|', v and v['parents'][:60])
