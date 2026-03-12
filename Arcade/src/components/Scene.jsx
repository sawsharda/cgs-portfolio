import Lighting from "./Lighting";
import ShopModel from "./ShopModel";
import Backdrop from "./Backdrop";
import { Bounds } from "@react-three/drei";

export default function Scene() {
  return (
    <>
      <Backdrop />
      <fog attach="fog" args={["#090a1a", 22, 110]} />

      <Lighting />

      <Bounds fit observe margin={1.15}>
        <ShopModel />
      </Bounds>
    </>
  );
}
