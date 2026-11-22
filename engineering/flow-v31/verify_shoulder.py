"""Independent refinement checks on serialized DXFs, not the design generator.

Use after verify.py R_ROUNDED_SHOULDERS for full 3D mate/interference replay.
"""
from pathlib import Path
from collections import defaultdict
import json, hashlib
import numpy as np, ezdxf
from shapely.geometry import Polygon, LineString, box
from shapely.affinity import affine_transform

P = Path(__file__).parent; OUT = P / 'artifacts/R_ROUNDED_SHOULDERS'
BEFORE = P / 'artifacts/R_RAIL_REINDEX'
ROOT = P.resolve().parents[1]
def read(path):
    doc = ezdxf.readfile(path); assert doc.units == 4
    polygons = [Polygon([(q[0], q[1]) for q in e.get_points()]) for e in doc.modelspace()]
    assert all(p.is_valid for p in polygons)
    outer = max(polygons, key=lambda p: p.area); result = outer
    for hole in polygons:
        if hole is not outer: result = result.difference(hole)
    assert result.is_valid and result.geom_type == 'Polygon'
    return result

def profiles(folder):
    return {r['profile']: read(folder/r['dxf'])
            for r in json.loads((folder/'bom-and-delta.json').read_text())}

def low(poly, u):
    return poly.intersection(LineString([(u, -1000), (u, 1000)])).bounds[1]

def high(poly, u):
    return poly.intersection(LineString([(u, 386), (u, 410)])).bounds[3]

old = profiles(BEFORE); new = profiles(OUT)
rows = json.loads((OUT/'transforms.json').read_text())['instances']
oldrows = {r['name']: r for r in json.loads((BEFORE/'transforms.json').read_text())['instances']}
by = {r['name']: r for r in rows}; changes = []
for row in rows:
    assert row['matrix'] == oldrows[row['name']]['matrix']
    prev = old[oldrows[row['name']]['profile']]; now = new[row['profile']]
    delta = now.symmetric_difference(prev)
    if row['role'] != 'leg':
        assert delta.area < 1e-7
        continue
    assert delta.difference(box(156, 386, 220, 410)).area < 1e-7
    assert delta.intersection(box(-100, -100, 156, 500)).area < 1e-7
    assert Polygon(now.exterior).difference(now).symmetric_difference(
        Polygon(prev.exterior).difference(prev)).area < 1e-7
    rail = by[row['mating_rail']]
    rel = np.linalg.inv(np.array(row['matrix'])) @ np.array(rail['matrix'])
    rp = affine_transform(new[rail['profile']], [rel[0,0], rel[0,1], rel[1,0], rel[1,1], rel[0,3], rel[1,3]])
    # The selected close-gap interval follows the existing faceted source rail.
    gaps = [low(rp, float(u))-high(now, float(u)) for u in np.linspace(156.001, 163.999, 161)]
    assert max(abs(g) for g in gaps) < 2e-4
    assert now.intersection(rp).area < 1e-7
    changes.append(dict(part=row['name'], profile=row['profile'], status='PASS',
        added_mm2=now.difference(prev).area, removed_mm2=prev.difference(now).area,
        previous_gap_at_u166_mm=low(rp, 166)-390,
        rail_follow_u_mm=[156,164], max_sampled_follow_gap_mm=max(abs(g) for g in gaps),
        sample_count=161, holes_tabs_spine_lower_receiver_unchanged=True))
assert len(changes) == 8
edges = json.loads((OUT/'joints-32.json').read_text()); adj = defaultdict(set)
for e in edges:
    assert e['status'] == 'PASS'; adj[e['a']].add(e['b']); adj[e['b']].add(e['a'])
seen = set(); todo = ['L_south']
while todo:
    x = todo.pop()
    if x not in seen: seen.add(x); todo.extend(adj[x]-seen)
assert len(seen) == 19
for f, sha in json.loads((ROOT/'engineering/flow-v3/artifacts/source-hashes.json').read_text()).items():
    assert hashlib.sha256((ROOT/f).read_bytes()).hexdigest() == sha
qc = json.loads((OUT/'independent-qc.json').read_text()); assert qc['collision_failures'] == 0
(OUT/'shoulder-qc.json').write_text(json.dumps(dict(status='PASS', changes=changes,
    unchanged_matrices=19, unchanged_frame_base_pieces=11, connected_components=1,
    source_v3_hashes='UNCHANGED', production_authorized=False), indent=2)+'\n')
print('PASS: 8 local shoulders, exact matrices, 11 unchanged frame/base pieces, original joint profiles preserved')
