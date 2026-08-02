"""Extract named icons from the cleaner black-background icon pack."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "icon-pack.png"
OUT = ROOT / "assets" / "icons"
PREVIEW = ROOT / "assets" / "_preview"

# Single-blob → filename (from contact-sheet QA on this pack).
NAME_MAP: dict[int, str] = {
    0: "app-logo",
    1: "ambulance",
    2: "training-shield",
    3: "streak",
    4: "trophy",
    5: "badge",
    6: "challenge",
    7: "message",
    8: "user-avatar",
    9: "dropdown",
    10: "medical-mascot",
    14: "standard",
    15: "exam",
    16: "medical",
    17: "peds",
    18: "ob",
    19: "mci",
    20: "arrow-right",
    21: "locked",
    22: "trauma-mascot",
    23: "unlocked",
    24: "check",
    25: "cancel",
    26: "trauma",
    27: "peds-mascot",
    28: "ob-mascot",
    29: "mci-mascot",
    30: "info",
    31: "settings",
    32: "home",
    33: "back",
    34: "star-outline",
    35: "mode",
    41: "scenario",
    42: "answer",
    43: "level-up",
    44: "progress",
    45: "leaderboard",
    46: "calendar",
    47: "time",
    48: "favorite",
    54: "step-1",
    55: "step-2",
    56: "step-3",
    57: "step-4",
    58: "step-5",
    59: "step-6",
    71: "medic-mascot",
    72: "pilot-mascot",
    73: "firefighter-mascot",
    74: "officer-mascot",
}

# Multi-blob merges (indices that should be unioned into one export).
MERGES: dict[str, list[int]] = {
    "coach": [11, 12, 13],
    "random-mascot": [85, 86],
}

# Blobs whose sheet crop includes a filename label under the art — trim bottom %.
LABEL_TRIM: dict[int, float] = {
    71: 0.18,
    72: 0.18,
    73: 0.18,
    74: 0.18,
}

KEEP_ONLY_NAMED = True


def find_boxes(mask: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    boxes: list[tuple[int, int, int, int, int]] = []
    for y in range(h):
        row = mask[y]
        for x in range(w):
            if not row[x] or visited[y, x]:
                continue
            stack = [(x, y)]
            visited[y, x] = True
            minx = maxx = x
            miny = maxy = y
            count = 0
            while stack:
                cx, cy = stack.pop()
                count += 1
                if cx < minx:
                    minx = cx
                if cx > maxx:
                    maxx = cx
                if cy < miny:
                    miny = cy
                if cy > maxy:
                    maxy = cy
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((nx, ny))
            bw = maxx - minx + 1
            bh = maxy - miny + 1
            if count < 180 or bw < 18 or bh < 18:
                continue
            if bw > 220 or bh > 220:
                continue
            if bw > 160 and bh < 40:
                continue
            boxes.append((minx, miny, maxx + 1, maxy + 1, count))
    boxes.sort(key=lambda b: (b[1] // 40, b[0]))
    return boxes


def punch_bg(im: Image.Image, threshold: int = 18) -> Image.Image:
    arr = np.asarray(im).convert("RGBA") if False else np.asarray(im)
    arr = np.array(im.convert("RGBA"))
    lum = arr[:, :, :3].max(axis=2)
    arr = arr.copy()
    arr[lum < threshold, 3] = 0
    return Image.fromarray(arr, "RGBA")


def pad_square(im: Image.Image, pad: int = 12) -> Image.Image:
    arr = np.asarray(im)
    ys, xs = np.where(arr[:, :, 3] > 8)
    if len(xs) == 0:
        return im
    im = im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    w, h = im.size
    side = max(w, h) + pad * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return canvas


def export_crop(sheet: Image.Image, box: tuple[int, int, int, int], trim_bottom: float = 0) -> Image.Image:
    x0, y0, x1, y1 = box
    if trim_bottom > 0:
        y1 = y0 + int((y1 - y0) * (1 - trim_bottom))
    crop = punch_bg(sheet.crop((x0, y0, x1, y1)))
    return pad_square(crop).resize((512, 512), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob("*.png"):
        p.unlink()

    if not SRC.exists():
        raise SystemExit(f"Missing icon pack at {SRC}")
    sheet = Image.open(SRC).convert("RGBA")
    arr = np.asarray(sheet)
    lum = arr[:, :, :3].max(axis=2)
    mask = lum > 22
    mask[640:, :280] = False
    mask[655:, :] = False

    boxes = find_boxes(mask)
    print(f"found {len(boxes)} blobs")

    annotated = sheet.copy()
    draw = ImageDraw.Draw(annotated)
    for i, (x0, y0, x1, y1, _) in enumerate(boxes):
        draw.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(0, 255, 180, 255), width=1)
        label = NAME_MAP.get(i, str(i))
        draw.text((x0 + 2, max(0, y0 - 11)), label[:14], fill=(255, 255, 0, 255))
    annotated.save(PREVIEW / "blobs.png")

    used_indices: set[int] = set()
    exported: list[tuple[str, Image.Image]] = []

    # Merges first
    for name, idxs in MERGES.items():
        xs0, ys0, xs1, ys1 = [], [], [], []
        for i in idxs:
            x0, y0, x1, y1, _ = boxes[i]
            xs0.append(x0)
            ys0.append(y0)
            xs1.append(x1)
            ys1.append(y1)
            used_indices.add(i)
        box = (min(xs0), min(ys0), max(xs1), max(ys1))
        out = export_crop(sheet, box)
        out.save(OUT / f"{name}.png")
        exported.append((name, out))
        print(f"MERGE {name:22s} {box} from {idxs}")

    # Named singles
    for i, (x0, y0, x1, y1, count) in enumerate(boxes):
        if i in used_indices:
            continue
        name = NAME_MAP.get(i)
        if name is None:
            if KEEP_ONLY_NAMED:
                continue
            name = f"blob-{i:02d}"
        used_indices.add(i)
        out = export_crop(sheet, (x0, y0, x1, y1), trim_bottom=LABEL_TRIM.get(i, 0))
        out.save(OUT / f"{name}.png")
        exported.append((name, out))
        print(f"{i:02d} {name:22s} {(x0, y0, x1, y1)} px={count}")

    # Random category icon — no shuffle glyph in this pack; reuse dice art.
    random_mascot = OUT / "random-mascot.png"
    if random_mascot.exists():
        Image.open(random_mascot).save(OUT / "random.png")
        print("COPY random-mascot -> random (no shuffle icon in pack)")

    # Contact of named exports only
    exported.sort(key=lambda t: t[0])
    cols = 8
    rows = max(1, (len(exported) + cols - 1) // cols)
    contact = Image.new("RGBA", (cols * 150, rows * 170), (8, 8, 12, 255))
    cdraw = ImageDraw.Draw(contact)
    for i, (name, im) in enumerate(exported):
        r, c = divmod(i, cols)
        thumb = im.resize((120, 120), Image.Resampling.LANCZOS)
        x, y = c * 150 + 15, r * 170 + 10
        contact.paste(thumb, (x, y), thumb)
        cdraw.text((x, y + 122), name[:18], fill=(180, 220, 255, 255))
    # also show random if copied
    if (OUT / "random.png").exists() and "random" not in {n for n, _ in exported}:
        im = Image.open(OUT / "random.png")
        i = len(exported)
        r, c = divmod(i, cols)
        # grow canvas if needed — simpler: just save separately
        im.resize((120, 120)).save(PREVIEW / "random-thumb.png")

    contact.save(PREVIEW / "contact-named.png")
    print(f"wrote {len(list(OUT.glob('*.png')))} files -> {OUT}")
    print(f"QA: {PREVIEW / 'contact-named.png'}")


if __name__ == "__main__":
    main()
