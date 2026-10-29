import json, re, hashlib, unicodedata
E = json.load(open('entries.json'))
IMG = json.load(open('imginfo.json'))
CH = json.load(open('chars.json'))

# ── Personajes ya dibujados en el juego ──
KNOWN = {'Frankie Stein': 'frankie', 'Draculaura': 'draculaura', 'Clawdeen Wolf': 'clawdeen', 'Cleo de Nile': 'cleo', 'Lagoona Blue': 'lagoona', 'Ghoulia Yelps': 'ghoulia', 'Deuce Gorgon': 'deuce', 'Abbey Bominable': 'abbey', 'Spectra Vondergeist': 'spectra', 'Operetta': 'operetta', 'Toralei Stripe': 'toralei', 'Howleen Wolf': 'howleen', 'Clawd Wolf': 'clawd', 'Holt Hyde': 'holt', 'Heath Burns': 'heath', 'Rochelle Goyle': 'rochelle', 'Venus McFlytrap': 'venus', 'Robecca Steam': 'robecca', 'Jinafire Long': 'jinafire', 'Skelita Calaveras': 'skelita', 'Catrine DeMew': 'catrine', 'Twyla Boogeyman': 'twyla', 'Twyla': 'twyla', 'Gigi Grant': 'gigi', 'Catty Noir': 'catty', 'Elissabat': 'elissabat', 'Nefera de Nile': 'nefera', 'Viperine Gorgon': 'viperine', 'Kiyomi Haunterly': 'kiyomi', 'Vandala Doubloons': 'vandala', 'Luna Mothews': 'luna', 'Mouscedes King': 'mouscedes', 'Elle Eedee': 'elle', 'Astranova': 'astranova', "Kala Mer'ri": 'kala', 'Posea Reef': 'posea', 'Peri Serpentine': 'peri', 'Pearl Serpentine': 'peri', 'Marisol Coxi': 'marisol', 'Lorna McNessie': 'lorna', 'Sirena Von Boo': 'sirena', 'Avea Trotter': 'avea', 'Neighthan Rot': 'neighthan', 'Cleolei': 'cleolei', 'Lagoonafire': 'lagoonafire', 'Dracubecca': 'dracubecca', 'Clawvenus': 'clawvenus', 'Pennywise': 'pennywise', 'Alexa Grady': 'grady', 'Alexie Grady': 'grady', 'Beetlejuice': 'beetlejuice', 'Betelgeuse': 'beetlejuice', 'Lydia Deetz': 'lydia', 'Greta Gremlin': 'greta', 'Dracula': 'dracula', 'Frankenstein': 'frankenstein', 'Bride of Frankenstein': 'bride', 'Elvira': 'elvira', 'Chucky': 'chucky', 'Tiffany': 'tiffany', 'Jack Skellington': 'jack', 'Sally': 'sally', 'Winifred Sanderson': 'winifred', 'Mary Sanderson': 'mary', 'Sarah Sanderson': 'sarah', 'Morticia Addams': 'morticia', 'Wednesday Addams': 'wednesday', 'Coraline Jones': 'coraline', 'Gozer': 'gozer', 'Michael Myers': 'michael', 'Krampus': 'krampus', 'Oogie Boogie': 'oogie'}
SHORT = {'Frankie': 'Frankie Stein', 'Clawdeen': 'Clawdeen Wolf', 'Cleo': 'Cleo de Nile', 'Lagoona': 'Lagoona Blue', 'Clawd': 'Clawd Wolf', 'Deuce': 'Deuce Gorgon', 'Ghoulia': 'Ghoulia Yelps', 'Holt': 'Holt Hyde', 'Abbey': 'Abbey Bominable', 'Spectra': 'Spectra Vondergeist', 'Robecca': 'Robecca Steam', 'Iris': 'Iris Clops', 'Manny': 'Manny Taur', 'Kieran': 'Kieran Valentine', 'Djinni': 'Djinni Grant', 'Hexiciah': 'Hexiciah Steam', 'Gillington Webber': 'Gil Webber'}
SPECIES = [('frankenmonster', 'Creación de Frankenstein'), ('ghost/mermaid', 'Fantasma y sirena'), ('centaur/harpy', 'Centaura y arpía'), ('skeleton/moth', 'Esqueleto y polilla'), ('unicorn/zombie', 'Zombicornio'), ('vampire bat', 'Murciélago vampiro'), ('vampire', 'Vampira'), ('werewolf', 'Licántropa'), ('werecat', 'Gata licántropa'), ('wererat', 'Ratona'), ('ghost', 'Fantasma'), ('zombie', 'Zombi'), ('skeleton', 'Calavera'), ('gorgon', 'Gorgona'), ('robot', 'Robot'), ('dragon queen', 'Reina dragona'), ('dragon', 'Dragona'), ('troll', 'Trol'), ('deer', 'Cierva'), ('cyclops', 'Cíclope'), ('spider', 'Araña'), ('banshee', 'Banshee'), ('genie', 'Genio'), ('gargoyle', 'Gárgola'), ('kraken', 'Kraken'), ('reaper', 'Parca'), ('sea nymph', 'Ninfa marina'), ('nymph', 'Ninfa del bosque'), ('blob', 'Monstruo gelatinoso'), ('swamp', 'Monstruo del pantano'), ('jungle', 'Monstruo de la selva'), ('moth', 'Polilla'), ('loch ness', 'Monstruo del lago Ness'), ('maricoxi', 'Maricoxi'), ('hydra', 'Hidra'), ('hyrda', 'Hidra'), ('witch weaver', 'Bruja tejedora'), ('witch', 'Bruja'), ('antropodian', 'Hada del jardín'), ('phantom', 'Fantasma de la Ópera'), ('boogie', 'Hija del Hombre del Saco'), ('fire elemental', 'Elemental de fuego'), ('bone elemental', 'Elemental de hueso'), ('mummy', 'Momia'), ('sea monster', 'Monstruo marino'), ('noppera', 'Noppera-bō'), ('minotaur', 'Minotauro')]
FILMS = {'Gremlins2 The New Batch': 'Gremlins 2', 'M3 GAN': 'M3GAN', 'Killer Klow From Outer Space': 'Los payasos asesinos del espacio exterior', 'It': 'It', 'The Shining': 'El resplandor', 'Beetlejuice': 'Bitelchús', 'Gremlins 2 The New Batch': 'Gremlins 2', 'Dracula': 'Drácula', 'Bride Of Frankenstein': 'La novia de Frankenstein', 'Elvira Mistress Of The Dark': 'Elvira', 'Chucky Tiffany': 'La novia de Chucky', 'Annabelle': 'Annabelle', 'The Nightmare Before Christmas': 'Pesadilla antes de Navidad', 'Creature From The Black Lagoon': 'La mujer y el monstruo', 'The Addams Family': 'La familia Addams', 'Hocus Pocus': 'El retorno de las brujas', 'Squid Game': 'El juego del calamar', 'Beetlejuice Beetlejuice': 'Bitelchús Bitelchús', 'The Lost Boys': 'Jóvenes ocultos', 'M3 G A N': 'M3GAN', 'M3GAN': 'M3GAN', 'Corpse Bride': 'La novia cadáver', 'Us': 'Nosotros', 'Alien': 'Alien', 'Edward Scissorhands': 'Eduardo Manostijeras', 'Coraline': 'Los mundos de Coraline', 'Masters Of The Universe': 'Masters del Universo', 'Killer Klown From Outer Space': 'Los payasos asesinos del espacio exterior', 'Ghostbusters': 'Cazafantasmas', 'Halloween I I': 'Halloween II', 'Buffy The Vampire Slayer': 'Buffy, cazavampiros', 'Krampus': 'Krampus', 'Catwoman': 'Catwoman', 'Goosebumps': 'Pesadillas'}
OLD_SK = {('It', '2020'): 'sk_it', ('El resplandor', '2020'): 'sk_shining', ('Bitelchús', '2021'): 'sk_beetle', ('Gremlins 2', '2021'): 'sk_gremlins', ('Drácula', '2022'): 'sk_dracula', ('La novia de Frankenstein', '2022'): 'sk_frank', ('Elvira', '2023'): 'sk_elvira', ('La novia de Chucky', '2023'): 'sk_chucky', ('Pesadilla antes de Navidad', '2023'): 'sk_nbc', ('El retorno de las brujas', '2024'): 'sk_hocus', ('La familia Addams', '2024'): 'sk_addams', ('Bitelchús Bitelchús', '2025'): 'sk_beetle2', ('Los mundos de Coraline', '2026'): 'sk_coraline', ('Cazafantasmas', '2026'): 'sk_gozer', ('Halloween II', '2026'): 'sk_halloween', ('Krampus', '2026'): 'sk_krampus', ('Pesadilla antes de Navidad', '2026'): 'sk_oogie'}
OLD_LINES = {'Basic': 'basic', 'Dawn of the Dance (doll assortment)': 'dawn', 'Dead Tired': 'deadtired', "School's Out": 'schoolsout', 'Gloom Beach (doll assortment)': 'gloombeach', 'Sweet 1600 (doll assortment)': 'sweet1600', 'Skull Shores (doll assortment)': 'skullshores', 'Ghouls Rule (doll assortment)': 'ghoulsrule', 'Picture Day': 'pictureday', 'Scaris: City of Frights (doll assortment)': 'scaris', 'Power Ghouls': 'powerghouls', '13 Wishes (doll assortment)': 'thirteenwishes', 'Frights, Camera, Action! - Black Carpet': 'fca', 'Freaky Fusion - Freaky Fusions': 'freakyfusion', 'Brand-Boo Students': 'brandboo', 'Haunted - Getting Ghostly': 'haunted', 'Boo York, Boo York - Gala Ghoulfriends': 'booyork', 'Great Scarrier Reef - Glowsome Ghoulfish': 'reef', 'SDCC': 'sdcc', 'Welcome to Monster High - Dance the Fright Away': 'welcome', 'Electrified - Hair-Raising Ghouls': 'electrified', 'Faboolous Friends (doll assortment)': 'g3core', 'Day Out (doll assortment)': 'dayout', 'Howliday (doll assortment)': 'howliday', 'Skulltimate Secrets: Fearidescent': 'fearidescent', 'Monster Ball (doll assortment)': 'monsterball', 'Skulltimate Secrets: Neon Frights': 'neonfrights', 'Skulltimate Secrets: Monster Mysteries': 'monstermysteries', 'Monster Fest (doll assortment)': 'monsterfest', 'Skulltimate Secrets: Garden Mysteries': 'gardenmysteries', 'Haunt Couture (doll assortment)': 'hauntcouture', 'Boo-riginal Creeproduction (doll assortment)': 'creeproduction', 'Fang Club (doll assortment)': 'fangclub'}
DESC = {'basic': 'Las primeras muñecas de Monster High, con su ropa de diario y su diario.', 'dawn': 'Listas para el gran baile, con faldas de tul.', 'deadtired': 'Fiesta de pijamas: camisones y antifaces para dormir.', 'schoolsout': '¡Se acabaron las clases! Looks de fin de curso.', 'gloombeach': 'Un día de playa con bañadores y gafas de sol.', 'sweet1600': 'La fiesta del 1.600 cumpleaños de Draculaura.', 'skullshores': 'Escapada a la isla tropical de Skull Shores.', 'ghoulsrule': 'Disfraces de Halloween en homenaje a su herencia monstruosa.', 'pictureday': 'Día de la foto de clase: ¡sonrisa monstruosa!', 'scaris': 'De viaje por Scaris, la capital de la moda monstruosa.', 'powerghouls': 'Superheroínas: Voltageous, Wonder Wolf, Polterghoul y Cat-Tastrophe.', 'thirteenwishes': 'La aventura de Gigi Grant y sus 13 deseos.', 'fca': 'Alfombra negra en Hauntlywood.', 'freakyfusion': 'Fusiones creadas por accidente en el laboratorio.', 'brandboo': 'Alumnas recién llegadas a Monster High.', 'haunted': 'Una aventura en el instituto fantasma de Haunted High.', 'booyork': 'Luces, música y un cometa sobre Boo York.', 'reef': 'Bajo el mar del Great Scarrier Reef, ¡brillan en la oscuridad!', 'sdcc': 'Ediciones exclusivas de la Comic-Con de San Diego.', 'welcome': 'El renacer de Monster High con un look más juvenil.', 'electrified': 'Pelo eléctrico y colores neón.', 'g3core': 'Las muñecas principales de la tercera generación.', 'dayout': 'Un día de compras por la ciudad.', 'howliday': 'Ediciones especiales de fiestas para coleccionistas.', 'fearidescent': 'Taquillas sorpresa con ropa iridiscente.', 'monsterball': 'El gran baile de gala de Monster High.', 'neonfrights': 'Taquillas sorpresa con colores fluorescentes.', 'monstermysteries': 'Detectives monstruosas resolviendo misterios.', 'monsterfest': 'El festival de música de Monster High.', 'gardenmysteries': 'Secretos entre flores en el jardín del instituto.', 'hauntcouture': 'Alta costura monstruosa para coleccionistas.', 'creeproduction': 'Reediciones fieles de las muñecas originales.', 'fangclub': 'Edición exclusiva para coleccionistas.'}
COL_PAGES = {'Collector', 'Haunt Couture (doll assortment)', 'Howliday (doll assortment)', 'Boo-riginal Creeproduction (doll assortment)', 'Designer Series (doll assortment)', 'Fang Club (doll assortment)', 'Skullebrity (doll assortment)', 'Barbie (doll assortment)', 'SDCC'}
LEGEND = re.compile(r'^Collector\b|Skullector|Haunt Couture|SDCC|Designer Series|Fang Club|Skullebrity|Barbie', re.I)
EPIC = re.compile(r'Howliday|Creeproduction|Power Ghouls|Freaky Fusions|Frightfully Tall|Ghoulebrities|We Are Monster High|Universal Monsters|Wednesday|Monster Family|Love in Scaris|Picnic Casket|Wheel Love|Love.s Not Dead|Comet-Crossed', re.I)
COMMON = re.compile(r"^(Basic|School's Out|First Day of School|Welcome to Monster High|Day Out|Faboolous Friends|Classroom|School Clubs|Picture Day|Dead Tired|Art Class|Music Class|Dance Class|Swimming|Cheerleader|Emoji|Coffin Bean|Creepateria|Geek Shriek|Ghoul Sports|Fangtastic Fitness|Scream Uniform|Lots of Looks|Party Hair|Complete Look|Day-to-Night|Accessories Pack|I Heart|Gore-geous|My Wardrobe|Maul Session|Music Festival|Party Ghouls|Ghoul Spirit|Go Monster High|School Spirit|Transforming|How Do You Boo|Creepover|Spa Day|Gloom Beach|Skull Shores)", re.I)
THEMES = [(r'Scarrier|Fan-Sea|Shriekwrecked', 'ocean'), (r'Gloom Beach|Skull Shores|Swim|Splash|Beach', 'beach'), (r'Dead Tired|Creepover|Cozy', 'pajamas'), (r'Dawn of the Dance|Dot Dead|Night Out|Party|Haunted Dance|Ballerina', 'party'), (r'Sweet 1600|Monster Ball|Scary Sweet|Birthday|Gala|Scarily Ever After', 'gala'), (r'Ghouls Rule|Halloween', 'halloween'), (r'Power Ghouls|Dead Fast', 'hero'), (r'Scaris|Boo York|Londoom|Getaway|Field Trip|Exchange|Love in Scaris', 'travel'), (r'Freak du Chic|Scarnival', 'broadway'), (r'Haunted|Spirits', 'ghostly'), (r'13 Wishes', 'casbah'), (r'Freaky Fusion', 'fusion'), (r'Frights, Camera|Hauntlywood|Reel Drama|Ghoulebrities', 'redcarpet'), (r'Haunt Couture|Designer|Monsteristas|Skullebrity', 'couture'), (r'Electrified|Neon', 'neon'), (r'Garden|Gloom and Bloom|Moonspell|Bloom', 'garden'), (r'Fearidescent|Innovation', 'iridescent'), (r'Mysteries|Buried Secrets|Self-Scare', 'mystery'), (r'Music|Fest|Rockers|Concert|Popstar|Singing', 'fest'), (r'Howliday', 'winter'), (r'Day Out|Maul|Day at the', 'casual'), (r'Picture Day', 'picture'), (r"School's Out", 'jacket')]
def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '', s.lower())[:22]
def camel_title(f):
    m = re.match(r'(.+?)(20\d\d)(?:Skullector|Promo)', f)
    if not m: return None, None
    t = re.sub(r'(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])', ' ', m.group(1)).strip()
    return t, m.group(2)

