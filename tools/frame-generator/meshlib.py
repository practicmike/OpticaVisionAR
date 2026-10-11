"""meshlib.py - geometría procedural con numpy para armazones de lentes.

Convenciones: unidades en metros, +Y arriba, +Z hacia el frente (lejos de la cara).
Todas las mallas son (V, F): vértices (n,3) float y triángulos (m,3) int.
"""
import numpy as np


# ----------------------------------------------------------------- utilidades
def unit(v, eps=1e-12):
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(n, eps)


def merge(parts):
    parts = [p for p in parts if p is not None and len(p[1])]
    Vs, Fs, off = [], [], 0
    for V, F in parts:
        Vs.append(np.asarray(V, float))
        Fs.append(np.asarray(F, np.int64) + off)
        off += len(V)
    if not Vs:
        return np.zeros((0, 3)), np.zeros((0, 3), np.int64)
    return np.vstack(Vs), np.vstack(Fs)


def signed_volume(V, F):
    a, b, c = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
    return np.einsum("ij,ij->i", a, np.cross(b, c)).sum() / 6.0


def outward(V, F):
    """Orienta una malla cerrada para que las normales apunten hacia afuera."""
    if signed_volume(V, F) < 0:
        F = F[:, ::-1]
    return V, F


def rot_x(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def xform(mesh, R=None, t=None):
    V, F = mesh
    V = np.asarray(V, float)
    if R is not None:
        V = V @ np.asarray(R).T
    if t is not None:
        V = V + np.asarray(t, float)
    return V, F


def mirror_x(mesh):
    V, F = mesh
    return V * np.array([-1.0, 1.0, 1.0]), F[:, ::-1]


# --------------------------------------------------------------- superficies
def loft_torus(G):
    """G: (N, P, 3), cerrada en ambas direcciones (topología de toro)."""
    N, P, _ = G.shape
    idx = np.arange(N * P).reshape(N, P)
    a = idx
    b = np.roll(idx, -1, axis=0)
    c = np.roll(b, -1, axis=1)
    d = np.roll(idx, -1, axis=1)
    F = np.concatenate([np.stack([a, b, c], -1).reshape(-1, 3),
                        np.stack([a, c, d], -1).reshape(-1, 3)])
    return G.reshape(-1, 3), F


def loft_open(G):
    """G: (N, P, 3), cerrada en N (primer eje) y abierta en P. Para esferas/lathe."""
    N, P, _ = G.shape
    idx = np.arange(N * P).reshape(N, P)
    a = idx[:, :-1]
    b = np.roll(idx, -1, axis=0)[:, :-1]
    c = np.roll(idx, -1, axis=0)[:, 1:]
    d = idx[:, 1:]
    F = np.concatenate([np.stack([a, b, c], -1).reshape(-1, 3),
                        np.stack([a, c, d], -1).reshape(-1, 3)])
    return G.reshape(-1, 3), F


def rrect_loop(t0, t1, z0, z1, rt, rz, na=6):
    """Lazo de rectángulo redondeado (sentido antihorario) en el plano (t, z).

    rt, rz: 4 radios (BR, TR, TL, BL); cada uno escalar o arreglo.
    Devuelve (..., P, 2) con P = 4*(na+1).
    """
    args = [np.asarray(x, float) for x in (t0, t1, z0, z1, *rt, *rz)]
    args = np.broadcast_arrays(*args)
    t0, t1, z0, z1 = args[:4]
    rt = args[4:8]
    rz = args[8:12]
    corners = [
        (t1 - rt[0], z0 + rz[0], -90, 0, 0),
        (t1 - rt[1], z1 - rz[1], 0, 90, 1),
        (t0 + rt[2], z1 - rz[2], 90, 180, 2),
        (t0 + rt[3], z0 + rz[3], 180, 270, 3),
    ]
    pts = []
    for ct, cz, a0, a1, k in corners:
        for al in np.radians(np.linspace(a0, a1, na + 1)):
            pts.append(np.stack([ct + rt[k] * np.cos(al), cz + rz[k] * np.sin(al)], -1))
    return np.stack(pts, -2)


def sweep(path, U, V, loops, caps=(True, True)):
    """Barrido de secciones 2D (loops) a lo largo de una trayectoria.

    path (K,3); U,V (K,3) ejes de la sección; loops (K,P,2). Cierra con tapas en abanico.
    La orientación se corrige con outward().
    """
    G = path[:, None, :] + loops[:, :, 0:1] * U[:, None, :] + loops[:, :, 1:2] * V[:, None, :]
    K, P, _ = G.shape
    idx = np.arange(K * P).reshape(K, P)
    a = idx[:-1]
    b = idx[1:]
    c = np.roll(b, -1, axis=1)
    d = np.roll(a, -1, axis=1)
    F = [np.stack([a, b, c], -1).reshape(-1, 3), np.stack([a, c, d], -1).reshape(-1, 3)]
    Vs = [G.reshape(-1, 3)]
    n = K * P
    for k, (end, flag) in enumerate(zip((0, K - 1), caps)):
        if not flag:
            continue
        ring = idx[end]
        center = G[end].mean(axis=0)
        Vs.append(center[None, :])
        cidx = n
        n += 1
        j1 = np.roll(ring, -1)
        if k == 0:
            F.append(np.stack([np.full(P, cidx), ring, j1], -1))
        else:
            F.append(np.stack([np.full(P, cidx), j1, ring], -1))
    return outward(np.vstack(Vs), np.vstack(F))


def rounded_box(size, r, na=4, nz=4):
    """Caja con aristas y esquinas redondeadas, centrada en el origen."""
    sx, sy, sz = size
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    r = min(r, hx * 0.99, hy * 0.99, hz * 0.99)
    als = np.linspace(np.pi / 2, 0, nz + 1)
    zb = -hz + r * (1 - np.sin(als))
    ib = r * (1 - np.cos(als))
    zs = np.r_[zb, -zb[::-1]]
    ins = np.r_[ib, ib[::-1]]
    loops = []
    for i in ins:
        rr = max(r - i, 0.0)
        loops.append(rrect_loop(-(hx - i), hx - i, -(hy - i), hy - i, [rr] * 4, [rr] * 4, na))
    loops = np.stack(loops)
    K = len(zs)
    path = np.zeros((K, 3))
    path[:, 2] = zs
    U = np.tile([1.0, 0, 0], (K, 1))
    Vv = np.tile([0, 1.0, 0], (K, 1))
    return sweep(path, U, Vv, loops)


def lathe(profile, nseg=24):
    """Sólido de revolución sobre el eje Z. profile: [(radio, z), ...] de un polo al otro."""
    prof = np.asarray(profile, float)
    ang = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    G = np.zeros((nseg, len(prof), 3))
    G[:, :, 0] = prof[None, :, 0] * np.cos(ang)[:, None]
    G[:, :, 1] = prof[None, :, 0] * np.sin(ang)[:, None]
    G[:, :, 2] = prof[None, :, 1]
    return outward(*loft_open(G))


def ellipsoid(radii, nu=28, nv=16):
    rx, ry, rz = radii
    u = np.linspace(0, 2 * np.pi, nu, endpoint=False)
    v = np.linspace(0, np.pi, nv + 1)
    G = np.zeros((nu, nv + 1, 3))
    G[:, :, 0] = rx * np.outer(np.cos(u), np.sin(v))
    G[:, :, 1] = ry * np.outer(np.sin(u), np.sin(v))
    G[:, :, 2] = rz * np.outer(np.ones(nu), np.cos(v))
    V, F = loft_open(G)
    # los ejes se reasignan: u -> plano XY; aquí devolvemos tal cual
    return outward(V, F)


# ----------------------------------------------------- contornos 2D cerrados
def rounded_polygon(P, radii, n_arc=26):
    """Polígono con esquinas redondeadas (radio por vértice). Devuelve polilínea densa."""
    P = np.asarray(P, float)
    n = len(P)
    out = []
    for i in range(n):
        p, a, b = P[i], P[i - 1], P[(i + 1) % n]
        u = a - p
        w = b - p
        lu, lw = np.linalg.norm(u), np.linalg.norm(w)
        u, w = u / lu, w / lw
        phi = np.arccos(np.clip(u @ w, -1, 1))
        d = radii[i] / np.tan(phi / 2)
        d = min(d, 0.48 * min(lu, lw))
        r = d * np.tan(phi / 2)
        m = unit(u + w)
        c = p + m * (r / np.sin(phi / 2))
        t1 = p + u * d
        t2 = p + w * d
        a1 = np.arctan2(*(t1 - c)[::-1])
        a2 = np.arctan2(*(t2 - c)[::-1])
        da = (a2 - a1 + np.pi) % (2 * np.pi) - np.pi
        ang = a1 + da * np.linspace(0, 1, n_arc)
        out.append(np.stack([c[0] + r * np.cos(ang), c[1] + r * np.sin(ang)], -1))
    return np.vstack(out)


def resample_closed(pts, N):
    closed = np.vstack([pts, pts[:1]])
    seg = np.linalg.norm(np.diff(closed, axis=0), axis=1)
    s = np.r_[0, np.cumsum(seg)]
    q = np.linspace(0, s[-1], N, endpoint=False)
    return np.stack([np.interp(q, s, closed[:, 0]), np.interp(q, s, closed[:, 1])], -1)


def smooth_closed(pts, it=2):
    for _ in range(it):
        pts = 0.25 * np.roll(pts, 1, axis=0) + 0.5 * pts + 0.25 * np.roll(pts, -1, axis=0)
    return pts


def ccw(pts):
    x, y = pts[:, 0], pts[:, 1]
    area = 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)
    return pts if area > 0 else pts[::-1].copy()


