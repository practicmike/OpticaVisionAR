"""render.py - lee un .glb y lo rasteriza (z-buffer, numpy) para revisar el resultado sin motor 3D."""
import json
import struct
import sys
import numpy as np
from PIL import Image


def read_glb(path):
    data = open(path, "rb").read()
    magic, ver, total = struct.unpack("<4sII", data[:12])
    assert magic == b"glTF" and ver == 2 and total == len(data), "cabecera GLB inválida"
    off = 12
    j = bn = None
    while off < len(data):
        ln, typ = struct.unpack("<I4s", data[off:off + 8])
        chunk = data[off + 8: off + 8 + ln]
        if typ == b"JSON":
            j = json.loads(chunk)
        elif typ == b"BIN\x00":
            bn = chunk
        off += 8 + ln
    return j, bn


def accessor(j, bn, i):
    a = j["accessors"][i]
    bv = j["bufferViews"][a["bufferView"]]
    dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}[a["componentType"]]
    nc = {"SCALAR": 1, "VEC2": 2, "VEC3": 3}[a["type"]]
    arr = np.frombuffer(bn, dtype=dt, count=a["count"] * nc, offset=bv["byteOffset"] + a.get("byteOffset", 0))
    return arr.reshape(-1, nc) if nc > 1 else arr


def gather(j, bn):
    """Devuelve lista de (P, N, I, color, alpha, metal) en espacio mundo."""
    out = []

    def walk(ni, T):
        n = j["nodes"][ni]
        t = T + np.array(n.get("translation", [0, 0, 0]))
        if "mesh" in n:
            for p in j["meshes"][n["mesh"]]["primitives"]:
                P = accessor(j, bn, p["attributes"]["POSITION"]).astype(float) + t
                N = accessor(j, bn, p["attributes"]["NORMAL"]).astype(float)
                I = accessor(j, bn, p["indices"]).astype(np.int64).reshape(-1, 3)
                m = j["materials"][p["material"]]
                pbr = m["pbrMetallicRoughness"]
                col = np.array(pbr["baseColorFactor"][:3])
                alpha = pbr["baseColorFactor"][3] if m.get("alphaMode") == "BLEND" else 1.0
                tex = None
                if "baseColorTexture" in pbr and "TEXCOORD_0" in p["attributes"]:
                    ti = j["textures"][pbr["baseColorTexture"]["index"]]["source"]
                    im = j["images"][ti]
                    bv = j["bufferViews"][im["bufferView"]]
                    import io
                    img = Image.open(io.BytesIO(bn[bv["byteOffset"]: bv["byteOffset"] + bv["byteLength"]])).convert("RGB")
                    tex = (np.asarray(img) / 255.0, accessor(j, bn, p["attributes"]["TEXCOORD_0"]).astype(float))
                out.append(dict(P=P, N=N, I=I, col=col, alpha=alpha, metal=pbr.get("metallicFactor", 0),
                                rough=pbr.get("roughnessFactor", 0.5), tex=tex, name=m.get("name", "")))
        for c in n.get("children", []):
            walk(c, t)

    for r in j["scenes"][0]["nodes"]:
        walk(r, np.zeros(3))
    return out


def look_at(eye, target, up=(0, 1, 0)):
    f = np.asarray(target, float) - eye
    f /= np.linalg.norm(f)
    r = np.cross(f, up)
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    return np.stack([r, u, f])   # filas: derecha, arriba, adelante


