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
    <primitive
      object={scene}
      scale={1.5}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload("/models/shop/shop.glb");
