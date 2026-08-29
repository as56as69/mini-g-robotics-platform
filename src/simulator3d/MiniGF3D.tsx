import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { RobotState } from '../types/robot';

/**
 * Mini G-F: Keychain Companion — metallic keyring medal robot
 * with glowing RGB LED eyes, side antenna nubs, and haptic vibration.
 */
export function MiniGF3D({ state }: { state: RobotState }) {
  const group = useRef<THREE.Group>(null);
  const ledColor = state.gf_ledColor || '#22c55e';

  // Haptic vibration jitter
  useFrame(() => {
    if (!group.current) return;
    if (state.gf_vibrating) {
      group.current.position.x = (Math.random() - 0.5) * 0.05;
      group.current.rotation.z = (Math.random() - 0.5) * 0.06;
    } else {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, 0.2);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.2);
    }
  });

  return (
    <group ref={group} scale={1.35}>
      {/* ==== METAL KEYRING ==== */}
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.055, 20, 48]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Link connector */}
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.14, 0.3, 0.12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* ==== BODY: rounded medal casing ==== */}
      <RoundedBox args={[1.55, 1.4, 0.55]} radius={0.26} smoothness={8} castShadow>
        <meshPhysicalMaterial
          color="#1e293b"
          metalness={0.5}
          roughness={0.3}
          clearcoat={0.85}
          clearcoatRoughness={0.28}
        />
      </RoundedBox>

      {/* Face glass inset (bezel) */}
      <mesh position={[0, 0.05, 0.28]}>
        <planeGeometry args={[1.05, 0.8]} />
        <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.15} />
      </mesh>

      {/* ==== RGB GLOWING EYES ==== */}
      {[-0.26, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.16, 0.3]}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial
            color={ledColor}
            emissive={ledColor}
            emissiveIntensity={2.6}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Eye halo lights */}
      <pointLight position={[-0.3, 0.16, 0.55]} color={ledColor} intensity={2} distance={2.4} />
      <pointLight position={[0.32, 0.14, 0.5]} color={ledColor} intensity={2} distance={2.2} />

      {/* Smile */}
      <mesh position={[0, -0.28, 0.27]}>
        <torusGeometry args={[0.17, 0.022, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#64748b" metalness={0.35} roughness={0.5} />
      </mesh>

      {/* Cute side antennas */}
      {[-0.74, 0.74].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.14, 4, 12]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.7} />
        </mesh>
      ))}

      {/* Bottom brand dot */}
      <mesh position={[0, -0.56, 0.29]}>
        <circleGeometry args={[0.05, 20]} />
        <meshStandardMaterial color="#475569" emissive="#475569" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
