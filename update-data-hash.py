#!/usr/bin/env python3
"""Set DATA_HASH in service-worker.js to a fingerprint of data.js + specs.js.
Run this after changing either file, so phones download the new data once (and code-only updates don't re-download it).
Usage: python3 update-data-hash.py [folder]"""
import hashlib, pathlib, re, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else __file__).resolve()
if root.is_file(): root = root.parent
h = hashlib.sha256()
for name in ['data.js', 'specs.js']:
    h.update((root / name).read_bytes())
digest = h.hexdigest()[:12]
sw = root / 'service-worker.js'
text = sw.read_text(encoding='utf-8')
new = re.sub(r"const DATA_HASH = '[^']*';", f"const DATA_HASH = '{digest}';", text, count=1)
if new == text and f"'{digest}'" not in text:
    sys.exit('DATA_HASH line not found in service-worker.js')
sw.write_text(new, encoding='utf-8')
print('DATA_HASH =', digest)
