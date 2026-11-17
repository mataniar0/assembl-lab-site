"""Visual redesign of the Personal Coffee Table from its existing GLB and the
actual product photograph. Not measurement-verified engineering or CAD."""
from __future__ import annotations
import hashlib, json, math, struct
from pathlib import Path
import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'table/personal/media/personal-design-preview.glb'
TARGET=ROOT/'app/assets/personal-coffee-showroom-v2.glb'
SUMMARY=ROOT/'app/assets/personal-coffee-showroom-v2.json'

def materials():
    w=h=768
    rng=np.random.default_rng(41)
    x=np.arange(w,dtype=float)[None,:]
    y=np.arange(h,dtype=float)[:,None]
    warp=7*np.sin(x/70)+3*np.sin(x/24)
    bands=np.sin((y+warp)/10.3)+.43*np.sin((y+warp)/3.7)+.22*np.sin((y+warp)/1.5)
    noise=rng.normal(0,1,(h,w))
    knot=np.exp(-((x-550)/40)**2-((y-230)/55)**2)
    rings=np.cos(np.sqrt(((x-550)*.9)**2+((y-230)*1.25)**2)*.13)*knot
    seams=np.minimum(np.mod(y+80,190),190-np.mod(y+80,190))
    intensity=.98+bands*.06+noise*.025-knot*.13+rings*.09-np.exp(-seams**2/5.2)*.08
    base=np.asarray([193,139,83],dtype=float)[None,None,:]
    top=np.uint8(np.clip(base*intensity[:,:,None]+[17,13,7],0,255))
    edgegrain=.92+.15*np.sin(x/9+.6*np.sin(y/30))+.055*np.cos(x/2.6)
    edge=np.uint8(np.clip(np.broadcast_to(base*edgegrain[:,:,None],(h,w,3)),0,255))
    return (
      PBRMaterial(name='Honey oak finish — visual approximation',
                  baseColorTexture=Image.fromarray(top,'RGB'),metallicFactor=0,roughnessFactor=.58),
      PBRMaterial(name='Layered wooden tabletop edge',
                  baseColorTexture=Image.fromarray(edge,'RGB'),metallicFactor=0,roughnessFactor=.7),
      PBRMaterial(name='Black-painted curved laser-cut base',
                  baseColorFactor=[27,28,28,255],metallicFactor=.04,roughnessFactor=.68),
      PBRMaterial(name='Warm edge accent',
                  baseColorFactor=[110,69,33,255],metallicFactor=0,roughnessFactor=.81)
    )

def make_mesh(vertices,faces,material,uvs=None):
    v=np.asarray(vertices,dtype=float);f=np.asarray(faces,dtype=int)
    m=trimesh.Trimesh(vertices=v,faces=f,process=False)
    m.fix_normals()
    m.visual=TextureVisuals(uv=np.asarray(uvs if uvs is not None else np.zeros((len(v),2))),material=material)
    return m

def disk(radius,z,material,n=160):
    vertices=[[0,0,z]];uv=[[.5,.5]]
    for i in range(n):
        theta=math.tau*i/n;x=radius*math.cos(theta);y=radius*math.sin(theta)
        vertices.append([x,y,z]);uv.append([.5+x/(2*radius),.5+y/(2*radius)])
    return make_mesh(vertices,[[0,i+1,(i+1)%n+1] for i in range(n)],material,uv)

def lathe(material,layers,n=160):
    vertices=[];uv=[];faces=[]
    for j,(r,z) in enumerate(layers):
        for i in range(n):
            a=math.tau*i/n
            vertices.append([r*math.cos(a),r*math.sin(a),z]);uv.append([i/n,j/(len(layers)-1)])
    for j in range(len(layers)-1):
        for i in range(n):
            a=j*n+i;b=j*n+(i+1)%n;c=a+n;d=b+n
            faces.extend([[a,b,c],[b,d,c]])
    return make_mesh(vertices,faces,material,uv)

