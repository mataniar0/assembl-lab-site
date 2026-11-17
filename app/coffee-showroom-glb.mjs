/* APP MVP-20 – the SAME source-of-truth for the landing hero and interactive 3D.
 * A round warm-oak tabletop on three satin-black tapered legs, modelled from
 * the approved showroom silhouette, NOT fabricated from real measurements.
 * This is a visual concept; the original 32-part CAD DESIGN_ONLY file and
 * authentic photos in /table/personal/ are deliberately left untouched.
 *
 * All vertices, normal maps and wood pixels live inside a self-contained GLB.
 * No fetching, user uploads, subscriptions, AI, or external runtime resources.
 */
import {GlbBuilder,generateTextures} from './realistic-glb.mjs';

export const COFFEE_SHOWROOM=Object.freeze({
  diameter_mm:620,
  tabletop_thickness_mm:29,
  visual_height_mm:455,
  leg_count:3,
  design_revision:'showroom-v1',
  verified_as_built:false
});
const SEGMENTS=96;
const TAU=Math.PI*2;
function normalize3(v){
  const n=Math.hypot(...v)||1;
  return v.map(x=>x/n);
}
function empty(){return {position:[],normal:[],uv:[],index:[]};}
function face(g,ia,ib,ic){
  const pa=g.position.slice(3*ia,3*ia+3),
    pb=g.position.slice(3*ib,3*ib+3),
    pc=g.position.slice(3*ic,3*ic+3);
  const u=pb.map((x,i)=>x-pa[i]),v=pc.map((x,i)=>x-pa[i]);
  const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const n=g.normal.slice(3*ia,3*ia+3);
  const dot=cross.reduce((s,x,i)=>s+x*n[i],0);
  if(dot>=0)g.index.push(ia,ib,ic);
  else g.index.push(ia,ic,ib);
}
export function roundWoodTop(){
  const g=empty();
  // Radius / absolute y profile (mm): upper surface, bevelled edge and
  // matching underside. Derived from the illustrated round-top silhouette.
  const p=[
    [0.01,455],[100,455],[250,455],[289,455],
    [299,454.2],[304,453],[308.5,450],[310,446],
    [310,435],[309,431],[305,428],[300,426],
    [289,426],[250,426],[100,426],[0.01,426]
  ];
  for(let k=0;k<p.length;k++){
    const [r,y]=p[k];
    const prev=p[Math.max(0,k-1)],next=p[Math.min(p.length-1,k+1)];
    let tangent=[next[0]-prev[0],next[1]-prev[1]];
    if(tangent[0]===0&&tangent[1]===0)tangent=[1,0];
    const radial=normalize3([-tangent[1],tangent[0],0]);
    for(let i=0;i<=SEGMENTS;i++){
      const angle=i/SEGMENTS*TAU,cs=Math.cos(angle),sn=Math.sin(angle);
      const x=r*cs,z=r*sn;
      g.position.push(x,y,z);
      g.normal.push(radial[0]*cs,radial[1],radial[0]*sn);
      // top and underside show continuous horizontally running timber grain.
      if(y>451||y<428)g.uv.push(x/640+.5,z/640+.5);
      else g.uv.push(i/SEGMENTS,(y-425)/40);
    }
  }
  for(let j=0;j<p.length-1;j++)for(let i=0;i<SEGMENTS;i++){
    const a=j*(SEGMENTS+1)+i,b=a+1,c=a+SEGMENTS+1,d=c+1;
    face(g,a,c,b);face(g,b,c,d);
  }
  // Extremely small center disks avoid zero-area triangles in GLB.
  return g;
}
function roundedSquare(half,cut){
  return [
    [-half+cut,-half],[half-cut,-half],
    [half,-half+cut],[half,half-cut],
    [half-cut,half],[-half+cut,half],
    [-half,half-cut],[-half,-half+cut]
  ];
}
export function slimSplayedLeg(angle){
  const g=empty();
  const upper=roundedSquare(15.5,4.2),lower=roundedSquare(10,3.8);
  const dx=Math.cos(angle),dz=Math.sin(angle);
  const centers=[
    [dx*214,0,dz*214],
    [dx*167,424,dz*167]
  ];
  const sections=[lower,upper];
  function point(ring,index){
    const [ux,uz]=sections[ring][index];
    const [cx,cy,cz]=centers[ring];
    // local horizontal/side axes radiate in the same direction as the leg.
    const px=ux*dx-uz*dz,pz=ux*dz+uz*dx;
    return [cx+px,cy,cz+pz];
  }
  // Separate smooth-chamfered faces with consistent normals (no bowed bars).
  for(let side=0;side<8;side++){
    const a=point(0,side),b=point(0,(side+1)%8),
      c=point(1,(side+1)%8),d=point(1,side);
    const u=b.map((x,i)=>x-a[i]),v=d.map((x,i)=>x-a[i]);
    const normal=normalize3([
      u[1]*v[2]-u[2]*v[1],
      u[2]*v[0]-u[0]*v[2],
      u[0]*v[1]-u[1]*v[0]
    ]);
    const center=[(a[0]+b[0]+c[0]+d[0])/4,220,(a[2]+b[2]+c[2]+d[2])/4];
    const radial=[center[0]-(dx*186),0,center[2]-(dz*186)];
    if(normal[0]*radial[0]+normal[2]*radial[2]<0){
      for(let k=0;k<3;k++)normal[k]*=-1;
    }
    const offset=g.position.length/3;
    for(const [idx,p] of [a,b,c,d].entries()){
      g.position.push(...p);g.normal.push(...normal);
      g.uv.push(idx===0||idx===3?0:1,idx<2?0:1);
    }
    face(g,offset,offset+1,offset+2);
    face(g,offset,offset+2,offset+3);
  }
  for(let ring=0;ring<2;ring++){
    const start=g.position.length/3;
    for(let i=0;i<8;i++){
      g.position.push(...point(ring,i));
      g.normal.push(0,ring===0?-1:1,0);
      g.uv.push(.5+sections[ring][i][0]/50,.5+sections[ring][i][1]/50);
    }
    for(let i=1;i<7;i++)face(g,start,start+i,start+i+1);
  }
  return g;
}
function underMount(angle){
  // Low-profile black mounting plate, hidden by the wood perimeter.
  const g=empty();
  const rad=22,startAngle=angle;
  // Approximate a small black square fixing foot with bevel edges.
  const side=12;
  const basis=[
    [-side,-side],[side,-side],[side,side],[-side,side]
  ];
  for(const y of [416,424]){
    for(const [x,z] of basis){
      const xc=165*Math.cos(startAngle),zc=165*Math.sin(startAngle);
      g.position.push(xc+x,y,zc+z);
      g.normal.push(0,y===416?-1:1,0);g.uv.push((x+side)/(2*side),(z+side)/(2*side));
    }
  }
  for(let k=0;k<4;k++){
    const a=k,b=(k+1)%4,c=a+4,d=b+4;
    face(g,a,b,c);face(g,b,d,c);
  }
  face(g,0,1,2);face(g,0,2,3);
  face(g,4,6,5);face(g,4,7,6);
  return g;
}
export function matchingCoffeeTableGlb(){
  const builder=new GlbBuilder();
  const oak=generateTextures('natural');
  const diffuse=builder.addBytes(oak.colour);
  const normals=builder.addBytes(oak.normals);
  builder.images.push({name:'Embedded warm-oak procedural grain',bufferView:diffuse,mimeType:'image/png'});
  builder.images.push({name:'Embedded wood-relief normal',bufferView:normals,mimeType:'image/png'});
  builder.textures.push({sampler:0,source:0},{sampler:0,source:1});
  const matWood=builder.materials.push({
    name:'Warm natural oak - illustrative wood with directional grain',
    pbrMetallicRoughness:{
      baseColorFactor:[1.04,.98,.92,1],
      baseColorTexture:{index:0},
      metallicFactor:0,roughnessFactor:.62
    },
    normalTexture:{index:1,scale:.12},doubleSided:false
  })-1;
  const matBlack=builder.materials.push({
    name:'Matte satin charcoal black - tapered supports',
    pbrMetallicRoughness:{
      baseColorFactor:[.045,.048,.052,1],metallicFactor:.21,roughnessFactor:.43
    },doubleSided:false
  })-1;
  const matHardware=builder.materials.push({
    name:'Invisible underside brackets - design sketch only',
    pbrMetallicRoughness:{
      baseColorFactor:[.075,.075,.08,1],metallicFactor:.25,roughnessFactor:.58
    }
  })-1;
  const tabletop=builder.mesh('Round chamfered 620mm visual tabletop',roundWoodTop(),matWood);
  builder.node('oak-round-tabletop',tabletop,[0,0,0],[1,1,1],{
    role:'visual_tabletop',source:'studio_model',nominal_diameter_mm:620,
    nominal_thickness_mm:29,unverified:true
  });
  for(let i=0;i<3;i++){
    const angle=(i*2*Math.PI/3)+Math.PI/6;
    const leg=builder.mesh('Splayed rounded-square black leg '+(i+1),slimSplayedLeg(angle),matBlack);
    builder.node('satin-black-tapered-leg-'+(i+1),leg,[0,0,0],[1,1,1],{
      role:'visual_support',unverified:true,leg:i+1
    });
    const fixture=builder.mesh('Hidden underside leg mount '+(i+1),underMount(angle),matHardware);
    builder.node('underside-bracket-'+(i+1),fixture,[0,0,0],[1,1,1],{
      role:'visual_bracket',unverified:true
    });
  }
  return builder.finish({
    geometry_kind:'MATCHED_COFFEE_TABLE_SHOWROOM',
    source_kind:'ASSEMBL_LAB_PERSONAL_COFFEE_PHOTO_STYLE_REFERENCE',
    coherence_key:'personal-coffee-3d-is-hero-source',
    top_shape:'ROUND_WOOD',legs:'THREE_SPLAYED_BLACK',
    nominal_dimensions_mm:{diameter:620,height:455,top_thickness:29},
    dimensions_are_illustrative:true,engineering_approval:false,
    manufacturing_approval:false,verified_as_built:false,
    intended_use:'showroom-only; NOT validated product or CAD',
    marketing_assets:'hero snapshot captured directly from this GLB'
  });
}
