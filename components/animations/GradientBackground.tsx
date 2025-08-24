"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientBackgroundProps {
  children?: React.ReactNode
  className?: string
  variant?: "default" | "mesh" | "animated"
  overlay?: "none" | "light" | "dark" | "brand"
}

export function GradientBackground({
  children,
  className,
  variant = "default",
  overlay = "dark",
}: GradientBackgroundProps) {
  // Helper function to get overlay classes
  const getOverlayClasses = () => {
    switch (overlay) {
      case "none":
        return ""
      case "light":
        return "bg-white/20"
      case "dark":
        return "bg-black/40"
      case "brand":
        return "bg-brand-900/30"
      default:
        return "bg-black/40"
    }
  }

  if (variant === "animated") {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700" />
        
        {/* Animated colorful gradients */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute -inset-[100%] opacity-30"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: `
                radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.3) 0px, transparent 0%),
                radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.3) 0px, transparent 50%),
                radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.3) 0px, transparent 50%),
                radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.3) 0px, transparent 50%),
                radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.3) 0px, transparent 50%),
                radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.3) 0px, transparent 50%),
                radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.3) 0px, transparent 50%)
              `,
              backgroundSize: "400% 400%",
              filter: "blur(100px) saturate(120%)",
            }}
          />
        </div>
        
        {/* Optional overlay for text readability */}
        {overlay !== "none" && (
          <div className={cn("absolute inset-0", getOverlayClasses())} />
        )}
        
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  if (variant === "mesh") {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* Base dark background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700" />
        
        {/* Mesh pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(at_50%_50%,_var(--tw-gradient-stops))] from-brand-500/20 via-brand-800/10 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute h-full w-full bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]" />
        </div>
        
        {/* Optional overlay for text readability */}
        {overlay !== "none" && (
          <div className={cn("absolute inset-0", getOverlayClasses())} />
        )}
        
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-background dark:to-brand-900" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}