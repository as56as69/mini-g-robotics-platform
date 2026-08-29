import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { ScreenFace } from './ScreenFaceMesh';
import { RobotState } from '../types/robot';

const PERSONA_ACCENTS: Record<string, string> = {
  alkhwarizmi: '#fbbf24',
  astronaut: '#22d3ee',
  einstein: '#c084fc',
  friendly_bot: '#38bdf8',
};

const BODY_WHITE = '#eef2f7';
const JOINT_DARK = '#334155';

/**
 * Mini G: Flagship Humanoid — premium white chassis with colored accents,
 * true shoulder-pivot arms, spinning wheels, and an elegant AI head.
 */
export function MiniG3D({ state }: { state: RobotState }) {
  const bodyRef = useRef<THREE.Group>(null);
  const wheelLRef = useRef<THREE.Group>(null);
  const wheelRRef = useRef<THREE.Group>(null);
  const posRef = useRef({ x: 0, z: 0, heading: 0 });

  const speedL = state.g_wheelSpeedL || 0;
  const speedR = state.g_wheelSpeedR || 0;
  const accent = PERSONA_ACCENTS[state.g_activePersona] || '#38bdf8';

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    // Differential drive kinematics (subtle, indoor speed)
    const linear = ((speedL + speedR) / 100) * 0.9;
    const angular = ((speedR - speedL) / 100) * 1.2;

    const p = posRef.current;
    p.heading += angular * delta;
    p.x = THREE.MathUtils.clamp(p.x + Math.sin(p.heading) * linear * delta, -3.2, 3.2);
    p.z = THREE.MathUtils.clamp(p.z + Math.cos(p.heading) * linear * delta, -2.2, 2.2);

    body.position.x = p.x;
    body.position.z = p.z;
    body.rotation.y = -p.heading;

    // Wheel spin
    const spin = (linear / 0.22) * delta;
    if (wheelLRef.current) wheelLRef.current.rotation.x -= spin;
    if (wheelRRef.current) wheelRRef.current.rotation.x -= spin;
  });

  return (
    <group ref={bodyRef}>
      {/* ===== MOBILE BASE (sleek rounded) ===== */}
      <RoundedBox args={[1.55, 0.4, 1.1]} radius={0.18} smoothness={6} position={[0, 0.32, 0]}>
        <meshPhysicalMaterial color="#f1f5f9" roughness={0.2} metalness={0.15} clearcoat={0.9} clearcoatRoughness={0.1} />
      </RoundedBox>

      {/* Accent light bar (front) */}
      <mesh position={[0, 0.33, 0.56]}>
        <boxGeometry args={[1.3, 0.05, 0.03]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      {/* Drive wheels (dark with colored hubs) */}
      <Wheel x={-0.85} spin={speedL} accent={accent} />
      <Wheel x={0.85} spin={speedR} accent={accent} />

      {/* ===== TORSO (rounded, premium white) ===== */}
      <RoundedBox args={[1.15, 1.2, 0.75]} radius={0.24} smoothness={6} position={[0, 1.08, 0]}>
        <meshPhysicalMaterial color="#f8fafc" roughness={0.18} metalness={0.08} clearcoat={1} clearcoatRoughness={0.05} />
      </RoundedBox>

      {/* Chest LED core (soft glow) */}
      <mesh position={[0, 1.12, 0.39]}>
        <circleGeometry args={[0.11, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.12, 0.55]} color={accent} intensity={0.8} distance={1.8} />

      {/* Chest detail line */}
      <mesh position={[0, 0.78, 0.4]}>
        <boxGeometry args={[0.55, 0.035, 0.02]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ===== ARTICULATED ARMS (shoulder pivot, premium) ===== */}
      <Arm side={-1} angle={state.g_armLeftAngle} accent={accent} />
      <Arm side={1} angle={state.g_armRightAngle} accent={accent} />

      {/* ===== HEAD (friendly rounded) ===== */}
      <group position={[0, 2.05, 0]}>
        {/* Neck */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.26, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Head: smooth rounded white */}
        <RoundedBox args={[1.15, 0.95, 0.85]} radius={0.28} smoothness={8}>
          <meshPhysicalMaterial color="#f8fafc" roughness={0.15} metalness={0.05} clearcoat={1} clearcoatRoughness={0.06} />
        </RoundedBox>

        {/* Face glass inset */}
        <mesh position={[0, 0.0, 0.43]}>
          <planeGeometry args={[0.92, 0.72]} />
          <meshStandardMaterial color="#030a16" roughness={0.08} metalness={0.1} />
        </mesh>

        {/* Animated AI screen */}
        <ScreenFace
          expression="happy"
          accent={accent}
          isTalking={state.g_isTalking}
          width={0.84}
          height={0.66}
          position={[0, 0.0, 0.44]}
        />

        {/* Side ear pods */}
        {[-0.62, 0.62].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.11, 0.1, 6, 16]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Shoulder-pivot articulated arm (natural pose, smooth raise) */
function Arm({ side, angle, accent }: { side: -1 | 1; angle: number; accent: string }) {
  const pivotRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!pivotRef.current) return;
    // Raise arm outward+forward naturally (rotate around Z, slight X tilt)
    const targetZ = THREE.MathUtils.degToRad(side * -(angle || 0) * 0.9);
    const targetX = THREE.MathUtils.degToRad((angle || 0) * 0.35);
    pivotRef.current.rotation.z = THREE.MathUtils.lerp(pivotRef.current.rotation.z, targetZ, 0.14);
    pivotRef.current.rotation.x = THREE.MathUtils.lerp(pivotRef.current.rotation.x, targetX, 0.14);
  });

  return (
    <group position={[side * 0.78, 1.32, 0]}>
      {/* Shoulder joint */}
      <mesh>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.06, 14, 14]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>

      {/* Arm rotates around shoulder */}
      <group ref={pivotRef}>
        {/* Upper arm (rounded capsule, white) */}
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.095, 0.34, 6, 16]} />
          <meshPhysicalMaterial color="#f8fafc" roughness={0.2} clearcoat={0.8} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.3} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.48, 0]}>
          <capsuleGeometry args={[0.08, 0.22, 6, 16]} />
          <meshPhysicalMaterial color="#eef2f7" roughness={0.2} clearcoat={0.8} />
        </mesh>
        {/* Hand (soft glove, accent color) */}
        <mesh position={[0, -0.72, 0]}>
          <sphereGeometry args={[0.1, 18, 18]} />
          <meshPhysicalMaterial color={accent} roughness={0.35} clearcoat={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Drive wheel: dark tire + glowing hub, spins with speed */
function Wheel({ x, spin, accent }: { x: number; spin: number; accent: string }) {
  const wheelRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!wheelRef.current || !spin) return;
    wheelRef.current.rotation.x -= (spin / 100) * 3.2 * delta;
  });

  return (
    <group position={[x, 0.2, 0.1]}>
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.14, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.16, 20]} />
        <meshPhysicalMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Spokes (rotation visible) */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
          <boxGeometry args={[0.13, 0.44, 0.018]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}
