'use client'

import { useEffect, useRef } from 'react'

interface MatrixRainProps {
  opacity?: number
  speed?: number
  density?: number
  className?: string
}

export default function MatrixRain({
  opacity = 0.08,
  speed = 1,
  density = 0.65,
  className = '',
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    
    // Set size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Characters list (Katakana, numbers, and some special symbols)
    const characters = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const charArray = characters.split('')
    
    const fontSize = 14
    let columns = Math.floor(canvas.width / fontSize)
    
    // drops representation: drops[i] stores the y-coordinate of the drop in column i
    let drops: number[] = []
    
    const initDrops = () => {
      columns = Math.floor(canvas.width / fontSize)
      drops = []
      for (let i = 0; i < columns; i++) {
        // Random starting positions so they don't fall as a single wave
        drops[i] = Math.random() * -100
      }
    }
    
    initDrops()

    // Draw loop
    const draw = () => {
      // Semi-transparent black background to create fading trail
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Green text styling
      ctx.fillStyle = '#00ff41'
      ctx.font = `${fontSize}px "Share Tech Mono", monospace`

      for (let i = 0; i < drops.length; i++) {
        // Skip some columns based on density to keep it clean
        if (Math.sin(i) > density) continue

        // Pick random character
        const char = charArray[Math.floor(Math.random() * charArray.length)]
        
        // Draw character
        const x = i * fontSize
        const y = drops[i] * fontSize
        
        // Give some random characters a brighter highlight for a neon digital glow
        if (Math.random() > 0.97) {
          ctx.fillStyle = '#ffffff'
        } else if (Math.random() > 0.9) {
          ctx.fillStyle = '#0aff9d'
        } else {
          ctx.fillStyle = '#00ff41'
        }

        ctx.fillText(char, x, y)

        // Increment drop y coordinate with speed
        drops[i] += speed

        // Reset drop position if it goes off screen (with a random delay)
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    // Delay initialization slightly to let window size settle
    const timeoutId = setTimeout(() => {
      draw()
    }, 100)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
      clearTimeout(timeoutId)
    }
  }, [opacity, speed, density])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