new_chars = {}
BOYS = {'David', 'Edward Scissorhands', 'Gill-man', 'Skeletor', 'Shorty', 'Angel', 'Imhotep', 'Hexiciah Steam', 'Kieran Valentine', 'Manny Taur', 'Invisi Billy', 'Sloman Mortavitch', 'Garrott du Roque', 'Porter Geiss', 'Jackson Jekyll', 'Gil Webber', 'Harris Reed'}
NAMES_ES = {'Edward Scissorhands': 'Eduardo Manostijeras', 'Xenomorph': 'Xenomorfo', "Magician's Assistant": 'La ayudante del mago', 'Imhotep': 'La Momia (Imhotep)', 'Gill-man': 'Gill-man'}
FILM_CTX = {}
def char_id(n, film=None):
    n = SHORT.get(n, n)
    if n in KNOWN: return KNOWN[n]
    if n in ('dracubecca', 'clawvenus', 'cleolei', 'lagoonafire'): return n
    cid = slug(n)
    if cid not in new_chars:
        info = CH.get(n) or {}
        sp = (info.get('species') or '').lower()
        kind = next((v for k, v in SPECIES if k in sp), '')
        pr = (info.get('pronouns') or '').lower()
        boy = pr.startswith('he') or pr.startswith('male')
        boy = boy or n in BOYS
        new_chars[cid] = {'name': NAMES_ES.get(n, n), 'kind': film or kind, 'boy': boy, 'species': sp}
    return cid

