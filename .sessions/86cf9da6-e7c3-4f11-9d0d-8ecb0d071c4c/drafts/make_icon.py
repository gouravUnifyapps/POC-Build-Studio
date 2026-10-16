import math, sys
from PIL import Image, ImageDraw, ImageFilter
S = 4096; OUT = 1024
# diagonal gradient: deep indigo (top-left) -> violet (bottom-right)
g = Image.new("RGB", (2, 2))
g.putpixel((0, 0), (46, 26, 120)); g.putpixel((1, 0), (74, 44, 170))
g.putpixel((0, 1), (60, 36, 150)); g.putpixel((1, 1), (124, 58, 237))
bg = g.resize((S, S), Image.BILINEAR)
img = bg.convert("RGBA")
# soft glow top-left
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((-S*0.25, -S*0.3, S*0.75, S*0.6), fill=(255, 255, 255, 0))
img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(S*0.08)))
d = ImageDraw.Draw(img)
# speech bubble
bx0, by0, bx1, by1 = S*0.17, S*0.20, S*0.83, S*0.70
shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle((bx0, by0+S*0.03, bx1, by1+S*0.03), radius=S*0.15, fill=(10, 5, 40, 110))
sd.polygon([(S*0.30, by1-S*0.02+S*0.03), (S*0.27, S*0.85+S*0.03), (S*0.46, by1-S*0.02+S*0.03)], fill=(10, 5, 40, 110))
img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(S*0.025)))
d = ImageDraw.Draw(img)
white = (255, 255, 255, 255)
d.rounded_rectangle((bx0, by0, bx1, by1), radius=S*0.15, fill=white)
d.polygon([(S*0.30, by1-S*0.02), (S*0.27, S*0.85), (S*0.46, by1-S*0.02)], fill=white)
# sparkle polygon
def sparkle(cx, cy, r, p=2.7, n=720):
    pts = []
    for i in range(n):
        t = 2*math.pi*i/n
        c, s = math.cos(t), math.sin(t)
        pts.append((cx + r*math.copysign(abs(c)**p, c), cy + r*math.copysign(abs(s)**p, s)))
    return pts
# gradient-filled main sparkle inside the bubble
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).polygon(sparkle(S*0.50, S*0.45, S*0.19), fill=255)
fill = g.resize((S, S), Image.BILINEAR).convert("RGBA")
img.paste(fill, (0, 0), mask)
# small accent sparkles (white, outside bubble, top-right)
d = ImageDraw.Draw(img)
d.polygon(sparkle(S*0.82, S*0.16, S*0.075), fill=white)
# three gate dots bottom-right: G1 G2 G3 ascending
for i, (x, a) in enumerate([(0.62, 140), (0.71, 200), (0.80, 255)]):
    r = S*0.032
    y = S*(0.86 - i*0.025)
    d.ellipse((S*x-r, y-r, S*x+r, y+r), fill=(255, 255, 255, a))
img = img.convert("RGB").resize((OUT, OUT), Image.LANCZOS)
img.save(sys.argv[1])
# preview strip at Slack sizes
prev = Image.new("RGB", (512+192+72+36+80, 540), (255, 255, 255))
x = 16
for sz in (512, 192, 72, 36):
    im = img.resize((sz, sz), Image.LANCZOS)
    m = Image.new("L", (sz, sz), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, sz-1, sz-1), radius=sz*0.22, fill=255)
    prev.paste(im, (x, 14), m); x += sz + 16
prev.save(sys.argv[2])
