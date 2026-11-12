"""Validate the bounded AL-016 GLB export; optional independent source-buffer comparison.
Run: python tests/three_model_assets_check.py [--source path/to/authoritative.glb]
"""
import argparse,json,struct,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def parse(path):
 data=path.read_bytes();assert len(data)>=28
 magic,version,length=struct.unpack_from('<III',data);assert magic==0x46546c67 and version==2 and length==len(data)
 n,typ=struct.unpack_from('<II',data,12);assert typ==0x4e4f534a and n%4==0
 doc=json.loads(data[20:20+n]);ln,typ=struct.unpack_from('<II',data,20+n);assert typ==0x004e4942 and ln==len(data)-28-n
 binary=data[28+n:];assert doc['buffers'][0]['byteLength']<=len(binary) and 'uri' not in doc['buffers'][0]
 return data,doc,binary

def values(doc,binary,index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];fmt,size={5126:('f',4),5125:('I',4),5123:('H',2),5121:('B',1)}[a['componentType']];cols={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];offset=v.get('byteOffset',0)+a.get('byteOffset',0);count=a['count']*cols;assert offset+count*size<=v.get('byteOffset',0)+v['byteLength']<=len(binary)
 return struct.unpack_from('<'+str(count)+fmt,binary,offset)

def validate(path,source=None):
 data,doc,binary=parse(path);assert doc['asset']['version']=='2.0';assert len(doc['meshes'])==32;assert len(doc['nodes'])==33
 assert doc['nodes'][0]['matrix']==[1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1]
 stats=json.loads((ROOT/'docs/3d/personal-export.json').read_text());assert hashlib.sha256(data).hexdigest()==stats['export_sha256'];assert len(data)<3_000_000
 if source:
  sd,sj,sb=parse(source);assert hashlib.sha256(sd).hexdigest()==stats['source_sha256']
 count=0
 for i,m in enumerate(doc['meshes']):
  assert m['name']==f'design-part-{i+1:02d}'
  for p in m['primitives']:
   assert p.get('mode',4)==4
   pos=values(doc,binary,p['attributes']['POSITION']);norm=values(doc,binary,p['attributes']['NORMAL']);indices=values(doc,binary,p['indices'])
   assert len(pos)==len(norm)>0 and len(indices)%3==0 and max(indices)<len(pos)//3
   assert all(math.isfinite(x) for x in pos+norm)
   assert all(abs(sum(v*v for v in norm[k:k+3])-1)<1e-4 for k in range(0,len(norm),3))
   if source:
    original=sj['meshes'][i]['primitives'][0];opos=values(sj,sb,original['attributes']['POSITION']);oi=values(sj,sb,original['indices']);oc=values(sj,sb,original['attributes']['COLOR_0']);color=values(doc,binary,p['attributes']['COLOR_0']);cols=sj['accessors'][original['attributes']['COLOR_0']]['type'];cols={'VEC3':3,'VEC4':4}[cols]
    assert len(indices)==len(oi)
    for vertex,old in zip(indices,oi):
     assert pos[vertex*3:vertex*3+3]==opos[old*3:old*3+3]
     assert color[vertex*cols:vertex*cols+cols]==oc[old*cols:old*cols+cols]
   count+=len(indices)//3
 assert count==stats['triangles']
 return {'mesh_count':32,'triangles':count,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'source_triangle_positions_colors_identical':bool(source)}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path);args=parser.parse_args();path=ROOT/'table/personal/media/personal-design-preview.glb';result=validate(path,args.source)
 # Genuine corrupt model negative controls use disposable bytes, never modify the checked asset.
 import tempfile
 negatives=0
 with tempfile.TemporaryDirectory() as tmp:
  for name,bad in [('truncated',path.read_bytes()[:-8]),('bad-version',path.read_bytes()[:4]+struct.pack('<I',1)+path.read_bytes()[8:])]:
   f=Path(tmp)/name;f.write_bytes(bad)
   try:validate(f)
   except (AssertionError,ValueError,struct.error):negatives+=1
   else:raise AssertionError('Corrupt control unexpectedly accepted')
 assert negatives==2
 print(json.dumps({'passed':3,'failed':0,'negative_controls_rejected':negatives,'result':result},indent=2))
