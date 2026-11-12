"""Bounded 2D SVG/OCC reference checks, NOT Geometric product CAD validation.
No thickness, millimetre scale, assembly placement or output GLB is invented.
"""
import json,hashlib,math,xml.etree.ElementTree as ET,importlib.metadata
from pathlib import Path
import cadquery as cq
from svgpathtools import parse_path,Line,CubicBezier
ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'assets/geometric-leg-drawing.svg'
def build_reference(paths):
 def point(z):return cq.Vector(z.real,-z.imag,0)
 wires=[]
 for path in paths:
  assert path.isclosed(),'Open reference contour'
  edges=[]
  for segment in path:
   if isinstance(segment,Line):edges.append(cq.Edge.makeLine(point(segment.start),point(segment.end)))
   elif isinstance(segment,CubicBezier):edges.append(cq.Edge.makeBezier([point(segment.start),point(segment.control1),point(segment.control2),point(segment.end)]))
   else:raise AssertionError('Unexpected SVG segment')
  wires.append(cq.Wire.assembleEdges(edges))
 outer=cq.Face.makeFromWires(wires[0])
 for hole in wires[1:]:
  inner=cq.Face.makeFromWires(hole)
  assert abs(outer.intersect(inner).Area()-inner.Area())<1e-6,'Hole outside outer contour'
 face=cq.Face.makeFromWires(wires[0],wires[1:]);assert face.isValid(),'Invalid reference topology'
 return face
raw=SOURCE.read_bytes();assert hashlib.sha256(raw).hexdigest()=='9c0b2d1bc4b03588e4105aa01b831a9049572b99b5e331c79d936e434c58c08e'
xml=ET.fromstring(raw);paths=[parse_path(p.attrib['d']) for p in xml.findall('.//{http://www.w3.org/2000/svg}path')]
checks=[]
def passed(name,condition):
 assert condition,name
 checks.append({'case':name,'passed':True})
passed('exact committed SVG source hash',True)
passed('two closed reference contours',len(paths)==2 and all(p.isclosed() for p in paths))
face=build_reference(paths)
passed('OCC reference face topology valid',face.isValid())
expected=abs(paths[0].area())-abs(paths[1].area())
passed('independent SVG integral and OCC face area agree',abs(face.Area()-expected)<1e-6)
passed('planar source has zero solids; no invented thickness',len(face.Solids())==0 and all(abs(v.Center().z)<1e-12 for v in face.Vertices()))
passed('no physical units/scale declared by SVG',xml.attrib.get('width') is None and xml.attrib.get('height') is None)
passed('printed frame dimensions arithmetic only',70+860+70==1000 and 70+480+70==620)
negatives=[]
# A broken contour must actually fail before CAD construction.
open_path=parse_path(xml.findall('.//{http://www.w3.org/2000/svg}path')[0].attrib['d'][:-1])
try:build_reference([open_path,paths[1]])
except AssertionError:negatives.append('open contour rejected')
else:raise AssertionError('Open control accepted')
# A hole outside the outer wire is invalid material topology, not a valid part.
try:build_reference([paths[0],paths[1].translated(1000+0j)])
except (AssertionError,ValueError):negatives.append('disjoint outside-hole topology rejected')
else:raise AssertionError('Outside hole accepted')
result={'scope':'UNIT_UNKNOWN 2D illustrative reference only; not a physical leg or assembly; zero product solids verified','positive_checks':len(checks),'failed':0,'checks':checks,'negative_controls_rejected':negatives,'source_sha256':hashlib.sha256(raw).hexdigest(),'source_path':str(SOURCE.relative_to(ROOT)),'viewBox':xml.attrib['viewBox'],'units':'SVG user units, NOT mm','source_bounds':[p.bbox() for p in paths],'signed_areas_user_units_squared':[p.area() for p in paths],'kernel_face_area_user_units_squared':face.Area(),'solid_count':len(face.Solids()),'versions':{name:importlib.metadata.version(name) for name in ['cadquery','cadquery-ocp','svgpathtools']}}
(ROOT/'docs/3d/geometric-source-audit/reference-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
