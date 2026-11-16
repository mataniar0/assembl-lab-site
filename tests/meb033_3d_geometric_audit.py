"""Independent geometry audit of the assembled MEB-033 V2 model.

This is diagnostic only. Checks are not a substitute for measured as-built CAD.
"""
from pathlib import Path
from collections import defaultdict
import json,struct,math
root=Path(__file__).resolve().parents[1]
data=(root/"megillat_esther_box/media/meb033-assembly-v2.glb").read_bytes()
size=struct.unpack_from("<I",data,12)[0]
g=json.loads(data[20:20+size])
boff=20+size+8
def unpack(accessor_idx):
 a=g["accessors"][accessor_idx]; view=g["bufferViews"][a["bufferView"]]
 off=boff+view["byteOffset"]+a.get("byteOffset",0)
 sz={"SCALAR":1,"VEC2":2,"VEC3":3}[a["type"]]*a["count"]
 types={5126:"f",5123:"H",5125:"I"}
 return struct.unpack_from("<"+str(sz)+types[a["componentType"]],data,off)
models={}
for mesh in g["meshes"]:
 vert=[]
 for prim in mesh["primitives"]:
  vals=unpack(prim["attributes"]["POSITION"])
  vert += [tuple(round(float(vals[3*i+j])*1000,4) for j in range(3)) for i in range(len(vals)//3)]
 lo=[round(min(v[k] for v in vert),3) for k in range(3)]
 hi=[round(max(v[k] for v in vert),3) for k in range(3)]
 models[mesh["name"]]={"vertices":vert,"lo":lo,"hi":hi}
print("V2_PART_BOUNDS_MM")
for k,x in models.items():
 print(k,"MIN",x["lo"],"MAX",x["hi"],"SIZE",[round(x["hi"][i]-x["lo"][i],2) for i in range(3)])
print("V2_OVERLAPPING_AABBS_OVER_1MM")
name=list(models)
for i in range(len(name)):
 for j in range(i+1,len(name)):
  a=models[name[i]];b=models[name[j]]
  o=[round(min(a["hi"][q],b["hi"][q])-max(a["lo"][q],b["lo"][q]),2) for q in range(3)]
  if min(o)>1:print(name[i],"WITH",name[j],o)
# Lid skins are a thin shell; compare its YZ point cloud against lid-end L/R.
skin=models["LID_SKIN_RADIAL_4MM"]["vertices"]
for cap in ("LID_END_L","LID_END_R"):
 e=models[cap]["vertices"]
 # Near the cap X interface, compare YZ vertices along the top half to the roof shell.
 xface=min(max(p[0] for p in e),max(p[0] for p in skin))
 yzskin=sorted(set((round(v[1],2),round(v[2],2)) for v in skin if abs(v[0]-xface)<10))
 yzend=sorted(set((round(v[1],2),round(v[2],2)) for v in e))
 # nearest neighbour in plane: smallest distance from each sampled lid roof point to end profile.
 sm=yzskin[::max(1,len(yzskin)//80)]
 ds=[min(math.hypot(v[0]-q[0],v[1]-q[1]) for q in yzend) for v in sm]
 ds.sort()
 print("LID_END_VS_SKIN",cap,"xface",round(xface,2),"samples",len(ds),
       "distanceMin",round(ds[0],3),"distanceMedian",round(ds[len(ds)//2],3),
       "distanceMax",round(ds[-1],3))
print("GEOMETRIC_AUDIT_COMPLETE")