lines = {}
YEAR_FIX = {'Buried Secrets (doll assortment)': 2025, 'Faboolous Friends (doll assortment)': 2022}
for x in E:
    page = x['page']
    if page in ('Playmobil',): continue
    ii = IMG.get(x['file'].replace('_', ' '))
    if not ii or not ii.get('ok'): continue
    year = int(x['year']) if x.get('year') else YEAR_FIX.get(page)
    if page == 'Skullector (doll assortment)':
        t, y = camel_title(x['file'].replace(' ', ''))
        film = FILMS.get(t, t or 'Skullector')
        year = int(y) if y else year
        lid = OLD_SK.get((film, str(year))) or 'sk_' + slug(film)[:14] + str(year)[2:]
        lname, gen, sub = f'Skullector: {film}', 'SK', ''
    else:
        lid = OLD_LINES.get(page) or slug(page.replace('(doll assortment)', ''))
        lname = 'Exclusivas Comic-Con' if page == 'SDCC' else re.sub(r'\s*\(doll assortment\)', '', page).replace(' - ', ': ').replace('}}', '').strip()
        gen = 'COL' if page in COL_PAGES else (x['gen'] or None)
        sub = x.get('sub') or ''
    L = lines.setdefault(lid, {'id': lid, 'name': lname, 'page': page, 'gen': gen, 'years': [], 'dolls': []})
    if year: L['years'].append(year)
    chars = []
    for c in x['chars']:
        cid = char_id(c, lname.split(': ', 1)[1] if gen == 'SK' else ('Universal Monsters' if 'Universal' in page else 'Wednesday' if page.startswith('Wednesday') else None))
        if cid not in chars: chars.append(cid)
    L['dolls'].append({'chars': chars, 'year': year, 'sub': sub, 'url': ii['url'], 'w': ii['w'], 'h': ii['h']})

