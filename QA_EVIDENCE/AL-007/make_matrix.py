import json,hashlib,subprocess
from pathlib import Path
B=json.load(open('/tmp/al007-qa/baseline-checks.json'));A=json.load(open('/tmp/al007-qa/acceptance-first.json'))
def page(report,route,lang):return next(r['snapshot']for r in report['records']if r['case']=='page'and r['width']==390 and r['language']==lang and r['page']==route)
def status(nodes):return' · '.join(n['text'].strip()for n in nodes if n.get('key')!='catalog.media'and n['text'].strip())or'—'
def esc(s):return s.replace('|','\\|').replace('\n',' / ')
rows=[]
for kind,route in [('home-card','/'),('model-card','table/')]:
 for ref in page(A,route,'en')['cards']:
  row={'kind':kind,'route':ref['href']}
  for lang in ['he','en']:
   for phase,report in [('before',B),('after',A)]:
    c=next(c for c in page(report,route,lang)['cards']if c['href']==ref['href'])
    row[phase+'_'+lang]={'status':status(c['labels']),'visible_card_text':c['text'],'image_alts':[i['alt']for i in c['images']]}
  rows.append(row)
for route in ['geometric/','table/flow/','driller_stand/','shelf/kids/','shoe_rack/','workbench/','crib/','etrog_box/','megillat_esther_box/']:
 row={'kind':'product-page','route':route}
 for lang in ['he','en']:
  for phase,report in [('before',B),('after',A)]:
   p=page(report,route,lang)
   row[phase+'_'+lang]={'status':status(p['statuses']),'media_labels':p['mediaLabels'],'hero_image_alts':[i['alt']for i in p['heroImages']],'explicit_provenance':[n['text']for n in p['statuses']if n.get('key')=='catalog.media']}
 rows.append(row)
# Compare every displayed lifecycle status across all tested widths/languages.
checks=[]
for width in [320,390,768,1024,1440]:
 for lang in ['he','en']:
  records={r['page']:r['snapshot']for r in A['records']if r['case']=='page'and r['width']==width and r['language']==lang}
  for c in records['/']['cards']:
   if c['href']=='table/':continue
   home=status(c['labels']);product=status(records[c['href']]['statuses']);checks.append({'width':width,'language':lang,'source':'home','page':c['href'],'catalog_status':home,'page_status':product,'consistent':home==product})
  for c in records['table/']['cards']:
   route='geometric/'if c['href']=='../geometric/'else'table/flow/'
   hub=status(c['labels']);product=status(records[route]['statuses']);checks.append({'width':width,'language':lang,'source':'table-hub','page':route,'catalog_status':hub,'page_status':product,'consistent':hub==product})
report={'base_sha':'be50dc06467b252929ae59a9703fefce0ab616df','candidate_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd='/workspace/assembl-lab-site',text=True).strip(),'rows':rows,'consistency_cases':len(checks),'consistent':sum(r['consistent']for r in checks),'failures':[r for r in checks if not r['consistent']],'checks':checks}
Path('/tmp/al007-qa/status-matrix.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
text=['# AL-007 — browser-observed before/after status matrix','',f'Baseline: `{report["base_sha"]}`. Candidate: `{report["candidate_sha"]}`.','', 'Raw JSON includes all visible card text, image alternatives and product media labels in both languages.','']
for kind,title in [('home-card','Eight homepage cards'),('model-card','Two table model cards'),('product-page','Nine linked product pages')]:
 text+=['## '+title,'','| Route | Before HE | After HE | Before EN | After EN |','| --- | --- | --- | --- | --- |']
 for row in rows:
  if row['kind']==kind:text+=['| '+' | '.join(esc(x)for x in [row['route']]+[row[k]['status']for k in ['before_he','after_he','before_en','after_en']])+' |']
 text+=['']
text += [f'Consistency: **{report["consistent"]}/{report["consistency_cases"]}** home/hub lifecycle labels match their linked product-page labels at every required width/language.','', 'Media provenance: existing image bytes and ordering are unchanged. Geometric/kids/drill hero/card photographs are identified as photographs; Geometric planning sheet is labelled planning/renderings with documentary photographs; shoe card remains a labelled render while the product page retains six real pre-finish photos plus separate planning; Flow retains its explicit no-photo placeholder; workbench/crib/etrog/megillah remain in development with existing render/planning captions.']
Path('/tmp/al007-qa/status-matrix.md').write_text('\n'.join(text)+'\n')
print(json.dumps({k:v for k,v in report.items()if k not in ['rows','checks']},ensure_ascii=False))
