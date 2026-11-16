/* ASSEMBL LAB MVP-09-C
 * Self-generated 384x384 indexed PNG fixtures. Pure JavaScript, deterministic.
 * No AI provider, real-world photos, EXIF, network calls, third-party images,
 * input strings or dynamic content. PNG chunks: IHDR / PLTE / IDAT / IEND.
 * The previous MVP-07 branch supplied the scenario concepts and test taxonomy;
 * these are newly generated indexed scenes, not its byte-for-byte image output.
 */
const W=384,H=384;
export const SCENE_DEFINITIONS=[
  {
    "id": "SC-01",
    "he": "קיר נייטרלי",
    "en": "Neutral wall",
    "kind": "neutral",
    "window": false,
    "plant": false,
    "lamp": false,
    "wall": [
      226,
      217,
      199
    ],
    "floor": [
      175,
      139,
      107
    ],
    "floorTop": 256
  },
  {
    "id": "SC-02",
    "he": "חלון משמאל",
    "en": "Left window",
    "kind": "window",
    "window": true,
    "plant": false,
    "lamp": false,
    "wall": [
      205,
      218,
      215
    ],
    "floor": [
      161,
      140,
      113
    ],
    "floorTop": 258
  },
  {
    "id": "SC-04",
    "he": "עציץ בפינה",
    "en": "Corner plant",
    "kind": "plant",
    "window": false,
    "plant": true,
    "lamp": false,
    "wall": [
      216,
      209,
      195
    ],
    "floor": [
      183,
      155,
      127
    ],
    "floorTop": 254
  },
  {
    "id": "SC-07",
    "he": "קיר ירקרק ומנורה",
    "en": "Olive wall and lamp",
    "kind": "lamp",
    "window": false,
    "plant": true,
    "lamp": true,
    "wall": [
      201,
      209,
      186
    ],
    "floor": [
      190,
      155,
      119
    ],
    "floorTop": 258
  },
  {
    "id": "SC-10",
    "he": "חדר עם חלון וחפצים",
    "en": "Window and objects",
    "kind": "combined",
    "window": true,
    "plant": true,
    "lamp": true,
    "wall": [
      217,
      219,
      216
    ],
    "floor": [
      143,
      154,
      157
    ],
    "floorTop": 261
  }
];
function concatBytes(parts){let size=0;for(const p of parts)size+=p.length;const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
function be32(num){return new Uint8Array([(num>>>24)&255,(num>>>16)&255,(num>>>8)&255,num&255]);}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc&1)?((crc>>>1)^0xedb88320):(crc>>>1);}return(crc^0xffffffff)>>>0;}
function pngChunk(type,body){const a=new Uint8Array(4);for(let i=0;i<4;i++)a[i]=type.charCodeAt(i);return concatBytes([be32(body.length),a,body,be32(crc32(concatBytes([a,body])))]);}
function storedZlib(raw){
 const chunks=[new Uint8Array([0x78,0x01])];
 for(let p=0;p<raw.length;p+=65535){const length=Math.min(65535,raw.length-p);const complement=(~length)&65535;const end=p+length===raw.length?1:0;chunks.push(new Uint8Array([end,length&255,length>>>8,complement&255,complement>>>8]));chunks.push(raw.subarray(p,p+length));}
 let a=1,b=0;for(const v of raw){a=(a+v)%65521;b=(b+a)%65521;}chunks.push(be32((b*65536+a)>>>0));return concatBytes(chunks);
}
export function makeFixture(id){
 const sc=SCENE_DEFINITIONS.find(x=>x.id===id);if(!sc)throw Error("unknown_synthetic_scene");
 const colors=[
 sc.wall,sc.wall.map(x=>Math.max(0,x-8)),sc.floor,sc.floor.map(x=>Math.min(255,x+12)),
 [169,151,128],[105,85,68],[228,216,193],[114,145,120],
 [242,239,226],[154,198,220],[65,112,72],[101,139,84],
 [172,113,79],[239,213,165],[74,73,70],[168,150,129]
 ];
 const pixels=new Uint8Array(W*H);
 const rect=(x0,y0,x1,y1,col)=>{for(let y=Math.max(0,y0|0);y<Math.min(H,y1|0);y++){const p=y*W;for(let x=Math.max(0,x0|0);x<Math.min(W,x1|0);x++)pixels[p+x]=col;}};
 const circle=(cx,cy,r,col)=>{const r2=r*r;for(let y=Math.max(0,cy-r);y<Math.min(H,cy+r);y++)for(let x=Math.max(0,cx-r);x<Math.min(W,cx+r);x++)if((cx-x)*(cx-x)+(cy-y)*(cy-y)<r2)pixels[y*W+x]=col;};
 for(let y=0;y<H;y++){
  const floor=y>=sc.floorTop;
  for(let x=0;x<W;x++)pixels[y*W+x]=floor?(((y-sc.floorTop)%23===0||((x+y)%141===0))?3:2):(((x*7+y*5)%127===0)?1:0);
 }
 rect(0,sc.floorTop-3,W,sc.floorTop+4,4);
 rect(294,46,359,117,5);rect(301,53,352,110,6);rect(318,71,334,96,7);
 if(sc.window){rect(31,53,134,179,8);rect(39,61,126,167,9);rect(79,61,85,167,8);rect(39,112,126,118,8);rect(27,175,139,184,8);}
 if(sc.lamp){rect(329,143,335,sc.floorTop+15,14);rect(312,sc.floorTop+15,354,sc.floorTop+21,14);rect(307,128,356,168,13);rect(304,164,358,172,5);}
 if(sc.plant){rect(18,sc.floorTop-14,52,sc.floorTop+19,12);rect(31,sc.floorTop-58,37,sc.floorTop-15,10);circle(16,sc.floorTop-67,21,10);circle(45,sc.floorTop-77,21,11);circle(25,sc.floorTop-96,18,10);circle(45,sc.floorTop-102,11,11);}
 const lineSize=1+W/2;
 const scan=new Uint8Array(lineSize*H);
 for(let y=0;y<H;y++){const at=y*lineSize;scan[at]=0;for(let x=0;x<W;x+=2)scan[at+1+x/2]=(pixels[y*W+x]<<4)|pixels[y*W+x+1];}
 const palette=new Uint8Array(48);for(let i=0;i<16;i++)for(let j=0;j<3;j++)palette[i*3+j]=colors[i][j];
 const ihdr=concatBytes([be32(W),be32(H),new Uint8Array([4,3,0,0,0])]);
 return concatBytes([new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk("IHDR",ihdr),pngChunk("PLTE",palette),pngChunk("IDAT",storedZlib(scan)),pngChunk("IEND",new Uint8Array(0))]);
}
export const SIZE=Object.freeze({width:W,height:H});
