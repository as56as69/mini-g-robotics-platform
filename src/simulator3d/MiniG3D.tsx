import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { ScreenFace } from './ScreenFaceMesh';
import { RobotState } from '../types/robot';

const PERSONA_ACCENTS: Record<string, string> = {
  alkhwarizmi: '#fbbf24',
  astronaut: '#06b6d4',
  einstein: '#c084fc',
  friendly_bot: '#a855f7',
};

/**
 * Mini G: 50cm AI Humanoid — differential-drive wheeled base,
 * shoulder-pivot articulated arms, and an animated persona screen head.
 * Wheels visually spin & the chassis glides according to wheel speeds.
 */
export function MiniG3D({ state }: { state: RobotState }) {
  const bodyRef = useRef<THREE.Group>(null);
  const wheelLRef = useRef<THREE.Group>(null);
  const wheelRRef = useRef<THREE.Group>(null);
  const posRef = useRef({ x: 0, z: 0, heading: 0 });
  const spinRef = useRef(0);

  const speedL = state.g_wheelSpeedL || 0;
  const speedR = state.g_wheelSpeedR || 0;
  const accent = PERSONA_ACCENTS[state.g_activePersona] || '#a855f7';

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    // Differential drive kinematics
    const linear = ((speedL + speedR) / 100) * 1.4;
    const angular = ((speedR - speedL) / 100) * 1.8;

    const p = posRef.current;
    p.heading += angular * delta;
    p.x = THREE.MathUtils.clamp(p.x + Math.sin(p.heading) * linear * delta, -4, 4);
    p.z = THREE.MathUtils.clamp(p.z + Math.cos(p.heading) * linear * delta, -2.6, 2.6);

    body.position.x = p.x;
    body.position.z = p.z;
    body.rotation.y = -p.heading;

    // Wheel spin visual
    spinRef.current += (linear / 0.26) * delta;
    if (wheelLRef.current) wheelLRef.current.rotation.x = spinRef.current;
    if (wheelRRef.current) wheelRRef.current.rotation.x = spinRef.current;
  });

  return (
    <group ref={bodyRef}>
      {/* ==== WHEELED BASE ==== */}
      <RoundedBox args={[1.7, 0.42, 1.25]} radius={0.16} smoothness={4} position={[0, 0.38, 0]}>
        <meshPhysicalMaterial color="#111133" roughness={0.3} metalness={0.55} clearcoat={0.7} />
      </RoundedBox>

      {/* Purple trim stripe */}
      <mesh position={[0, 0.42, 0.63]}>
        <boxGeometry args={[1.6, 0.07, 0.04]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>

      {/* Drive wheels (spin visually) */}
      <DriveWheel x={-0.95} speed={speedL} color="#a855f7" />
      <DriveWheel x={0.92} speed={speedR} color="#8b5cf6" />

      {/* ==== TORSO ==== */}
      <RoundedBox args={[1.35, 1.15, 0.9]} radius={0.22} smoothness={5} position={[0, 1.12, 0]}>
        <meshPhysicalMaterial color="#221a4b" roughness={0.28} metalness={0.5} clearcoat={0.85} />
      </RoundedBox>

      {/* AI core pulse */}
      <mesh position={[0, 1.08, 0.56]}>
        <sphereGeometry args={[0.15, 22, 22]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.1, 0.6]} color="#ec4899" intensity={1.1} distance={2.2} />

      {/* Chest vent lines */}
      {[0.78, 0.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0.54]}>
          <boxGeometry args={[0.62, 0.05, 0.03]} />
          <meshStandardMaterial color="#312e81" emissive="#4c1d95" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* ==== ARTICULATED ARMS ==== */}
      <ShoulderArm side={-1} angle={state.g_armLeftAngle} color="#7c3aed" />
      <ShoulderArm side={1} angle={state.g_armRightAngle} color="#a855f7" />

      {/* ==== AI HEAD ==== */}
      <group position={[0, 2.0, 0]}>
        <RoundedBox args={[1.42, 1.02, 0.9]} radius={0.24} smoothness={5}>
          <meshPhysicalMaterial color="#0f0b26" roughness={0.26} metalness={0.55} clearcoat={0.85} />
        </RoundedBox>

        {/* bezel */}
        <RoundedBox args={[1.3, 0.96, 0.05]} radius={0.07} position={[0, 0, 0.44]}>
          <meshStandardMaterial color="#020617" roughness={0.4} />
        </RoundedBox>

        {/* Animated AI persona screen with lip-sync */}
        <ScreenFace
          expression="happy"
          accent={accent}
          isTalking={state.g_isTalking}
          width={0.98}
          height={0.76}
          position={[0, 0, 0.4]}
        />

        {/* Persona halo ring */}
        <mesh position={[0, 0.6, 0.3]}>
          <torusGeometry args={[0.1, 0.02, 10, 28]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Shoulder-pivot articulated arm */
function ShoulderArm({ side, angle, color }: { side: -1 | 1; angle: number; color: string }) {
  const pivotRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!pivotRef.current) return;
    const target = THREE.MathUtils.degToRad(side * -(angle || 0));
    pivotRef.current.rotation.x = THREE.MathUtils.lerp(pivotRef.current.rotation.x, target, 0.15);
  });

  return (
    <group position={[side * 0.8, 1.42, 0]}>
      {/* Shoulder joint */}
      <mesh>
        <sphereGeometry args={[0.15, 20, 20]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Arm rotates forward around X axis from the shoulder */}
      <group ref={pivotRef}>
        <mesh position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.1, 0.46, 6, 16]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0, -0.58, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#5b21b6" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.78, 0]}>
          <sphereGeometry args={[0.11, 18, 18]} />
          <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.55} />
        </mesh>
      </group>
    </group>
  );
}

/** Drive wheel with visible spin markers */
function DriveWheel({ x, color, speed }: { x: number; color: string; speed: number }) {
  const wheelRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!wheelRef.current || !speed) return;
    wheelRef.current.rotation.x -= (speed / 100) * 4 * delta;
  });

  return (
    <group position={[x, 0.26, 0.14]} ref={wheelRef}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.27, 0.27, 0.16, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.75} metalness={0.25} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.18, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      {/* Spoke markers so spin is clearly visible */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
          <boxGeometry args={[0.16, 0.5, 0.02]} />
          <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
