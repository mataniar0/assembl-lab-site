#!/usr/bin/env python3
"""PST-230 product publishing contract. Read-only; never submits inquiries."""
from __future__ import annotations
import argparse, hashlib, json, re, struct
from pathlib import Path

P=argparse.ArgumentParser();P.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=P.parse_args()
r=args.root
page=(r/'plant_stand/index.html').read_text(encoding='utf-8')
manifest=re.search(r'<script type="application/json" id="page-translations">(.*?)</script>',page,re.S)
assert manifest, 'product language manifest missing'
translations=json.loads(manifest[1]);assert all('he' in obj and 'en' in obj for obj in translations.values())
for key in re.findall(r'data-i18n(?:-[\w-]+)?="([\w.-]+)"',page):
    assert key in translations or key.startswith('nav.'), ('untranslated',key)
assert page.count('data-three-preview')==1
assert 'data-state="idle"' in page and 'data-three-open disabled' in page
assert 'data-model-src="media/pst-230-v3-design-only.glb"' in page
for token in ('data-three-action="left"','data-three-action="right"','data-three-action="reset"','data-three-close','three-preview.js','three-preview.css','data-i18n="three.design"','aria-describedby="three-help"'):
    assert token in page,token
assert 'DESIGN' in page.upper() and 'טרם אושר' in page
assert 'href="../inquiry/?product=plant-stand-pst230"' in page
model=r/'plant_stand/media/pst-230-v3-design-only.glb'
data=model.read_bytes(); magic,version,length=struct.unpack_from('<III',data,0)
assert (magic,version,length)==(0x46546c67,2,len(data))
chunklen,chunktyp=struct.unpack_from('<II',data,12)
assert chunktyp==0x4e4f534a
j=json.loads(data[20:20+chunklen]);assert len(j['meshes'])==22
assert all(any('COLOR_0' in x['attributes'] for x in m['primitives']) for m in j['meshes'])
pos=[j['accessors'][p['attributes']['POSITION']] for m in j['meshes'] for p in m['primitives']]
assert any(a['max'][2]>.545 for a in pos)
assert all(abs(n['matrix'][0]-.001)<1e-9 and abs(n['matrix'][5]-.001)<1e-9 and abs(n['matrix'][10]-.001)<1e-9 for n in j['nodes'] if 'mesh' in n), 'GLB scene nodes must transform original CAD mm into meters'
for asset in ('plant_stand/media/pst-230-v3-design-only-poster.webp','assets/cards/pst230-480.webp','assets/cards/pst230-960.webp'):
    b=(r/asset).read_bytes();assert b[:4]==b'RIFF' and b[8:12]==b'WEBP' and len(b)>2000,asset
if (r/'index.html').is_file():
    home=(r/'index.html').read_text(encoding='utf-8');assert 'href="plant_stand/"' in home
    assert 'assets/cards/pst230-480.webp' in home
    assert 'home.plant.title' in home
if (r/'inquiry/index.html').is_file():
    form=(r/'inquiry/index.html').read_text(encoding='utf-8');assert 'value="plant-stand-pst230" data-planning="true"' in form
print(json.dumps({'status':'PASS','product':'PST-230','meshes':len(j['meshes']),'glb_bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'real_posts':0},ensure_ascii=False))