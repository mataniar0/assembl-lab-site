"""Validate MEB-033 3D viewer source, physical-report wording and GLB structure."""
from pathlib import Path
import json,struct,hashlib
root=Path(__file__).resolve().parents[1]
page=(root/"megillat_esther_box/index.html").read_text(encoding="utf-8")
home=(root/"index.html").read_text(encoding="utf-8")
blob=(root/"megillat_esther_box/media/meb033-assembly-preview.glb").read_bytes()
assert len(blob)>100000
magic,ver,size=struct.unpack_from("<III",blob,0)
assert magic==0x46546c67 and ver==2 and size==len(blob)
jsize,jtype=struct.unpack_from("<II",blob,12)
assert jtype==0x4e4f534a and jsize%4==0
gltf=json.loads(blob[20:20+jsize])
names={m["name"] for m in gltf["meshes"]}
assert len(names)==len(gltf["nodes"])==20
assert "LID_SKIN_RADIAL_4MM" in names and "BODY_FLOOR" in names
assert "MEB029_SINGLE_INVERSE_CURVE_4MM" not in names
assert gltf["extras"]["stockMm"]==4
assert gltf["extras"]["lidCutlines"]==88 and gltf["extras"]["lidSlitRows"]==22
assert "indicative" in gltf["extras"]["caveat"].lower() or "approximate" in gltf["extras"]["caveat"].lower()
binpos=20+jsize
blen,btype=struct.unpack_from("<II",blob,binpos)
assert btype==0x004e4942 and binpos+8+blen==size
assert gltf["buffers"][0]["byteLength"]==blen
for view in gltf["bufferViews"]:
    assert view["byteOffset"]+view["byteLength"]<=blen
assert page.count("data-three-preview")==1
assert 'data-model-src="media/meb033-assembly-preview.glb"' in page
for marker in ('data-three-open','data-three-close','data-three-action="reset"','three-preview.js','three-preview.css','DESIGN_ONLY'):
    assert marker in page
for html,keys in ((page,("three.title","three.design","three.alt","three.open","three.error","three.ready","status.meb033")), (home,("home.megillah.copy","catalog.megillah.status"))):
    value=html.split('<script type="application/json" id="page-translations">',1)[1].split("</script>",1)[0]
    d=json.loads(value)
    for key in keys:
        assert d[key]["he"] and d[key]["en"],key
assert "אב־טיפוס נחתך והורכב בהצלחה" in page
print("PASS MEB-033 3D",len(blob),"bytes /",len(names),"named parts / 88 kerf lines / sha256",hashlib.sha256(blob).hexdigest())
