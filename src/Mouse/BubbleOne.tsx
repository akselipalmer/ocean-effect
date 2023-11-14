import { motion, useSpring, SpringOptions, MotionValue } from "framer-motion";
import "./Mouse.css";

type BubbleOneProps = {
  mousePosition: {
    x: MotionValue;
    y: MotionValue;
  };
};

export default function BubbleOne({ mousePosition }: BubbleOneProps) {
  const smoothnessOptions: SpringOptions = { damping: 20 };

  const springEffectPosition = {
    x: useSpring(mousePosition.x, smoothnessOptions),
    y: useSpring(mousePosition.y, smoothnessOptions),
  };

  return (
    <motion.div
      className="bubble-one"
      style={{ left: springEffectPosition.x, top: springEffectPosition.y }}
    ></motion.div>
  );
}
