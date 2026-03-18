import { useGLTF, useScroll } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import HoverCard from "./HoverCard";

export default function ShopModel({ machineHoverEnabled = false }) {
  const SHOP_MODEL_URL = "/models/shop/shop.glb";
  const { scene } = useGLTF(SHOP_MODEL_URL);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [popupPos, setPopupPos] = useState([0, 0, 0]);
  const groupRef = useRef();
  const hoverTimeout = useRef(null);
  const isHoveringCard = useRef(false);

  // Cache the root cabinet nodes to build virtual hitboxes
  const cabinetsRef = useRef([]);

  const scroll = useScroll();

  const cancelCloseTimeout = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  const startCloseTimeout = () => {
    if (hoveredNode && !hoverTimeout.current && !isHoveringCard.current) {
      hoverTimeout.current = setTimeout(() => {
        window.__DEBUG_CABINET = "None";
        window.__DEBUG_POS = "None";
        setHoveredNode(null);
        document.body.style.cursor = "auto";
        hoverTimeout.current = null;
      }, 150); // Using 150ms heavily reduces jitter from minor raycast gaps
    }
  };

  useFrame(() => {
    if (!machineHoverEnabled) {
      if (hoveredNode) {
        setHoveredNode(null);
        window.__DEBUG_CABINET = "None";
        window.__DEBUG_POS = "None";
        document.body.style.cursor = "auto";
      }
      return;
    }

    // If the card is open, and the user scrolls their camera away from the arcade section (below offset 0.8), close the card!
    if (scroll && hoveredNode) {
      if (scroll.offset < 0.8) {
        setHoveredNode(null);
        window.__DEBUG_CABINET = "None";
        document.body.style.cursor = "auto";
      }
    }
  });

  const getArcadeCabinet = (obj) => {
    let current = obj;
    while (current) {
      if (current.name) {
        const n = current.name.toLowerCase();
        if (
          n.includes("cabinet") ||
          (n.includes("arcade") &&
            !n.includes("building") &&
            !n.includes("sign"))
        ) {
          return current;
        }
      }
      current = current.parent;
    }
    return null;
  };

  const handlePointerMove = (e) => {
    if (!machineHoverEnabled) {
      if (hoveredNode) setHoveredNode(null);
      document.body.style.cursor = "auto";
      return;
    }

    if (e.intersections.length > 0 && e.intersections[0].object) {
      let curr = e.intersections[0].object;
      let path = [];
      while (curr && path.length < 3) {
        if (curr.name) path.push(curr.name);
        curr = curr.parent;
      }
      window.__DEBUG_RAW_HIT = path.join(" > ");
    }

    let foundCabinet = null;
    for (const hit of e.intersections) {
      const cabinet = getArcadeCabinet(hit.object);
      if (cabinet) {
        foundCabinet = cabinet;
        break;
      }
    }

    // IF the ray hit the building walls instead of the screen panel,
    // mathematically check if the hit position is physically inside the expanded 3D bounds of ANY known cabinet!
    if (!foundCabinet && e.intersections.length > 0) {
      const point = e.intersections[0].point;
      for (const cab of cabinetsRef.current) {
        const box = new THREE.Box3().setFromObject(cab);
        // Expand the bounds by 0.3 units (~30cm) to perfectly envelop the un-differentiated plastic side panels
        box.expandByScalar(0.3);
        if (box.containsPoint(point)) {
          foundCabinet = cab;
          break;
        }
      }
    }

    if (foundCabinet) {
      e.stopPropagation();
      cancelCloseTimeout();

      if (!hoveredNode || hoveredNode.uuid !== foundCabinet.uuid) {
        setHoveredNode(foundCabinet);

        const box = new THREE.Box3().setFromObject(foundCabinet);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const targetWorldPos = new THREE.Vector3(
          center.x,
          center.y + 0.1,
          center.z,
        );

        if (groupRef.current) {
          groupRef.current.worldToLocal(targetWorldPos);
          window.__DEBUG_CABINET = foundCabinet.name;
          window.__DEBUG_POS = `[${targetWorldPos.x.toFixed(2)}, ${targetWorldPos.y.toFixed(2)}, ${targetWorldPos.z.toFixed(2)}]`;
          setPopupPos([targetWorldPos.x, targetWorldPos.y, targetWorldPos.z]);
        }
      }
      document.body.style.cursor = "pointer";
    } else {
      startCloseTimeout();
    }
  };

  const handlePointerOut = (e) => {
    if (!machineHoverEnabled) return;
    startCloseTimeout();
  };

  const handleClick = (e) => {
    if (!machineHoverEnabled) return;
    for (const hit of e.intersections) {
      const cabinet = getArcadeCabinet(hit.object);
      if (cabinet) {
        e.stopPropagation();
        window.open("https://cgs.website/game", "_blank");
        return;
      }
    }
  };

  useEffect(() => {
    if (machineHoverEnabled) return;

    cancelCloseTimeout();
    isHoveringCard.current = false;
    setHoveredNode(null);
    window.__DEBUG_CABINET = "None";
    window.__DEBUG_POS = "None";
    document.body.style.cursor = "auto";
  }, [machineHoverEnabled]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
      clearTimeout(hoverTimeout.current);
    };
  }, []);

  useEffect(() => {
    // Pre-cache all valid cabinet roots for proximity hit-testing
    const cabs = [];
    scene.children.forEach((child) => {
      if (child.name && child.name.toLowerCase().includes("cabinet")) {
        cabs.push(child);
      }
    });
    cabinetsRef.current = cabs;

    scene.traverse((obj) => {
      if (!obj || !obj.isMesh) return;

      // Optionally hide baked-in ground/base meshes from the asset.
      // Keeps the scene clean since we're not using a separate floor.
      const objName = (obj.name || "").toLowerCase();
      if (objName.includes("ddrfloor") || objName.includes("dioramabase")) {
        obj.visible = false;
        return;
      }

      obj.castShadow = true;
      obj.receiveShadow = true;
      // Some exported meshes have odd bounds; this prevents view-dependent popping.
      obj.frustumCulled = false;

      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      for (const material of materials) {
        if (!material) continue;

        // This model exports most materials with emissiveFactor [1,1,1],
        // which blows everything out to white. Tone it down.
        if ("emissiveIntensity" in material) {
          const n = (material.name || "").toLowerCase();
          const isNeon =
            n.includes("neon") ||
            n.includes("panel") ||
            n.includes("sign") ||
            n.includes("pixel");
          material.emissiveIntensity = isNeon ? 0.6 : 0.06;
        }

        // The asset declares most materials as double-sided; keep it consistent
        // so geometry doesn't disappear when you rotate underneath/behind.
        if ("side" in material) material.side = THREE.DoubleSide;

        // Fix view-dependent popping: the GLB uses alphaMode=BLEND widely, which
        // causes depth sorting artifacts when orbiting. Convert to stable cutout.
        if ("transparent" in material && material.transparent) {
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = true;
          material.depthTest = true;
          material.alphaTest = Math.max(material.alphaTest || 0, 0.25);
          material.alphaToCoverage = true;
          material.blending = THREE.NormalBlending;
        }

        material.needsUpdate = true;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} scale={1.5} position={[0, 0, 0]}>
      <primitive
        object={scene}
        onPointerMove={machineHoverEnabled ? handlePointerMove : undefined}
        onPointerOut={machineHoverEnabled ? handlePointerOut : undefined}
        onClick={machineHoverEnabled ? handleClick : undefined}
      />
      <HoverCard
        position={popupPos}
        visible={machineHoverEnabled && !!hoveredNode}
        onClick={() => window.open("https://cgs.website/game", "_blank")}
        onPointerOver={() => {
          if (!machineHoverEnabled) return;
          isHoveringCard.current = true;
          cancelCloseTimeout();
        }}
        onPointerOut={() => {
          if (!machineHoverEnabled) return;
          isHoveringCard.current = false;
          startCloseTimeout();
        }}
      />
    </group>
  );
}

useGLTF.preload("/models/shop/shop.glb");
