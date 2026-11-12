import subprocess,json,re,hashlib,io,zipfile,struct,zlib,argparse,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser(description='Read-only Geometric source search; no source is executed or accepted as a part automatically.')
parser.add_argument('--engineering',type=Path,default=ROOT.parent/'assembl-lab-engineering')
parser.add_argument('--output',type=Path,default=ROOT/'docs/3d/geometric-source-audit')
parser.add_argument('--frozen',action='store_true',help='Use recorded immutable ref SHAs, excluding future/self-authored commits')
args=parser.parse_args();OUT=args.output;OUT.mkdir(parents=True,exist_ok=True)
KEY=re.compile(r'geometric|גאומטר|גיאומטר',re.I)
CAD=re.compile(r'\.(step|stp|fcstd|obj|stl|3mf|iges|igs|blend|glb|gltf|scad|dxf|dwg|f3d|sldprt|sldasm|ipt|iam|skp)$',re.I)
TEXT=re.compile(r'\.(md|json|py|js|html|txt|csv|yaml|yml|scad|svg|xml|dxf|gltf)$',re.I)
LINK=re.compile(r'(?:https?://|href=[\"\x27]|src=[\"\x27])[^\s\"\x27<>]+',re.I)
summary=[]
for name in ('assembl-lab-site','assembl-lab-engineering'):
 root=ROOT if name=='assembl-lab-site' else args.engineering
 def git(*args):return subprocess.check_output(['git',*args],cwd=root)
 refs=git('for-each-ref','--format=%(refname) %(objectname)','refs/heads','refs/remotes','refs/tags').decode().splitlines()
 if args.frozen:refs=json.loads((ROOT/'docs/3d/geometric-source-audit'/(name+'-history.json')).read_text())['refs']
 starts=sorted({line.split()[1] for line in refs})
 objects=git('rev-list','--objects',*starts).decode().splitlines();lookup={line.split(' ',1)[0]:line.split(' ',1)[1] if ' ' in line else '' for line in objects}
 checks=subprocess.run(['git','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],cwd=root,input=('\n'.join(lookup)+'\n').encode(),capture_output=True,check=True).stdout.decode().splitlines()
 blobs=[];hits=[];archives=[];models=[];links=set();storage_links=set();embedded_types=collections.Counter();embedded_candidates=[];texts=0;binary=0;bytecount=0
 proc=subprocess.Popen(['git','cat-file','--batch'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
 def analyze(data,path,oid,archive=None):
  sig=None
  if data[:4]==b'glTF':sig='GLB'
  elif data.lstrip().startswith(b'ISO-10303-21'):sig='STEP'
  elif data.startswith(b'PK\x03\x04'):sig='ZIP'
  if CAD.search(path) or sig in ('GLB','STEP'):
   models.append({'path':path,'git_blob':oid,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'magic':sig,'archive':archive})
  if TEXT.search(path) or (not b'\0' in data[:2048] and not data.startswith((b'\xff\xd8',b'\x89PNG',b'RIFF'))):
   try:txt=data.decode('utf8')
   except UnicodeDecodeError:return False
   for mime in re.findall(r'\bdata:([A-Za-z0-9.+-]+/[A-Za-z0-9.+-]+)',txt):
    embedded_types[mime]+=1
    if not mime.startswith(('image/','font/')):embedded_candidates.append({'path':path,'git_blob':oid,'media_type':mime})
   for link in LINK.findall(txt):
    if re.search(r'\.(?:step|stp|fcstd|obj|glb|gltf|dxf|zip)(?:[?#]|$)',link,re.I):links.add(link)
    if re.search(r'(drive\.google|dropbox|1drv|onedrive|sharepoint|autodesk|onshape|fusion360)',link,re.I):storage_links.add(link)
   found=list(KEY.finditer(txt))
   if found:
    contexts=[]
    for m in found[:8]:contexts.append(re.sub(r'\s+',' ',txt[max(0,m.start()-110):min(len(txt),m.end()+200)]))
    hits.append({'path':path,'git_blob':oid,'archive':archive,'matches':len(found),'contexts':contexts})
    for link in LINK.findall(txt):
     if re.search(r'\.(?:step|stp|fcstd|obj|glb|gltf|dxf|zip)(?:[?#]|$)',link,re.I):links.add(link)
   return True
  return False
 def archive_scan(data,path,oid,depth=0):
  with zipfile.ZipFile(io.BytesIO(data)) as z:
   members=[]
   for info in z.infolist():
    if info.is_dir():continue
    assert info.file_size<100_000_000,'Oversized archive member: '+info.filename
    integrity='CRC_VALID'
    try:content=z.read(info)
    except zipfile.BadZipFile as error:
     # For historical content search only; never promote damaged archives to CAD authority.
     offset=info.header_offset;fields=struct.unpack_from('<IHHHHHIIIHH',data,offset);start=offset+30+fields[-2]+fields[-1];compressed=data[start:start+info.compress_size]
     assert info.compress_type in (0,8),'Unsupported damaged archive compression'
     content=compressed if info.compress_type==0 else zlib.decompress(compressed,-15)
     integrity='CRC_FAILED_UNTRUSTED_CONTENT_SCAN_ONLY: '+str(error)
    members.append({'path':info.filename,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest(),'integrity':integrity})
    analyze(content,info.filename,oid,archive=path)
    if content.startswith(b'PK\x03\x04'):
     assert depth<5,'Archive nesting exceeds inspected limit'
     archive_scan(content,path+'!'+info.filename,oid,depth+1)
   archives.append({'path':path,'git_blob':oid,'members':members})
 for item in checks:
  oid,typ,size=item.split();size=int(size)
  if typ!='blob':continue
  path=lookup[oid];proc.stdin.write((oid+'\n').encode());proc.stdin.flush();header=proc.stdout.readline().decode().split();assert header[0]==oid and int(header[2])==size
  data=proc.stdout.read(size);assert len(data)==size;assert proc.stdout.read(1)==b'\n';bytecount+=size
  sha=hashlib.sha256(data).hexdigest();blobs.append({'git_blob':oid,'path':path,'bytes':size,'sha256':sha})
  if analyze(data,path,oid):texts+=1
  else:binary+=1
  if data.startswith(b'PK\x03\x04'):
   try:archive_scan(data,path,oid)
   except (zipfile.BadZipFile,zlib.error,EOFError) as error:
    archives.append({'path':path,'git_blob':oid,'error':str(error),'status':'UNREADABLE_ARCHIVE_REJECTED_AS_GEOMETRY_SOURCE','bytes':len(data)})
 proc.stdin.close();proc.wait();assert proc.returncode==0
 historical_paths=sorted({line for line in git('-c','core.quotepath=false','log','--full-history','--root','--no-renames','-m','--format=','--name-only',*starts).decode().splitlines() if line})
 result={'historical_paths':historical_paths,'cad_paths_including_aliases':[p for p in historical_paths if CAD.search(p)],'blob_path_note':'rev-list reports one canonical path per content blob; historical_paths separately retains all aliases including removed files.','repository':'mataniar0/'+name,'checked_head':git('rev-parse','HEAD').decode().strip(),'main':git('rev-parse','origin/main').decode().strip(),'shallow':git('rev-parse','--is-shallow-repository').decode().strip(),'commit_count':int(git('rev-list','--count',*starts)),'refs':refs,'reachable_object_count':len(objects),'unique_blob_count':len(blobs),'bytes_scanned':bytecount,'text_blobs':texts,'binary_blobs':binary,'archives':archives,'cad_candidates':models,'geometric_content_hits':hits,'candidate_links':sorted(links),'external_storage_links':sorted(storage_links),'embedded_data_types':dict(embedded_types),'embedded_nonimage_candidates':embedded_candidates,'blobs':blobs,'scope':'All reachable fetched heads/tags and PR head refs plus their full ancestry; names, every blob content, parseable ZIP central directories and members (unreadable ZIPs explicitly recorded/rejected); damaged-CRC members explicitly marked untrusted, raw decompressed for content search only, never accepted as geometry sources. No dangling server-only/deleted refs outside Git reachability or external private storage.'}
 (OUT/(name+'-history.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 summary.append({k:result[k] for k in ('repository','commit_count','reachable_object_count','unique_blob_count','bytes_scanned','text_blobs','binary_blobs','candidate_links')});summary[-1].update(archive_count=len(archives),cad_candidate_count=len(models),content_hit_count=len(hits),ref_count=len(refs))
 print(json.dumps(summary[-1],ensure_ascii=False),flush=True)
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
