#!/usr/bin/env python3
"""AL-016/017: source-traceable viewer asset contract for six selected product pages."""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS={
 "geometric/":("geometric-v11-design-only.glb",15,"b3ee4944fee14901bafa2f50e52820d2e8394c13b41563ee627ba719bac9a1e9"),
 "table/flow/":("flow-v31-design-only.glb",19,"6194d110245a59289ba76bb5b5386648eaa8b0a679936c0e80602e679f42a8c3"),
 "table/personal/":("personal-design-preview.glb",32,None),
 "shelf/kids/":("kids-shelf-700-design-only.glb",5,None),
 "driller_stand/":("driller-v365-design-only.glb",31,None),
 "shoe_rack/":("shoe-rack-v4-700-design-only.glb",36,"84fbf1bef9a264c399ac800333a899e818a1fdf68c956d6eabdb4a896fa49445")
}
# Color-fix contract: new whole-file Git blob IDs, exact original mesh buffer SHA256,
# and warm-birch PBR color in every primitive. Other three models are untouched.
WOOD_FIXES={
 "shelf/kids/": {
  "git_blob":"4d45a91ced22f644ecdc6674403dadd1b01411fb",
  "bin_sha256":"dd2364b650f92166436506b719b3add4f9c0f150031541cfa3a534be9eba2c10",
  "color":[0.67,0.54,0.35,1.0],
 },
 "driller_stand/": {
  "git_blob":"73c7900e553289cf1f9562305d223c9e71c42a01",
  "bin_sha256":"062b8e0e0e76f4fca7da2525d14ffa5b0e1de7dfe937463aa33b59bb4845d65b",
  "color":[0.64,0.49,0.30,1.0],
 },
}
def parse(data):
 if len(data)<28:raise AssertionError("GLB too short")
 magic,v,total=struct.unpack_from('<III',data)
 assert magic==0x46546C67 and v==2 and total==len(data),"invalid GLB envelope"
 n,typ=struct.unpack_from('<II',data,12)
 assert typ==0x4E4F534A and n%4==0,"invalid glTF JSON chunk"
 meta=json.loads(data[20:20+n])
 assert meta["asset"]["version"]=="2.0" and meta.get("meshes") and meta.get("scenes")
 return len(meta["meshes"])
def run():
 info=[]
 for route,(name,expected,sha) in ASSETS.items():
  page=ROOT/route/"index.html"; model=ROOT/route/"media"/name
  poster=ROOT/route/"media"/(name.replace(".glb","-poster.webp"))
  if route=="table/personal/":poster=ROOT/route/"media/personal-design-preview-poster.webp"
  assert model.is_file() and poster.is_file(),(route,"missing asset")
  b=model.read_bytes(); meshes=parse(b);assert meshes==expected,(route,meshes,expected)
  if sha:assert hashlib.sha256(b).hexdigest()==sha,(route,"unapproved GLB version")
  header=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
  prims=[p for m in header["meshes"] for p in m["primitives"]]
  if route in WOOD_FIXES:
   spec=WOOD_FIXES[route]
   blob=hashlib.sha1(b"blob "+str(len(b)).encode()+bytes([0])+b).hexdigest()
   assert blob==spec["git_blob"],(route,"unexpected colored GLB version",blob)
   offset=20+struct.unpack_from('<I',b,12)[0]
   chunk_len,chunk_type=struct.unpack_from('<II',b,offset)
   assert chunk_type==0x4E4942 and hashlib.sha256(b[offset+8:offset+8+chunk_len]).hexdigest()==spec["bin_sha256"],(route,"geometry buffer changed")
   assert len(header.get("materials",[]))==1,(route,"missing warm-wood material")
   mat=header["materials"][0]["pbrMetallicRoughness"]
   assert mat["baseColorFactor"]==spec["color"] and mat["metallicFactor"]==0 and mat["roughnessFactor"]==1,(route,"wrong color/PBR")
   assert all(p.get("material")==0 for p in prims),(route,"uncolored primitives")
  else:
   assert any("COLOR_0" in p.get("attributes",{}) for p in prims) or header.get("materials"),(route,"existing model has no visible color")
   if route=="shoe_rack/": assert all("COLOR_0" in p.get("attributes",{}) for p in prims),(route,"shoe rack lost source wood vertex colors")
  assert poster.read_bytes()[:4]==b"RIFF" and b"WEBP" in poster.read_bytes()[:16],(route,"not WebP")
  h=page.read_text(encoding="utf8")
  assert h.count("data-three-preview")==1 and 'data-state="idle"' in h,(route,"viewer not ready")
  assert ('data-model-src="media/'+name+'"') in h,(route,"wrong route model")
  assert ('src="media/'+poster.name+'"') in h,(route,"wrong poster")
  for token in ('data-three-open','data-three-close','data-three-action="reset"','data-i18n="three.design"',"three-preview.js","three-preview.css"):
   assert token in h,(route,"missing",token)
  assert 'data-state="blocked"' not in h,(route,"unexpected blocked viewer")
  assert "DESIGN" in h.upper() or "תכנון" in h,(route,"missing design-only disclaimer")
  info.append({"route":route,"meshes":meshes,"bytes":len(b)})
 assert (ROOT/"assets/vendor/model-viewer-4.1.0/model-viewer.min.js").is_file()
 for bad in (b"",b"not a GLB",b"glTF"+bytes(24)):
  try:parse(bad)
  except Exception:pass
  else:raise AssertionError("negative-control corrupted GLB was accepted")
 print(json.dumps({"passed":5,"failed":0,"results":info,"real_posts":0},ensure_ascii=False,indent=2))
if __name__=="__main__":
 try:run()
 except Exception as error:print("FAIL",repr(error));raise
