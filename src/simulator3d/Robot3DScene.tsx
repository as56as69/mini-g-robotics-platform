import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { RobotState } from '../types/robot';
import { MiniGF3D } from './MiniGF3D';
import { MiniGM3D } from './MiniGM3D';
import { MiniG3D } from './MiniG3D';

interface Robot3DSceneProps {
  state: RobotState;
}

/**
 * Premium WebGL scene: soft studio lighting, gentle contact shadows,
 * subtle reflective floor, smooth orbit camera — no harsh glows.
 */
export default function Robot3DScene({ state }: { state: RobotState }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.2, 4.4], fov: 40 }}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.1 }}
      style={{ background: 'radial-gradient(ellipse at 50% 115%, #182036 0%, #0c1220 55%, #050810 100%)' }}
    >
      {/* ==== SOFT LIGHTING RIG (3-point studio style) ==== */}
      <ambientLight intensity={0.6} />
      {/* Main key light (soft white, top-right) */}
      <directionalLight
        position={[3, 5.5, 4]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={18}
        shadow-bias={-0.0002}
      />
      {/* Cool soft fill from left */}
      <directionalLight position={[-4, 2.5, 2]} intensity={0.32} color="#a5b4fc" />
      {/* Gentle rim from behind */}
      <directionalLight position={[1, 3, -4]} intensity={0.3} color="#c4b5fd" />

      {/* ==== ENVIRONMENT (procedural studio — fully offline, no CDN fetch) ==== */}
      <Environment resolution={256} frames={1}>
        <group>
          <Lightformer form="rect" intensity={3.2} color="#e8f6ff" position={[0, 4, -9]} scale={[12, 6, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-6, 2, 3]} rotation={[0, Math.PI / 2.4, 0]} scale={[8, 4, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#cfe8ff" position={[6, 1.5, 2]} rotation={[0, -Math.PI / 2.4, 0]} scale={[8, 4, 1]} />
          <Lightformer form="ring" intensity={1.1} color="#b6a3ff" position={[0, 5, 4]} scale={6} />
          <Lightformer form="rect" intensity={0.8} color="#0a3b61" position={[0, -4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
        </group>
      </Environment>

      {/* ==== ROBOT (auto-centered per model) ==== */}
      <group position={[0, -0.15, 0]}>
        {state.model === 'mini_gf' && <MiniGF3D state={state} />}
        {state.model === 'mini_gm' && <MiniGM3D state={state} />}
        {state.model === 'mini_g' && <MiniG3D state={state} />}
      </group>

      {/* Elegant floor: dark disc with soft contact shadow */}
      <ContactShadows
        position={[0, -1.42, 0]}
        opacity={0.45}
        scale={7.5}
        blur={3}
        far={3.4}
        color="#000208"
      />
      <mesh position={[0, -1.63, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.8, 64]} />
        <meshStandardMaterial color="#0d1424" roughness={0.42} metalness={0.55} />
      </mesh>

      {/* Subtle floor accent ring */}
      <mesh position={[0, -1.615, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.62, 72]} />
        <meshStandardMaterial
          color={state.model === 'mini_g' ? '#8b5cf6' : state.model === 'mini_gm' ? '#38bdf8' : '#fbbf24'}
          emissive={state.model === 'mini_g' ? '#8b5cf6' : state.model === 'mini_gm' ? '#38bdf8' : '#fbbf24'}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* ==== CAMERA (smooth orbit + zoom) ==== */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={8.5}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={!state.connected}
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.07}
      />
    </Canvas>
  );
}
