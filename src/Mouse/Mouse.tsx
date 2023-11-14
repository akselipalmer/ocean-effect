import "./Mouse.css";
import {
  motion,
  useMotionValue,
  useSpring,
  SpringOptions,
} from "framer-motion";
import { useEffect } from "react";
import BubbleOne from "./BubbleOne";

function Mouse() {
  const mousePosition = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };
  const smoothnessOptions: SpringOptions = { damping: 20 };

  const springEffectPosition = {
    x: useSpring(mousePosition.x, smoothnessOptions),
    y: useSpring(mousePosition.y, smoothnessOptions),
  };

  const mouseSize = 30;
  const manageMouseMove = (event: MouseEvent) => {
    const { clientX, clientY } = event;
    mousePosition.x.set(clientX - mouseSize / 2);
    mousePosition.y.set(clientY - mouseSize / 2);
  };

  useEffect(() => {
    window.addEventListener("mousemove", manageMouseMove);
    return () => {
      window.removeEventListener("mousemove", manageMouseMove);
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <motion.div
        className="box"
        style={{ left: springEffectPosition.x, top: springEffectPosition.y }}
      ></motion.div>
      <BubbleOne mousePosition={springEffectPosition} />
    </div>
  );
}

export default Mouse;
