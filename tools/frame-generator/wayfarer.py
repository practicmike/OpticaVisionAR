"""wayfarer.py - armazón estilo "wayfarer" (acetato, trapezoidal) generado por código.

Diseño genérico de forma clásica; sin logotipos ni marcas.
Sistema de coordenadas del modelo (metros):
    origen  = centro del puente (plano frontal del armazón, z = 0 en x = 0)
    +X      = a la derecha de quien mira el armazón de frente (corresponde al ojo izquierdo de quien lo usa)
    +Y      = arriba
    +Z      = hacia adelante (alejándose de la cara); las varillas se extienden hacia -Z
"""
import numpy as np
from meshlib import *

# ------------------------------------------------------------------ parámetros
P = dict(
    lens_half_w=0.02525,      # semiancho de la abertura del lente
    lens_half_h=0.0215,       # semialto de la abertura
    nasal_gap=0.0090,         # distancia del centro al borde nasal de la abertura (DBL/2)
    t_side=0.0046, t_top=0.0079, t_bot=0.0036,   # grosor del aro (lado, ceja, borde inferior)
    half_depth=0.0030,        # semiprofundidad del aro (6 mm)
    kappa=1.0,                # curvatura envolvente: z -= kappa * x^2  (R = 1/(2*kappa) = 0.5 m)
    bridge_y=0.0213, bridge_h=0.0100, bridge_d=0.0055,
    end_center=(0.0653, 0.0228, -0.0045), end_size=(0.0095, 0.0150, 0.0150),
    temple_x=0.0655, temple_y=0.0228, temple_z=-0.0166,
    temple_len=0.134, temple_flare=0.0022,
)


def quality(level):
    if level == "lite":
        return dict(N=96, na=3, lens_rings=4, nseg=12, ell=(14, 8), temple_K=40, arc=3)
    return dict(N=208, na=7, lens_rings=9, nseg=28, ell=(30, 18), temple_K=96, arc=5)


# ------------------------------------------------------------------ contornos
def lens_contour(q):
    a, b = P["lens_half_w"], P["lens_half_h"]
    poly = np.array([
        (-a * 0.97, b * 0.90),    # superior nasal
        (a * 1.00, b * 1.00),     # superior temporal
        (a * 0.96, -b * 0.35),    # lado temporal inferior
        (a * 0.35, -b * 1.00),    # inferior
        (-a * 0.62, -b * 0.86),   # inferior nasal
        (-a * 1.00, -b * 0.10),   # lado nasal
    ])
    radii = [0.0035, 0.0032, 0.0165, 0.0190, 0.0140, 0.0125]
    pts = rounded_polygon(poly, radii, n_arc=34)
    pts = resample_closed(ccw(pts), q["N"])
    pts = smooth_closed(pts, 2)
    cx = P["nasal_gap"] - pts[:, 0].min()
    return pts + np.array([cx, 0.0]), cx


def thickness(normals):
    ny = normals[:, 1]
    t = P["t_side"] + (P["t_top"] - P["t_side"]) * np.clip(ny, 0, 1) ** 1.3 \
        + (P["t_bot"] - P["t_side"]) * np.clip(-ny, 0, 1) ** 1.0
    return t


# --------------------------------------------------------------------- piezas
def build_rim(q):
    I, cx = lens_contour(q)
    n = outward_normals_2d(I)
    t = thickness(n)
    O = I + n * t[:, None]
    hz = P["half_depth"]
    lift = 0.0010 * np.clip(n[:, 1], 0, 1) ** 1.5
    rzs = [0.0009, 0.0013, 0.0006, 0.0006]   # BR(ext-trasero) TR(ext-frontal) TL(int-frontal) BL(int-trasero)
    rt = [np.clip(r / t, 0, 0.45) for r in rzs]
    loops = rrect_loop(0.0, 1.0, -hz, hz, rt, [min(r, hz * 0.9) for r in rzs], na=q["na"])   # (N,P,2)
    tt = loops[..., 0]
    xy = I[:, None, :] + (O - I)[:, None, :] * tt[..., None]
    z = loops[..., 1] + lift[:, None] * tt
    G = np.concatenate([xy, z[..., None]], axis=-1)
    return outward(*loft_torus(G)), I, cx


