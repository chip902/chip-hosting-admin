"use client"

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  once?: boolean
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  once = true,
}: AnimatedCounterProps) {
  const ref = useRef(null)
  const motionValue = useMotionValue(from)
  const rounded = useTransform(motionValue, (latest) => {
    return decimals > 0 ? latest.toFixed(decimals) : Math.round(latest)
  })
  const isInView = useInView(ref, { once, amount: 0.5 })

  useEffect(() => {
    if (isInView) {
      const animation = animate(motionValue, to, {
        duration,
        ease: "easeOut",
      })
      return animation.stop
    }
  }, [isInView, motionValue, to, duration])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{rounded as any}</motion.span>
      {suffix}
    </span>
  )
}