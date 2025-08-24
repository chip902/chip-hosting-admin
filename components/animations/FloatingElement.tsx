"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FloatingElementProps {
  children: React.ReactNode
  className?: string
  duration?: number
  delay?: number
  yOffset?: number
  rotateAmount?: number
}

export function FloatingElement({
  children,
  className,
  duration = 6,
  delay = 0,
  yOffset = 20,
  rotateAmount = 10,
}: FloatingElementProps) {
  return (
    <motion.div
      className={cn("pointer-events-none", className)}
      animate={{
        y: [0, -yOffset, 0],
        rotate: [-rotateAmount, rotateAmount, -rotateAmount],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}