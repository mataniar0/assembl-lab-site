"""Measured source/candidate overlays; no generative or guessed geometry."""
import os
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR','/workspace/work/flow-v31/mpl-cache')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.path import Path as MPath
from matplotlib.patches import PathPatch,Rectangle
from shapely.affinity import translate
from model import *
OUT=HERE/'artifacts'
def draw(ax,p,color,alpha=.5,edge=None):
 if p.is_empty or p.area<1e-10:return
 if p.geom_type!='Polygon':
  for q in p.geoms:draw(ax,q,color,alpha,edge)
  return
 paths=[]
 for ring in [p.exterior,*p.interiors]:
  v=list(ring.coords);paths.append(MPath(v,[MPath.MOVETO]+[MPath.LINETO]*(len(v)-2)+[MPath.CLOSEPOLY]))
 patch=PathPatch(MPath.make_compound_path(*paths),facecolor=color,edgecolor=edge or color,alpha=alpha,lw=1);ax.add_patch(patch)
def save(fig,name):
 fig.tight_layout();fig.savefig(OUT/(name+'.png'),dpi=160);p=OUT/(name+'.svg');fig.savefig(p);p.write_text('\n'.join(x.rstrip() for x in p.read_text().splitlines())+'\n');plt.close(fig)
orig,R,_=option_profiles('R_RAIL_REINDEX');_,L,_=option_profiles('L_LEG_BASE')
fig,axs=plt.subplots(2,2,figsize=(15,9));details=[('LENGTH_OUTER_L',R['LENGTH_OUTER_L'],(15,185,7,26),'R: near receivers +6 mm'),('LENGTH_OUTER_L',R['LENGTH_OUTER_L'],(700,875,7,26),'R: far receivers -11 mm'),('LEG_A',L['LEG_A_NEAR'],(7,44,7,95),'L: spine shifted +6 mm internally'),('TRI_BASE_ROUNDED',L['TRI_BASE_ROUNDED'],(-8,18,-8,18),'L: base ears 6 mm toward corner; radius 9.5 mm')]
for ax,(k,new,lim,title) in zip(axs.flat,details):
 old=orig[k];draw(ax,old,'#c9c9c9',.65);draw(ax,new.difference(old),'#239775',.85);draw(ax,old.difference(new),'#d45454',.7);draw(ax,new,'none',1,'#24588c');ax.set_xlim(*lim[:2]);ax.set_ylim(*lim[2:]);ax.set_title(title);ax.set_xlabel('Source local U / X (mm)');ax.set_ylabel('Source local V / Y (mm)');ax.grid(alpha=.18)
axs[0,0].annotate('',(31,19),(25,19),arrowprops={'arrowstyle':'<->'});axs[0,0].text(28,20,'6 mm',ha='center');axs[0,0].annotate('',(51,8.5),(31,8.5),arrowprops={'arrowstyle':'<->'});axs[0,0].text(41,9,'20 mm',ha='center',fontsize=9)
axs[0,1].annotate('',(724,19),(735,19),arrowprops={'arrowstyle':'<->'});axs[0,1].text(729.5,20,'11 mm',ha='center')
axs[1,0].annotate('',(22,44),(16,44),arrowprops={'arrowstyle':'<->'});axs[1,0].text(19,48,'6 mm',ha='center');axs[1,0].set_aspect('equal')
axs[1,1].annotate('r = 15.5',xy=(11,11),xytext=(3,16),arrowprops={'arrowstyle':'->'});axs[1,1].annotate('r = 9.5',xy=(6.7,6.7),xytext=(10,2),arrowprops={'arrowstyle':'->'});axs[1,1].set_aspect('equal')
fig.suptitle('Flow V3 -> V3.1 CANDIDATES | grey: source, red: removed, green: added, blue: candidate\nNominal 6 mm; study only / NOT FOR PRODUCTION',fontsize=15);save(fig,'joint-overlays')
# Exact2D foot sections at floor Z3, with base plate footprint at the same Z.
def foot(poly,shift,axis):
 s=poly.intersection(LineString([(-100,13),(300,13)]));gs=[s] if s.geom_type=='LineString' else s.geoms;out=[]
 for line in gs:
  a,b=line.bounds[0]+shift,line.bounds[2]+shift;out.append(box(a,0,b,6) if axis==0 else box(0,a,6,b))
 from shapely.ops import unary_union
 return unary_union(out)
fig,axs=plt.subplots(1,3,figsize=(16,6));cases=[('V3 rejected corner',orig['LEG_A'],orig['LEG_B'],-16,orig['TRI_BASE_ROUNDED'],(0,6)),('R: original legs + original base',orig['LEG_A'],orig['LEG_B'],-10,orig['TRI_BASE_ROUNDED'],(6,6)),('L: trimmed spine + compact base',L['LEG_A_NEAR'],L['LEG_B_NEAR'],-16,L['TRI_BASE_ROUNDED'],(6,6))]
for ax,(name,a,b,shift,base,offset) in zip(axs,cases):
 aa,bb=foot(a,shift,0),foot(b,shift,1);draw(ax,aa,'#397fc0',.5);draw(ax,bb,'#e48d3a',.5);draw(ax,translate(base,xoff=offset[0],yoff=offset[1]),'#30946d',.35);draw(ax,aa.intersection(bb),'#cf3447',.9)
 ax.set_title(name+'\nA/B section overlap: '+f'{aa.intersection(bb).area:.0f}'+' mm²');ax.set_xlim(-8,36);ax.set_ylim(-8,36);ax.set_aspect('equal');ax.set_xlabel('CAD X (mm)');ax.set_ylabel('CAD Y (mm)');ax.grid(alpha=.18)
fig.suptitle('Measured before/after corner sections at floor Z=3 mm\nBlue A / orange B / green base / red A-B penetration. Vertical spine joints checked over full height separately.',fontsize=14);save(fig,'corner-comparison')
print('PASS generated source-derived overlay and before/after section drawings')
