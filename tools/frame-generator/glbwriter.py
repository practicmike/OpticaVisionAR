"""glbwriter.py - escritor mínimo de glTF 2.0 binario (.glb), sin dependencias externas."""
import json
import struct
import numpy as np


class GLB:
    def __init__(self, generator="procedural"):
        self.bin = bytearray()
        self.j = {
            "asset": {"version": "2.0", "generator": generator},
            "scene": 0,
            "scenes": [{"nodes": []}],
            "nodes": [], "meshes": [], "materials": [],
            "accessors": [], "bufferViews": [], "buffers": [],
        }
        self.ext_used = set()

    # -- bajo nivel
    def _view(self, data: bytes, target=None):
        while len(self.bin) % 4:
            self.bin.append(0)
        off = len(self.bin)
        self.bin += data
        bv = {"buffer": 0, "byteOffset": off, "byteLength": len(data)}
        if target:
            bv["target"] = target
        self.j["bufferViews"].append(bv)
        return len(self.j["bufferViews"]) - 1

    def _accessor(self, arr, comp, typ, target=None, minmax=False):
        arr = np.ascontiguousarray(arr)
        view = self._view(arr.tobytes(), target)
        acc = {"bufferView": view, "componentType": comp, "count": int(len(arr)), "type": typ}
        if minmax:
            acc["min"] = [float(x) for x in arr.min(axis=0)]
            acc["max"] = [float(x) for x in arr.max(axis=0)]
        self.j["accessors"].append(acc)
        return len(self.j["accessors"]) - 1

    # -- API
    def add_texture_png(self, png_bytes, wrap_repeat=True):
        view = self._view(png_bytes)
        self.j.setdefault("images", []).append({"bufferView": view, "mimeType": "image/png"})
        self.j.setdefault("samplers", []).append(
            {"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497})
        self.j.setdefault("textures", []).append(
            {"source": len(self.j["images"]) - 1, "sampler": len(self.j["samplers"]) - 1})
        return len(self.j["textures"]) - 1

    def add_material(self, name, mat):
        mat = dict(mat)
        mat["name"] = name
        for e in mat.get("extensions", {}):
            self.ext_used.add(e)
        self.j["materials"].append(mat)
        return len(self.j["materials"]) - 1

    def add_mesh(self, name, prims):
        """prims: lista de dict(P, N, UV|None, I, material:int)."""
        out = []
        for p in prims:
            attrs = {"POSITION": self._accessor(p["P"].astype(np.float32), 5126, "VEC3", 34962, True),
                     "NORMAL": self._accessor(p["N"].astype(np.float32), 5126, "VEC3", 34962)}
            if p.get("UV") is not None:
                attrs["TEXCOORD_0"] = self._accessor(p["UV"].astype(np.float32), 5126, "VEC2", 34962)
            I = p["I"].reshape(-1)
            if I.max() < 65535:
                ia = self._accessor(I.astype(np.uint16), 5123, "SCALAR", 34963)
            else:
                ia = self._accessor(I.astype(np.uint32), 5125, "SCALAR", 34963)
            out.append({"attributes": attrs, "indices": ia, "material": p["material"], "mode": 4})
        self.j["meshes"].append({"name": name, "primitives": out})
        return len(self.j["meshes"]) - 1

    def add_node(self, name, mesh=None, translation=None, children=None, extras=None, parent=None):
        n = {"name": name}
        if mesh is not None:
            n["mesh"] = mesh
        if translation is not None and any(abs(x) > 0 for x in translation):
            n["translation"] = [float(x) for x in translation]
        if children:
            n["children"] = children
        if extras:
            n["extras"] = extras
        self.j["nodes"].append(n)
        idx = len(self.j["nodes"]) - 1
        if parent is None:
            self.j["scenes"][0]["nodes"].append(idx)
        else:
            self.j["nodes"][parent].setdefault("children", []).append(idx)
        return idx

    def save(self, path):
        j = dict(self.j)
        for k in ("images", "samplers", "textures"):
            if k in j and not j[k]:
                del j[k]
        if self.ext_used:
            j["extensionsUsed"] = sorted(self.ext_used)
        while len(self.bin) % 4:
            self.bin.append(0)
        j["buffers"] = [{"byteLength": len(self.bin)}]
        js = json.dumps(j, separators=(",", ":")).encode("utf-8")
        js += b" " * ((4 - len(js) % 4) % 4)
        total = 12 + 8 + len(js) + 8 + len(self.bin)
        with open(path, "wb") as f:
            f.write(struct.pack("<4sII", b"glTF", 2, total))
            f.write(struct.pack("<I4s", len(js), b"JSON"))
            f.write(js)
            f.write(struct.pack("<I4s", len(self.bin), b"BIN\x00"))
            f.write(bytes(self.bin))
        return total
