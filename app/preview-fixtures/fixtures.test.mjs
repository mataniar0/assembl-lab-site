import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SCENE_DEFINITIONS,makeFixture,SIZE} from './generate-fixtures.mjs';

const manifest=JSON.parse(readFileSync(new URL('./manifest.json',import.meta.url),'utf8'));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const expectedIds=['SC-01','SC-02','SC-04','SC-07','SC-10'];
const signature=Buffer.from([137,80,78,71,13,10,26,10]);

function inspectPng(bytes){
  assert.ok(bytes.subarray(0,8).equals(signature),'PNG signature');
  const chunks=[];
  for(let p=8;p<bytes.length;){
    const size=bytes.readUInt32BE(p);
    const name=bytes.toString('ascii',p+4,p+8);
    assert.ok(size>=0&&p+12+size<=bytes.length,'chunk bounds');
    chunks.push({name,size});
    p+=12+size;
    if(name==='IEND'){
      assert.equal(p,bytes.length,'no trailing EXIF/data');
      break;
    }
  }
  return chunks;
}
test('five expected, local and explicitly owned procedural fixture identities',()=>{
  assert.deepEqual(SCENE_DEFINITIONS.map(s=>s.id),expectedIds);
  assert.deepEqual(manifest.fixtures.map(s=>s.id),expectedIds);
  assert.deepEqual(SIZE,{width:384,height:384});
  assert.deepEqual(manifest.dimensions_px,SIZE);
  assert.equal(manifest.generated_by_ai,false);
  assert.equal(manifest.contains_customer_media,false);
  assert.equal(manifest.contains_exif,false);
  assert.match(manifest.license,/Project-created procedural/);
  for(const fixture of manifest.fixtures){
    assert.match(fixture.file,/^SC-(01|02|04|07|10)\.png$/);
    assert.equal(fixture.bytes,74245);
    assert.match(fixture.sha256,/^[a-f0-9]{64}$/);
  }
});
for(const fixture of manifest.fixtures){
  test(fixture.id+' byte-for-byte deterministic PNG and SHA-256',()=>{
    const saved=readFileSync(new URL('./'+fixture.file,import.meta.url));
    const reproduced=Buffer.from(makeFixture(fixture.id));
    assert.equal(saved.length,fixture.bytes);
    assert.equal(sha256(saved),fixture.sha256);
    assert.ok(saved.equals(reproduced),'committed fixture matches source generator');
    assert.equal(saved.readUInt32BE(16),384);
    assert.equal(saved.readUInt32BE(20),384);
    assert.equal(saved[24],4,'4-bit per palette index');
    assert.equal(saved[25],3,'indexed PNG');
    assert.deepEqual(inspectPng(saved).map(c=>c.name),['IHDR','PLTE','IDAT','IEND']);
  });
}
test('generated scenes have no person, real-camera or remote asset inputs',()=>{
  const code=readFileSync(new URL('./generate-fixtures.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|https?:\/\/|canvas\.toDataURL/);
  assert.doesNotMatch(code,/private_key|sb_secret_|service_role|navigator\.mediaDevices/i);
});
