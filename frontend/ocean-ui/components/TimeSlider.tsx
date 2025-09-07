import { useState, useEffect, useRef } from 'react'

interface TimeSliderProps {
  startDate: string
  endDate: string
  currentDate: string
  onDateChange: (date: string) => void
  isPlaying: boolean
  onPlayPause: () => void
  playSpeed: number
  onSpeedChange: (speed: number) => void
  resolution: 'daily' | 'monthly' | 'yearly'
  onResolutionChange: (resolution: 'daily' | 'monthly' | 'yearly') => void
}

export default function TimeSlider({
  startDate,
  endDate,
  currentDate,
  onDateChange,
  isPlaying,
  onPlayPause,
  playSpeed,
  onSpeedChange,
  resolution,
  onResolutionChange
}: TimeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  const animationRef = useRef<number>()
  const lastUpdateRef = useRef<number>(Date.now())

  // Convert date to slider value (0-100)
  const dateToSliderValue = (date: string): number => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const current = new Date(date).getTime()
    return Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100))
  }

  // Convert slider value to date
  const sliderValueToDate = (value: number): string => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const timestamp = start + (value / 100) * (end - start)
    return new Date(timestamp).toISOString().split('T')[0]
  }

  // Get next date based on resolution
  const getNextDate = (date: string): string => {
    const current = new Date(date)
    const next = new Date(current)
    
    switch (resolution) {
      case 'daily':
        next.setDate(current.getDate() + 1)
        break
      case 'monthly':
        next.setMonth(current.getMonth() + 1)
        break
      case 'yearly':
        next.setFullYear(current.getFullYear() + 1)
        break
    }
    
    return next.toISOString().split('T')[0]
  }

  // Animation loop for auto-play
  useEffect(() => {
    if (isPlaying && !isDragging) {
      const animate = () => {
        const now = Date.now()
        const deltaTime = now - lastUpdateRef.current
        
        // Update every frame based on play speed (1x = 1 time unit per second)
        if (deltaTime > (1000 / playSpeed)) {
          const nextDate = getNextDate(currentDate)
          const nextDateTime = new Date(nextDate).getTime()
          const endDateTime = new Date(endDate).getTime()
          
          if (nextDateTime <= endDateTime) {
            onDateChange(nextDate)
          } else {
            // Loop back to start
            onDateChange(startDate)
          }
          
          lastUpdateRef.current = now
        }
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, isDragging, currentDate, playSpeed, resolution, startDate, endDate, onDateChange])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const newDate = sliderValueToDate(value)
    onDateChange(newDate)
  }

  const currentSliderValue = dateToSliderValue(currentDate)

  // Format date for display
  const formatDate = (date: string): string => {
    const d = new Date(date)
    switch (resolution) {
      case 'daily':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      case 'monthly':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })
      case 'yearly':
        return d.getFullYear().toString()
    }
  }

  // Get total time span info
  const getTotalSpan = (): string => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const years = end.getFullYear() - start.getFullYear()
    
    switch (resolution) {
      case 'daily':
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return `${days.toLocaleString()} days`
      case 'monthly':
        const months = years * 12 + (end.getMonth() - start.getMonth())
        return `${months} months`
      case 'yearly':
        return `${years} years`
    }
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
      borderRadius: '12px',
      color: 'white',
      userSelect: 'none'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>
          🕰️ Temporal Controls
        </h3>
        <div style={{
          fontSize: '14px',
          opacity: 0.8
        }}>
          Spanning {getTotalSpan()} • {resolution} resolution
        </div>
      </div>

      {/* Current Date Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
          {formatDate(currentDate)}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {Math.round(currentSliderValue)}% through time series
        </div>
      </div>

      {/* Time Slider */}
      <div style={{ marginBottom: '20px' }}>
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={currentSliderValue}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(to right, 
              #60a5fa 0%, 
              #60a5fa ${currentSliderValue}%, 
              rgba(255,255,255,0.3) ${currentSliderValue}%, 
              rgba(255,255,255,0.3) 100%)`,
            outline: 'none',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        />
        
        {/* Date range labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '12px',
          opacity: 0.7
        }}>
          <span>{formatDate(startDate)}</span>
          <span>{formatDate(endDate)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Playback Controls */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
          <button
            onClick={() => onDateChange(startDate)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Go to start"
          >
            ⏮️
          </button>
          
          <button
            onClick={onPlayPause}
            style={{
              background: isPlaying ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 255, 100, 0.8)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button
            onClick={() => onDateChange(endDate)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Go to end"
          >
            ⏭️
          </button>
        </div>

        {/* Resolution Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {(['yearly', 'monthly', 'daily'] as const).map(res => (
            <button
              key={res}
              onClick={() => onResolutionChange(res)}
              style={{
                background: resolution === res ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {res}
            </button>
          ))}
        </div>

        {/* Speed Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center', 
          justifyContent: 'flex-end' 
        }}>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>Speed:</span>
          <select
            value={playSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={8}>8x</option>
          </select>
        </div>
      </div>

      {/* Quick Jump Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        flexWrap: 'wrap'
      }}>
        {[1980, 1990, 2000, 2010, 2020].map(year => {
          const yearDate = `${year}-01-01`
          const yearTime = new Date(yearDate).getTime()
          const startTime = new Date(startDate).getTime()
          const endTime = new Date(endDate).getTime()
          
          if (yearTime >= startTime && yearTime <= endTime) {
            return (
              <button
                key={year}
                onClick={() => onDateChange(yearDate)}
                style={{
                  background: currentDate.startsWith(year.toString()) 
                    ? 'rgba(96, 165, 250, 0.8)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {year}s
              </button>
            )
          }
          return null
        })}
      </div>

      {/* Status Indicator */}
      <div style={{
        marginTop: '16px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        fontSize: '11px',
        opacity: 0.8
      }}>
        <div>📊 Temporal Navigation Active</div>
        <div>🔄 {isPlaying ? `Playing at ${playSpeed}x speed` : 'Paused'}</div>
        <div>📅 Resolution: {resolution} intervals</div>
      </div>
    </div>
  )
}