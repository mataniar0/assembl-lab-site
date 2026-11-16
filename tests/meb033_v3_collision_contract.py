"""MEB-033 V3: require source-derived geometry, eliminated front-rail clash and live poster."""
from pathlib import Path
import json,struct,math
ROOT=Path(__file__).resolve().parents[1]
def load(name):
    data=(ROOT/"megillat_esther_box/media"/name).read_bytes()
    magic,version,size=struct.unpack_from("<III",data)
    assert magic==0x46546c67 and version==2 and size==len(data)
    jlen,jtyp=struct.unpack_from("<II",data,12)
    assert jtyp==0x4e4f534a
    header=json.loads(data[20:20+jlen])
    start=20+jlen
    blen,btyp=struct.unpack_from("<II",data,start)
    assert btyp==0x004e4942 and start+8+blen==size
    return header,data[start+8:]
v2,bin2=load("meb033-assembly-v2.glb")
v3,bin3=load("meb033-assembly-v3.glb")
assert len(v3["meshes"])==len(v2["meshes"])==20
assert v3["extras"]["modelRevision"]=="MEB033-ASSEMBLY-V3"
assert v3["extras"]["frontRailRelocationMm"]["distance"]==-4.0
assert v3["extras"]["sourceGeometryUnchanged"] is True
assert v3["extras"]["sourceStockThicknessMm"]==4
assert v3["extras"]["kerfRows"]==22 and v3["extras"]["kerfLines"]==88
assert v3["extras"]["cutoutLoopsPreserved"]==10
def xyz(doc,binary,name):
    mesh=next(x for x in doc["meshes"] if x["name"]==name)
    coords=[]
    for prim in mesh["primitives"]:
        a=doc["accessors"][prim["attributes"]["POSITION"]]
        v=doc["bufferViews"][a["bufferView"]]
        assert a["componentType"]==5126 and a["type"]=="VEC3"
        offset=v["byteOffset"]+a.get("byteOffset",0)
        coords.extend(struct.unpack_from("<"+str(a["count"]*3)+"f",binary,offset))
    return coords
old=xyz(v2,bin2,"LID_FRONT_RAIL")
new=xyz(v3,bin3,"LID_FRONT_RAIL")
assert len(old)==len(new)
for i,(a,b) in enumerate(zip(old,new)):
    expect=-0.004 if i%3==2 else 0
    assert abs((b-a)-expect)<2e-7,(i,a,b,expect)
for m in v2["meshes"]:
    if m["name"]=="LID_FRONT_RAIL":continue
    a=xyz(v2,bin2,m["name"]);b=xyz(v3,bin3,m["name"])
    assert a==b,("other part geometry changed",m["name"])
front=xyz(v3,bin3,"BODY_FRONT")
assert max(new[2::3])<=min(front[2::3])+0.000001,"front rail still intersects wall"
assert -0.0426<min(new[2::3])<-0.0424
page=(ROOT/"megillat_esther_box/index.html").read_text(encoding="utf8")
assert 'data-model-src="media/meb033-assembly-v3.glb"' in page
assert 'src="media/meb033-assembly-v3-poster.png"' in page
png=(ROOT/"megillat_esther_box/media/meb033-assembly-v3-poster.png").read_bytes()
assert png[:8]==bytes((137,80,78,71,13,10,26,10))
print("PASS MEB033 V3 front rail correction / unchanged other 19 parts / accurate viewer asset")