def build_lens(I, q):
    n = outward_normals_2d(I)
    C = I + n * 0.0005                      # el lente se embebe en el aro
    c = C.mean(axis=0)
    rr = np.linspace(0, 1, q["lens_rings"])
    thick, dome = 0.0016, 0.0006
    zf = lambda r: 0.0002 + thick / 2 + dome * (1 - r ** 2)
    zb = lambda r: 0.0002 - thick / 2 + dome * (1 - r ** 2)
    prof = [(r, zf(r)) for r in rr] + [(1.0, 0.0002 + 0.0001), (1.0, 0.0002 - 0.0001)] + [(r, zb(r)) for r in rr[::-1]]
    prof = np.array(prof)
    N = len(C)
    G = np.zeros((N, len(prof), 3))
    G[:, :, 0] = c[0] + prof[None, :, 0] * (C[:, 0:1] - c[0])
    G[:, :, 1] = c[1] + prof[None, :, 0] * (C[:, 1:2] - c[1])
    G[:, :, 2] = prof[None, :, 1]
    return outward(*loft_torus(G))


def build_bridge(q):
    K = 25
    x = np.linspace(-0.0085, 0.0085, K)
    y = P["bridge_y"] + 0.0008 * (1 - (x / 0.0085) ** 2)
    path = np.stack([x, y, np.zeros(K)], -1)
    T = unit(np.gradient(path, axis=0))
    U = np.tile([0, 0, 1.0], (K, 1))
    V = unit(np.cross(U, T))
    d, h = P["bridge_d"], P["bridge_h"]
    r = 0.0016
    loop = rrect_loop(-d / 2, d / 2, -h / 2, h / 2, [r] * 4, [r] * 4, na=5)
    loops = np.tile(loop, (K, 1, 1))
    return sweep(path, U, V, loops)


def build_endpiece():
    m = rounded_box(P["end_size"], 0.0018, na=5, nz=5)
    return xform(m, t=P["end_center"])


def build_pad(q):
    m = ellipsoid((0.0024, 0.0095, 0.0050), nu=q["ell"][0], nv=q["ell"][1])
    m = xform(m, R=rot_z(np.radians(14)) @ rot_y(np.radians(18)), t=(0.0072, -0.0105, -0.0070))
    return m


def wrap(mesh, kappa=None):
    k = P["kappa"] if kappa is None else kappa
    V, F = mesh
    V = V.copy()
    V[:, 2] -= k * V[:, 0] ** 2
    return V, F


def build_temple(q):
    """Varilla en coordenadas locales: el origen es el pivote de la bisagra. Lado +X."""
    L = P["temple_len"]
    s1, Lb, bend = 0.082, 0.052, np.radians(33)
    tail = 0.006
    s = np.r_[np.linspace(0, L - tail, q["temple_K"]),
              L - tail + tail * np.sin(np.linspace(0, np.pi / 2, 9)[1:])]
    fac = np.r_[np.ones(q["temple_K"]), np.cos(np.linspace(0, np.pi / 2, 9)[1:])]
    phi = bend * smoothstep(0, 1, (s - s1) / Lb)
    ds = np.diff(s, prepend=0)
    dirs = np.stack([np.zeros_like(s), -np.sin(phi), -np.cos(phi)], -1)
    path = np.cumsum(dirs * ds[:, None], axis=0)
    path[:, 0] = P["temple_flare"] * s / L
    T = unit(np.gradient(path, axis=0))
    ux = np.tile([1.0, 0, 0], (len(s), 1))
    V = unit(np.cross(ux, T))
    U = unit(np.cross(T, V))
    w = np.interp(s, [0, 0.04, 0.09, L], [0.0046, 0.0038, 0.0032, 0.0028]) * fac
    h = np.interp(s, [0, 0.025, 0.06, 0.09, 0.115, L], [0.0098, 0.0094, 0.0080, 0.0066, 0.0050, 0.0040]) * fac
    r = np.minimum(w, h) * 0.42
    loops = rrect_loop(-w / 2, w / 2, -h / 2, h / 2, [r] * 4, [r] * 4, na=q["arc"])
    return sweep(path, U, V, loops), path, T


