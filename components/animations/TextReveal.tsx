"use client"

import { motion, useInView, Variants } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface TextRevealProps {
  text: string
  className?: string
  delay?: number
  stagger?: number
  once?: boolean
}

export function TextReveal({
  text,
  className,
  delay = 0,
  stagger = 0.05,
  once = true,
}: TextRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: 0.5 })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  }

  const words = text.split(" ")

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={cn("flex flex-wrap", className)}
      style={{ perspective: 1000 }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="mr-2 inline-block origin-bottom"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}