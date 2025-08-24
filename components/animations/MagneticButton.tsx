"use client"

import { motion, useSpring, useMotionValue } from "framer-motion"
import { useRef, MouseEvent } from "react"
import { cn } from "@/lib/utils"

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  magnetStrength?: number
  onClick?: () => void
}

export function MagneticButton({
  children,
  className,
  magnetStrength = 0.5,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 300 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = (e.clientX - centerX) * magnetStrength
    const distanceY = (e.clientY - centerY) * magnetStrength

    x.set(distanceX)
    y.set(distanceY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: xSpring, y: ySpring }}
      className={cn("relative cursor-pointer", className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-600 opacity-0 rounded-lg blur-xl"
        whileHover={{ opacity: 0.3 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.div>
  )
}