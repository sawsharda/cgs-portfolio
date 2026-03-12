import * as THREE from "three";

function LedBar({ position, rotation, color, length = 6, thickness = 0.06 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[thickness, 2.6, length]} />
      <meshStandardMaterial
        color="#05060a"
        roughness={0.55}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={2.4}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function NeonRig() {
  return (
    <group>
      {/* Two vertical LED pillars framing the model */}
      <LedBar position={[-3.8, 1.4, -1.5]} rotation={[0, 0.15, 0]} color="#00e5ff" />
      <LedBar position={[3.8, 1.4, -1.5]} rotation={[0, -0.15, 0]} color="#ff2bd6" />

      {/* Overhead crossbar */}
      <mesh position={[0, 3.1, -1.6]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[8.4, 0.08, 0.12]} />
        <meshStandardMaterial
          color="#05060a"
          roughness={0.55}
          metalness={0.6}
          emissive="#7c3cff"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Holo rings */}
      <mesh position={[0, 1.2, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.02, 16, 180]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={3.0}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 2.0, -1.35]} rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[2.2, 0.018, 16, 180]} />
        <meshStandardMaterial
          color="#ff2bd6"
          emissive="#ff2bd6"
          emissiveIntensity={2.8}
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Distant glow panels */}
      <mesh position={[-10, 3.5, -18]} rotation={[0, 0.4, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[11, 4.2, -16]} rotation={[0, -0.35, 0]}>
        <planeGeometry args={[9, 4.5]} />
        <meshBasicMaterial
          color="#ff2bd6"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

