import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CatalogFrame } from '@shared/schema';
import { useTryOnStore } from '@/store/tryOnStore';
import { faceTracker } from '@/ar/tracking';

interface GlassesRendererProps {
  frame: CatalogFrame;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  /** The view is shown mirrored (selfie): flip the user's left/right adjustments. */
  mirrored?: boolean;
}

const frameColorHex: Record<string, string> = {
  black: '#161719',
  brown: '#68452f',
  tortoise: '#67452b',
  blue: '#527b9d',
  red: '#a64855',
  gold: '#c69b55',
  silver: '#aeb6c0',
  transparent: '#c8b8a8',
};

const getFrameColor = (color: string) =>
  frameColorHex[color.toLowerCase()] ?? '#252525';

const createLensContour = (
  style: string,
  radiusX: number,
  radiusY: number,
  mirror = false,
) => {
  const contour = new THREE.Shape();
  const x = (value: number) => (mirror ? -value : value);

  if (style === 'round' || style === 'oval') {
    contour.absellipse(
      0,
      0,
      radiusX,
      radiusY,
      0,
      Math.PI * 2,
      false,
      0,
    );
    contour.closePath();
    return contour;
  }

  if (style === 'cat-eye') {
    contour.moveTo(x(-radiusX), -radiusY * 0.62);
    contour.quadraticCurveTo(x(-radiusX * 0.98), radiusY * 0.48, x(-radiusX * 0.72), radiusY * 0.68);
    contour.quadraticCurveTo(x(-radiusX * 0.18), radiusY * 0.9, x(radiusX * 0.35), radiusY * 0.67);
    contour.quadraticCurveTo(x(radiusX * 0.78), radiusY * 0.47, x(radiusX), radiusY * 0.94);
    contour.quadraticCurveTo(x(radiusX * 0.99), radiusY * 0.38, x(radiusX * 0.91), -radiusY * 0.54);
    contour.quadraticCurveTo(x(0), -radiusY * 1.04, x(-radiusX * 0.72), -radiusY * 0.86);
    contour.quadraticCurveTo(x(-radiusX * 0.96), -radiusY * 0.81, x(-radiusX), -radiusY * 0.62);
    contour.closePath();
    return contour;
  }

  if (style === 'aviator') {
    contour.moveTo(x(-radiusX * 0.9), radiusY * 0.74);
    contour.quadraticCurveTo(x(-radiusX), radiusY * 0.64, x(-radiusX), radiusY * 0.14);
    contour.bezierCurveTo(
      x(-radiusX),
      -radiusY * 0.58,
      x(-radiusX * 0.48),
      -radiusY,
      x(0),
      -radiusY,
    );
    contour.bezierCurveTo(
      x(radiusX * 0.48),
      -radiusY,
      x(radiusX),
      -radiusY * 0.58,
      x(radiusX),
      radiusY * 0.14,
    );
    contour.quadraticCurveTo(x(radiusX), radiusY * 0.64, x(radiusX * 0.9), radiusY * 0.74);
    contour.quadraticCurveTo(x(0), -radiusY * 1.16, x(-radiusX * 0.9), radiusY * 0.74);
    contour.closePath();
    return contour;
  }

  const corner = Math.min(radiusX * 0.24, radiusY * 0.28);
  contour.moveTo(x(-radiusX + corner), -radiusY);
  contour.lineTo(x(radiusX - corner), -radiusY);
  contour.quadraticCurveTo(x(radiusX), -radiusY, x(radiusX), -radiusY + corner);
  contour.lineTo(x(radiusX), radiusY - corner);
  contour.quadraticCurveTo(x(radiusX), radiusY, x(radiusX - corner), radiusY);
  contour.lineTo(x(-radiusX + corner), radiusY);
  contour.quadraticCurveTo(x(-radiusX), radiusY, x(-radiusX), radiusY - corner);
  contour.lineTo(x(-radiusX), -radiusY + corner);
  contour.quadraticCurveTo(x(-radiusX), -radiusY, x(-radiusX + corner), -radiusY);
  contour.closePath();
  return contour;
};

