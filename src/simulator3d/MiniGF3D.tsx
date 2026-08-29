import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { RobotState } from '../types/robot';

/**
 * Mini G-F: Premium Keychain Companion
 * أنيق: حلقة معدنية ذهبية، هيكل أبيض لامع بحواف ناعمة،
 * وجه زجاجي داكن بعيون LED متوهجة، وبدون أي عناصر عائمة.
 */
export function MiniGF3D({ state }: { state: RobotState }) {
  const group = useRef<THREE.Group>(null);
  const ledColor = state.gf_ledColor || '#22c55e';

  // Haptic vibration — subtle shake
  useFrame(() => {
    if (!group.current) return;
    if (state.gf_vibrating) {
      group.current.position.x = (Math.random() - 0.5) * 0.045;
      group.current.rotation.z = (Math.random() - 0.5) * 0.05;
    } else {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, 0.15);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.15);
    }
  });

  return (
    <group ref={group} position={[0, 0.3, 0]}>
      {/* ===== Metal Keyring (polished ring) ===== */}
      <mesh position={[0, 1.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.045, 20, 64]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.98} roughness={0.08} />
      </mesh>
      {/* Keyring stem */}
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.16, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* ===== Body: premium rounded pill casing (glossy white) ===== */}
      <RoundedBox args={[1.45, 1.5, 0.6]} radius={0.3} smoothness={8} castShadow>
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.18}
          metalness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.08}
          sheen={0.4}
          sheenColor="#e2e8f0"
        />
      </RoundedBox>

      {/* ===== Face glass inset (recessed dark panel) ===== */}
      <mesh position={[0, 0.05, 0.298]}>
        <planeGeometry args={[1.02, 0.84]} />
        <meshStandardMaterial color="#050912" roughness={0.08} metalness={0.35} />
      </mesh>

      {/* ===== LED eyes: rounded capsule eyes (not spheres) ===== */}
      {[-0.26, 0.28].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0.3]}>
          <capsuleGeometry args={[0.07, 0.1, 4, 16]} />
          <meshStandardMaterial
            color={ledColor}
            emissive={ledColor}
            emissiveIntensity={2.8}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Soft eye glow */}
      <pointLight position={[-0.26, 0.12, 0.55]} color={ledColor} intensity={0.7} distance={1.4} />
      <pointLight position={[0.26, 0.12, 0.55]} color={ledColor} intensity={0.7} distance={1.4} />

      {/* ===== Smile (subtle, recessed) ===== */}
      <mesh position={[0, -0.14, 0.299]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.13, 0.018, 10, 32, Math.PI]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {/* ===== Side antenna nubs (rounded, white) ===== */}
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.1, 0.12, 6, 16]} />
          <meshPhysicalMaterial color="#f8fafc" roughness={0.25} clearcoat={0.8} />
        </mesh>
      ))}

      {/* Bottom engraving dot */}
      <mesh position={[0, -0.62, 0.302]}>
        <circleGeometry args={[0.035, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
