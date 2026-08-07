"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { roomCenters, roomWeights } from "@/lib/ambient-controller";

// Multiplicadores base: mantienen cada capa muy discreta incluso en su pico
// de peso, para que nunca compita visualmente con las fotos.
const BASE_BLOB_A = 0.05;
const BASE_BLOB_B = 0.045;
const BASE_LIGHT = 0.35;

export function AmbientTexture({ roomCount }: { roomCount: number }) {
  const { scrollYProgress } = useScroll();
  const centers = roomCenters(roomCount);

  const blobAOpacity = useTransform(
    scrollYProgress,
    centers,
    centers.map((_, i) => roomWeights(i).blobA * BASE_BLOB_A),
  );
  const blobBOpacity = useTransform(
    scrollYProgress,
    centers,
    centers.map((_, i) => roomWeights(i).blobB * BASE_BLOB_B),
  );
  const lightOpacity = useTransform(
    scrollYProgress,
    centers,
    centers.map((_, i) => roomWeights(i).light * BASE_LIGHT),
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        style={{ opacity: blobAOpacity }}
        className="ambient-blob-a absolute -left-1/4 top-[-10%] h-[70vmax] w-[70vmax] rounded-full bg-neutral-400 blur-3xl"
      />
      <motion.div
        style={{ opacity: blobBOpacity }}
        className="ambient-blob-b absolute -right-1/4 top-[40%] h-[60vmax] w-[60vmax] rounded-full bg-neutral-400 blur-3xl"
      />
      {/* La animación CSS controla el barrido (posición + pulso de opacidad
          "ocasional"); el motion.div envolvente aplica el peso de la sala
          como multiplicador, sin pisar la propiedad que ya anima la CSS. */}
      <motion.div style={{ opacity: lightOpacity }} className="absolute inset-0">
        <div className="ambient-light absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-transparent via-white/70 to-transparent" />
      </motion.div>
      <div className="ambient-grain absolute inset-0 mix-blend-overlay" />
    </div>
  );
}
