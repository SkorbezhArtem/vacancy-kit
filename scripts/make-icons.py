"""Tiny helper to produce brand-coloured icon PNGs.

Generates a rounded square with a diagonal indigo→violet gradient and a small
sparkle motif on top. Idempotent — re-running overwrites the four icons in
public/icons/.

Usage: python3 scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ICON_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"
SIZES = (16, 32, 48, 128)

GRADIENT_START = (79, 84, 238)   # brand-500
GRADIENT_END = (139, 92, 246)    # accent-500


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = max(2, size // 5)

    # Gradient bitmap, then mask with rounded rect.
    grad = Image.new("RGBA", (size, size))
    grad_px = grad.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1) or 1)
            r, g, b = lerp(GRADIENT_START, GRADIENT_END, t)
            grad_px[x, y] = (r, g, b, 255)

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    img.paste(grad, (0, 0), mask)

    # Sparkle: two stacked diamonds.
    cx, cy = size / 2, size / 2
    r1 = size * 0.28
    r2 = size * 0.10
    draw.polygon(
        [(cx, cy - r1), (cx + r1 * 0.55, cy), (cx, cy + r1), (cx - r1 * 0.55, cy)],
        fill=(255, 255, 255, 235),
    )
    if size >= 32:
        cx2, cy2 = cx + r1 * 0.7, cy - r1 * 0.55
        draw.polygon(
            [(cx2, cy2 - r2), (cx2 + r2 * 0.55, cy2), (cx2, cy2 + r2), (cx2 - r2 * 0.55, cy2)],
            fill=(255, 255, 255, 230),
        )

    return img


def main() -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        out = ICON_DIR / f"icon{size}.png"
        render(size).save(out, format="PNG", optimize=True)
        print(f"wrote {out}")


if __name__ == "__main__":
    main()