out_lines = []
photos = {}
for lid, L in lines.items():
    yrs = sorted(L['years'])
    year = yrs[0] if yrs else None
    gen = L['gen']
    if not gen:
        gen = 'G1' if (year or 2012) <= 2015 else 'G2' if (year or 0) <= 2019 else 'G3'
    if L['page'] in ('Universal Monsters (doll assortment)', 'Wednesday (doll assortment)'): gen = 'G3'
    late_g1 = gen == 'G1' and (year or 0) >= 2019
    if late_g1: gen = 'COL'
    if not year: year = {'G1': 2012, 'G2': 2016, 'G3': 2022, 'COL': 2022, 'SK': 2022}[gen]
    nm = L['name']
    rar = 'legendaria' if LEGEND.search(L['page'] + ' ' + nm) else 'epica' if (EPIC.search(nm) or late_g1) else 'comun' if COMMON.search(nm) else 'rara'
    theme = next((t for r, t in THEMES if re.search(r, nm, re.I)), {'G2': 'g2', 'G3': 'g3'}.get(gen, 'school'))
    members = []
    used = {}
    seen = set()
    count = {}
    for d in L['dolls']: count[d['chars'][0]] = count.get(d['chars'][0], 0) + 1
    for d in L['dolls']:
        sig = (tuple(d['chars']), d['sub'], d['year'])
        if sig in seen: continue
        seen.add(sig)
        c = d['chars'][0]
        used[c] = used.get(c, 0) + 1
        k = '' if used[c] == 1 else str(used[c])
        did = f"{lid}.{c}" + (f".{k}" if k else '')
        m = {'c': c}
        if k: m['k'] = k
        if len(d['chars']) > 1: m['with'] = d['chars'][1:]
        keep = d['sub'] and (count[c] > 1 or re.search(r'Comic|Exclusive|Edition|Runway|Signature|Collector|Deluxe|Fashion Pack|Wave', d['sub'], re.I))
        nrm = lambda z: re.sub(r'[^a-z0-9]', '', z.lower())
        if keep and nrm(d['sub']) not in nrm(nm) and nrm(nm) not in nrm(d['sub']) and not re.match(r'(releases|dolls|gallery|series|first)$', d['sub'], re.I): m['sub'] = re.sub(r'\s+', ' ', d['sub'])[:40]
        if d['year'] and d['year'] != year: m['year'] = d['year']
        members.append(m)
        photos[did] = d['url']
    desc = DESC.get(lid) or (f"Skullector de «{nm.split(': ', 1)[1]}»." if gen == 'SK' else f"Colección de {len(members)} {'muñeca' if len(members) == 1 else 'muñecas'} de {year}.")
    item = {'id': lid, 'name': nm, 'year': year, 'gen': gen, 'rarity': rar, 'theme': theme, 'desc': desc, 'members': members}
    if L['page'] == 'SDCC': item['rarity'] = 'legendaria'
    out_lines.append(item)
