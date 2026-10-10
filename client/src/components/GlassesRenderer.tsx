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
  
  // Load glasses model (using a simple placeholder model for now)
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove existing model if present
    if (glassesModelRef.current) {
      sceneRef.current.remove(glassesModelRef.current);
      glassesModelRef.current = null;
    }
    
    // Create a placeholder glasses model (simple frames)
    const framesGroup = new THREE.Group();
    framesGroup.visible = false;
    
    // Frame color based on the selected frame
    const frameColor = new THREE.Color(frame.color.toLowerCase() || '#000000');
    const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.5, roughness: 0.2 });
    
    // Rim for left eye
    const leftRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 16, 50),
      frameMaterial
    );
    leftRim.position.set(-0.4, 0, 0);
    framesGroup.add(leftRim);
    
    // Rim for right eye
    const rightRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 16, 50),
      frameMaterial
    );
    rightRim.position.set(0.4, 0, 0);
    framesGroup.add(rightRim);
    
    // Bridge connecting the rims
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.05),
      frameMaterial
    );
    bridge.position.set(0, 0, 0);
    framesGroup.add(bridge);
    
    // Left temple (arm)
    const leftTemple = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.05),
      frameMaterial
    );
    leftTemple.position.set(-0.75, 0, 0);
    leftTemple.rotation.y = Math.PI / 4;
    framesGroup.add(leftTemple);
    
    // Right temple (arm)
    const rightTemple = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.05),
      frameMaterial
    );
    rightTemple.position.set(0.75, 0, 0);
    rightTemple.rotation.y = -Math.PI / 4;
    framesGroup.add(rightTemple);
    
    // Add a transparent lens material for different frame styles
    if (frame.style === 'Sunglasses') {
      const lensMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.6,
        metalness: 0.1,
        roughness: 0.1
      });
      
      // Left lens
      const leftLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.29, 32),
        lensMaterial
      );
      leftLens.position.set(-0.4, 0, 0.01);
      framesGroup.add(leftLens);
      
      // Right lens
      const rightLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.29, 32),
        lensMaterial
      );
      rightLens.position.set(0.4, 0, 0.01);
      framesGroup.add(rightLens);
    }
    
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