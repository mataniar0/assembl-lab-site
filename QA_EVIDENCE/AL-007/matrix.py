import sys,json,subprocess,re
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path('/workspace/assembl-lab-site')
BASE='be50dc06467b252929ae59a9703fefce0ab616df'
PAGES=['','table/','geometric/','table/flow/','driller_stand/','shelf/kids/','shoe_rack/','workbench/','crib/','etrog_box/','megillat_esther_box/']
records=[]
for route in PAGES:
 source=subprocess.check_output(['git','show',BASE+':'+route+'index.html'],cwd=ROOT,text=True)
 raw=re.search(r'<script[^>]+id="page-translations"[^>]*>(.*?)</script>',source,re.S)
 trans=json.loads(raw.group(1)) if raw else {}
 records.append({'page':route or '/','translations':{k:v for k,v in trans.items() if re.search(r'status|badge|stage|intro|copy|note|photo|render|planning|finished|built',k,re.I)},'markup_statuses':re.findall(r'<[^>]+class="[^"]*(?:status|development|planning-note|placeholder|image-explanation)[^"]*"[^>]*>.*?</(?:p|span|div)>',source,re.S)})
Path('/tmp/al007-qa/before/source-matrix.json').write_text(json.dumps({'sha':BASE,'pages':records},ensure_ascii=False,indent=2))
print('Before matrix saved for',len(records),'pages')