import collections as _c
dupn = _c.Counter(l['name'] for l in out_lines)
for l in out_lines:
    if dupn[l['name']] > 1: l['name'] += f" ({l['year']})"
GO = {'G1': 0, 'G2': 1, 'G3': 2, 'COL': 3, 'SK': 4}
out_lines.sort(key=lambda l: (GO[l['gen']], l['year'], l['name']))
json.dump({'lines': out_lines, 'photos': photos, 'new_chars': new_chars}, open('catalog.json', 'w'), indent=1, ensure_ascii=False)
import collections
dolls = sum(len(l['members']) for l in out_lines)
print('lines', len(out_lines), 'dolls', dolls, 'new chars', len(new_chars))
print(collections.Counter(l['gen'] for l in out_lines for m in l['members']))
print(collections.Counter(l['rarity'] for l in out_lines for m in l['members']))

# ── Ficheros del juego ──
def js(v): return json.dumps(v, ensure_ascii=False)
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'js') + os.sep
with open(ROOT + 'catalog.js', 'w') as f:
    f.write("'use strict';\n\n/* ══════════════════════════════════════\n   CATÁLOGO · colecciones y muñecas\n   Generado con la wiki de Monster High (monsterhigh.fandom.com):\n   cada colección y sus muñecas salen de su página en la wiki.\n══════════════════════════════════════ */\n\n")
    f.write('// Personajes que solo aparecen en algunas colecciones (sin dibujo propio)\nObject.assign(CHARS, {\n')
    for cid, c in sorted(new_chars.items()):
        o = {'name': c['name'], 'kind': c['kind']}
        if c['boy']: o['boy'] = True
        if c['species']: o['species'] = c['species']
        f.write(f'  {js(cid)}: {js(o)},\n')
    f.write('});\n\n// Colecciones: id, nombre, año, generación, rareza, tema del dibujo, descripción y muñecas\nconst LINES = [\n')
    for l in out_lines:
        f.write('  ' + js(l) + ',\n')
    f.write('];\n\nbuildCatalog();\n')
with open(ROOT + 'photos.js', 'w') as f:
    f.write("'use strict';\n\n/* ══════════════════════════════════════\n   FOTOS REALES · enlaces a la foto oficial de cada muñeca en la wiki\n   Solo se guardan los enlaces: las imágenes se cargan desde la wiki.\n   Si un enlace falla, el juego muestra el dibujo de la muñeca.\n══════════════════════════════════════ */\nconst PHOTO_SOURCE = 'Monster High Wiki (monsterhigh.fandom.com)';\nconst PHOTO_URLS = {\n")
    for did, u in photos.items():
        f.write(f'  {js(did)}: {js(u)},\n')
    f.write('};\n')
print('escrito', ROOT)
