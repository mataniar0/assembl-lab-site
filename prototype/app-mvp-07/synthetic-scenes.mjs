/* Deterministic, synthetic room images for provider POC.
 * Entirely procedural pixels, no user photos and no external dependencies.
 */
import {deflateSync} from 'node:zlib';
const W=384,H=384;
const palettes=[
  {wall:[225,217,198],floor:[165,128,87],trim:[181,167,146]},
  {wall:[207,214,211],floor:[171,138,110],trim:[165,174,172]},
  {wall:[225,221,209],floor:[116,125,127],trim:[180,175,164]},
  {wall:[213,205,196],floor:[176,151,119],trim:[170,158,147]},
  {wall:[209,218,222],floor:[155,126,92],trim:[163,179,184]},
  {wall:[226,216,205],floor:[124,116,108],trim:[179,165,151]},
  {wall:[201,206,185],floor:[190,154,116],trim:[148,157,135]},
  {wall:[234,230,219],floor:[138,112,82],trim:[185,181,170]},
  {wall:[214,204,213],floor:[150,131,127],trim:[170,159,168]},
  {wall:[224,219,211],floor:[116,129,132],trim:[179,173,166]}
];
export const scenarios=Object.freeze([
  {id:'SC-01',label:'plain neutral wall',window:false,plant:false,existing:false,position:52},
  {id:'SC-02',label:'left-side window',window:true,plant:false,existing:false,position:62},
  {id:'SC-03',label:'right-side lamp',window:false,plant:false,existing:true,position:43},
  {id:'SC-04',label:'plant in corner',window:false,plant:true,existing:false,position:58},
  {id:'SC-05',label:'bright daytime room',window:true,plant:true,existing:false,position:59},
  {id:'SC-06',label:'low light warm wall',window:false,plant:false,existing:true,position:48},
  {id:'SC-07',label:'olive wall and wooden floor',window:false,plant:true,existing:true,position:54},
  {id:'SC-08',label:'minimal white room',window:true,plant:false,existing:false,position:57},
  {id:'SC-09',label:'soft lilac wall',window:false,plant:false,existing:true,position:61},
  {id:'SC-10',label:'cool gray floor',window:true,plant:true,existing:true,position:52}
]);
function pngChunk(type,payload){
  const name=Buffer.from(type,'ascii'),n=Buffer.alloc(4);n.writeUInt32BE(payload.length);
  const crcValue=crc(Buffer.concat([name,payload])),check=Buffer.alloc(4);check.writeUInt32BE(crcValue);
  return Buffer.concat([n,name,payload,check]);
}
const crcTable=Array.from({length:256},(_,i)=>{
  let c=i;for(let b=0;b<8;b++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}

export function renderScene(index){
  if(!Number.isInteger(index)||index<0||index>=scenarios.length)throw new Error('invalid_scenario_index');
  const p=palettes[index],s=scenarios[index];
  const pixels=Buffer.alloc(W*H*3);
  function at(x,y,c){
    if(x<0||y<0||x>=W||y>=H)return;
    const q=(y*W+x)*3;pixels[q]=c[0];pixels[q+1]=c[1];pixels[q+2]=c[2];
  }
  function rect(x0,y0,x1,y1,color){
    for(let y=Math.max(0,Math.floor(y0));y<Math.min(H,Math.ceil(y1));y++)
      for(let x=Math.max(0,Math.floor(x0));x<Math.min(W,Math.ceil(x1));x++)at(x,y,color);
  }
  function disk(cx,cy,r,color){
    for(let y=Math.max(0,cy-r);y<Math.min(H,cy+r);y++)
      for(let x=Math.max(0,cx-r);x<Math.min(W,cx+r);x++)
        if((x-cx)*(x-cx)+(y-cy)*(y-cy)<r*r)at(x,y,color);
  }
  const floorTop=250+(index%3)*5;
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const wall=y<floorTop;
      const base=wall?p.wall:p.floor;
      const shade=wall?Math.round(5*x/W)-3:Math.round(12*(y-floorTop)/(H-floorTop));
      const grain=wall?((x*3+y)%53===0?-3:0):((y%14===0)?-9:0);
      at(x,y,base.map(v=>Math.min(255,Math.max(0,v+shade+grain))));
    }
  }
  rect(0,floorTop-4,W,floorTop+3,p.trim);
  // Perspective seams and a small framed picture.
  rect(298,48,356,112,[106,87,72]);rect(303,53,351,107,[229,223,199]);
  rect(317,71,335,92,[126,156,130]);
  if(s.window){
    rect(34,55,128,172,[238,238,230]);
    rect(40,61,122,166,[169,206,221]);
    rect(79,61,84,166,[244,239,222]);
    rect(40,110,122,115,[244,239,222]);
    rect(31,170,131,180,[226,218,201]);
  }
  if(s.existing){
    // A thin floor lamp, kept to the far right of the free placement area.
    rect(329,150,334,floorTop+19,[64,62,58]);
    rect(318,floorTop+16,344,floorTop+22,[67,64,59]);
    rect(306,125,356,164,[233,211,163]);
    rect(310,163,352,167,[132,112,89]);
  }
  if(s.plant){
    rect(16,floorTop-10,48,floorTop+18,[157,111,79]);
    rect(24,floorTop-51,38,floorTop-10,[81,108,72]);
    for(const [cx,cy,r] of [[15,floorTop-69,21],[43,floorTop-74,21],[29,floorTop-89,18]])
      disk(cx,cy,r,[84,118,72]);
  }
  // Visible empty floor area, reserved for furniture insertion.
  const row=Buffer.alloc(H*(W*3+1));
  for(let y=0;y<H;y++){
    const start=y*(W*3+1);row[start]=0;
    pixels.copy(row,start+1,y*W*3,(y+1)*W*3);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);
  ihdr[8]=8;ihdr[9]=2;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  const png=Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR',ihdr),
    pngChunk('IDAT',deflateSync(row,{level:9})),
    pngChunk('IEND',Buffer.alloc(0))
  ]);
  return {png,id:s.id,label:s.label,width:W,height:H,case:s};
}
