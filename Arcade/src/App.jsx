import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import Scene from "./components/Scene";
import CameraLogger from "./components/CameraLogger";
import * as THREE from "three";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function IntroCameraRig({ onIntroDone, controlsRef }) {
  const { camera } = useThree();

  const target = useMemo(() => new THREE.Vector3(0, 1.55, 0), []);
  const introPos = useMemo(() => new THREE.Vector3(10.2, 4.9, 3.8), []);
  const midPos = useMemo(() => new THREE.Vector3(9.6, 4.2, 9.8), []);
  const finalPos = useMemo(() => new THREE.Vector3(6.3, 3.65, 8.1), []);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
  const tmpC = useMemo(() => new THREE.Vector3(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);

  const intro = useRef({ t0: 0, running: false, done: false });

  useFrame((state) => {
    const controls = controlsRef?.current;

    if (!intro.current.running && !intro.current.done) {
      intro.current.running = true;
      intro.current.t0 = state.clock.elapsedTime;
    }

    if (!intro.current.running) return;

    const delay = 0.25;
    const duration = 2.35;
    const t = Math.min(
      1,
      Math.max(0, (state.clock.elapsedTime - intro.current.t0 - delay) / duration)
    );
    const te = easeOutCubic(t);

    // Quadratic bezier: introPos -> midPos -> finalPos.
    const aScale = (1 - te) * (1 - te);
    const bScale = 2 * (1 - te) * te;
    const cScale = te * te;
    tmpA.copy(introPos).multiplyScalar(aScale);
    tmpB.copy(midPos).multiplyScalar(bScale);
    tmpC.copy(finalPos).multiplyScalar(cScale);
    tmpPos.copy(tmpA).add(tmpB).add(tmpC);

    camera.position.copy(tmpPos);
    camera.lookAt(target);

    if (controls) {
      controls.target.copy(target);
      controls.update();
    }

    if (t >= 1) {
      intro.current.running = false;
      intro.current.done = true;
      onIntroDone?.();
    }
  });

  return null;
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const controlsRef = useRef(null);

  return (
    <Canvas
      // Default camera position (log values with <CameraLogger />).
      camera={{ position: [10.2, 4.9, 3.8], fov: 48, near: 0.1, far: 200 }}
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
      <color attach="background" args={["#000000"]} />

      {import.meta.env.DEV ? <CameraLogger every={0.35} /> : null}

      <IntroCameraRig
        onIntroDone={() => setIntroDone(true)}
        controlsRef={controlsRef}
      />

      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enabled={introDone}
        enableDamping
        dampingFactor={0.08}
        target={[0, 1.55, 0]}
        // Allow rotating down to inspect undersides.
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  );
}
