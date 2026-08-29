import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { ScreenFace } from './ScreenFaceMesh';
import { RobotState } from '../types/robot';

const ACCENT = '#38bdf8';

/**
 * Mini G-M: Desktop Companion — rotating head on a servo neck,
 * animated OLED expression screen, and a holographic augmented body.
 */
export function MiniGM3D({ state }: { state: RobotState }) {
  const headRef = useRef<THREE.Group>(null);

  // Smooth servo head rotation
  useFrame(() => {
    if (!headRef.current) return;
    const target = THREE.MathUtils.degToRad(state.gm_headAngle || 0);
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, target, 0.12);
  });

  return (
    <group position={[0, -0.4, 0]}>
      {/* ==== AUGMENTED BODY (holographic lower half) ==== */}
      {/* Torso */}
      <RoundedBox args={[1.5, 1.5, 0.75]} radius={0.22} position={[0, -1.25, 0]}>
        <meshPhysicalMaterial
          color="#1e293b"
          transparent
          opacity={0.55}
          roughness={0.2}
          metalness={0.35}
          transmission={0.4}
          clearcoat={0.6}
        />
      </RoundedBox>

      {/* Core glowing badge */}
      <mesh position={[0, -1.22, 0.55]}>
        <circleGeometry args={[0.16, 32]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -1.25, 0.5]} color="#0ea5e9" intensity={1.2} distance={2.2} />

      {/* Augmented arms */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.95, -1.05, 0]}>
          <mesh rotation={[0, 0, (Math.PI / 2) * -side]}>
            <capsuleGeometry args={[0.11, 0.5, 6, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.8} transparent opacity={0.75} />
          </mesh>
          {/* hand sphere */}
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} emissive="#0284c7" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Legs (holographic) */}
      {[-0.42, 0.42].map((x, i) => (
        <mesh key={i} position={[x * 0.8, -2.25, 0]}>
          <capsuleGeometry args={[0.16, 0.42, 4, 14]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.55} emissive="#0369a1" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* ==== PHYSICAL HEAD + NECK ==== */}
      <group ref={headRef} position={[0, 0.15, 0]}>
        {/* Neck servo cylinder */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 0.34, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.35} />
        </mesh>

        {/* Head casing */}
        <RoundedBox args={[1.75, 1.45, 0.85]} radius={0.3} smoothness={6} position={[0, 0.35, 0]}>
          <meshPhysicalMaterial color="#0f172a" roughness={0.25} metalness={0.45} clearcoat={0.9} clearcoatRoughness={0.2} />
        </RoundedBox>

        {/* Screen bezel */}
        <RoundedBox args={[1.42, 1.12, 0.06]} radius={0.08} position={[0, 0.05, 0.27]}>
          <meshStandardMaterial color="#020617" roughness={0.35} metalness={0.2} />
        </RoundedBox>

        {/* Animated expression screen */}
        <ScreenFace
          expression={state.gm_expression}
          accent={ACCENT}
          isTalking={false}
          width={1.06}
          height={0.86}
          position={[0, 0.06, 0.3]}
        />

        {/* Top antenna */}
        <mesh position={[0, 0.92, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.42, 10]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
