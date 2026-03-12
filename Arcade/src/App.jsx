import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Scene from "./components/Scene";
import * as THREE from "three";

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 3, 10], fov: 50, near: 0.1, far: 200 }}
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 0.95;
      }}
    >
      <color attach="background" args={["#070812"]} />

      <Scene />

      <OrbitControls
        // Allow rotating down to inspect undersides.
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  );
}
