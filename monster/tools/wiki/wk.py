import json, time, urllib.request, urllib.parse
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
def api(params):
    params = dict(params); params['format'] = 'json'
    url = 'https://monsterhigh.fandom.com/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for i in range(5):
        try: return json.load(urllib.request.urlopen(req, timeout=40))
        except Exception: time.sleep(2 ** i)
    raise RuntimeError(url)
def allq(params, key):
    out = []; p = dict(params)
    while True:
        d = api(p)
        out += d['query'][key]
        if 'continue' in d: p.update(d['continue'])
        else: return out