def render(prims, eye, target, W=1100, H=620, fov_scale=0.0, ortho_h=0.17, persp=0.0, bg=(0.93, 0.94, 0.96)):
    R = look_at(np.asarray(eye, float), target)
    img = np.ones((H, W, 3)) * np.array(bg)
    # degradado suave de fondo
    img *= (1.0 - 0.10 * np.linspace(0, 1, H))[:, None, None]
    zbuf = np.full((H, W), np.inf)
    scale = H / ortho_h
    light_dirs = [(np.array([-0.45, 0.65, 0.62]), 0.85), (np.array([0.7, 0.2, 0.5]), 0.30), (np.array([0.0, -0.3, -0.8]), 0.18)]
    light_dirs = [(d / np.linalg.norm(d), w) for d, w in light_dirs]
    view_dir = R[2]

    def project(P):
        Pc = (P - eye) @ R.T
        x = Pc[:, 0] * scale + W / 2
        y = H / 2 - Pc[:, 1] * scale
        return x, y, Pc[:, 2]

    order = sorted(prims, key=lambda p: p["alpha"] < 1.0)   # opacos primero
    for p in order:
        x, y, z = project(p["P"])
        Nw = p["N"]
        for tri in p["I"]:
            i0, i1, i2 = tri
            x0, y0, x1, y1, x2, y2 = x[i0], y[i0], x[i1], y[i1], x[i2], y[i2]
            area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
            if abs(area) < 1e-9:
                continue
            # cara trasera: en pantalla (y hacia abajo) un triángulo antihorario en 3D da área negativa
            front = area < 0
            if p["alpha"] >= 1.0 and not front:
                continue
            minx = int(max(np.floor(min(x0, x1, x2)), 0)); maxx = int(min(np.ceil(max(x0, x1, x2)), W - 1))
            miny = int(max(np.floor(min(y0, y1, y2)), 0)); maxy = int(min(np.ceil(max(y0, y1, y2)), H - 1))
            if minx > maxx or miny > maxy:
                continue
            xs, ys = np.meshgrid(np.arange(minx, maxx + 1) + 0.5, np.arange(miny, maxy + 1) + 0.5)
            w0 = ((x1 - xs) * (y2 - ys) - (x2 - xs) * (y1 - ys)) / area
            w1 = ((x2 - xs) * (y0 - ys) - (x0 - xs) * (y2 - ys)) / area
            w2 = 1 - w0 - w1
            m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
            if not m.any():
                continue
            zz = w0 * z[i0] + w1 * z[i1] + w2 * z[i2]
            sub = zbuf[miny:maxy + 1, minx:maxx + 1]
            vis = m & (zz < sub)
            if not vis.any():
                continue
            n = (w0[..., None] * Nw[i0] + w1[..., None] * Nw[i1] + w2[..., None] * Nw[i2])
            n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-9)
            if p["alpha"] < 1.0 and not front:
                n = -n
            diff = sum(w * np.clip(n @ d, 0, 1) for d, w in light_dirs)
            hemi = 0.30 + 0.25 * (n[..., 1] * 0.5 + 0.5)
            col = p["col"]
            if p["tex"] is not None:
                tx, uv = p["tex"]
                uvp = w0[..., None] * uv[i0] + w1[..., None] * uv[i1] + w2[..., None] * uv[i2]
                h, w_ = tx.shape[:2]
                col = tx[(uvp[..., 1] % 1 * h).astype(int) % h, (uvp[..., 0] % 1 * w_).astype(int) % w_]
            else:
                col = np.broadcast_to(col, n.shape)
            hv = view_dir * -1
            half = np.array([-0.45, 0.65, 0.62]); half = half / np.linalg.norm(half) + hv; half /= np.linalg.norm(half)
            spec_pow = 8 + (1 - p["rough"]) * 220
            spec = np.clip(n @ half, 0, 1) ** spec_pow * (0.55 if p["metal"] < 0.5 else 0.9)
            if p["metal"] > 0.5:
                shaded = col * (0.35 + 0.55 * diff)[..., None] + (spec * 0.8)[..., None]
            else:
                shaded = col * (hemi + 0.62 * diff)[..., None] + spec[..., None]
            shaded = np.clip(shaded, 0, 1) ** (1 / 1.0)
            region = img[miny:maxy + 1, minx:maxx + 1]
            if p["alpha"] >= 1.0:
                region[vis] = shaded[vis]
                sub[vis] = zz[vis]
            else:
                a = p["alpha"]
                region[vis] = region[vis] * (1 - a) + shaded[vis] * a
    return img


def save(img, path):
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path)


if __name__ == "__main__":
    glb = sys.argv[1]
    out = sys.argv[2]
    j, bn = read_glb(glb)
    prims = gather(j, bn)
    views = {
        "frente": dict(eye=(0, 0.005, 0.6), target=(0, 0.002, 0), ortho_h=0.075),
        "tres_cuartos": dict(eye=(0.35, 0.18, 0.40), target=(0, -0.003, -0.05), ortho_h=0.125),
        "lateral": dict(eye=(0.7, 0.01, -0.06), target=(0, 0.0, -0.065), ortho_h=0.105),
        "superior": dict(eye=(0, 0.7, -0.07), target=(0, 0, -0.065), ortho_h=0.185),
    }
    which = sys.argv[3:] or list(views)
    for k in which:
        v = views[k]
        img = render(prims, np.array(v["eye"]), np.array(v["target"]), ortho_h=v["ortho_h"])
        save(img, f"{out}_{k}.png")
        print("ok", k)
