import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { RobotState } from '../types/robot';
import { MiniGF3D } from './MiniGF3D';
import { MiniGM3D } from './MiniGM3D';
import { MiniG3D } from './MiniG3D';

interface Robot3DSceneProps {
  state: RobotState;
}

/**
 * The main WebGL scene: lighting rig, reflective floor, soft shadows,
 * orbit camera controls, and the live robot digital twin.
 */
export default function Robot3DScene({ state }: { state: RobotState }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 4.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'radial-gradient(ellipse at 50% 120%, #1e1b4b 0%, #0f172a 55%, #020617 100%)' }}
    >
      {/* ==== LIGHTING RIG ==== */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[3.5, 5, 3.5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={16}
      />
      {/* Cool fill light from the left */}
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#818cf8" />
      {/* Warm rim light from behind */}
      <directionalLight position={[-2, 3, -4]} intensity={0.4} color="#f0abfc" />

      {/* ==== ENVIRONMENT (subtle reflections) ==== */}
      <Environment preset="city" background={false} />

      {/* ==== ROBOT MODEL ==== */}
      <group position={[0, -0.55, 0]}>
        {state.model === 'mini_gf' && <MiniGF3D state={state} />}
        {state.model === 'mini_gm' && <MiniGM3D state={state} />}
        {state.model === 'mini_g' && <MiniG3D state={state} />}
      </group>

      {/* Soft contact shadow under the robot */}
      <ContactShadows position={[0, -1.62, 0]} opacity={0.6} scale={9} blur={2.6} far={3.2} color="#010409" />

      {/* Reflective dark floor disc */}
      <mesh position={[0, -1.63, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.5, 64]} />
        <meshStandardMaterial color="#0a0f1c" roughness={0.35} metalness={0.65} />
      </mesh>

      {/* ==== CAMERA CONTROLS (drag to orbit, wheel to zoom) ==== */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3.2}
        maxDistance={9}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate={!state.connected}
        autoRotateSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
