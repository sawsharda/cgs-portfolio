export default function NeonSign({ position }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[3, 0.4, 0.2]} />
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={4}
      />
    </mesh>
  );
}