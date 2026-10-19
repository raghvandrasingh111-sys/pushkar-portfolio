"""Shared helpers for the media build scripts (ffmpeg via the imageio-ffmpeg wheel)."""
import subprocess, pathlib, sys
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SRC = pathlib.Path(r"C:\Users\pushk\OneDrive\Desktop\Portfolio")   # originals are never modified
ROOT = pathlib.Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
MEDIA.mkdir(exist_ok=True)

SOURCES = {
    "01": SRC / "0719.mp4",
    "02": SRC / "chan kita final 2.mp4",
    "03": SRC / "complete4.mp4",
    "04": SRC / "SHOWSHABAAZ.mp4",
    "05": SRC / "WhatsApp Video 2026-10-18 at 10.13.30 AM.mp4",
    "06": SRC / "WhatsApp Video 2026-10-18 at 10.22.52 AM.mp4",
}

# 01 and 02 are landscape edits stored rotated 90 deg clockwise inside a 1440x2560 portrait
# frame. Rotating counter-clockwise makes picture and captions upright; the crop then drops
# the burned-in handle watermark that sits at the right edge after rotation.
UPRIGHT_FILTER = "transpose=2,crop=2380:1440:0:0"
UPRIGHT = {"01": UPRIGHT_FILTER, "02": UPRIGHT_FILTER}

def run(args):
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y"] + [str(a) for a in args]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit(1)
