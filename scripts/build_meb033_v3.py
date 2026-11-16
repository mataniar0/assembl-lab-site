#!/usr/bin/env python3
"""Rebuild MEB-033 V3 from V2 by removing real lid/front-wall interpenetration.

The physically confirmed MEB-033 part profiles stay unchanged. Change only the
display assembly placement of LID_FRONT_RAIL, not manufacturing SVG/DXF.
"""
from pathlib import Path
import struct,json,os,base64,hashlib
root=Path(__file__).resolve().parents[1]
source=root/"megillat_esther_box/media/meb033-assembly-v2.glb"
destination=root/"megillat_esther_box/media/meb033-assembly-v3.glb"
blob=source.read_bytes()
magic,version,total=struct.unpack_from("<III",blob)
assert magic==0x46546c67 and version==2 and total==len(blob)
length,chunk=struct.unpack_from("<II",blob,12)
assert chunk==0x4e4f534a
doc=json.loads(blob[20:20+length])
binary_at=20+length
bin_length,typ=struct.unpack_from("<II",blob,binary_at)
assert typ==0x004e4942
binary=bytearray(blob[binary_at+8:binary_at+8+bin_length])
assert len(binary)==bin_length
rail=next(m for m in doc["meshes"] if m["name"]=="LID_FRONT_RAIL")
count=0
for prim in rail["primitives"]:
    id=prim["attributes"]["POSITION"]
    a=doc["accessors"][id]
    v=doc["bufferViews"][a["bufferView"]]
    assert a["type"]=="VEC3" and a["componentType"]==5126
    assert v.get("byteStride",0) in (0,12)
    ofs=v["byteOffset"]+a.get("byteOffset",0)
    for n in range(a["count"]):
        p=ofs+12*n+8
        old=struct.unpack_from("<f",binary,p)[0]
        struct.pack_into("<f",binary,p,old-0.004)
        count+=1
    a["min"][2]=float(a["min"][2])-0.004
    a["max"][2]=float(a["max"][2])-0.004
assert count>200
old=doc["extras"]
assert old["modelRevision"]=="MEB033-ASSEMBLY-V2"
old["modelRevision"]="MEB033-ASSEMBLY-V3"
old["frontRailRelocationMm"]={"axis":"Z","distance":-4.0,
 "reason":"Remove measured solid 4mm-thick overlap with BODY_FRONT at Y66.5..71mm"}
old["sourceGeometryUnchanged"]=True
old["remainingLimitations"]="Full fit not verified against maker photos or measurements; source V2 lid curvature and hinge placement remain approximations"
doc["asset"]["generator"]="ASSEMBL LAB corrected MEB-033 V3 - side lap rail collision removed"
j=json.dumps(doc,ensure_ascii=True,separators=(",",":")).encode("utf8")
j+=b" "*((-len(j))%4)
while len(binary)%4:binary.append(0)
total=12+8+len(j)+8+len(binary)
out=struct.pack("<III",0x46546c67,2,total)
out+=struct.pack("<II",len(j),0x4e4f534a)+j
out+=struct.pack("<II",len(binary),0x004e4942)+binary
assert len(out)==total
destination.write_bytes(out)
print("MEB033_V3_GENERATED",json.dumps({"bytes":len(out),"translatedVertices":count,"meshCount":len(doc["meshes"]),"sha256":hashlib.sha256(out).hexdigest(),"railBoundingBoxMm":{"zMin":-42.5,"zMax":-38.5}}),flush=True)
if os.environ.get("MEB033_EXPORT_BASE64")=="1":
    b64=base64.b64encode(out).decode("ascii")
    print("MEB033_V3_BASE64_BEGIN",flush=True)
    for i in range(0,len(b64),4096):
        print("MEB033_V3_CHUNK:"+b64[i:i+4096],flush=True)
    print("MEB033_V3_BASE64_END",flush=True)
