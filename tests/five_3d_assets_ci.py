#!/usr/bin/env python3
"""AL-016/017: source-traceable viewer asset contract for exactly five selected pages."""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS={
 "geometric/":("geometric-v11-design-only.glb",15,"b3ee4944fee14901bafa2f50e52820d2e8394c13b41563ee627ba719bac9a1e9"),
 "table/flow/":("flow-v31-design-only.glb",19,"6194d110245a59289ba76bb5b5386648eaa8b0a679936c0e80602e679f42a8c3"),
 "table/personal/":("personal-design-preview.glb",32,None),
 "shelf/kids/":("kids-shelf-700-design-only.glb",5,"d06a7c058c4b0eacf7296e7c76f0b9f7427874db31f58aee355e925a587f976f"),
 "driller_stand/":("driller-v365-design-only.glb",31,"64d77807279c9afb647886062ddaf650a3500fd10d9aa9374721c7aef1360320")
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
