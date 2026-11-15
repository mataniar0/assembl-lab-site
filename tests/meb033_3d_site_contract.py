"""MEB-033 corrected 3D: source geometry, real holes, hinge anchors and viewer contract."""
from pathlib import Path
import json, struct, math, hashlib
root=Path(__file__).resolve().parents[1]
page=(root/"megillat_esther_box/index.html").read_text(encoding="utf-8")
home=(root/"index.html").read_text(encoding="utf-8")
data=(root/"megillat_esther_box/media/meb033-assembly-v2.glb").read_bytes()
poster=(root/"megillat_esther_box/media/meb033-assembly-v2-poster.svg").read_text()
assert len(data)>300000 and data[:4]==b"glTF"
magic,version,total=struct.unpack_from("<III",data,0)
assert magic==0x46546c67 and version==2 and total==len(data)
json_size,json_type=struct.unpack_from("<II",data,12)
assert json_type==0x4e4f534a and json_size%4==0
gltf=json.loads(data[20:20+json_size])
bin_at=20+json_size
bin_size,bin_type=struct.unpack_from("<II",data,bin_at)
assert bin_type==0x004e4942 and bin_at+8+bin_size==len(data)
assert gltf["buffers"][0]["byteLength"]==bin_size
models={m["name"]:m for m in gltf["meshes"]}
assert len(models)==len(gltf["nodes"])==20
assert "MEB029_SINGLE_INVERSE_CURVE_4MM" not in models
meta=gltf["extras"]
assert meta["modelRevision"]=="MEB033-ASSEMBLY-V2"
assert meta["sourceStockThicknessMm"]==4 and meta["sourceProductParts"]==20
assert meta["sourceOutlineCount"]==31 and meta["kerfRows"]==22 and meta["kerfLines"]==88
assert meta["cutoutLoopsPreserved"]==10
assert meta["fullAssemblyNotMeasured"] is True
assert meta["hingeCenterDeviationMm"]<=0.1
assert abs(meta["roofArcLengthMm"]-99.17085434)<1e-6
assert abs(meta["roofChordMm"]-85.5)<1e-6
assert 21.3<meta["roofSagittaMm"]<21.6
assert len(gltf["bufferViews"])>=80
for v in gltf["bufferViews"]:
    assert v["byteOffset"]+v["byteLength"]<=bin_size
def values(index):
    a=gltf["accessors"][index];v=gltf["bufferViews"][a["bufferView"]]
    offset=bin_at+8+v["byteOffset"]+a.get("byteOffset",0)
    unit={5126:"f",5123:"H",5125:"I"}[a["componentType"]]
    n={"SCALAR":1,"VEC3":3}[a["type"]]
    fmt="<"+unit*n*a["count"]
    return struct.unpack_from(fmt,data,offset)
def triangles(name):
    prim=models[name]["primitives"][0]
    pts=values(prim["attributes"]["POSITION"])
    ids=values(prim["indices"])
    return [[(pts[3*k],pts[3*k+1],pts[3*k+2]) for k in ids[i:i+3]] for i in range(0,len(ids),3)]
def covers_yz(name,y,z):
    y/=1000;z/=1000
    for tri in triangles(name):
        a,b,c=[(v[1],v[2]) for v in tri]
        def signed(p,q,r): return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
        a0=signed(a,b,(y,z));b0=signed(b,c,(y,z));c0=signed(c,a,(y,z))
        if min(a0,b0,c0)>=-1e-12 or max(a0,b0,c0)<=1e-12:
            return True
    return False
def extent(name):
    mesh=models[name]
    acc=[gltf["accessors"][p["attributes"]["POSITION"]] for p in mesh["primitives"]]
    return [min(a["min"][k] for a in acc) for k in range(3)],[max(a["max"][k] for a in acc) for k in range(3)]
# Fascia lies vertically: previous V1 reversed 102.43 mm height and 84.1 mm depth.
for key in ("OUTER_FASCIA_L","OUTER_FASCIA_R","FASCIA_HIDDEN_BACKER_L","FASCIA_HIDDEN_BACKER_R"):
    low,high=extent(key)
    assert 0.1023<high[1]-low[1]<0.1026,(key,"wrong vertical orientation",low,high)
    assert 0.0840<high[2]-low[2]<0.0842,(key,"wrong depth orientation",low,high)
# Hinge holes and adjacent material must have opposite occupancy.
for key in ("OUTER_FASCIA_L","OUTER_FASCIA_R","FASCIA_HIDDEN_BACKER_L","FASCIA_HIDDEN_BACKER_R","LID_END_L","LID_END_R"):
    assert not covers_yz(key,75,36.5),(key,"hinge hole was filled")
for key in ("OUTER_FASCIA_L","OUTER_FASCIA_R","FASCIA_HIDDEN_BACKER_L","FASCIA_HIDDEN_BACKER_R"):
    assert covers_yz(key,40,0),(key,"face mistakenly empty")
assert 'data-model-src="media/meb033-assembly-v2.glb"' in page
assert 'class="three-poster" src="media/meb033-assembly-v2-poster.svg"' in page
assert "meb033-assembly-preview.glb" not in page
for k in ("data-three-preview","data-three-open","data-three-close","three-preview.css","three-preview.js"):
    assert k in page
for raw,keys in ((page,("three.title","three.design","three.alt","three.ready","three.error","status.meb033")),(home,("home.megillah.copy","catalog.megillah.status"))):
    translations=json.loads(raw.split('<script type="application/json" id="page-translations">')[1].split("</script>")[0])
    for k in keys: assert translations[k]["he"] and translations[k]["en"]
assert "<svg" in poster and "MEB-033" in poster and "reconstructed placement" in poster
print(json.dumps({"status":"PASS","meshes":20,"realHingeHoles":6,"roofSlits":88,
 "hingeCenterDeviationMm":meta["hingeCenterDeviationMm"],"glbBytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}))
