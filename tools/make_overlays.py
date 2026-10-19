"""Renders the showreel's lower-third labels and end card as transparent PNGs."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

OUT = Path(__file__).parent / "_ov"
OUT.mkdir(exist_ok=True)
W, H = 1920, 1080
RED = (228, 38, 26, 255)
WHITE = (255, 255, 255, 255)
FONT = r"C:\Windows\Fonts\bahnschrift.ttf"

def font(size, bold=True):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([700 if bold else 400, 100])
    except Exception:
        pass
    return f

LABELS = {
    "A": ("01", "Cinematic / Lyrical Edit"),
    "F": ("02", "Character-Driven Cinematic Edit"),
    "I1": ("03", "Animated Wedding Invitation"),
    "J1": ("04", "Educational / Talking-Head Edit"),
    "K1": ("05", "Commercial / Promotional Video"),
    "L1": ("06", "Event / Corporate Highlight"),
}
for key, (num, title) in LABELS.items():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for layer, d in ((shadow, ImageDraw.Draw(shadow)), (img, ImageDraw.Draw(img))):
        fill = (0, 0, 0, 230) if layer is shadow else WHITE
        d.text((96, 118), title, font=font(44), fill=fill)
        d.text((96, 70), num, font=font(30), fill=(0, 0, 0, 230) if layer is shadow else RED)
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    out = Image.alpha_composite(shadow, img)
    ImageDraw.Draw(out).rectangle([96, 54, 150, 58], fill=RED)
    out.save(OUT / f"label_{key}.png")

card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(card)
name = "PUSHKAR RAJ SINGH"
f = font(150)
tw = sum(d.textlength(c, font=f) for c in name) + 5 * (len(name) - 1)
x = (W - tw) / 2
for c in name:
    d.text((x, 380), c, font=f, fill=WHITE)
    x += d.textlength(c, font=f) + 5
d.rectangle([W / 2 - 70, 600, W / 2 + 70, 608], fill=RED)
d.text((W / 2, 690), "Video Editor", font=font(58, bold=False), fill=(255, 255, 255, 230), anchor="mm")
card.save(OUT / "card.png")
print("overlays ok")
