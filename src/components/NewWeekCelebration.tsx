"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";

const CELEBRATION_MESSAGES = [
  "새로운 한 주, 새로운 반짝임",
  "궤적이 새롭게 흐르기 시작합니다.",
  "당신의 시간이 다시 빛납니다!",
  "새로운 한 주가 시작되었습니다.",
  "오늘도 당신의 별자리를 그려보세요.",
  "반짝이는 시간의 정렬..",
];

const CONSTELLATIONS = [
  [{ x: 10, y: 20 }, { x: 35, y: 70 }, { x: 55, y: 35 }, { x: 75, y: 80 }, { x: 95, y: 15 }],
  [
    { x: 10, y: 55 },
    { x: 30, y: 45 },
    { x: 50, y: 50 },
    { x: 65, y: 60 },
    { x: 70, y: 85 },
    { x: 95, y: 90 },
    { x: 110, y: 70 },
    { x: 65, y: 60 },
  ],
  [{ x: 30, y: 10 }, { x: 70, y: 15 }, { x: 45, y: 50 }, { x: 55, y: 52 }, { x: 65, y: 48 }, { x: 35, y: 90 }, { x: 75, y: 85 }],
  [{ x: 50, y: 50 }, { x: 20, y: 20 }, { x: 50, y: 50 }, { x: 80, y: 30 }, { x: 50, y: 50 }, { x: 30, y: 80 }],
  [{ x: 40, y: 20 }, { x: 20, y: 60 }, { x: 80, y: 70 }, { x: 60, y: 30 }, { x: 40, y: 20 }],
];

const STARS = Array.from({ length: 15 }).map((_, i) => ({
  points: CONSTELLATIONS[i % CONSTELLATIONS.length],
  left: ((i * 13) % 90) + 5,
  top: 30 + ((i * 17) % 60),
  size: 50 + ((i * 19) % 80),
  rot: (i * 47) % 360,
  delay: (i % 6) * 0.2,
}));

const RenderConstellation = ({ points, size = 100 }: { points: { x: number; y: number }[]; size?: number }) => {
  return (
    <svg viewBox="0 0 120 100" width={size} height={size}>
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="currentColor" opacity="0.9" />
      ))}
    </svg>
  );
};

export const NewWeekCelebration: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
    >
      <motion.div
        initial={{ backgroundColor: "rgba(0,0,0,0.9)" }}
        animate={{ backgroundColor: "rgba(0,0,0,0)" }}
        transition={{ duration: 4, ease: "easeOut" }}
        className="absolute inset-0"
      />

      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: "100%", opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 via-purple-500/20 via-amber-400/20 to-transparent skew-x-12"
      />

      <div className="absolute inset-0">
        {STARS.map((star, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.2, 0.6, 0] }}
            transition={{
              duration: 4,
              delay: star.delay,
              times: [0, 0.3, 0.5, 0.8, 1],
              ease: "easeInOut",
            }}
            className="absolute text-indigo-100 mix-blend-screen"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              transform: `translate(-50%, -50%) rotate(${star.rot}deg)`,
            }}
          >
            <RenderConstellation points={star.points} size={star.size} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.1, 0.85, 1] }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center"
      >
        <h1 className="text-2xl md:text-3xl font-light text-white/90 tracking-widest font-sans">{CELEBRATION_MESSAGES[0]}</h1>
      </motion.div>
    </motion.div>
  );
};
