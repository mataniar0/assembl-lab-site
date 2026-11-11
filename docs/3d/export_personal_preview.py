from pathlib import Path
import json,struct,hashlib,numpy as np
R=Path(__file__).resolve().parents[2];src=R.parent/'assembl-lab-engineering/projects/CTB-01/closeout/personal-prototype-design-only/assembly/validated-candidate-DESIGN_ONLY.glb';b=src.read_bytes();assert hashlib.sha256(b).hexdigest()=='285dabf36be7d7a26772d4ad9dba7442eb1c06704fe104aec929adf4c4a65bf4', 'Unexpected engineering source revision';jl=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+jl]);binary=bytearray(b[28+jl:]);stats=[];allpos=[]
# Split shading vertices at CAD creases; triangle positions/colors are unchanged.
source_binary=bytes(binary);source_doc=json.loads(json.dumps(j));binary=bytearray()
j['accessors']=[];j['bufferViews']=[]
def source_arr(idx):
 a=source_doc['accessors'][idx];v=source_doc['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];cols={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]
 return np.frombuffer(source_binary,dtype=dtype,count=a['count']*cols,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape((-1,cols)).copy()
def add(data,typ,component,target,bounds=False):
 global binary
 binary+=b'\0'*((-len(binary))%4);off=len(binary);binary+=data.tobytes();vi=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':data.nbytes,'target':target})
 a={'bufferView':vi,'componentType':component,'count':len(data),'type':typ}
 if bounds:a.update(min=data.min(0).tolist(),max=data.max(0).tolist())
 ai=len(j['accessors']);j['accessors'].append(a);return ai
for index,m in enumerate(j['meshes']):
 originalname=m.get('name');m['name']=f'design-part-{index+1:02d}';m.pop('extras',None)
 for p in m['primitives']:
  oldattrs=p['attributes'];positions=source_arr(oldattrs['POSITION']);inds=source_arr(p['indices']).reshape(-1,3);colors=source_arr(oldattrs['COLOR_0']);color_accessor=source_doc['accessors'][oldattrs['COLOR_0']]
  assert np.isfinite(positions).all() and len(positions)>0 and inds.max()<len(positions)
  faces=np.cross(positions[inds[:,1]]-positions[inds[:,0]],positions[inds[:,2]]-positions[inds[:,0]]);length=np.linalg.norm(faces,axis=1);unit=np.divide(faces,length[:,None],out=np.zeros_like(faces),where=length[:,None]>0)
  adjacent=[[] for _ in positions]
  for fi,tri in enumerate(inds):
   for vertex in tri:adjacent[vertex].append(fi)
  lookup={};newpos=[];newnorm=[];newcolors=[];newinds=[]
  for fi,tri in enumerate(inds):
   for vertex in tri:
    neighbors=adjacent[vertex];eligible=[n for n in neighbors if np.dot(unit[n],unit[fi])>=np.cos(np.pi/6)]
    normal=faces[eligible].sum(0)
    if np.linalg.norm(normal)==0:normal=faces[neighbors].sum(0)
    if np.linalg.norm(normal)==0:normal=np.array([0.,1.,0.])  # Zero-area source triangles have no visible surface.
    normal/=np.linalg.norm(normal);key=(int(vertex),tuple(np.round(normal,5)))
    if key not in lookup:
     lookup[key]=len(newpos);newpos.append(positions[vertex]);newnorm.append(normal);newcolors.append(colors[vertex])
    newinds.append(lookup[key])
  newpos=np.array(newpos,dtype='<f4');newnorm=np.array(newnorm,dtype='<f4');newcolors=np.array(newcolors,dtype=colors.dtype);newinds=np.array(newinds,dtype='<u4').reshape(-1,1)
  assert np.array_equal(newpos[newinds.reshape(-1)],positions[inds.reshape(-1)])
  p['attributes']={'POSITION':add(newpos,'VEC3',5126,34962,True),'NORMAL':add(newnorm,'VEC3',5126,34962),'COLOR_0':add(newcolors,color_accessor['type'],color_accessor['componentType'],34962)}
  if color_accessor.get('normalized'):j['accessors'][p['attributes']['COLOR_0']]['normalized']=True
  p['indices']=add(newinds,'SCALAR',5125,34963)
  allpos.append(positions);stats.append({'source_part':originalname,'public_part':m['name'],'vertices':len(newpos),'source_vertices':len(positions),'triangles':len(inds),'source_zero_area_triangles':int((length==0).sum())})
for i,n in enumerate(j['nodes']):n['name']='preview-world' if i==0 else f'preview-node-{i:02d}';n.pop('extras',None)
j['nodes'][0]['matrix']=[1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1];j['buffers'][0]['byteLength']=len(binary);j['asset']['extras']={'designation':'DESIGN_ONLY / PERSONAL_PROTOTYPE / FIT_STRENGTH_UNVERIFIED'}
for mesh in j['meshes']:
 for prim in mesh['primitives']:
  for a in prim['attributes'].values():j['bufferViews'][j['accessors'][a]['bufferView']]['target']=34962
  j['bufferViews'][j['accessors'][prim['indices']]['bufferView']]['target']=34963
jdata=json.dumps(j,separators=(',',':')).encode();jdata+=b' '*((-len(jdata))%4);binary+=b'\0'*((-len(binary))%4)
out=struct.pack('<III',0x46546c67,2,28+len(jdata)+len(binary))+struct.pack('<II',len(jdata),0x4e4f534a)+jdata+struct.pack('<II',len(binary),0x004e4942)+binary
path=R/'table/personal/media/personal-design-preview.glb';path.write_bytes(out);xyz=np.concatenate(allpos);lo=xyz.min(0);hi=xyz.max(0);assert abs(float(hi[2]-lo[2])-.5)<1e-6
report={'source_sha256':hashlib.sha256(b).hexdigest(),'export_sha256':hashlib.sha256(out).hexdigest(),'source_bytes':len(b),'export_bytes':len(out),'mesh_count':len(stats),'triangles':sum(x['triangles'] for x in stats),'source_bounds_metres':[lo.tolist(),hi.tolist()],'display_bounds_metres':[[float(lo[0]),float(lo[2]),float(-hi[1])],[float(hi[0]),float(hi[2]),float(-lo[1])]],'triangle_positions_preserved':True,'display_transform':'Rigid Rx(-90 degrees), metres, Y-up','new_normals':'Area-weighted normals within 30-degree CAD creases; split shading vertices only, exact triangle positions/colors preserved','parts':stats,'status':'DESIGN_ONLY; physical replica UNVERIFIED'}
(R/'docs/3d/personal-export.json').write_text(json.dumps(report,indent=2)+'\n');print('Export',len(out),'bytes',len(stats),'meshes',report['triangles'],'triangles')