const disposeFrameGroup = (group: THREE.Object3D) => {
  group.traverse((object: any) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material: any) => {
      Object.values(material).forEach((value: any) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
};


// The GLB origin goes slightly behind the very front of the model (rims and
// nose pads), roughly where the frame rests on the nose.
const FRONT_PLANE_DEPTH = 0.08;

/**
 * True when most of the geometry (rims, lenses) sits on the +z side, i.e.
 * the front of the frame looks at the camera. Temple arms are thin, so the
 * back slice has far fewer vertices than the front slice.
 */
const frontFacesCamera = (model: THREE.Object3D) => {
  const bounds = new THREE.Box3().setFromObject(model);
  const depth = bounds.max.z - bounds.min.z;
  if (!(depth > 0)) return true;
  const v = new THREE.Vector3();
  let front = 0;
  let back = 0;
  model.traverse((object: any) => {
    const position = object.isMesh ? object.geometry?.attributes?.position : null;
    if (!position) return;
    const step = Math.max(1, Math.floor(position.count / 4000));
    for (let i = 0; i < position.count; i += step) {
      v.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
      const t = (v.z - bounds.min.z) / depth;
      if (t > 0.8) front++;
      else if (t < 0.2) back++;
    }
  });
  return front >= back;
};

// Head occluder: invisible ellipsoid that only writes depth, so the parts of
// the temple arms behind the head are hidden when the user turns. Radii are
// fractions of the temple-to-temple face width.
const OCCLUDER_RADII = { x: 0.48, y: 0.62, z: 0.62 };

const GlassesRenderer = ({ frame, canvasRef, width, height, mirrored = false }: GlassesRendererProps) => {
  const mirroredRef = useRef(mirrored);
  mirroredRef.current = mirrored;
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  // anchor = head pose (position + rotation); holder = glasses size and the
  // user's fine adjustments; occluder = the head itself (depth only).
  const anchorRef = useRef<THREE.Group | null>(null);
  const glassesHolderRef = useRef<THREE.Group | null>(null);
  const occluderRef = useRef<THREE.Mesh | null>(null);
  const glassesModelRef = useRef<THREE.Group | null>(null);
  const modelLoadSequenceRef = useRef(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Video-relative orthographic camera: image width = 4 world units, so the
    // overlay maps directly onto the normalized face landmarks.
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-2, 2, 2 / aspect, -2 / aspect, 0.1, 1000);
    camera.position.z = 100;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      // Lets the "take photo" button read the glasses layer.
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height, false);
    rendererRef.current = renderer;

    // Soft studio reflections: glossy acetate (clearcoat), metal hinges and
    // lenses look flat with direct lights only.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    // 0.5 keeps catalog colours true to the model (measured: at 1.0 navy
    // and wine frames rendered ~30 sRGB levels too light).
    scene.environmentIntensity = 0.5;
    pmrem.dispose();
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    const anchor = new THREE.Group();
    anchor.visible = false;
    scene.add(anchor);
    anchorRef.current = anchor;

    const holder = new THREE.Group();
    anchor.add(holder);
    glassesHolderRef.current = holder;

    const occluder = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshBasicMaterial({ colorWrite: false }),
    );
    occluder.renderOrder = -1;
    anchor.add(occluder);
    occluderRef.current = occluder;

    return () => {
      modelLoadSequenceRef.current += 1;
      disposeFrameGroup(anchor);
      scene.remove(anchor);
      environment.dispose();
      glassesModelRef.current = null;
      anchorRef.current = null;
      glassesHolderRef.current = null;
      occluderRef.current = null;
      renderer.dispose();
    };
  }, [canvasRef]);

  useEffect(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return;

    const aspect = width / height;
    camera.left = -2;
    camera.right = 2;
    camera.top = 2 / aspect;
    camera.bottom = -2 / aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }, [width, height]);

  // Build a distinct lightweight 3D frame shape for each catalog style.
  useEffect(() => {
    const holder = glassesHolderRef.current;
    if (!holder) return;
    const loadSequence = ++modelLoadSequenceRef.current;
    
    // Remove existing model if present
    if (glassesModelRef.current) {
      holder.remove(glassesModelRef.current);
      disposeFrameGroup(glassesModelRef.current);
      glassesModelRef.current = null;
    }
    
    const framesGroup = new THREE.Group();

    if (frame.modelUrl) {
      holder.add(framesGroup);
      glassesModelRef.current = framesGroup;

      new GLTFLoader().load(
        frame.modelUrl,
        ({ scene: model }) => {
          if (
            loadSequence !== modelLoadSequenceRef.current
            || glassesModelRef.current !== framesGroup
          ) {
            disposeFrameGroup(model);
            return;
          }

          model.rotation.y = frame.modelRotationY ?? 0;
          model.updateMatrixWorld(true);
          // Front of the frame must face the camera (+z): with real yaw the
          // back would otherwise show. Detected from geometry, so any GLB works.
          if (!frontFacesCamera(model)) {
            model.rotation.y += Math.PI;
            model.updateMatrixWorld(true);
          }
          // Models that name their front part (rims + lenses) are centred on
          // it; otherwise temples bending behind the ears would pull the
          // centre down and back. Falls back to the whole model.
          const reference = model.getObjectByName('frente') ?? model;
          const bounds = new THREE.Box3().setFromObject(reference);
          const size = bounds.getSize(new THREE.Vector3());
          if (!Number.isFinite(size.x) || size.x < 0.0001) {
            console.error(`El modelo GLB del armazón ${frame.id} no tiene un ancho válido.`);
            disposeFrameGroup(model);
            return;
          }

          // Same width convention as before (1.85 units = eye span x 1.85),
          // but the origin is now the front plane, not the box center: the
          // glasses rotate around the nose bridge instead of a point inside
          // the head.
          const center = bounds.getCenter(new THREE.Vector3());
          const normalizationScale = 1.85 / size.x;
          model.scale.setScalar(normalizationScale);
          model.position
            .set(center.x, center.y, bounds.max.z - FRONT_PLANE_DEPTH * size.z)
            .multiplyScalar(-normalizationScale);
          model.updateMatrixWorld(true);
          framesGroup.add(model);
        },
        undefined,
        (error) => {
          console.error(`No se pudo cargar el modelo GLB del armazón ${frame.id}:`, error);
        },
      );
      return;
    }

    const shapeStyle = frame.style.toLowerCase() === 'sunglasses'
      ? 'rectangle'
      : frame.style.toLowerCase();
    const isSunglasses = frame.style.toLowerCase() === 'sunglasses'
      || /sun|solar/.test(`${frame.nameEn} ${frame.nameEs}`.toLowerCase());
    const isMetal = /metal|titanium/.test(frame.material.toLowerCase());
    const isClearFrame = frame.color.toLowerCase() === 'transparent';
    const frameColor = new THREE.Color(getFrameColor(frame.color));
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      metalness: isMetal ? 0.78 : 0.18,
      roughness: isMetal ? 0.27 : 0.34,
      transparent: isClearFrame,
      opacity: isClearFrame ? 0.72 : 1,
      side: THREE.DoubleSide,
    });
    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: isSunglasses ? 0x263846 : 0xb9d0d8,
      transparent: true,
      opacity: isSunglasses ? 0.58 : 0.12,
      metalness: 0.05,
      roughness: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const radiusX = shapeStyle === 'round' ? 0.3 : 0.34;
    const radiusY = shapeStyle === 'round' ? 0.3 : shapeStyle === 'oval' ? 0.25 : 0.27;
    const lensCenters = [-0.39, 0.39];

    lensCenters.forEach((centerX) => {
      const mirrorCatEye = shapeStyle === 'cat-eye' && centerX < 0;
      const outerContour = createLensContour(shapeStyle, radiusX, radiusY, mirrorCatEye);
      outerContour.holes.push(
        createLensContour(shapeStyle, radiusX - 0.052, radiusY - 0.052, mirrorCatEye),
      );
      const rim = new THREE.Mesh(
        new THREE.ExtrudeGeometry(outerContour, {
          depth: 0.055,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.006,
          bevelSegments: 2,
          curveSegments: 32,
        }),
        frameMaterial,
      );
      rim.position.set(centerX, 0, -0.028);
      framesGroup.add(rim);

      const lensContour = createLensContour(
        shapeStyle,
        radiusX - 0.053,
        radiusY - 0.053,
        mirrorCatEye,
      );
      const lens = new THREE.Mesh(
        new THREE.ShapeGeometry(lensContour, 32),
        lensMaterial,
      );
      lens.position.set(centerX, 0, 0.031);
      framesGroup.add(lens);
    });

    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, 0.015, 0.015),
      new THREE.Vector3(0, 0.065, 0.035),
      new THREE.Vector3(0.11, 0.015, 0.015),
    ]);
    framesGroup.add(new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 16, 0.022, 8, false),
      frameMaterial,
    ));

    [-1, 1].forEach((side) => {
      const templeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.71, 0.025, -0.005),
        new THREE.Vector3(side * 0.83, 0.01, -0.095),
        new THREE.Vector3(side * 1.02, -0.035, -0.28),
      ]);
      framesGroup.add(new THREE.Mesh(
        new THREE.TubeGeometry(templeCurve, 18, 0.024, 8, false),
        frameMaterial,
      ));
    });
    
    // Add the glasses model to the head-anchored holder
    holder.add(framesGroup);
    glassesModelRef.current = framesGroup;
  }, [frame]);

  // Per-frame loop: read the smoothed head pose and the user's adjustments
  // directly (no React state), place the glasses and render.
  useEffect(() => {
    let animationFrameId = 0;
    const faceQuaternion = new THREE.Quaternion();
    const adjustEuler = new THREE.Euler();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const anchor = anchorRef.current;
      const holder = glassesHolderRef.current;
      const occluder = occluderRef.current;
      if (!scene || !camera || !renderer || !anchor || !holder || !occluder) return;

      const pose = faceTracker.getPose();
      anchor.visible = !!pose;
      if (pose) {
        const { adjustments } = useTryOnStore.getState();

        anchor.position.set(pose.position.x, pose.position.y, pose.position.z);
        anchor.quaternion.copy(faceQuaternion.fromArray(pose.quaternion));

        // Fine adjustments are relative to the head, so "up" follows a tilt.
        // In the mirrored selfie view, left/right (x, yaw, roll) are flipped
        // so the sliders move the glasses the way the user sees them move.
        const m = mirroredRef.current ? -1 : 1;
        holder.position.set(m * adjustments.position.x, adjustments.position.y, adjustments.position.z);
        holder.rotation.copy(
          adjustEuler.set(adjustments.rotation.x, m * adjustments.rotation.y, m * adjustments.rotation.z),
        );
        holder.scale.setScalar(pose.eyeSpan * adjustments.scale);

        const w = pose.faceWidth;
        occluder.scale.set(OCCLUDER_RADII.x * w, OCCLUDER_RADII.y * w, OCCLUDER_RADII.z * w);
        occluder.position.set(0, pose.templeOffset.y, pose.templeOffset.z - 0.3 * w);
      }

      renderer.render(scene, camera);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return null; // Rendering happens via the canvasRef
};

export default GlassesRenderer;
