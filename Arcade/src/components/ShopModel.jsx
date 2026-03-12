import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

export default function ShopModel() {
  const SHOP_MODEL_URL = "/models/shop/shop.glb";
  const { scene } = useGLTF(SHOP_MODEL_URL);

  useEffect(() => {
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

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const material of materials) {
        if (!material) continue;

        // This model exports most materials with emissiveFactor [1,1,1],
        // which blows everything out to white. Tone it down.
        if ("emissiveIntensity" in material) {
          const n = (material.name || "").toLowerCase();
          const isNeon = n.includes("neon") || n.includes("panel") || n.includes("sign") || n.includes("pixel");
          material.emissiveIntensity = isNeon ? 0.6 : 0.06;
        }

        // Keep most materials single-sided (cleaner), but make very thin
        // plane-like geometry double-sided so it doesn't disappear when
        // you rotate below/behind it.
        if ("side" in material && obj.geometry) {
          if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
          const bb = obj.geometry.boundingBox;
          if (bb) {
            const size = new THREE.Vector3();
            bb.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const minDim = Math.min(size.x, size.y, size.z);
            const isThin = maxDim > 0 && minDim / maxDim < 0.02;
            material.side = isThin ? THREE.DoubleSide : THREE.FrontSide;
          } else {
            material.side = THREE.FrontSide;
          }
        }

        material.needsUpdate = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={1.5}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload("/models/shop/shop.glb");
