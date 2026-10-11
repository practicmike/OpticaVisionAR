"""build_catalog.py - genera las variantes GLB del armazón Wayfarer.

Uso:  python3 build_catalog.py [carpeta_salida]
"""
import io
import json
import os
import sys
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image

from meshlib import finalize, triplanar_uv, mirror_x, xform
from glbwriter import GLB
import wayfarer as W


# ------------------------------------------------------------------ materiales
def acetate(rgb, rough=0.22, texture=None):
    pbr = {"baseColorFactor": [*rgb, 1.0], "metallicFactor": 0.0, "roughnessFactor": rough}
    if texture is not None:
        pbr["baseColorTexture"] = {"index": texture}
        pbr["baseColorFactor"] = [1, 1, 1, 1]
    return {"pbrMetallicRoughness": pbr,
            "extensions": {"KHR_materials_clearcoat": {"clearcoatFactor": 1.0, "clearcoatRoughnessFactor": 0.04}}}


def lens_mat(rgba):
    return {"pbrMetallicRoughness": {"baseColorFactor": list(rgba), "metallicFactor": 0.0, "roughnessFactor": 0.04},
            "alphaMode": "BLEND", "doubleSided": False}


METAL = {"pbrMetallicRoughness": {"baseColorFactor": [0.74, 0.75, 0.78, 1.0], "metallicFactor": 0.95, "roughnessFactor": 0.30}}
METAL_DARK = {"pbrMetallicRoughness": {"baseColorFactor": [0.03, 0.03, 0.035, 1.0], "metallicFactor": 0.6, "roughnessFactor": 0.45}}

VARIANTS = [
    dict(id="negro_humo", label="Negro brillante / lente humo",
         frame=dict(rgb=(0.016, 0.016, 0.019), rough=0.20), lens=(0.09, 0.09, 0.10, 0.80)),
    dict(id="carey_cafe", label="Carey (tortuga) / lente café",
         frame=dict(texture=True, rough=0.24), lens=(0.22, 0.13, 0.06, 0.70)),
    dict(id="azul_marino_cristal", label="Azul marino / lente transparente (graduado)",
         frame=dict(rgb=(0.025, 0.055, 0.15), rough=0.20), lens=(0.82, 0.90, 0.94, 0.10)),
    dict(id="vino_verde", label="Vino / lente verde",
         frame=dict(rgb=(0.20, 0.018, 0.045), rough=0.20), lens=(0.06, 0.19, 0.11, 0.78)),
]


def tortoise_png(size=1024, seed=11):
    rng = np.random.default_rng(seed)

    def noise(sig):
        n = gaussian_filter(rng.standard_normal((size, size)), sig, mode="wrap")
        return (n - n.mean()) / n.std()

    a, b, c = noise(26), noise(9), noise(55)
    sm = lambda lo, hi, x: np.clip((x - lo) / (hi - lo), 0, 1) ** 2 * (3 - 2 * np.clip((x - lo) / (hi - lo), 0, 1))
    dark = sm(0.1, 1.0, 0.85 * a + 0.35 * b)
    light = sm(0.2, 1.1, c)
    amber = np.array([0.50, 0.24, 0.06])
    honey = np.array([0.80, 0.50, 0.17])
    brown = np.array([0.14, 0.05, 0.025])
    col = amber[None, None] * (1 - light[..., None]) + honey[None, None] * light[..., None]
    col = col * (1 - dark[..., None]) + brown[None, None] * dark[..., None]
    img = Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8), "RGB")
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue(), img


# --------------------------------------------------------------------- export
def prim(mesh, material, uv_fn=None):
    P_, N_, UV, I = finalize(*mesh, uv_fn=uv_fn)
    return dict(P=P_, N=N_, UV=UV, I=I, material=material)


def export_variant(model, var, path, png=None):
    g = GLB("Claude procedural wayfarer")
    use_tex = bool(var["frame"].get("texture"))
    tex = g.add_texture_png(png) if use_tex else None
    fr = var["frame"]
    m_ace = g.add_material("acetato", acetate(fr.get("rgb", (1, 1, 1)), fr.get("rough", 0.22), tex))
    m_lens = g.add_material("lente", lens_mat(var["lens"]))
    m_met = g.add_material("metal", METAL)
    m_dark = g.add_material("metal_oscuro", METAL_DARK)
    uvfn = triplanar_uv() if use_tex else None

    info = model["info"]
    root = g.add_node("wayfarer_" + var["id"], extras={
        "units": "meters", "axes": "+Y arriba, +Z frente, origen en el centro del puente",
        "label": var["label"], "lod": model["level"], **{k: float(v) for k, v in info.items()},
        "note": "temple_L (+X) y temple_R (-X) giran en Y sobre su pivote (bisagra); L/R = lado de quien usa el armazón. Las anclas son referencias aproximadas."})

    front_mesh = g.add_mesh("frente", [prim(model["front_acetate"], m_ace, uvfn), prim(model["front_lens"], m_lens)])
    g.add_node("frente", mesh=front_mesh, parent=root)

    piv = model["pivot"]

    def temple(side):
        acet = (model["temple_acetate"], model["temple_metal"], model["temple_dark"])
        if side == "L":
            acet = tuple(mirror_x(m) for m in acet)
        # el uv triplanar usa coordenadas locales: se desplaza por el pivote para que ambos lados casen con el frente
        sign = 1 if side == "R" else -1
        off = piv * np.array([sign, 1, 1])
        def uvf(P_, N_):
            return uvfn(P_ + off, N_)
        prims = [prim(acet[0], m_ace, uvf if use_tex else None), prim(acet[1], m_met), prim(acet[2], m_dark)]
        anat = "L" if sign == 1 else "R"      # +X = lado izquierdo de quien usa el armazón
        mesh = g.add_mesh("varilla_" + anat, prims)
        g.add_node("temple_" + anat, mesh=mesh, translation=piv * np.array([sign, 1, 1]), parent=root)

    temple("R")
    temple("L")
    g.add_node("anchor_nose_rest", translation=model["nose"], parent=root,
               extras={"desc": "punto aproximado de apoyo en el puente nasal (alinear con landmark 168/6 de MediaPipe)"})
    for side, sign in (("R", 1), ("L", -1)):
        g.add_node("anchor_ear_" + ("L" if sign == 1 else "R"), translation=model["ear"] * np.array([sign, 1, 1]), parent=root,
                   extras={"desc": "inicio de la curva retroauricular de la varilla (aprox.)"})
    return g.save(path)


def main(out):
    os.makedirs(out, exist_ok=True)
    png, img = tortoise_png()
    img.resize((512, 512)).save(os.path.join(out, "textura_carey_preview.png"))
    hd = W.build_model("hd")
    lite = W.build_model("lite")
    report = {"measures": {k: float(v) for k, v in hd["info"].items()}, "files": []}
    for v in VARIANTS:
        p = os.path.join(out, f"wayfarer_{v['id']}.glb")
        size = export_variant(hd, v, p, png)
        report["files"].append({"file": os.path.basename(p), "bytes": size, "lod": "hd", "label": v["label"]})
        print(f"{os.path.basename(p):42s} {size/1024:8.0f} KB")
    p = os.path.join(out, "wayfarer_negro_humo_lite.glb")
    size = export_variant(lite, VARIANTS[0], p)
    report["files"].append({"file": os.path.basename(p), "bytes": size, "lod": "lite", "label": VARIANTS[0]["label"]})
    print(f"{os.path.basename(p):42s} {size/1024:8.0f} KB")
    json.dump(report, open(os.path.join(out, "catalogo.json"), "w"), indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "out")
