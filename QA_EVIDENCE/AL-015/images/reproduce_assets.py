from pathlib import Path
import hashlib,json,subprocess,tempfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[3];M=ROOT/'table/personal/media';P=json.loads((M/'PROVENANCE.json').read_text());checks=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(prefix='al015-independent-reproduction-') as folder:
 folder=Path(folder)
 for rec in P['images']:
  src=M/rec['source'];assert sha(src)==rec['source_sha256'];master=folder/(rec['stem']+'.miff');cmd=['convert',str(src),'-auto-orient']
  if rec['crop_geometry']:cmd+=['-crop',rec['crop_geometry'],'+repage']
  cmd+=['-brightness-contrast',rec['brightness_contrast'],'-color-matrix',rec['rgb_matrix'],'-strip',str(master)];subprocess.run(cmd,check=True)
  with Image.open(src) as image:assert list(image.size)==rec['source_dimensions_px']
  for export in rec['exports']:
   expected=M/export['path'];replica=folder/export['path'];width=1440 if export['path'].endswith('-full.webp') else export['width']
   subprocess.run(['convert',str(master),'-resize',f'{width}x>','-strip','-quality',str(export['quality']),'-define','webp:method=6',str(replica)],check=True)
   with Image.open(expected) as image:dimensions=list(image.size)
   assert dimensions==[export['width'],export['height']];assert export['width']<=rec['native_edited_dimensions_px'][0] and export['height']<=rec['native_edited_dimensions_px'][1]
   assert expected.stat().st_size==export['bytes'] and sha(expected)==export['sha256'] and sha(replica)==export['sha256']
   checks.append({'file':export['path'],'dimensions':dimensions,'bytes':export['bytes'],'sha256':export['sha256'],'reproduction_match':True,'no_upscaling':True})
  if rec['stem']==P['images'][0]['stem']:
   for export in P['card_assets']:
    expected=M/export['path'];replica=folder/export['path'];subprocess.run(['convert',str(master),'-resize',f"{export['width']}x>",'-strip','-quality',str(export['quality']),'-define','webp:method=6',str(replica)],check=True)
    with Image.open(expected) as image:assert list(image.size)==[export['width'],export['height']]
    assert sha(expected)==export['sha256']==sha(replica);checks.append({'file':export['path'],'reproduction_match':True,'no_upscaling':True,'bytes':export['bytes']})
result={'source_hashes_verified':7,'export_reproductions_passed':len(checks),'failed':0,'all_before_after_pairs_present':all((ROOT/f'QA_EVIDENCE/AL-015/images/{i:02d}_BEFORE_AFTER.jpg').is_file() for i in range(1,8)),'contact_sheet_present':(ROOT/'QA_EVIDENCE/AL-015/images/BEFORE_AFTER_CONTACT_SHEET.jpg').is_file(),'checks':checks}
(ROOT/'QA_EVIDENCE/AL-015/images/ASSET_REPRODUCTION.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='checks'}))
