"""Escribe js/looks.js a partir de looks.txt (una línea por muñeca: «id ficha»).
Una ficha «=id» copia la de otra muñeca; varias fichas separadas por «|» son un set.
Los tipos de prenda y los colores se comprueban contra los que sabe dibujar figure.js."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'js', 'looks.js')
K = {'hr':{'long','longblunt','wavy','curly','pig','pony','side','bob','bun','buns','short','quiff','mohawk','shag','half','victory','braid','snakes','flames'},
 'hs':{'streak','stripes','tips','ombre','split','none'},
 'tp':{'tee','long','collar','turtle','crop','vneck','corset','tube','strapless','tank','bra','halter','offs'},
 'bt':{'pleat','mini','skater','tutu','pencil','midi','gown','mermaid','hilo','bubble','tiered','swim','shorts','pants','flare','jeans','leggings','capri'},
 'jk':{'jacket','crop','blazer','coat','long','vest','fur','bolero','hoodie','lab','kimono','cape'},
 'lg':{'tights','leggings','stripes','fishnet','socks','knee','ankle'},
 'sh':{'boot','thigh','ankle','buckle','lace','heel','sandal','mary','sneaker','slipper','skate','bare'},
 'hd':{'bow','bigbow','band','headdress','tiara','crown','hat','tophat','beret','cap','flower','flowers','headphones','goggles','veil','hood','clip','mask','turban','wrap','skullpin','shades','sleep','sunhat','helmet','beanie','bucket','pirate'},
 'nk':{'tee','long','collar','turtle','crop','vneck','corset','tube','strapless','tank','bra','halter','offs'},
}
K['dr'] = K['bt']
AC = {'belt','sash','neck','collar','choker','tie','bowtie','scarf','apron','bag','gloves','cuffs','glasses','sunglasses','earrings','noglasses','kneepads'}
PAT = {'plaid','hearts','leopard','stripes','scales','snow','polka','tiger','flames','leaves','gears','flowers','paint','stars','zigzag','skulls','pinstripe','patch','hstripes','vstripes','check','fishnet','lace','sparkle','web','camo'}
raw = {}
for l in open(os.path.join(HERE, 'looks.txt')):
    if l.strip():
        id_, spec = l.rstrip('\n').split(' ', 1)
        raw[id_] = spec.strip()
order = list(raw)
def resolve(id_):
    s = raw[id_]
    return resolve(order[int(s[1:])] if s[1:].isdigit() else s[1:]) if s.startswith('=') else s
errs, out = [], {}
for id_ in order:
    specs = [x.strip() for x in resolve(id_).split('|')]
    for sp in specs:
        for tok in sp.split():
            k, _, v = tok.partition('=')
            parts = v.split('/') if k in ('ac', 'ft') else v.replace(':', '/').split('/')
            if k in K and parts[0] not in K[k]: errs.append(f'{id_} {k}={parts[0]}')
            if k in K and len(parts) > 3 and parts[3] and parts[3] not in PAT: errs.append(f'{id_} estampado {parts[3]}')
            if k == 'ac':
                for a in v.split(','):
                    if a.split(':')[0] not in AC: errs.append(f'{id_} ac {a}')
            if k not in K and k not in ('ac', 'ft', 'sk', 'ey', 'lp', 'boy'): errs.append(f'{id_} clave {k}')
            for c in (parts[1:3] if k not in ('ac', 'ft') else []):
                if c and not re.fullmatch(r'[0-9a-f]{6}', c): errs.append(f'{id_} color {tok}')
    out[id_] = specs[0] if len(specs) == 1 else specs
if errs: raise SystemExit('\n'.join(errs))
with open(OUT, 'w') as f:
    f.write("'use strict';\n\n/* GENERADO por tools/looks/gen.py a partir de looks.txt.\n   Ficha de estilo de cada muñeca (ver figure.js): ropa, peinado y colores\n   sacados de la foto oficial de cada modelo. */\nconst LOOKS = {\n")
    for k, v in out.items(): f.write(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},\n')
    f.write('};\n')
print(len(out), 'muñecas')
