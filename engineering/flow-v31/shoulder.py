"""Local shoulder refinement of R; dimensions in leg-local millimetres.

This is the accepted visual study converted to a separate engineering candidate.
No circular radius is claimed: the transition is a sampled cubic Bezier tangent
to the actual rail underside and to the original outer leg edge. Nominal fit,
not a kerf/clearance prescription. Original V3 and both earlier options stay put.
"""
import numpy as np
from shapely.geometry import Polygon, box, LineString
from shapely.affinity import affine_transform

OPTION = 'R_ROUNDED_SHOULDERS'
PATCH = box(156, 386, 220, 410)


def bottom(poly, u):
    section = poly.intersection(LineString([(u, -1000), (u, 1000)]))
    assert not section.is_empty
    return section.bounds[1]


def right(poly, v):
    return poly.intersection(LineString([(-100, v), (500, v)])).bounds[2]


def refine(poly, rail, tabs):
    start, turn, finish = 156., 164., 386.
    p0 = np.array([turn, bottom(rail, turn)])
    slope = (bottom(rail, turn + .02) - bottom(rail, turn - .02)) / .04
    p1 = p0 + [2.5, 2.5 * slope]
    p3 = np.array([right(poly, finish), finish])
    du = (right(poly, finish + .02) - right(poly, finish - .02)) / .04
    tangent = np.array([-du, -1.]); tangent /= np.linalg.norm(tangent)
    p2 = p3 - tangent * 2.7
    # Preserve all source facet breaks. Uniform stations alone bridge corners
    # and leave a tiny real gap, even with no collision; do not relax QC.
    stations = sorted({*map(float, np.linspace(start, turn, 65)),
                       *(float(u) for u, v in rail.exterior.coords if start < u < turn)})
    cap = [(start, finish)] + [(u, bottom(rail, u)) for u in stations]
    for t in np.linspace(0, 1, 101)[1:]:
        q = (1-t)**3*p0 + 3*(1-t)**2*t*p1 + 3*(1-t)*t*t*p2 + t**3*p3
        cap.append(tuple(q))
    cap.append((start, finish))
    patch = Polygon(cap)
    assert patch.is_valid
    result = poly.difference(PATCH).union(patch).difference(rail)
    assert result.is_valid and result.geom_type == 'Polygon'
    delta = result.symmetric_difference(poly)
    assert delta.difference(PATCH).area < 1e-7
    for lo, hi in tabs:
        assert delta.intersection(box(lo, 390, hi, 396)).area < 1e-7
    assert Polygon(result.exterior).difference(result).symmetric_difference(
        Polygon(poly.exterior).difference(poly)).area < 1e-7
    return result, dict(control_points_mm=[p.tolist() for p in [p0, p1, p2, p3]],
                        rail_follow_u_mm=[start, turn], transition_segments=100,
                        old_gap_at_u166_mm=bottom(rail, 166)-390,
                        added_mm2=result.difference(poly).area,
                        removed_mm2=poly.difference(result).area)


def candidate(original, profiles, rows, features):
    profiles = dict(profiles)
    origin = {key: key for key in profiles}
    by = {r['name']: r for r in rows}
    changes = []
    for row in rows:
        if row['role'] != 'leg':
            continue
        key = row['profile']; rail = by[row['mating_rail']]
        rel = np.linalg.inv(np.array(row['matrix'])) @ np.array(rail['matrix'])
        # The leg and its mating rail are coplanar parallel sheet prisms.
        assert np.allclose(rel[:2, 2], 0) and np.allclose(rel[2, :2], 0)
        rp = affine_transform(profiles[rail['profile']],
                              [rel[0,0], rel[0,1], rel[1,0], rel[1,1], rel[0,3], rel[1,3]])
        poly, detail = refine(original[key], rp, features[key]['tabs'])
        far = row['corner'] in (['SE', 'NE'] if key == 'LEG_A' else ['NW', 'NE'])
        name = key + ('_FAR_ROUNDED' if far else '_NEAR_ROUNDED')
        if name in profiles:
            assert profiles[name].symmetric_difference(poly).area < 1e-7
        profiles[name] = poly; origin[name] = key
        row['profile'] = name
        changes.append(dict(part=row['name'], profile=name, **detail))
    for key in ['LEG_A', 'LEG_B']:
        del profiles[key]; del origin[key]
    return profiles, origin, rows, changes