def build_screw(q):
    rh = 0.00145
    prof = [(0, 0), (rh - 0.0002, 0), (rh, 0.0002), (rh, 0.00036), (rh - 0.00028, 0.00062), (rh * 0.45, 0.00074), (0, 0.00076)]
    head = lathe(prof, nseg=q["nseg"])
    slot = rounded_box((rh * 1.6, 0.00030, 0.00016), 0.00005, na=2, nz=2)
    slot = xform(slot, R=rot_z(np.radians(28)), t=(0, 0, 0.00076))
    return head, slot


def build_pin(q):
    r = 0.0013
    prof = [(0, -0.0042), (r * 0.8, -0.0042), (r, -0.0040), (r, 0.0040), (r * 0.8, 0.0042), (0, 0.0042)]
    m = lathe(prof, nseg=q["nseg"])
    return xform(m, R=rot_x(np.pi / 2))     # eje Z -> eje Y


# ---------------------------------------------------------------------- modelo
def build_model(level="hd"):
    q = quality(level)
    (rimV, rimF), I, cx = build_rim(q)
    rim_R = (rimV, rimF)
    rim_R = xform(rim_R, t=(0, 0, 0))
    lens_R = build_lens(I, q)
    end_R = build_endpiece()
    pad_R = build_pad(q)
    bridge = build_bridge(q)

    def sym(m):
        return [m, mirror_x(m)]

    front_acetate = merge([wrap(x) for x in
                           sym(rim_R) + sym(end_R) + sym(pad_R) + [bridge]])
    front_lens = merge([wrap(x) for x in sym(lens_R)])

    # varilla (lado +X) en coordenadas locales + tornillo + pasador
    (tV, tF), path, T = build_temple(q)
    head, slot = build_screw(q)
    # tornillo en la cara exterior de la varilla (eje +X)
    sx = P["temple_flare"] * 0.0065 / P["temple_len"] + 0.0046 / 2 - 0.00005
    R_x = rot_y(np.pi / 2)    # eje Z -> eje X
    head = xform(head, R=R_x, t=(sx, 0.0003, -0.0070))
    slot = xform(slot, R=R_x, t=(sx, 0.0003, -0.0070))
    pin = build_pin(q)
    pin = xform(pin, t=(0.0, 0.0, 0.00015))
    temple_acetate = (tV, tF)
    temple_metal = merge([head, pin])
    temple_dark = slot
    pivot = np.array([P["temple_x"], P["temple_y"], P["temple_z"]])

    # anclas aproximadas
    pad_V = merge([wrap(pad_R)])[0]
    nose = np.array([0.0, pad_V[:, 1].mean(), pad_V[:, 2].min() + 0.0015])
    bend_i = np.argmin(np.abs(np.cumsum(np.linalg.norm(np.diff(path, axis=0, prepend=path[:1]), axis=1)) - 0.100))
    ear = pivot + path[bend_i]

    # medidas reales
    lw = (I[:, 0].max() - I[:, 0].min()) * 1000
    lh = (I[:, 1].max() - I[:, 1].min()) * 1000
    allV = front_acetate[0]
    fw = (allV[:, 0].max() - allV[:, 0].min()) * 1000
    info = dict(lens_width_mm=round(lw, 1), lens_height_mm=round(lh, 1),
                bridge_mm=round(2 * (I[:, 0].min()) * 1000, 1),
                front_width_mm=round(fw, 1), temple_len_mm=round(P["temple_len"] * 1000),
                frame_depth_mm=round((allV[:, 2].max() - (pivot[2] + tV[:, 2].min())) * 1000, 1))
    return dict(front_acetate=front_acetate, front_lens=front_lens,
                temple_acetate=temple_acetate, temple_metal=temple_metal, temple_dark=temple_dark,
                pivot=pivot, nose=nose, ear=ear, info=info, level=level)
