"""Re-export character portraits with enough torso to show name tags."""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets" / "characters"
MEDIC_SRC = Path(
    r"C:\Users\leato\.cursor\projects\c-Users-leato-OneDrive-Desktop-CodeProjects-EMT\assets"
    r"\c__Users_leato_OneDrive_Desktop_CodeProjects_EMT_assets_characters_medic.png"
)
# Prefer a full original if the user re-drops it as md-source.png
MD_CANDIDATES = [
    ROOT / "md-source.png",
    ROOT / "md-original.png",
    Path.home() / "Downloads" / "md.png",
    Path(
        r"C:\Users\leato\.cursor\projects\c-Users-leato-OneDrive-Desktop-CodeProjects-EMT\assets"
        r"\c__Users_leato_OneDrive_Desktop_CodeProjects_EMT_assets_characters_md.png"
    ),
]


def punch(im: Image.Image, thr: int = 22) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    lum = arr[:, :, :3].max(axis=2)
    arr[lum < thr, 3] = 0
    return Image.fromarray(arr, "RGBA")


def trim(im: Image.Image) -> Image.Image:
    arr = np.asarray(im)
    ys, xs = np.where(arr[:, :, 3] > 10)
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def export_portrait(src: Path, dest: Path, keep_frac: float = 0.98, target_w: int = 560) -> None:
    im = punch(Image.open(src))
    im = trim(im)
    w, h = im.size
    im = im.crop((0, 0, w, max(1, int(h * keep_frac))))
    im = trim(im)
    nh = int(im.height * target_w / im.width)
    im = im.resize((target_w, nh), Image.Resampling.LANCZOS)
    im.save(dest, optimize=True)
    print(f"wrote {dest.name} {im.size} bytes={dest.stat().st_size}")


def main() -> None:
    if MEDIC_SRC.exists():
        export_portrait(MEDIC_SRC, ROOT / "medic.png", keep_frac=0.85, target_w=560)
    else:
        print("medic source missing")

    md_src = next((p for p in MD_CANDIDATES if p.exists()), None)
    if md_src:
        # Through name badge; not full lower torso.
        export_portrait(md_src, ROOT / "md.png", keep_frac=0.72, target_w=560)
    else:
        print(
            "No full Lauren source found. Drop the original as assets/characters/md-source.png "
            "and re-run, or re-add md.png."
        )

    disappointed_src = next(
        (
            p
            for p in [
                ROOT / "md_dispointed-source.png",
                Path(
                    r"C:\Users\leato\.cursor\projects\c-Users-leato-OneDrive-Desktop-CodeProjects-EMT\assets"
                    r"\c__Users_leato_OneDrive_Desktop_CodeProjects_EMT_assets_characters_md_dispointed.png"
                ),
                ROOT / "md_dispointed.png",
            ]
            if p.exists()
        ),
        None,
    )
    if disappointed_src:
        export_portrait(disappointed_src, ROOT / "md_dispointed.png", keep_frac=0.72, target_w=560)
    else:
        print("md_dispointed source missing — skip")


if __name__ == "__main__":
    main()
