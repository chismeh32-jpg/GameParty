import json, urllib.request, concurrent.futures as cf
from wk import api
e = json.load(open('entries.json'))
files = sorted(set(x['file'].replace('_', ' ') for x in e))
info = {}
for i in range(0, len(files), 50):
    batch = files[i:i + 50]
    d = api({'action': 'query', 'titles': '|'.join('File:' + f for f in batch), 'prop': 'imageinfo', 'iiprop': 'url|size|mime', 'iiurlwidth': 360})
    norm = {n['to']: n['from'] for n in d['query'].get('normalized', [])}
    for p in d['query']['pages'].values():
        t = p['title']
        src = norm.get(t, t)
        if 'imageinfo' in p:
            ii = p['imageinfo'][0]
            info[src[5:]] = {'url': ii.get('thumburl') or ii['url'], 'w': ii.get('thumbwidth') or ii['width'], 'h': ii.get('thumbheight') or ii['height'], 'mime': ii['mime']}
        else:
            info[src[5:]] = None
def check(item):
    f, ii = item
    if not ii: return f, False
    try:
        r = urllib.request.urlopen(urllib.request.Request(ii['url'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=30)
        ok = r.status == 200 and r.headers.get('Content-Type', '').startswith('image/')
        return f, ok
    except Exception:
        return f, False
with cf.ThreadPoolExecutor(12) as ex:
    res = dict(ex.map(check, info.items()))
for f in info:
    if info[f]: info[f]['ok'] = res[f]
json.dump(info, open('imginfo.json', 'w'))
print('files', len(files), 'resolved', sum(1 for v in info.values() if v), 'ok', sum(1 for v in info.values() if v and v.get('ok')))
print('missing:', [f for f, v in info.items() if not v][:20])
