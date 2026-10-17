import json,hashlib,re,subprocess
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path('/workspace/assembl-lab-site');BASE=Path('/tmp/al007-baseline-site')
class Doc(HTMLParser):
 def __init__(self,s):
  super().__init__();self.images=[];self.arrows=[];self.steps=[];self.links=[];self.forms=[];self.scripts=[];self._script=None;self.feed(s)
 def handle_starttag(self,t,a):
  d=dict(a);classes=(d.get('class')or'').split()
  if t=='img':self.images.append({k:v for k,v in d.items()if k not in ['alt','data-i18n-alt']})
  if t=='a':self.links.append(d.get('href'))
  if t=='form':self.forms.append({k:d[k]for k in ['id','action','method']if k in d})
  if t=='button' and('arrow'in classes or'carousel-arrow'in classes):self.arrows.append(d)
  if t=='button' and'step'in classes:self.steps.append({k:d[k]for k in ['data-code','data-layout','data-pos','data-full-size']if k in d})
  if t=='script' and d.get('type')!='application/json':self._script={'src':d.get('src'),'content':''}
 def handle_data(self,s):
  if self._script is not None:self._script['content']+=s
 def handle_endtag(self,t):
  if t=='script'and self._script is not None:self.scripts.append(self._script);self._script=None
proof={'base_sha':'be50dc06467b252929ae59a9703fefce0ab616df','images':[],'pages':[],'errors':[]}
for path in BASE.rglob('*'):
 if path.suffix.lower() in {'.jpg','.jpeg','.png','.webp','.svg','.gif','.avif','.ico','.tif','.tiff'}:
  rel=path.relative_to(BASE);target=ROOT/rel
  h=hashlib.sha256(path.read_bytes()).hexdigest()
  same=target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==h
  proof['images'].append({'file':str(rel),'sha256':h,'unchanged':same})
  if not same:proof['errors'].append('Image bytes changed:'+str(rel))
for path in BASE.rglob('index.html'):
 rel=path.relative_to(BASE);a=Doc(path.read_text());b=Doc((ROOT/rel).read_text());record={'page':str(rel)}
 for k in ['images','arrows','steps','links','forms','scripts']:
  same=getattr(a,k)==getattr(b,k);record[k+'_unchanged']=same
  if not same:proof['errors'].append(f'{rel}: {k} changed')
 proof['pages'].append(record)
proof['formspree_urls_before']=sorted(set(re.findall(r'https://formspree.io/[^\s"\'<>]+','\n'.join(p.read_text()for p in BASE.rglob('*')if p.is_file()and p.suffix in ['.html','.js','.json']and 'QA_EVIDENCE'not in p.parts))))
proof['formspree_urls_after']=sorted(set(re.findall(r'https://formspree.io/[^\s"\'<>]+','\n'.join(p.read_text()for p in ROOT.rglob('*')if p.is_file()and p.suffix in ['.html','.js','.json']and not any(x.startswith('.') or x in ['QA_EVIDENCE','node_modules']for x in p.relative_to(ROOT).parts)))))
proof['image_count']=len(proof['images']);proof['page_count']=len(proof['pages']);proof['formspree_unchanged']=proof['formspree_urls_before']==proof['formspree_urls_after']
Path('/tmp/al007-qa/preservation.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in proof.items()if k not in ['images','pages']},ensure_ascii=False))
