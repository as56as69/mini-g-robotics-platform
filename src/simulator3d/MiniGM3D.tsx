import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox, Cylinder } from '@react-three/drei';
import { ScreenFace } from './ScreenFaceMesh';
import { RobotState } from '../types/robot';

const ACCENT = '#38bdf8';

/**
 * Mini G-M: Elegant Desktop Companion
 * قاعدة دائرية مستقرة، عمود عنق أنيق، ورأس بيضاوي منسجم بشاشة زجاجية.
 * الجسد الافتراضي المكمّل هولوغرافي ناعم وليس عائماً.
 */
export function MiniGM3D({ state }: { state: RobotState }) {
  const headRef = useRef<THREE.Group>(null);
  const antennaBallRef = useRef<THREE.Mesh>(null);

  // Smooth servo head rotation + vertical nod gesture (GM_NOD_HEAD 0x23)
  useFrame(() => {
    if (!headRef.current) return;
    const target = THREE.MathUtils.degToRad(state.gm_headAngle || 0);
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, target, 0.12);
    if (state.gm_nodding) {
      const t = performance.now();
      headRef.current.rotation.x = Math.sin(t / 130) * 0.18;
    } else {
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.2);
    }
    // Antenna ball pulses with the tone (sound indicator)
    const playing = !!state.gm_isPlayingSound;
    const s = playing ? 1 + Math.abs(Math.sin(performance.now() / 120)) * 0.5 : 1;
    if (antennaBallRef.current) {
      antennaBallRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      {/* ===== Desktop Base (weighted circular stand) ===== */}
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.16, 48]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.6} roughness={0.25} clearcoat={0.7} />
      </mesh>
      {/* Base glow ring */}
      <mesh position={[0, -1.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.68, 48]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* ===== NECK (short elegant servo) ===== */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.42, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* ===== HEAD GROUP (rotates on servo) ===== */}
      <group ref={headRef} position={[0, -0.05, 0]}>
        {/* Head: sleek rounded capsule-like casing (white premium) */}
        <RoundedBox args={[1.55, 1.3, 0.9]} radius={0.34} smoothness={8}>
          <meshPhysicalMaterial
            color="#f8fafc"
            roughness={0.15}
            metalness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        </RoundedBox>

        {/* Face glass panel (recessed) */}
        <mesh position={[0, 0, 0.445]}>
          <planeGeometry args={[1.1, 0.88]} />
          <meshStandardMaterial color="#030812" roughness={0.1} metalness={0.2} />
        </mesh>

        {/* Live expression screen (talk lip-sync + custom 8x8 pixel face) */}
        <ScreenFace
          expression={state.gm_expression}
          accent={ACCENT}
          isTalking={!!state.gm_isPlayingSound}
          customFace={state.gm_customFace ?? undefined}
          width={0.98}
          height={0.86}
          position={[0, 0.005, 0.455]}
        />

        {/* Side ear pods (soft cyan) */}
        {[-0.92, 0.92].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.13, 0.14, 6, 18]} />
            <meshStandardMaterial color={ACCENT} emissive="#0284c7" emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
        ))}

        {/* Small top antenna */}
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh ref={antennaBallRef} position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      {/* ===== HOLOGRAPHIC AUGMENTED BODY (soft, semi-transparent) ===== */}
      <group position={[0, -0.95, 0]} visible={false}>
        {/* Placeholder: keep simple; body hidden for cleaner look */}
      </group>
    </group>
  );
}