def outward_normals_2d(pts):
    T = np.roll(pts, -1, axis=0) - np.roll(pts, 1, axis=0)
    T = unit(T)
    return np.stack([T[:, 1], -T[:, 0]], -1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ------------------------------------------------------ normales con pliegues
def finalize(V, F, crease_deg=38.0, uv_fn=None, big_deg=14):
    """Calcula normales suaves respetando aristas vivas (ángulo de pliegue).

    Devuelve (positions, normals, uvs|None, indices) con vértices duplicados donde hay pliegues.
    """
    V = np.asarray(V, float)
    F = np.asarray(F, np.int64)
    a, b, c = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
    cr = np.cross(b - a, c - a)
    area = np.linalg.norm(cr, axis=1) / 2
    keep = area > 1e-13
    F, cr, area = F[keep], cr[keep], area[keep]
    fn = cr / (2 * area[:, None])
    nF = len(F)

    corner_v = F.reshape(-1)
    corner_f = np.repeat(np.arange(nF), 3)
    order = np.argsort(corner_v, kind="stable")
    sv = corner_v[order]
    starts = np.r_[0, np.flatnonzero(np.diff(sv)) + 1]
    counts = np.diff(np.r_[starts, len(sv)])
    gid = np.repeat(np.arange(len(starts)), counts)
    pos = np.arange(len(sv)) - starts[gid]
    cf = corner_f[order]
    cos_t = np.cos(np.radians(crease_deg))
    corner_n = np.zeros((3 * nF, 3))

    small = counts <= big_deg
    # grupos pequeños: vectorizado
    sel = small[gid]
    if sel.any():
        remap = -np.ones(len(starts), np.int64)
        remap[small] = np.arange(small.sum())
        g = remap[gid[sel]]
        p = pos[sel]
        K = int(counts[small].max())
        FN = np.zeros((small.sum(), K, 3))
        AR = np.zeros((small.sum(), K))
        FN[g, p] = fn[cf[sel]]
        AR[g, p] = area[cf[sel]]
        D = np.einsum("vkc,vlc->vkl", FN, FN)
        W = ((D > cos_t) & (AR[:, None, :] > 0)) * AR[:, None, :]
        N = np.einsum("vkl,vlc->vkc", W, FN)
        N = unit(N)
        corner_n[order[sel]] = N[g, p]
    # grupos grandes: bucle
    for gi in np.flatnonzero(~small):
        s0, cnt = starts[gi], counts[gi]
        ids = order[s0:s0 + cnt]
        fns = fn[cf[s0:s0 + cnt]]
        ars = area[cf[s0:s0 + cnt]]
        D = fns @ fns.T
        W = (D > cos_t) * ars[None, :]
        corner_n[ids] = unit(W @ fns)

    pos_c = V[corner_v]
    key = np.concatenate([np.round(pos_c * 1e6).astype(np.int64),
                          np.round(corner_n * 1000).astype(np.int64)], axis=1)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.reshape(-1)
    P_out = pos_c[first]
    N_out = unit(corner_n[first])
    idx = inv.reshape(-1, 3)
    uv = uv_fn(P_out, N_out) if uv_fn is not None else None
    return P_out, N_out, uv, idx


def triplanar_uv(scale=13.0, offset=(0.13, 0.37)):
    """UV por proyección plana según el eje dominante de la normal (texturas tipo carey)."""
    def fn(P, N):
        ax = np.argmax(np.abs(N), axis=1)
        uv = np.zeros((len(P), 2))
        m = ax == 2
        uv[m] = P[m][:, [0, 1]]
        m = ax == 0
        uv[m] = P[m][:, [2, 1]]
        m = ax == 1
        uv[m] = P[m][:, [0, 2]]
        return uv * scale + np.asarray(offset)
    return fn
