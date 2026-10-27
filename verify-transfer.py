from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parent
manifest=json.loads((root/'transfer-manifest.json').read_text(encoding='utf-8'))
errors=[]
for entry in manifest['files']:
    path=root/entry['path']
    if not path.is_file():errors.append('missing: '+entry['path']);continue
    if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']:errors.append('changed: '+entry['path'])
assets=json.loads((root/'midam-ad-board/dist/assets.json').read_text(encoding='utf-8'))
for asset in assets:
    for field in ['image','productImage']:
        if asset.get(field) and not (root/'midam-ad-board/dist'/asset[field]).is_file():errors.append('asset: '+asset[field])
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f"Verified {len(manifest['files'])} snapshot files and {len(assets)} generated images.")
