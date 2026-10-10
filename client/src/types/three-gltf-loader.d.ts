declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: { scene: any }) => void,
      onProgress?: (event: { loaded: number; total?: number }) => void,
      onError?: (error: unknown) => void,
    ): void;
  }
}
