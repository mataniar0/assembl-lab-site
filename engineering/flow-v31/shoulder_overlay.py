"""Measured before/after overlays read directly from the two candidate DXF sets."""
from pathlib import Path
import json
import numpy as np, ezdxf
from shapely.geometry import Polygon
from shapely.affinity import affine_transform
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

P = Path(__file__).parent; OUT = P/'artifacts/R_ROUNDED_SHOULDERS'
def read(folder):
    result = {}
    for r in json.loads((folder/'bom-and-delta.json').read_text()):
        polys = [Polygon([(q[0],q[1]) for q in e.get_points()])
                 for e in ezdxf.readfile(folder/r['dxf']).modelspace()]
        outer = max(polys,key=lambda p:p.area); poly = outer
        for hole in polys:
            if hole is not outer: poly = poly.difference(hole)
        result[r['profile']] = poly
    return result
old = read(P/'artifacts/R_RAIL_REINDEX'); new = read(OUT)
rows = json.loads((OUT/'transforms.json').read_text())['instances']; by = {r['name']:r for r in rows}
fig, axes = plt.subplots(2,2,figsize=(12,10),layout='constrained')
def fill(ax, geom, color):
    if geom.is_empty or geom.area < 1e-9: return
    if geom.geom_type == 'Polygon': ax.fill(*geom.exterior.xy,color=color,alpha=.8)
    elif hasattr(geom,'geoms'):
        for g in geom.geoms: fill(ax,g,color)
for ax,key in zip(axes.flat,sorted(k for k in new if k.startswith('LEG_'))):
    row = next(r for r in rows if r['profile']==key); rail = by[row['mating_rail']]
    rel = np.linalg.inv(np.array(row['matrix'])) @ np.array(rail['matrix'])
    rp = affine_transform(new[rail['profile']], [rel[0,0],rel[0,1],rel[1,0],rel[1,1],rel[0,3],rel[1,3]])
    before = old['LEG_A' if key.startswith('LEG_A') else 'LEG_B']; after = new[key]
    ax.plot(*rp.exterior.xy,color='#776a55',linewidth=1.5,label='Unchanged rail')
    fill(ax,after.difference(before),'#57b892'); fill(ax,before.difference(after),'#e17777')
    ax.plot(*before.exterior.xy,color='#555555',linestyle='--',linewidth=1.1)
    ax.plot(*after.exterior.xy,color='#175e91',linewidth=1.5)
    ax.annotate('',xy=(156,397.1),xytext=(164,397.1),arrowprops=dict(arrowstyle='<->',color='#222222'))
    ax.text(160,397.35,'8 mm rail-following segment',ha='center',fontsize=9)
    ax.axhline(386,color='#bbbbbb',linewidth=.7); ax.text(153,386.3,'V386 tangent return',fontsize=8)
    ax.set(xlim=(152,171),ylim=(383,398.3),aspect='equal',title=key,xlabel='Leg-local U (mm)',ylabel='Leg-local V (mm)')
    ax.grid(alpha=.15)
fig.suptitle('Flow V3.1: local rounded shoulder vs previous R | NOMINAL 6 mm | DESIGN_ONLY',fontsize=13)
fig.legend(handles=[Patch(facecolor='#57b892',label='Added material'),Patch(facecolor='#e17777',label='Removed material'),
    Patch(facecolor='#175e91',label='New outline (blue); previous R dashed')],loc='outside lower center',ncol=3)
fig.savefig(OUT/'shoulder-overlay.svg'); fig.savefig(OUT/'shoulder-overlay.png',dpi=150); plt.close(fig)
print('PASS: measured four-profile shoulder overlay exported from DXFs')
