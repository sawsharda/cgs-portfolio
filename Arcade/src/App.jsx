import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import Scene from "./components/Scene";
import CameraLogger from "./components/CameraLogger";
import * as THREE from "three";

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

const CAMERA_SPLINE_POINTS = [
  [8.28, 6.743, 4.324],
  [2.624, 1.722, 3.002],
  [-1.057, 1.114, 2.579],
  [-2.976, 0.383, 0.808],
  [-2.905, 0.571, 0.634],
  [-2.500, 0.850, -0.800],
  [-0.803, 1.130, 0.191],
];

const LOOK_SPLINE_POINTS = [
  [-0.611, 0.264, -0.308],
  [-0.546, 0.333, -0.239],
  [-0.137, 0.327, -0.153],
  [-0.1, 0.175, 0.024],
  [0.003, -0.450, -0.085],
  [0.100, 0.400, -0.080],
  [0.196, 0.892, -0.066],
];

function ScrollPathCameraRig({ onTelemetry, jumpRequest, enabled }) {
  const { camera } = useThree();
  const heroProgress = 0;
  const progress = useRef(0);
  const targetProgress = useRef(heroProgress);
  const introElapsed = useRef(0);
  const introDone = useRef(false);
  const lastJumpId = useRef(null);
  const telemetryAccumulator = useRef(0);
  const lookPoint = useMemo(() => new THREE.Vector3(), []);

  const cameraPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAMERA_SPLINE_POINTS.map(
          (point) => new THREE.Vector3(point[0], point[1], point[2]),
        ),
      ),
    [],
  );
  const lookPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        LOOK_SPLINE_POINTS.map(
          (point) => new THREE.Vector3(point[0], point[1], point[2]),
        ),
      ),
    [],
  );

  useEffect(() => {
    const onWheel = (event) => {
      event.preventDefault();
      if (!introDone.current) return;
      targetProgress.current = clamp01(
        targetProgress.current + event.deltaY * 0.00045,
      );
    };

    const onKeyDown = (event) => {
      if (!introDone.current) return;
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        targetProgress.current = clamp01(targetProgress.current + 0.055);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        targetProgress.current = clamp01(targetProgress.current - 0.055);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useFrame((_, delta) => {
    if (!enabled) return;

    if (jumpRequest && jumpRequest.id !== lastJumpId.current) {
      lastJumpId.current = jumpRequest.id;
      introDone.current = true;
      targetProgress.current = clamp01(jumpRequest.progress);
      progress.current = clamp01(jumpRequest.progress);
    }

    if (!introDone.current) {
      introElapsed.current += delta;
      const introT = clamp01((introElapsed.current - 0.08) / 1.9);
      const easedIntro = THREE.MathUtils.smootherstep(introT, 0, 1);
      progress.current = THREE.MathUtils.lerp(0, heroProgress, easedIntro);
      targetProgress.current = progress.current;
      if (introT >= 1) {
        introDone.current = true;
        targetProgress.current = heroProgress;
      }
    }

    progress.current = THREE.MathUtils.damp(
      progress.current,
      targetProgress.current,
      5,
      delta,
    );
    const t = THREE.MathUtils.smootherstep(progress.current, 0, 1);
    camera.position.copy(cameraPath.getPointAt(t));
    lookPoint.copy(lookPath.getPointAt(t));
    camera.lookAt(lookPoint);

    telemetryAccumulator.current += delta;
    if (telemetryAccumulator.current >= 0.08 && onTelemetry) {
      telemetryAccumulator.current = 0;
      onTelemetry({
        progress: progress.current,
        targetProgress: targetProgress.current,
        camera: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        },
        look: {
          x: lookPoint.x,
          y: lookPoint.y,
          z: lookPoint.z,
        },
      });
    }
  });

  return null;
}

function FreeCameraTelemetry({ onTelemetry, controlsRef, enabled }) {
  const { camera } = useThree();
  const accumulator = useRef(0);

  useFrame((_, delta) => {
    if (!enabled || !onTelemetry) return;
    accumulator.current += delta;
    if (accumulator.current < 0.08) return;
    accumulator.current = 0;

    const target = controlsRef.current?.target;
    onTelemetry({
      progress: 0,
      targetProgress: 0,
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      look: {
        x: target?.x ?? 0,
        y: target?.y ?? 0,
        z: target?.z ?? 0,
      },
    });
  });

  return null;
}

export default function App() {
  const checkpoints = useMemo(
    () =>
      CAMERA_SPLINE_POINTS.map((_, index) => {
        if (CAMERA_SPLINE_POINTS.length <= 1) return 0;
        return index / (CAMERA_SPLINE_POINTS.length - 1);
      }),
    [],
  );
  const [freeMove, setFreeMove] = useState(true);
  const [telemetry, setTelemetry] = useState({
    progress: 0,
    targetProgress: 0,
    camera: { x: 0, y: 0, z: 0 },
    look: { x: 0, y: 0, z: 0 },
  });
  const [jumpRequest, setJumpRequest] = useState(null);
  const controlsRef = useRef(null);

  const goToCheckpoint = (direction) => {
    const current = telemetry.targetProgress;
    if (direction > 0) {
      const next = checkpoints.find((value) => value > current + 0.001);
      if (next != null) setJumpRequest({ id: Date.now(), progress: next });
      return;
    }

    const reversed = [...checkpoints].reverse();
    const prev = reversed.find((value) => value < current - 0.001);
    if (prev != null) setJumpRequest({ id: Date.now(), progress: prev });
  };

  return (
    <div className="scroll-layout">
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 20,
          color: "#ccfbff",
          background: "rgba(5, 11, 24, 0.78)",
          border: "1px solid rgba(90, 236, 255, 0.4)",
          borderRadius: 10,
          padding: "10px 12px",
          minWidth: 248,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 11,
          lineHeight: 1.45,
          boxShadow: "0 0 18px rgba(68, 220, 255, 0.2)",
          userSelect: "none",
        }}
      >
        <div style={{ marginBottom: 8, color: "#8ff6ff" }}>CAMERA LOGGER</div>
        <button
          type="button"
          onClick={() => setFreeMove((prev) => !prev)}
          style={{
            marginBottom: 8,
            width: "100%",
            background: freeMove ? "#18465a" : "#2a243d",
            color: "#bff9ff",
            border: "1px solid rgba(90, 236, 255, 0.5)",
            borderRadius: 6,
            padding: "6px 8px",
            cursor: "pointer",
          }}
        >
          {freeMove ? "Free Move: ON" : "Spline Mode: ON"}
        </button>
        <div>P: {telemetry.progress.toFixed(3)}</div>
        <div>TP: {telemetry.targetProgress.toFixed(3)}</div>
        <div>
          C: [{telemetry.camera.x.toFixed(3)}, {telemetry.camera.y.toFixed(3)},{" "}
          {telemetry.camera.z.toFixed(3)}]
        </div>
        <div>
          L: [{telemetry.look.x.toFixed(3)}, {telemetry.look.y.toFixed(3)},{" "}
          {telemetry.look.z.toFixed(3)}]
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => goToCheckpoint(-1)}
            disabled={freeMove}
            style={{
              flex: 1,
              background: freeMove ? "#1a2131" : "#0f2e3c",
              color: freeMove ? "#8398aa" : "#bff9ff",
              border: "1px solid rgba(90, 236, 255, 0.5)",
              borderRadius: 6,
              padding: "6px 8px",
              cursor: freeMove ? "not-allowed" : "pointer",
            }}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => goToCheckpoint(1)}
            disabled={freeMove}
            style={{
              flex: 1,
              background: freeMove ? "#1a2131" : "#0f2e3c",
              color: freeMove ? "#8398aa" : "#bff9ff",
              border: "1px solid rgba(90, 236, 255, 0.5)",
              borderRadius: 6,
              padding: "6px 8px",
              cursor: freeMove ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
        <div style={{ marginTop: 10, color: "#8ff6ff" }}>Camera Spline</div>
        {CAMERA_SPLINE_POINTS.map((point, index) => (
          <div key={`cam-${index}`}>
            {index}: new THREE.Vector3({point[0]}, {point[1]}, {point[2]})
          </div>
        ))}
        <div style={{ marginTop: 8, color: "#8ff6ff" }}>Look Spline</div>
        {LOOK_SPLINE_POINTS.map((point, index) => (
          <div key={`look-${index}`}>
            {index}: new THREE.Vector3({point[0]}, {point[1]}, {point[2]})
          </div>
        ))}
      </div>

      <div className="canvas-shell">
        <Canvas
          // Default camera position (log values with <CameraLogger />).
          camera={{ position: [10.2, 4.9, 3.8], fov: 33, near: 0.1, far: 200 }}
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

          <ScrollPathCameraRig
            onTelemetry={setTelemetry}
            jumpRequest={jumpRequest}
            enabled={!freeMove}
          />
          <FreeCameraTelemetry
            onTelemetry={setTelemetry}
            controlsRef={controlsRef}
            enabled={freeMove}
          />

          <OrbitControls
            ref={controlsRef}
            enabled={freeMove}
            enableDamping
            dampingFactor={0.08}
          />
          <Scene />
        </Canvas>
      </div>

      <div className="scroll-spacer" />
    </div>
  );
}
