export default function Lighting() {
  return (
    <>
      {/* Daylight-style studio lighting: even, neutral, from all sides. */}
      <ambientLight intensity={0.45} />
      <hemisphereLight intensity={0.65} color="#e8f2ff" groundColor="#1b1f2b" />

      {/* Key */}
      <directionalLight
        position={[6, 9, 6]}
        intensity={1.15}
        color="#ffffff"
        castShadow
        shadow-bias={-0.00015}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill */}
      <directionalLight position={[-7, 6, 4]} intensity={0.8} color="#f3fbff" />

      {/* Back/rim */}
      <directionalLight position={[0, 5, -10]} intensity={0.55} color="#e9e3ff" />

      {/* Very soft cyber tint (kept subtle so it still feels like daylight). */}
      <pointLight position={[8, 3, 2]} intensity={0.35} distance={60} decay={2} color="#00e5ff" />
      <pointLight position={[-8, 3, 2]} intensity={0.28} distance={60} decay={2} color="#ff2bd6" />
    </>
  );
}
