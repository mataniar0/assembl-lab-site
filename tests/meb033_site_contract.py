"""Source-linked bilingual MEB-033 page contract; stdlib only."""
from pathlib import Path
import re, json, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
page=(root/"megillat_esther_box/index.html").read_text()
home=(root/"index.html").read_text()
prefix="https://raw.githubusercontent.com/mataniar0/assembl-lab-engineering/main/projects/MEB-01/MEB-033/cutting/MEB033_ALL20_PLUS_CURVE_R6_4MM_440x800_GAP1MM_DESIGN_ONLY."
assert prefix+"svg" in page and prefix+"dxf" in page
assert "MEB033_QA.json" in page and "DESIGN_ONLY" in page
assert "MEB-033" in home and "V8.2.2" not in page
ns={"s":"http://www.w3.org/2000/svg"}
nest=ET.parse(root/"megillat_esther_box/media/meb033-nesting-preview.svg").getroot()
lid=ET.parse(root/"megillat_esther_box/media/meb033-r6-lid.svg").getroot()
assert nest.get("viewBox")=="0 0 440 445"
assert len(nest.findall(".//s:polyline",ns))==31
assert len(nest.findall(".//s:line",ns))==88
assert len(lid.findall(".//s:line",ns))==88
for text,keys in [(page,["status.meb033","planning.note","specs.structure.value","detail.lid.copy","meb033.svg","meb033.dxf"]),(home,["catalog.megillah.status","home.megillah.copy"])]:
    m=re.search(r'<script type="application/json" id="page-translations">([\s\S]*?)</script>',text)
    assert m is not None
    data=json.loads(m.group(1))
    assert all(data[k]["he"] and data[k]["en"] for k in keys)
print("PASS: MEB-033 source, i18n, R6 kerfs, 21-part nesting and warnings")
