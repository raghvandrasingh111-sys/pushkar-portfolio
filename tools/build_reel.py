"""Renders the showreel (1920x1080, 30 fps) from the six source files.

One consistent grammar for every clip: the picture is shown at its TRUE aspect ratio, full height,
centred on a darkened, blurred copy of itself. Nothing is stretched, rotated randomly or cropped
into a different shape. Audio is each clip's own sound (loudness-matched); the only synthesized
sound is a riser into the end card and a low impact on it.

Run make_overlays.py first (labels + end card PNGs).
"""
import json, re, subprocess
from common import *

W, H, FPS = 1920, 1080, 30
SEG = ROOT / "tools" / "_seg"
SEG.mkdir(exist_ok=True)
OV = ROOT / "tools" / "_ov"

GRADE = {
    "01": "eq=contrast=1.1:saturation=1.1:gamma=0.97,colorbalance=bs=0.05:rm=0.03,noise=alls=4:allf=t",
    "02": "eq=contrast=1.05:saturation=0.92:brightness=0.01,colorbalance=gs=0.02:bh=0.02,noise=alls=3:allf=t",
    "03": "eq=contrast=1.03:saturation=1.08",
    "04": "eq=contrast=1.05:saturation=1.05:gamma=0.98",
    "05": "eq=contrast=1.08:saturation=1.12",
    "06": "eq=contrast=1.05:saturation=1.08",
}

# ---- edit decision list -----------------------------------------------------------
# join = (xfade transition, seconds) into the NEXT segment. 0.034 s (one frame) == a hard cut.
HARD = ("fade", 0.034)
EDL = [
    dict(id="A", k="01", ss=5.30, d=1.65, label=True, note="Blast as the first frame", join=HARD),
    dict(id="B", k="01", ss=11.0, d=1.20, note="Red-lit close-up", join=HARD),
    dict(id="C", k="01", ss=15.05, d=1.10, note="Rapid-cut flurry from the source", join=HARD),
    dict(id="D", k="01", ss=18.7, d=2.00, note="Inferno, left to breathe", join=("fadeblack", 0.16)),
    dict(id="E", k="01", ss=23.0, d=1.90, note="Scream, end of the action", join=("fade", 0.5)),
    dict(id="F", k="02", ss=6.2, d=4.00, label=True, note="Slow hold, cool grade", join=("fade", 0.3)),
    dict(id="G", k="02", ss=12.13, d=3.00, note="Teal night", join=HARD),
    dict(id="H", k="02", ss=25.0, d=1.60, note="Close-up", join=("fadewhite", 0.2)),
    dict(id="I1", k="03", ss=0.2, d=3.20, label=True, note="Doorway opens", join=HARD),
    dict(id="I2", k="03", ss=37.0, d=3.00, note="The couple", join=HARD),
    dict(id="I3", k="03", ss=70.5, d=2.60, note="Sangeet scene", join=("fadeblack", 0.2)),
    dict(id="J1", k="04", ss=20.0, d=3.60, label=True, note="Keyword titles", join=HARD),
    dict(id="J2", k="04", ss=38.0, d=2.40, note="Second location", join=("fadewhite", 0.1)),
    dict(id="K1", k="05", ss=0.0, d=2.60, label=True, note="Kinetic type opening", join=HARD),
    dict(id="K2", k="05", ss=17.6, d=2.40, note="Counters and quality stamp", join=("fadeblack", 0.2)),
    dict(id="L1", k="06", ss=0.0, d=2.60, label=True, note="Headline opening", join=HARD),
    dict(id="L2", k="06", ss=47.0, d=2.20, note="Group moment", join=("fadeblack", 0.15)),
    dict(id="R", kind="recap", d=2.52, note="Six-shot recap, one per project", join=("fadeblack", 0.25),
         shots=[("01", 19.3), ("02", 7.6), ("03", 37.6), ("04", 20.2), ("05", 0.9), ("06", 47.6)]),
    dict(id="Z", kind="card", d=3.4, note="Name card"),
]


