#!/usr/bin/env python3
"""Remove background from an image using rembg (U2-Net).

Usage:
    python3 remove_bg.py input.png
    python3 remove_bg.py input.jpg output.png
"""

import sys
from pathlib import Path


def remove_background(src: Path, dst: Path) -> None:
    from rembg import remove

    data = src.read_bytes()
    result = remove(data)
    dst.write_bytes(result)
    print(f"Saved: {dst}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    src = Path(sys.argv[1])
    if not src.exists():
        print(f"Error: file not found: {src}")
        sys.exit(1)

    dst = Path(sys.argv[2]) if len(sys.argv) >= 3 else src.with_stem(src.stem + "_nobg").with_suffix(".png")

    remove_background(src, dst)