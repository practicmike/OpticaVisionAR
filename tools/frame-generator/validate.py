import sys, glob, json, struct
import numpy as np
from render import read_glb, accessor, gather

ok_all = True
for path in sorted(glob.glob((sys.argv[1] if len(sys.argv) > 1 else 'out') + '/*.glb')):
    j, bn = read_glb(path)
    errs = []
    # buffer
    if j['buffers'][0]['byteLength'] != len(bn): errs.append('buffer length mismatch')
    for i, bv in enumerate(j['bufferViews']):
        if bv['byteOffset'] % 4: errs.append(f'bufferView {i} sin alineación a 4')
        if bv['byteOffset'] + bv['byteLength'] > len(bn): errs.append(f'bufferView {i} fuera de rango')
    tris = 0; verts = 0
    for m in j['meshes']:
        for p in m['primitives']:
            P = accessor(j, bn, p['attributes']['POSITION']).astype(float)
            N = accessor(j, bn, p['attributes']['NORMAL']).astype(float)
            I = accessor(j, bn, p['indices']).astype(np.int64)
            acc = j['accessors'][p['attributes']['POSITION']]
            if not np.isfinite(P).all() or not np.isfinite(N).all(): errs.append('NaN/Inf')
            if I.max() >= len(P): errs.append('índice fuera de rango')
            if len(I) % 3: errs.append('índices no múltiplo de 3')
            if not np.allclose(acc['min'], P.min(0), atol=1e-6) or not np.allclose(acc['max'], P.max(0), atol=1e-6): errs.append('min/max incorrectos')
            ln = np.linalg.norm(N, axis=1)
            if ln.min() < 0.99 or ln.max() > 1.01: errs.append('normales no unitarias')
            if 'TEXCOORD_0' in p['attributes']:
                uv = accessor(j, bn, p['attributes']['TEXCOORD_0'])
                if len(uv) != len(P): errs.append('UV count')
            # triángulos degenerados
            T = I.reshape(-1, 3)
            a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
            deg = (np.linalg.norm(np.cross(b - a, c - a), axis=1) < 1e-13).sum()
            if deg: errs.append(f'{deg} triángulos degenerados')
            tris += len(T); verts += len(P)
    prims = gather(j, bn)
    allP = np.vstack([p['P'] for p in prims])
    mn, mx = allP.min(0) * 1000, allP.max(0) * 1000
    sym = abs(mn[0] + mx[0])
    print(f"{path:38s} tris={tris:6d} verts={verts:6d} bbox_mm x[{mn[0]:.1f},{mx[0]:.1f}] y[{mn[1]:.1f},{mx[1]:.1f}] z[{mn[2]:.1f},{mx[2]:.1f}] asimetría_x={sym:.3f}mm  nodos={[n['name'] for n in j['nodes']]}")
    if sym > 0.05: errs.append('asimetría en X')
    print('   ', 'OK' if not errs else 'ERRORES: ' + '; '.join(errs))
    ok_all &= not errs
print('TODO OK' if ok_all else 'HAY ERRORES')
