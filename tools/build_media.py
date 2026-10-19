"""Builds web-ready copies, WebP posters and hover previews of the six source videos.
Everything keeps the clip's true aspect ratio.  Originals are never modified."""
from common import *
from PIL import Image

ENC = ["-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
AUD = ["-c:a", "aac", "-b:a", "112k", "-ac", "2"]

# key: (video filter, crf, fps, trim args for the full web copy)
FULL = {
    "01": (UPRIGHT["01"] + ",scale=1280:-2", 25, 30, ["-t", "25"]),    # stops before the "Follow @…" end card
    "02": (UPRIGHT["02"] + ",scale=1280:-2", 25, 30, ["-t", "26.7"]),
    # web copy stops at 1:30 so client phone numbers/addresses in the closing cards are not published
    "03": ("scale=720:-2", 28, 30, ["-t", "90"]),
    "04": ("scale=720:-2", 28, 24, []),
    "05": ("scale=480:-2", 24, 24, []),
    "06": ("scale=480:-2", 25, 24, []),
}
POSTER = {"01": 18.9, "02": 7.6, "03": 0.4, "04": 20.2, "05": 0.9, "06": 47.6}   # seconds
PREVIEW = {"01": 15.5, "02": 12.5, "03": 36.5, "04": 17.5, "05": 17.5, "06": 0.5}

for k, src in SOURCES.items():
    vf, crf, fps, trim = FULL[k]
    run(["-i", src] + trim + ["-vf", f"{vf},fps={fps}", *ENC, "-crf", crf, *AUD, MEDIA / f"p{k}.mp4"])
    jpg = MEDIA / f"p{k}.tmp.jpg"
    run(["-ss", POSTER[k], "-i", src, "-frames:v", 1, "-vf", vf, "-q:v", 2, jpg])
    im = Image.open(jpg)
    im.save(MEDIA / f"p{k}.webp", quality=78, method=6)
    w = 480 if im.width < im.height else 640        # small poster for the project list
    im.resize((w, round(im.height * w / im.width))).save(MEDIA / f"p{k}-sm.webp", quality=74, method=6)
    jpg.unlink()
    (MEDIA / f"p{k}.jpg").unlink(missing_ok=True)
    pw = 640 if k in UPRIGHT else 360
    pv = UPRIGHT[k] + "," if k in UPRIGHT else ""
    run(["-ss", PREVIEW[k], "-t", 4, "-i", src, "-an", "-vf", f"{pv}scale={pw}:-2,fps=24", *ENC, "-crf", 30, MEDIA / f"p{k}-preview.mp4"])
    print("done", k, im.size)
