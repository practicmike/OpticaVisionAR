import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Frame } from '@shared/schema';
import { useTryOnStore } from '@/store/tryOnStore';

interface GlassesRendererProps {
  frame: Frame;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
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

const disposeFrameGroup = (group: THREE.Group) => {
  group.traverse((object: any) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach((material: any) => material.dispose());
    } else {
      object.material.dispose();
    }
  });
};

const GlassesRenderer = ({ frame, canvasRef, width, height }: GlassesRendererProps) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const glassesModelRef = useRef<THREE.Group | null>(null);
  
  // Get state from Zustand store
  const {
    isFaceDetected,
    glassesPosition,
    glassesRotation,
    glassesScale,
    adjustments
  } = useTryOnStore();

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Use video-relative coordinates so the overlay maps directly to the
    // normalized face landmarks instead of shrinking into a perspective view.
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-2, 2, 2 / aspect, -2 / aspect, 0.1, 1000);
    camera.position.z = 100;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,  // Transparent background
    });
    renderer.setSize(width, height, false);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Clean up on unmount
    return () => {
      renderer.dispose();
      if (glassesModelRef.current) {
        scene.remove(glassesModelRef.current);
        disposeFrameGroup(glassesModelRef.current);
        glassesModelRef.current = null;
      }
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
    if (!sceneRef.current) return;
    
    // Remove existing model if present
    if (glassesModelRef.current) {
      sceneRef.current.remove(glassesModelRef.current);
      disposeFrameGroup(glassesModelRef.current);
      glassesModelRef.current = null;
    }
    
    const framesGroup = new THREE.Group();
    framesGroup.visible = false;
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
    
    // Add the glasses model to the scene
    sceneRef.current.add(framesGroup);
    glassesModelRef.current = framesGroup;
  }, [frame]);
  
  // Update glasses position based on face detection
  useEffect(() => {
    if (!glassesModelRef.current || !sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    
    glassesModelRef.current.visible = isFaceDetected;
    if (isFaceDetected) {
      // Map normalized coordinates to 3D space
      const posX = (glassesPosition.x - 0.5) * 4;
      const aspect = width / height;
      const posY = (0.5 - glassesPosition.y) * (4 / aspect);
      const posZ = -glassesPosition.z * 4;
      
      // Apply position based on face detection and user adjustments
      glassesModelRef.current.position.set(
        posX + adjustments.position.x,
        posY + adjustments.position.y,
        posZ + adjustments.position.z
      );
      
      // Apply rotation based on face detection and user adjustments
      glassesModelRef.current.rotation.set(
        glassesRotation.x + adjustments.rotation.x,
        glassesRotation.y + adjustments.rotation.y,
        glassesRotation.z + adjustments.rotation.z
      );
      
      // Apply scale based on face width and user adjustments
      const baseScale = glassesScale.x * 4;
      const finalScale = baseScale * adjustments.scale;
      glassesModelRef.current.scale.set(finalScale, finalScale, finalScale);
    }
    
    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [
    isFaceDetected,
    glassesPosition,
    glassesRotation,
    glassesScale,
    adjustments,
    frame.id,
    width,
    height
  ]);
  
  // Ensure render loop runs consistently
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return null; // Rendering happens via the canvasRef
};

export default GlassesRenderer;