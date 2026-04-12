import { useEffect, useRef } from 'react'

function MicVisualizer({ mediaStream, isActive }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const source = audioCtx.createMediaStreamSource(mediaStream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)
    analyserRef.current = analyser

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const BAR_COUNT = 24
    const BAR_WIDTH = 3
    const BAR_GAP = 2
    const MAX_HEIGHT = 32

    canvas.width = BAR_COUNT * (BAR_WIDTH + BAR_GAP)
    canvas.height = MAX_HEIGHT + 4

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < BAR_COUNT; i++) {
        const dataIndex = Math.floor((i / BAR_COUNT) * bufferLength)
        const value = dataArray[dataIndex] / 255
        const barHeight = Math.max(2, value * MAX_HEIGHT)

        const x = i * (BAR_WIDTH + BAR_GAP)
        const y = (canvas.height - barHeight) / 2

        if (isActive && value > 0.05) {
          ctx.fillStyle = `rgba(16, 185, 129, ${0.5 + value * 0.5})`
        } else {
          ctx.fillStyle = 'rgba(79, 70, 229, 0.35)'
        }

        ctx.beginPath()
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1)
        ctx.fill()
      }
    }

    draw()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      audioCtx.close()
    }
  }, [mediaStream, isActive])

  return (
    <div className="flex items-center justify-center px-3 py-1.5 rounded-full" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
      <canvas ref={canvasRef} style={{ height: '36px' }} />
    </div>
  )
}

export default MicVisualizer
