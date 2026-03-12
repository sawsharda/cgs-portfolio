import * as THREE from "three";

export default function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[70, 70]} />
      <meshStandardMaterial
        color="#090b12"
        roughness={0.35}
        metalness={0.65}
        emissive="#0a0016"
        emissiveIntensity={0.22}
      />
    </mesh>
  );
}
