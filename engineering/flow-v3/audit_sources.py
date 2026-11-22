"""Read-only exhaustive path/history search in both repositories; isolate legacy revisions."""
from pathlib import Path
import subprocess,json,hashlib,zipfile,io,sys
sys.path.insert(0,str(Path(__file__).parent))
ROOT=Path(__file__).resolve().parents[2]; OUT=Path(__file__).parent/'artifacts'
def git(repo,*args):return subprocess.check_output(['git','-C',str(repo),*args])
report={}
for name,repo in [('site',ROOT),('engineering',Path(sys.argv[1]))]:
 objects=git(repo,'rev-list','--objects','--all').decode().splitlines()
 paths=[line for line in objects if len(line.split(' ',1))==2 and 'flow' in line.split(' ',1)[1].lower() and not line.split(' ',1)[1].startswith('.github/')]
 report[name]={'head':git(repo,'rev-parse','HEAD').decode().strip(),'commits':int(git(repo,'rev-list','--all','--count')),'refs':git(repo,'for-each-ref','--format=%(refname) %(objectname)').decode().splitlines(),'flow_objects':paths}
 if name=='site':
  archives=[]
  for line in paths:
   sha,path=line.split(' ',1)
   if path.endswith('.zip'):
    raw=git(repo,'cat-file','blob',sha);entry={'git_blob':sha,'path':path,'sha256':hashlib.sha256(raw).hexdigest(),'members':[]}
    try:
     z=zipfile.ZipFile(io.BytesIO(raw))
     for info in z.infolist():
      m={'name':info.filename,'size':info.file_size,'crc':f'{info.CRC:08x}'}
      try:data=z.read(info);m.update(read='PASS',sha256=hashlib.sha256(data).hexdigest())
      except Exception as e:m.update(read='FAIL',error=str(e))
      entry['members'].append(m)
    except Exception as e:entry['error']=str(e)
    archives.append(entry)
  report[name]['legacy_archives']=archives
report['conclusion']='Owner clarification excludes tabletop from design; tabletop recovery is not an acceptance gate. Full source assembly CAD was not recovered in the original history search. Engineering has no Flow design paths. Unreachable/deleted refs and external owner files are not accessible.'
OUT.mkdir(exist_ok=True);(OUT/'source-search.json').write_text(json.dumps(report,indent=2)+'\n')
print({k:(v['commits'],len(v['refs']),len(v['flow_objects'])) for k,v in report.items() if isinstance(v,dict)})
