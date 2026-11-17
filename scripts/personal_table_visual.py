"""Inspect the existing built product's digital GLB design prior to visual reconstruction.
The digital prototype is NOT an engineering-verified replica of the photographed table.
"""
import json
import struct
from pathlib import Path

ORIGINAL=Path('table/personal/media/personal-design-preview.glb')
def read_glb(path):
    raw=path.read_bytes()
    magic,version,length=struct.unpack_from('<III',raw,0)
    assert magic==0x46546c67 and version==2 and length==len(raw)
    n,typ=struct.unpack_from('<II',raw,12)
    assert typ==0x4e4f534a
    doc=json.loads(raw[20:20+n].rstrip(b' \x00').decode())
    off=20+n
    k,t=struct.unpack_from('<II',raw,off)
    assert t==0x004e4942
    binary=raw[off+8:off+8+k]
    return doc,binary

if __name__=='__main__':
    gltf,blob=read_glb(ORIGINAL)
    summary={'size_bytes':ORIGINAL.stat().st_size,'asset':gltf.get('asset'),
        'scene_count':len(gltf.get('scenes',[])), 'nodes':[], 'meshes':[],
        'materials':[], 'images':gltf.get('images',[])}
    for i,n in enumerate(gltf.get('nodes',[])):
        summary['nodes'].append({'idx':i,'name':n.get('name'),'mesh':n.get('mesh'),'children':n.get('children'),
            'translation':n.get('translation'),'rotation':n.get('rotation'),'scale':n.get('scale'),
            'matrix':n.get('matrix')})
    for i,m in enumerate(gltf.get('meshes',[])):
        prims=[]
        for p in m.get('primitives',[]):
            acc=gltf['accessors'][p['attributes']['POSITION']]
            prims.append({'vertex_count':acc['count'],'indices':gltf['accessors'][p['indices']]['count'] if 'indices' in p else None,
              'min':acc.get('min'),'max':acc.get('max'),'material':p.get('material'),'attributes':p.get('attributes')})
        summary['meshes'].append({'idx':i,'name':m.get('name'),'primitives':prims})
    for i,m in enumerate(gltf.get('materials',[])):
        summary['materials'].append({'idx':i,'name':m.get('name'),
         'pbr':m.get('pbrMetallicRoughness'),'doubleSided':m.get('doubleSided')})
    print('INSPECT_PERSONAL_TABLE_GLB_BEGIN')
    print(json.dumps(summary,indent=2,ensure_ascii=False))
    print('INSPECT_PERSONAL_TABLE_GLB_END')
