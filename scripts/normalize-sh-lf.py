"""Force LF line endings on backend shell scripts (Windows copy -> Linux safe)."""
import pathlib
import sys

if len(sys.argv) < 2:
    print("usage: normalize-sh-lf.py <backend_dir>", file=sys.stderr)
    sys.exit(2)

d = pathlib.Path(sys.argv[1])
for name in ("start-backend-prod.sh", "stop-backend-prod.sh"):
    p = d / name
    if not p.is_file():
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    p.write_bytes(t.encode("utf-8"))
