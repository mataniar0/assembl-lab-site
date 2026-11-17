/* ASSEMBL LAB MVP-17 — polished, textured procedural nightstand in real glTF 2.0.
 * Browser and Node deterministic. Geometry and all textures are generated locally,
 * embedded in the GLB, and independently marked VISUAL ONLY (never production CAD).
 * This module is deliberately without network, DOM, canvas, remote AI or customer data.
 */
import {buildNightstand} from './concept-geometry.mjs';

const MM=.001, TEXTURE_W=512, TEXTURE_H=256;
const PALETTES={
  natural:[182,139,92],
  honey:[164,105,55],
  walnut:[105,70,48]
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function smooth(t){return t*t*(3-2*t);}
function hash(x,y){
  let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+1274126177)|0;
  n=Math.imul(n^(n>>>13),1274126177);
  n^=n>>>16;
  return (n>>>0)/4294967295;
}
function noise(x,y){
  const ix=Math.floor(x),iy=Math.floor(y);
  const tx=smooth(x-ix),ty=smooth(y-iy);
  const a=hash(ix,iy)*(1-tx)+hash(ix+1,iy)*tx;
  const b=hash(ix,iy+1)*(1-tx)+hash(ix+1,iy+1)*tx;
  return a*(1-ty)+b*ty;
}
function pattern(x,y){
  const l=(noise(x/101,y/22)-.5)*20+(noise(x/41,y/9)-.5)*8;
  const k1=Math.exp(-(((x-358)/73)**2+((y-95)/33)**2));
  const k2=Math.exp(-(((x-126)/67)**2+((y-204)/35)**2));
  const yy=y+l+Math.sin((x-358)/38)*k1*19+Math.sin((x-126)/32)*k2*14;
  const wide=Math.sin(yy*.115+(noise(x/58,yy/27)-.5)*2.2);
  const fine=Math.sin(yy*.74+noise(x/43,yy/10)*1.6);
  const ultra=Math.sin(yy*1.91+noise(x/16,yy/7)*1.2);
  const rings1=Math.sin(Math.sqrt(((x-358)/1.6)**2+((y-95)/.68)**2)*.29)*k1;
  const rings2=Math.sin(Math.sqrt(((x-126)/1.6)**2+((y-204)/.68)**2)*.3)*k2;
  return {
    value: .16*wide+.09*fine+.043*ultra+.048*(noise(x/8,y/5)-.5)-
      .24*k1-.19*k2+.09*rings1+.068*rings2,
    micro: Math.sin(yy*.74+noise(x/43,yy/10)*1.6)
  };
}
function pngChunk(name,bytes){
  const n=bytes.length,output=new Uint8Array(n+12),dv=new DataView(output.buffer);
  dv.setUint32(0,n,false);
  for(let i=0;i<4;i++)output[4+i]=name.charCodeAt(i);
  output.set(bytes,8);
  let c=0xffffffff;
  for(let i=4;i<8+n;i++){
    c^=output[i];
    for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  dv.setUint32(n+8,(c^0xffffffff)>>>0,false);
  return output;
}
function pngRgb(width,height,pixel){
  const stride=width*3+1,raw=new Uint8Array(stride*height);
  for(let y=0;y<height;y++){
    const row=y*stride;
    raw[row]=0; // unfiltered scan line
    for(let x=0;x<width;x++){
      const p=pixel(x,y);
      const off=row+1+x*3;
      raw[off]=p[0];raw[off+1]=p[1];raw[off+2]=p[2];
    }
  }
  // zlib stream with valid DEFLATE stored blocks: independent of browser/node
  // compression APIs, and therefore also usable offline on Android.
  const blocks=[],max=65535;
  for(let i=0;i<raw.length;i+=max){
    const n=Math.min(max,raw.length-i),final=i+n===raw.length;
    const b=new Uint8Array(n+5);
    b[0]=final?1:0;b[1]=n&255;b[2]=n>>>8;
    const complement=(~n)&65535;
    b[3]=complement&255;b[4]=complement>>>8;
    b.set(raw.subarray(i,i+n),5);blocks.push(b);
  }
  let a=1,b=0;
  for(const v of raw){a=(a+v)%65521;b=(b+a)%65521;}
  const len=2+blocks.reduce((n,v)=>n+v.length,0)+4;
  const zlib=new Uint8Array(len),dv=new DataView(zlib.buffer);
  zlib[0]=0x78;zlib[1]=0x01;
  let at=2;
  for(const block of blocks){zlib.set(block,at);at+=block.length;}
  dv.setUint32(at,((b<<16)|a)>>>0,false);
  const header=new Uint8Array(13),hd=new DataView(header.buffer);
  hd.setUint32(0,width,false);hd.setUint32(4,height,false);
  header[8]=8;header[9]=2; // 8-bit truecolour
  const segments=[
    Uint8Array.of(137,80,78,71,13,10,26,10),
    pngChunk('IHDR',header),pngChunk('IDAT',zlib),pngChunk('IEND',new Uint8Array())
  ];
  const total=segments.reduce((n,v)=>n+v.length,0),out=new Uint8Array(total);
  let ptr=0;
  for(const p of segments){out.set(p,ptr);ptr+=p.length;}
  return out;
}
function generateTextures(finish){
  const palette=PALETTES[finish];
  if(!palette)throw new TypeError('INVALID_FINISH');
  // Albedo and a near-flat but directional normal map. No photographic inputs.
  const colour=pngRgb(TEXTURE_W,TEXTURE_H,(x,y)=>{
    const g=pattern(x,y);
    const random=(hash(x,y)-.5)*5;
    const m=1+g.value;
    return palette.map((v,i)=>clamp(Math.round(v*m+random+(i===0?4:0)),0,255));
  });
  const normals=pngRgb(256,128,(x,y)=>{
    const g=pattern(x*2,y*2);
    const tangent=(pattern(x*2,y*2+1).value-g.value)*.62;
    const radial=(pattern(x*2+1,y*2).value-g.value)*.18;
    const nx=clamp(radial*1.5,-.12,.12),ny=clamp(tangent*1.5,-.17,.17);
    return [Math.round(128+127*nx),Math.round(128+127*ny),254];
  });
  return {colour,normals};
}
function floatBytes(numbers){
  const a=new Float32Array(numbers);
  return new Uint8Array(a.buffer);
}
function indexBytes(numbers){
  if(numbers.some(v=>v<0||v>65535))throw new RangeError('INDEX_RANGE');
  const a=new Uint16Array(numbers);
  return new Uint8Array(a.buffer);
}
const componentType={positions:5126,normals:5126,uv:5126,indices:5123};
class GlbBuilder{
  constructor(){
    this.parts=[];this.offset=0;this.bufferViews=[];this.accessors=[];
    this.meshes=[];this.nodes=[];this.materials=[];this.images=[];this.textures=[];
  }
  addBytes(bytes,target){
    const pad=(4-(this.offset%4))%4;
    if(pad){this.parts.push(new Uint8Array(pad));this.offset+=pad;}
    const index=this.bufferViews.length;
    const view={buffer:0,byteOffset:this.offset,byteLength:bytes.byteLength};
    if(target)view.target=target;
    this.bufferViews.push(view);
    this.parts.push(bytes);this.offset+=bytes.byteLength;
    return index;
  }
  accessor(bytes,count,type,component,kind,min,max){
    const idx=this.accessors.length;
    const entry={bufferView:this.addBytes(bytes,kind==='indices'?34963:34962),
      componentType:component,count,type};
    if(min)entry.min=min;
    if(max)entry.max=max;
    this.accessors.push(entry);
    return idx;
  }
  mesh(name,geometry,material){
    const {position,normal,uv,index}=geometry;
    if(position.length%3||normal.length!==position.length||
      uv.length!==position.length/3*2||
      index.length%3||position.length/3>65535)
      throw new Error('INVALID_MESH');
    const count=position.length/3;
    const bounds=[[],[]];
    for(let j=0;j<3;j++){
      let min=Infinity,max=-Infinity;
      for(let k=j;k<position.length;k+=3){
        min=Math.min(min,position[k]);max=Math.max(max,position[k]);
      }
      bounds[0].push(min);bounds[1].push(max);
    }
    const primitives=[{
      attributes:{
        POSITION:this.accessor(floatBytes(position),count,'VEC3',5126,'positions',bounds[0],bounds[1]),
        NORMAL:this.accessor(floatBytes(normal),count,'VEC3',5126,'normals'),
        TEXCOORD_0:this.accessor(floatBytes(uv),count,'VEC2',5126,'uv')
      },
      indices:this.accessor(indexBytes(index),index.length,'SCALAR',5123,'indices'),
      material,mode:4
    }];
    const id=this.meshes.length;
    this.meshes.push({name,primitives});
    return id;
  }
  node(name,mesh,position,size,extras={},rotation=null){
    const item={name,mesh,
      translation:position.map(v=>v*MM),
      scale:size.map(v=>v*MM),
      extras:{...extras,engineering_approval:false,manufacturing_approval:false}
    };
    if(rotation)item.rotation=rotation;
    const idx=this.nodes.length;this.nodes.push(item);
    return idx;
  }
  finish(meta){
    const bin=new Uint8Array((this.offset+3)&~3),bytesLength=this.offset;
    let ptr=0;
    for(const b of this.parts){bin.set(b,ptr);ptr+=b.length;}
    const json={
      asset:{version:'2.0',generator:'ASSEMBL LAB realistic showroom v0.1'},
      scene:0,scenes:[{name:'SHOWROOM_NIGHTSTAND_VISUAL_ONLY',nodes:this.nodes.map((_,i)=>i)}],
      nodes:this.nodes,meshes:this.meshes,materials:this.materials,
      textures:this.textures,images:this.images,
      samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],
      accessors:this.accessors,bufferViews:this.bufferViews,
      buffers:[{byteLength:bytesLength}],extras:meta
    };
    const encoded=new TextEncoder().encode(JSON.stringify(json));
    const n=(encoded.length+3)&~3,m=(bin.length+3)&~3;
    const out=new Uint8Array(12+8+n+8+m),dv=new DataView(out.buffer);
    dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);
    dv.setUint32(8,out.length,true);
    dv.setUint32(12,n,true);dv.setUint32(16,0x4e4f534a,true);
    out.fill(32,20,20+n);out.set(encoded,20);
    dv.setUint32(20+n,m,true);dv.setUint32(24+n,0x004e4942,true);
    out.set(bin,28+n);
    return out;
  }
}
function normalize(p){
  const l=Math.hypot(p[0],p[1],p[2])||1;
  return p.map(v=>v/l);
}
function boxGrid(width,height,depth,bevel){
  const dims=[width,height,depth],half=dims.map(v=>v/2);
  const r=Math.max(.15,Math.min(bevel,Math.min(...half)*.6));
  const result={position:[],normal:[],uv:[],index:[]};
  const coords=dims.map(v=>{
    const f=r/v;
    return [-.5,-.5+f*.18,-.5+f*.48,-.5+f,
      .5-f,.5-f*.48,.5-f*.18,.5];
  });
  for(let axis=0;axis<3;axis++){
    const others=[0,1,2].filter(x=>x!==axis);
    for(const sign of [-1,1]){
      const start=result.position.length/3;
      const u=others[0],v=others[1];
      for(let j=0;j<8;j++)for(let i=0;i<8;i++){
        const p=[0,0,0];
        p[axis]=sign*.5;p[u]=coords[u][i];p[v]=coords[v][j];
        const physical=p.map((n,k)=>n*dims[k]);
        const inner=physical.map((n,k)=>clamp(n,-half[k]+r,half[k]-r));
        const difference=physical.map((n,k)=>n-inner[k]);
        const normal=normalize(difference);
        const curved=inner.map((n,k)=>n+normal[k]*r);
        const normalized=curved.map((n,k)=>n/dims[k]);
        result.position.push(...normalized);
        // Node has non-uniform scale. Compensate normals so world-space
        // normal remains physically correct after inverse-transpose.
        result.normal.push(...normalize(normal.map((n,k)=>n*dims[k])));
        // UV grain follows horizontal wood surfaces; slight face variation.
        const uvx=axis===0?physical[2]/depth+.5:physical[0]/width+.5;
        const uvy=axis===1?physical[2]/depth+.5:physical[1]/height+.5;
        result.uv.push(uvx,uvy);
      }
      for(let j=0;j<7;j++)for(let i=0;i<7;i++){
        const a=start+j*8+i,b=a+1,c=a+8,d=c+1;
        // Outward winding determined from the actual first cell's normal.
        const p0=result.position.slice(a*3,a*3+3);
        const p1=result.position.slice(b*3,b*3+3);
        const p2=result.position.slice(c*3,c*3+3);
        const e1=p1.map((n,k)=>n-p0[k]),e2=p2.map((n,k)=>n-p0[k]);
        const cross=[e1[1]*e2[2]-e1[2]*e2[1],
          e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
        if(cross[axis]*sign>0)result.index.push(a,b,d,a,d,c);
        else result.index.push(a,d,b,a,c,d);
      }
    }
  }
  return result;
}
function cylinder(segments=24){
  const g={position:[],normal:[],uv:[],index:[]};
  for(let i=0;i<=segments;i++){
    const t=2*Math.PI*i/segments,s=Math.sin(t),c=Math.cos(t);
    for(const y of [-.5,.5]){
      g.position.push(s*.5,y,c*.5);
      g.normal.push(s,0,c);
      g.uv.push(i/segments,y+.5);
    }
  }
  for(let i=0;i<segments;i++){
    const a=i*2,b=a+1,c=a+2,d=a+3;
    // Cross-checked cylinder wall faces point outward.
    g.index.push(a,c,b,b,c,d);
  }
  for(const y of [-.5,.5]){
    const root=g.position.length/3;
    g.position.push(0,y,0);
    g.normal.push(0,Math.sign(y),0);g.uv.push(.5,.5);
    for(let i=0;i<=segments;i++){
      const t=2*Math.PI*i/segments,s=Math.sin(t),c=Math.cos(t);
      g.position.push(s*.5,y,c*.5);
      g.normal.push(0,Math.sign(y),0);
      g.uv.push((s+1)*.5,(c+1)*.5);
    }
    for(let i=0;i<segments;i++){
      if(y>0)g.index.push(root,root+1+i,root+2+i);
      else g.index.push(root,root+2+i,root+1+i);
    }
  }
  return g;
}
function taperedLeg(){
  const g={position:[],normal:[],uv:[],index:[]};
  const top=.5,bottom=.34;
  for(const [axis,sign] of [[0,1],[0,-1],[2,1],[2,-1]]){
    const n=[0,0,0];n[axis]=sign;
    const p=[];
    for(const y of [-.5,.5])for(const t of [-1,1]){
      const v=[0,y,0],radius=y>0?top:bottom;
      v[axis]=radius*sign;
      v[axis===0?2:0]=radius*t;
      p.push(v);
    }
    const start=g.position.length/3;
    for(const v of p){
      g.position.push(...v);
      g.normal.push(...normalize([n[0],.12,n[2]]));
      g.uv.push(v[axis===0?2:0]+.5,v[1]+.5);
    }
    const a=start,b=a+1,c=a+2,d=a+3;
    if(sign*(axis===0?-1:1)>0)g.index.push(a,b,c,b,d,c);
    else g.index.push(a,c,b,b,c,d);
  }
  for(const y of [-.5,.5]){
    const start=g.position.length/3;
    const r=y>0?top:bottom;
    for(const [x,z] of [[-r,-r],[r,-r],[r,r],[-r,r]]){
      g.position.push(x,y,z);g.normal.push(0,Math.sign(y),0);
      g.uv.push(x+.5,z+.5);
    }
    if(y>0)g.index.push(start,start+2,start+1,start,start+3,start+2);
    else g.index.push(start,start+1,start+2,start,start+2,start+3);
  }
  return g;
}
const ROT_X=Object.freeze([0,0,-Math.SQRT1_2,Math.SQRT1_2]);
const ROT_Z=Object.freeze([Math.SQRT1_2,0,0,Math.SQRT1_2]);
export function realisticNightstandGlb(concept){
  if(!concept||!PALETTES[concept.finish]||!['shelf','closed'].includes(concept.lower_section??'shelf'))
    throw new TypeError('REALISTIC_CONCEPT_INVALID');
  const model=buildNightstand(concept,concept.dimensions_mm);
  const builder=new GlbBuilder();
  const wood=generateTextures(model.finish);
  const colourView=builder.addBytes(wood.colour);
  const normalView=builder.addBytes(wood.normals);
  builder.images.push({name:'Embedded procedural wood-grain diffuse',bufferView:colourView,mimeType:'image/png'});
  builder.images.push({name:'Embedded fine-grain normal',bufferView:normalView,mimeType:'image/png'});
  builder.textures.push({sampler:0,source:0});
  builder.textures.push({sampler:0,source:1});
  function woodMaterial(name,tint,roughness){
    return builder.materials.push({
      name,pbrMetallicRoughness:{
        baseColorFactor:[...tint,1],
        baseColorTexture:{index:0},
        metallicFactor:0,roughnessFactor:roughness
      },
      normalTexture:{index:1,scale:.28},
      doubleSided:false
    })-1;
  }
  const mats={
    shell:woodMaterial('Birch veneered cabinet shell, textured',[.96,.94,.90],.67),
    top:woodMaterial('Selected wood finish — rounded top',[1.06,1.03,.98],.52),
    drawer:woodMaterial('Selected wood finish — flush drawer fronts',[1.08,1.05,1.00],.56),
    side:woodMaterial('Selected wood finish — endgrain edge band',[.86,.79,.72],.78),
    leg:woodMaterial('Selected wood finish — tapered solid legs',[.83,.77,.70],.72)
  };
  mats.reveal=builder.materials.push({
    name:'Inset drawer shadow gap',pbrMetallicRoughness:{
      baseColorFactor:[.085,.067,.056,1],metallicFactor:0,roughnessFactor:.93
    }
  })-1;
  mats.brass=builder.materials.push({
    name:'Satin machined brass — showroom handle',
    pbrMetallicRoughness:{
      baseColorFactor:[.69,.51,.29,1],metallicFactor:.83,roughnessFactor:.27
    }
  })-1;
  const meshCylinder=builder.mesh('Turned 24-segment metal handle',cylinder(),mats.brass);
  // The source parametric shape is retained as distinct named objects.
  for(const p of model.parts){
    const mat=p.kind==='top'?mats.top:p.kind==='drawer'||p.kind==='front'?
      mats.drawer:p.kind==='leg'?mats.leg:p.kind==='side'?mats.side:mats.shell;
    const bevel=p.kind==='top'?Math.min(2.6,model.nominal_thickness_mm*.36):
      p.kind==='drawer'||p.kind==='front'?Math.min(2.3,model.nominal_thickness_mm*.34):
      p.kind==='leg'?1.8:Math.min(1.4,model.nominal_thickness_mm*.25);
    const shape=p.kind==='leg'?taperedLeg():boxGrid(p.width,p.height,p.depth,bevel);
    const mesh=builder.mesh('Refined '+p.id+' beveled/formed geometry',shape,mat);
    builder.node(p.id,mesh,[p.x,p.y,p.z],[p.width,p.height,p.depth],
      {id:p.id,kind:p.kind,unverified:true,nominal_mm:[p.width,p.height,p.depth]});
  }
  const W=model.dimensions_mm.width,H=model.dimensions_mm.height,
    D=model.dimensions_mm.depth,T=model.nominal_thickness_mm,L=Math.min(82,Math.round(H*.16));
  const zfront=D/2;
  function extraBox(name,material,x,y,z,w,h,d,bevel,role){
    if(![x,y,z,w,h,d,bevel].every(Number.isFinite)||
       [w,h,d].some(v=>v<=0))throw new RangeError('DECORATIVE_SHAPE_INVALID');
    const mesh=builder.mesh(name+' bevelled presentation',boxGrid(w,h,d,bevel),material);
    builder.node(name,mesh,[x,y,z],[w,h,d],{role,unverified:true});
  }
  function brass(name,position,size,rotation){
    builder.node(name,meshCylinder,position,size,
      {role:'decorative_handle_only',unverified:true},rotation);
  }
  // Distinct black reveal + proper panel fascia visually replaces the very
  // shallow legacy schematic drawer front, without modifying the source BOM.
  const available=Math.max(62,H-L-T-24);
  const height=clamp(Math.floor(available/(model.drawers===2?3.05:2.1)),
    Math.min(38,available/(model.drawers===2?2.3:1.8)),122);
  const revealGap=5;
  const starts=H-T-12;
  const panelWidth=W-2*T-16;
  for(let i=0;i<model.drawers;i++){
    const y=starts-height/2-i*(height+revealGap);
    extraBox('drawer-'+(i+1)+'-shadow-gap',mats.reveal,
      0,y,zfront+1.15,panelWidth+4,height+4,2.2,1.05,'visual_drawer_reveal');
    extraBox('drawer-'+(i+1)+'-face-visual',mats.drawer,
      0,y,zfront+3.75,panelWidth,height,3.8,1.48,'visual_fascia_not_cad');
    // A thin warm-wood accent below the drawer front provides an intentional
    // edge detail and makes the gaps readable at mobile viewing sizes.
    extraBox('drawer-'+(i+1)+'-lower-edge',mats.side,
      0,y-height/2+2.1,zfront+6,panelWidth-11,1.45,1.2,.4,'decorative_edge');
    const pullLength=Math.min(132,Math.max(70,W*.23));
    const pullY=y,outerZ=zfront+21;
    brass('drawer-'+(i+1)+'-pull',[0,pullY,outerZ],[7.3,pullLength,7.3],ROT_X);
    for(const sign of [-1,1]){
      const at=sign*pullLength*.37;
      brass('drawer-'+(i+1)+(sign<0?'-left-post':'-right-post'),
        [at,pullY,zfront+12.5],[7.5,12.2,7.5],ROT_Z);
      brass('drawer-'+(i+1)+(sign<0?'-left-cap':'-right-cap'),
        [sign*(pullLength/2+1.3),pullY,outerZ],[9.4,3.2,9.4],ROT_X);
    }
  }
  const bottomOfFront=starts-model.drawers*(height+revealGap)+revealGap;
  if(model.lower_section==='closed'&&bottomOfFront>L+25){
    const low=L+17,faceHeight=bottomOfFront-low-9;
    if(faceHeight>15){
      const y=low+faceHeight/2;
      extraBox('lower-visual-shadow-gap',mats.reveal,
        0,y,zfront+1.2,panelWidth+4,faceHeight+4,2.4,1,'closed_lower_reveal');
      extraBox('lower-visual-face',mats.drawer,
        0,y,zfront+3.65,panelWidth,faceHeight,3.8,1.6,'closed_lower_fascia');
    }
  } else if(model.lower_section==='shelf'){
    extraBox('shelf-front-lip',mats.side,0,L+T*2,zfront-4,
      W-2*T-17,Math.max(6,T*1.2),8,1,'edge_band_detail');
  }
  // Reinforced optical edge under the top; fits inside the envelope and is
  // purely a decorative showroom detail, not a claimed production laminate.
  extraBox('top-undercut-shadow',mats.reveal,
    0,H-T-2.4,0,W-13,1.3,D-13,.43,'visual_shadow_under_top');
  // Satin brass foot ferrules finish the silhouette; they are NOT structural.
  for(const leg of model.parts.filter(p=>p.kind==='leg')){
    extraBox(leg.id+'-brass-sock',mats.brass,
      leg.x,4.2,leg.z,19,8.4,19,1.15,'decorative_foot_cap');
  }
  return builder.finish({
    geometry_kind:'REALISTIC_TEXTURED_SHOWROOM_CONCEPT',
    visual_quality:'bevelled-textured-pbr-v1',
    materials:'procedural woodgrain textures and satin brass',
    source_kind:'synthetic_design_parameters_only',
    source_version:concept.version_id||'visual-unknown',
    source_dimensions_mm:model.dimensions_mm,
    finish:model.finish,drawers:model.drawers,
    lower_section:model.lower_section,
    nominal_thickness_mm:model.nominal_thickness_mm,
    decorations_are_visual_only:true,
    engineering_approval:false,manufacturing_approval:false,
    load_verified:false,joinery_verified:false,collision_free_verified:false
  });
}