def gain_for(src, ss, d, target=-21.0):
    r = subprocess.run([FFMPEG, "-hide_banner", "-ss", str(ss), "-t", str(d), "-i", str(src),
                        "-af", "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"mean_volume: (-?[\d.]+) dB", r.stderr)
    return max(-6.0, min(14.0, target - float(m.group(1)))) if m else 0.0


def composed(k, label_in, label_out):
    """True-aspect clip, fitted to height, over a blurred darkened copy of itself."""
    pre = (UPRIGHT[k] + ",") if k in UPRIGHT else ""
    return (f"[{label_in}]{pre}fps={FPS},{GRADE[k]},split[a][b];"
            f"[a]scale=480:270:force_original_aspect_ratio=increase,crop=480:270,gblur=sigma=9,"
            f"scale={W}:{H}:flags=bilinear,eq=brightness=-0.32:saturation=0.8[bg];"
            f"[b]scale=-2:{H}:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0,setsar=1,format=yuv420p[{label_out}]")


def seg_args(s):
    out = SEG / f"{s['id']}.mkv"
    d = s["d"]
    enc = ["-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", FPS,
           "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-t", d, out]
    kind = s.get("kind", "clip")
    if kind == "clip":
        k, ss = s["k"], s["ss"]
        src = SOURCES[k]
        g = gain_for(src, ss, d)
        ins = ["-ss", ss, "-t", d + 0.2, "-i", src]
        if s.get("label"):
            parts = [composed(k, "0:v", "base")]
            ins += ["-loop", 1, "-t", d + 0.2, "-i", OV / f"label_{s['id']}.png"]
            parts.append(f"[1:v]format=rgba,fade=t=in:st=0.25:d=0.3:alpha=1,fade=t=out:st={d - 0.35:.2f}:d=0.3:alpha=1[lab]")
            parts.append("[base][lab]overlay=0:'18*pow(max(0\\,1-(t-0.25)/0.45)\\,3)':shortest=1,format=yuv420p[v]")
        else:
            parts = [composed(k, "0:v", "v")]
        parts.append(f"[0:a]aresample=48000,aformat=channel_layouts=stereo,volume={g:.1f}dB,"
                     f"afade=t=in:d=0.05,afade=t=out:st={max(d - 0.08, 0):.2f}:d=0.08[a]")
        return ins + ["-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]"] + enc
    if kind == "recap":
        ins, parts, chain = [], [], ""
        n = len(s["shots"])
        for i, (k, ss) in enumerate(s["shots"]):
            ins += ["-ss", ss, "-t", 0.6, "-i", SOURCES[k]]
            parts.append(composed(k, f"{i}:v", f"t{i}") + f";[t{i}]trim=duration={d / n:.3f},setpts=PTS-STARTPTS[c{i}]")
            chain += f"[c{i}]"
        parts.append(f"{chain}concat=n={n}:v=1:a=0[v]")
        parts.append(f"aevalsrc='0.35*sin(2*PI*(180*t+260*t*t))*min(1,t/1.2)':d={d}:s=48000:c=stereo,afade=t=out:st={d - 0.12:.2f}:d=0.12[a]")
        return ins + ["-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]"] + enc
    # card
    ins = ["-f", "lavfi", "-t", d, "-i", f"color=c=black:s={W}x{H}:r={FPS}", "-loop", 1, "-t", d, "-i", OV / "card.png"]
    parts = ["[1:v]format=rgba,fade=t=in:st=0.3:d=0.6:alpha=1[c]",
             "[0:v][c]overlay=0:'14*pow(max(0\\,1-(t-0.3)/0.7)\\,3)':shortest=1,format=yuv420p[v]",
             "aevalsrc='0.9*sin(2*PI*52*t)*exp(-3.2*t)+0.25*sin(2*PI*104*t)*exp(-6*t)':d=1.6:s=48000:c=stereo,"
             f"adelay=300|300,apad=whole_dur={d},afade=t=out:st={d - 0.6:.2f}:d=0.6[a]"]
    return ins + ["-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]"] + enc


def main():
    for s in EDL:
        run(seg_args(s))
        print("segment", s["id"])
    inputs, vf, af = [], [], []
    for s in EDL:
        inputs += ["-i", SEG / f"{s['id']}.mkv"]
    length = EDL[0]["d"]
    pv, pa = "0:v", "0:a"
    starts = [0.0]
    for i in range(1, len(EDL)):
        tr, td = EDL[i - 1]["join"]
        off = length - td
        vf.append(f"[{pv}][{i}:v]xfade=transition={tr}:duration={td}:offset={off:.3f}[v{i}]")
        af.append(f"[{pa}][{i}:a]acrossfade=d={td}:c1=tri:c2=tri[a{i}]")
        pv, pa = f"v{i}", f"a{i}"
        starts.append(off)
        length = off + EDL[i]["d"]
    vf.append(f"[{pv}]format=yuv420p[vout]")
    af.append(f"[{pa}]loudnorm=I=-16:TP=-1.5:LRA=9[aout]")
    full = MEDIA / "showreel-1080.mp4"
    run(inputs + ["-filter_complex", ";".join(vf + af), "-map", "[vout]", "-map", "[aout]",
                  "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-r", FPS,
                  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", full])
    run(["-i", full, "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", MEDIA / "showreel.mp4"])
    # ambient hero loop: whole reel, small, silent
    run(["-i", full, "-an", "-vf", "scale=960:-2,fps=24", "-c:v", "libx264", "-preset", "slow", "-crf", "30",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", MEDIA / "hero-loop.mp4"])
    run(["-ss", 1.0, "-i", full, "-frames:v", 1, "-vf", "scale=1280:-2", "-q:v", 4, MEDIA / "hero.jpg"])
    meta = [dict(id=s["id"], start=round(starts[i], 2), source=s.get("k") or "all", note=s["note"]) for i, s in enumerate(EDL)]
    (ROOT / "tools" / "reel-meta.json").write_text(json.dumps(dict(duration=round(length, 2), segments=meta), indent=2))
    print("reel length", round(length, 2))


if __name__ == "__main__":
    main()