def curved_leg(angle,material,thick=.017):
    n=26;vertices=[];uv=[];faces=[]
    ca,sa=math.cos(angle),math.sin(angle)
    for j in range(n+1):
        t=j/n;z=.012+t*.436
        inside=.223-.137*t**.71+.003*math.sin(math.pi*t)
        outside=inside+.079-.017*math.sin(math.pi*t)
        for r,tangential in ((inside,-thick/2),(outside,-thick/2),(inside,thick/2),(outside,thick/2)):
            vertices.append([ca*r-sa*tangential,sa*r+ca*tangential,z])
            uv.append([r/.32,t])
    for j in range(n):
        a=4*j;b=a+4
        # Inner face, outer face, and the two walls between them
        for q in ((a,a+1,b,b+1),(a+2,b+2,a+3,b+3),
                  (a,b,a+2,b+2),(a+1,a+3,b+1,b+3)):
            i,k,l,m=q
            faces.extend([[i,k,l],[k,m,l]])
    faces.extend([[0,2,1],[1,2,3]])
    i=4*n
    faces.extend([[i,i+1,i+2],[i+1,i+3,i+2]])
    return make_mesh(vertices,faces,material,uv)

def add(scene,geometry,name):
    scene.add_geometry(geometry,geom_name=name,node_name=name)

def build():
    assert OLD.exists(),f'Original GLB required: {OLD}'
    original=OLD.read_bytes()
    assert struct.unpack_from('<II',original,0)==(0x46546c67,2)
    source_hash=hashlib.sha256(original).hexdigest()
    original_scene=trimesh.load(OLD,force='scene')
    assert len(original_scene.geometry)>=30,'Unexpected original prototype'
    wood,edge,black,trim=materials()
    scene=trimesh.Scene()
    # A wider rounded tabletop (visual estimate from the real photograph),
    # preserving the 50 cm approximate original prototype height.
    z=.51;r=.288
    add(scene,disk(r,z,wood),'top_wood_face_round')
    add(scene,lathe(edge,[(r,.510),(.293,.508),(.297,.502),(.297,.464),(.293,.458),(.286,.455)]),
        'thick_oak_tabletop_edge')
    add(scene,disk(.286,.455,wood),'wood_underside')
    add(scene,lathe(trim,[(.295,.458),(.295,.4595)]),'timber_edge_joint')
    for i,a in enumerate((math.pi/2,math.pi/2+math.tau/3,math.pi/2+2*math.tau/3)):
        add(scene,curved_leg(a,black),f'curved_black_laser_cut_leg_{i+1}')
    ring=trimesh.creation.annulus(r_min=.124,r_max=.138,height=.014,sections=96)
    ring.apply_translation([0,0,.212])
    ring.visual=TextureVisuals(material=black)
    add(scene,ring,'circular_black_bracing_ring')
    for i,a in enumerate((math.pi/2,math.pi/2+math.tau/3,math.pi/2+2*math.tau/3)):
        brace=trimesh.creation.box(extents=[.046,.022,.015])
        brace.apply_transform(trimesh.transformations.rotation_matrix(a,[0,0,1]))
        center=.1425
        brace.apply_translation([center*math.cos(a),center*math.sin(a),.219])
        brace.visual=TextureVisuals(material=black)
        add(scene,brace,f'ring_brace_{i+1}')
    TARGET.parent.mkdir(parents=True,exist_ok=True)
    glb=trimesh.exchange.gltf.export_glb(scene)
    TARGET.write_bytes(glb)
    loaded=trimesh.load(TARGET,force='scene')
    assert len(loaded.geometry)==len(scene.geometry)
    assert np.max(np.abs(loaded.bounds-scene.bounds))<1e-4
    meta={
        'kind':'SHOWROOM_VISUAL_ONLY',
        'product':'personal-coffee-table',
        'source_model_sha256':source_hash,
        'showroom_model_sha256':hashlib.sha256(glb).hexdigest(),
        'source_model_geometry_count':len(original_scene.geometry),
        'showroom_geometry_count':len(scene.geometry),
        'showroom_bounds_m':scene.bounds.tolist(),
        'visual_dimensions_estimate_m':{'top_diameter':r*2,'height':z,'top_edge_thickness':.055},
        'features':['thick round light-oak top','curved black laser-cut silhouette',
                    'circular ring brace','procedural oak wood texture'],
        'engineering_approval':False,'manufacturing_approval':False,
        'note':'Visual estimate from product photo and original GLB; unverified dimensions and joinery.'
    }
    SUMMARY.write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
    print('MODEL_BUILD_OK '+json.dumps(meta,ensure_ascii=False))

if __name__=='__main__':
    build()
