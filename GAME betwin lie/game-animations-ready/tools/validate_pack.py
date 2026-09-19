#!/usr/bin/env python3
import json, sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]
def fail(msg): errors.append(msg)
try: manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
except Exception as e: print('ERROR manifest.json:',e); sys.exit(1)
if not isinstance(manifest.get('animations'),list): fail('manifest.animations is not an array')
for clip in manifest.get('animations',[]):
    cid=clip.get('id','?'); w,h=clip.get('frameSize',[-1,-1]); frames=clip.get('frames',[])
    if len(frames)!=clip.get('frameCount'): fail(f'{cid}: frameCount mismatch')
    if len(clip.get('timingMs',[]))!=len(frames): fail(f'{cid}: timingMs count mismatch')
    for rel in frames+[clip.get('spriteSheet',''),clip.get('preview','')]:
        if not rel or not (ROOT/rel).is_file(): fail(f'{cid}: missing path {rel}')
    mpath=ROOT/clip.get('game','')/clip.get('name','')/'metadata.json'
    try: md=json.loads(mpath.read_text(encoding='utf-8'))
    except Exception as e: fail(f'{cid}: invalid/missing metadata.json ({e})'); md={}
    sizes=set(); empty=[]
    for i,rel in enumerate(frames):
        p=ROOT/rel
        try:
            with Image.open(p) as im:
                im.load(); sizes.add(im.size)
                if im.mode!='RGBA': fail(f'{cid}: {rel} mode={im.mode}, expected RGBA')
                if im.getchannel('A').getbbox() is None: empty.append(i)
        except Exception as e: fail(f'{cid}: broken image {rel}: {e}')
    if sizes!={(w,h)}: fail(f'{cid}: frame sizes {sorted(sizes)} expected {(w,h)}')
    try:
        with Image.open(ROOT/clip.get('spriteSheet','')) as sh:
            sh.load()
            if sh.mode!='RGBA': fail(f'{cid}: sheet is not RGBA')
            if sh.size!=(w*len(frames),h): fail(f'{cid}: sheet size {sh.size} expected {(w*len(frames),h)}')
    except Exception as e: fail(f'{cid}: broken sheet: {e}')
    expected=md.get('validation',{}).get('emptyFrameIndexes',[])
    if empty!=expected: fail(f'{cid}: unexpected empty frames {empty}; metadata records {expected}')
    for s in clip.get('bundledSourceAssets',[]):
        if not (ROOT/s).is_file(): fail(f'{cid}: missing bundled source {s}')
    if not md: continue
print(f'Clips checked: {len(manifest.get("animations",[]))}')
print(f'Errors: {len(errors)}')
for e in errors: print('ERROR:',e)
if warnings:
    for w in warnings: print('WARN:',w)
sys.exit(1 if errors else 0)
