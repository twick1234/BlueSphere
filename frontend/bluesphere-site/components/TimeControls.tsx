// Advanced Time Navigation Component
// Matches PRD specification for 5-year historical data cycling interface
import React, { useState, useCallback, useEffect, useRef } from 'react'

export interface TimeState {
  currentDate: Date
  isPlaying: boolean
  playbackSpeed: number
  timeRange: {
    start: Date
    end: Date
  }
  selectedPeriod: 'hour' | 'day' | 'week' | 'month' | 'year'
}

interface TimeControlsProps {
  timeState: TimeState
  onTimeChange: (newDate: Date) => void
  onPlayToggle: (playing: boolean) => void
  onSpeedChange: (speed: number) => void
  onPeriodChange: (period: 'hour' | 'day' | 'week' | 'month' | 'year') => void
  onTimeRangeChange: (start: Date, end: Date) => void
  isDarkMode: boolean
  className?: string
}

const TimeControls: React.FC<TimeControlsProps> = ({
  timeState,
  onTimeChange,
  onPlayToggle,
  onSpeedChange,
  onPeriodChange,
  onTimeRangeChange,
  isDarkMode,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Calculate time position (0-1) within range
  const getTimePosition = useCallback(() => {
    const { currentDate, timeRange } = timeState
    const totalTime = timeRange.end.getTime() - timeRange.start.getTime()
    const currentTime = currentDate.getTime() - timeRange.start.getTime()
    return Math.max(0, Math.min(1, currentTime / totalTime))
  }, [timeState])

  // Convert position (0-1) back to date
  const positionToDate = useCallback((position: number) => {
    const { timeRange } = timeState
    const totalTime = timeRange.end.getTime() - timeRange.start.getTime()
    return new Date(timeRange.start.getTime() + position * totalTime)
  }, [timeState])

  // Handle timeline scrubbing
  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const position = (event.clientX - rect.left) / rect.width
    const newDate = positionToDate(position)
    onTimeChange(newDate)
  }, [positionToDate, onTimeChange])

  // Handle timeline dragging
  const handleTimelineDrag = useCallback((event: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const newDate = positionToDate(position)
    onTimeChange(newDate)
  }, [isDragging, positionToDate, onTimeChange])

  // Auto-play functionality
  useEffect(() => {
    if (timeState.isPlaying) {
      const interval = 1000 / timeState.playbackSpeed // Base: 1 second
      
      playIntervalRef.current = setInterval(() => {
        const increment = getTimeIncrement()
        const nextDate = new Date(timeState.currentDate.getTime() + increment)
        
        if (nextDate <= timeState.timeRange.end) {
          onTimeChange(nextDate)
        } else {
          onPlayToggle(false) // Stop at end
          onTimeChange(timeState.timeRange.start) // Reset to start
        }
      }, interval)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [timeState.isPlaying, timeState.playbackSpeed, timeState.currentDate, timeState.timeRange, onTimeChange, onPlayToggle])

  // Get time increment based on selected period
  const getTimeIncrement = useCallback(() => {
    const increments = {
      hour: 60 * 60 * 1000,        // 1 hour
      day: 24 * 60 * 60 * 1000,    // 1 day
      week: 7 * 24 * 60 * 60 * 1000, // 1 week
      month: 30 * 24 * 60 * 60 * 1000, // ~1 month
      year: 365 * 24 * 60 * 60 * 1000 // 1 year
    }
    return increments[timeState.selectedPeriod]
  }, [timeState.selectedPeriod])

  // Setup drag listeners
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        handleTimelineDrag(event)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleTimelineDrag])

  // Format date for display
  const formatDate = useCallback((date: Date, format: 'short' | 'long' | 'time') => {
    const options: Intl.DateTimeFormatOptions = 
      format === 'short' ? { month: 'short', day: 'numeric', year: '2-digit' } :
      format === 'long' ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } :
      { hour: '2-digit', minute: '2-digit', hour12: true }
    
    return date.toLocaleDateString('en-US', options)
  }, [])

  // Predefined time ranges
  const timeRanges = {
    '24h': { 
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), 
      end: new Date(),
      label: 'Last 24 Hours'
    },
    '7d': { 
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
      end: new Date(),
      label: 'Last Week'
    },
    '30d': { 
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
      end: new Date(),
      label: 'Last Month'
    },
    '1y': { 
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 
      end: new Date(),
      label: 'Last Year'
    },
    '5y': { 
      start: new Date('2020-01-01'), 
      end: new Date(),
      label: '5-Year Archive'
    }
  }

  const playbackSpeeds = [0.25, 0.5, 1, 2, 4, 8, 16]

  return (
    <div className={`time-controls ${isDarkMode ? 'dark' : 'light'} ${className} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Main Timeline */}
      <div className="timeline-container">
        <div className="timeline-header">
          <div className="current-time">
            <div className="current-date">{formatDate(timeState.currentDate, 'long')}</div>
            <div className="current-time-detail">{formatDate(timeState.currentDate, 'time')}</div>
          </div>
          
          <button
            className="expand-timeline"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse controls' : 'Expand controls'}
          >
            {isExpanded ? '🔽' : '🔼'}
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="timeline-scrubber">
          <div className="timeline-labels">
            <span className="start-label">{formatDate(timeState.timeRange.start, 'short')}</span>
            <span className="end-label">{formatDate(timeState.timeRange.end, 'short')}</span>
          </div>
          
          <div 
            className="timeline-track"
            ref={sliderRef}
            onClick={handleTimelineClick}
          >
            <div className="timeline-progress" style={{ width: `${getTimePosition() * 100}%` }} />
            <div 
              className="timeline-handle"
              style={{ left: `${getTimePosition() * 100}%` }}
              onMouseDown={() => setIsDragging(true)}
            />
            
            {/* Timeline markers for major events/periods */}
            <div className="timeline-markers">
              {/* This would show major climate events, marine heatwaves, etc. */}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="playback-controls">
          <button
            className="control-btn"
            onClick={() => onTimeChange(timeState.timeRange.start)}
            title="Go to start"
          >
            ⏮️
          </button>
          
          <button
            className="control-btn"
            onClick={() => {
              const prevTime = new Date(timeState.currentDate.getTime() - getTimeIncrement())
              if (prevTime >= timeState.timeRange.start) {
                onTimeChange(prevTime)
              }
            }}
            title="Previous step"
          >
            ⏪
          </button>
          
          <button
            className={`play-btn ${timeState.isPlaying ? 'playing' : 'paused'}`}
            onClick={() => onPlayToggle(!timeState.isPlaying)}
            title={timeState.isPlaying ? 'Pause' : 'Play'}
          >
            {timeState.isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button
            className="control-btn"
            onClick={() => {
              const nextTime = new Date(timeState.currentDate.getTime() + getTimeIncrement())
              if (nextTime <= timeState.timeRange.end) {
                onTimeChange(nextTime)
              }
            }}
            title="Next step"
          >
            ⏩
          </button>
          
          <button
            className="control-btn"
            onClick={() => onTimeChange(timeState.timeRange.end)}
            title="Go to end"
          >
            ⏭️
          </button>
        </div>
      </div>

      {/* Extended Controls */}
      {isExpanded && (
        <div className="extended-controls">
          {/* Time Period Selection */}
          <div className="control-section">
            <label>Time Step</label>
            <div className="period-buttons">
              {(['hour', 'day', 'week', 'month', 'year'] as const).map(period => (
                <button
                  key={period}
                  className={`period-btn ${timeState.selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => onPeriodChange(period)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Playback Speed */}
          <div className="control-section">
            <label>Playback Speed</label>
            <div className="speed-controls">
              <select
                value={timeState.playbackSpeed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="speed-select"
              >
                {playbackSpeeds.map(speed => (
                  <option key={speed} value={speed}>
                    {speed}x {speed < 1 ? 'Slower' : speed > 1 ? 'Faster' : 'Normal'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preset Time Ranges */}
          <div className="control-section">
            <label>Quick Ranges</label>
            <div className="range-buttons">
              {Object.entries(timeRanges).map(([key, range]) => (
                <button
                  key={key}
                  className="range-btn"
                  onClick={() => onTimeRangeChange(range.start, range.end)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Climate Events Timeline */}
          <div className="control-section">
            <label>Notable Events</label>
            <div className="climate-events">
              <div className="event-item">🔥 2023 Marine Heatwave Peak</div>
              <div className="event-item">🌊 2022 La Niña Cycle</div>
              <div className="event-item">🌡️ 2021 Record Ocean Temperatures</div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .time-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(16px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .time-controls.collapsed {
          width: 600px;
          max-width: 90vw;
        }

        .time-controls.expanded {
          width: 800px;
          max-width: 95vw;
        }

        .timeline-container {
          padding: 20px;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .current-time {
          text-align: left;
        }

        .current-date {
          font-size: 18px;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          margin-bottom: 2px;
        }

        .current-time-detail {
          font-size: 14px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        .expand-timeline {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .expand-timeline:hover {
          opacity: 1;
        }

        .timeline-scrubber {
          margin-bottom: 16px;
        }

        .timeline-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        .timeline-track {
          position: relative;
          height: 8px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 4px;
          cursor: pointer;
          margin: 8px 0;
        }

        .timeline-progress {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          border-radius: 4px;
          transition: width 0.1s ease;
        }

        .timeline-handle {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: white;
          border: 3px solid #3b82f6;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .timeline-handle:hover,
        .timeline-handle:active {
          transform: translate(-50%, -50%) scale(1.2);
          cursor: grabbing;
        }

        .playback-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .control-btn,
        .play-btn {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
          border: none;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }

        .control-btn:hover,
        .play-btn:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
          transform: scale(1.05);
        }

        .play-btn {
          background: #3b82f6;
          color: white;
          font-size: 18px;
          padding: 16px 20px;
        }

        .play-btn:hover {
          background: #2563eb;
        }

        .extended-controls {
          padding: 0 20px 20px;
          border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          margin-top: 16px;
          padding-top: 16px;
        }

        .control-section {
          margin-bottom: 20px;
        }

        .control-section label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          margin-bottom: 8px;
        }

        .period-buttons,
        .range-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .period-btn,
        .range-btn {
          padding: 6px 12px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .period-btn.active,
        .period-btn:hover,
        .range-btn:hover {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .speed-select {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .climate-events {
          max-height: 100px;
          overflow-y: auto;
        }

        .event-item {
          padding: 8px 12px;
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
          border-radius: 6px;
          margin-bottom: 4px;
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        @media (max-width: 768px) {
          .time-controls {
            bottom: 10px;
            width: 95vw !important;
          }

          .timeline-container {
            padding: 15px;
          }

          .current-date {
            font-size: 16px;
          }

          .playback-controls {
            gap: 8px;
          }

          .control-btn,
          .play-btn {
            padding: 10px;
            font-size: 14px;
          }

          .play-btn {
            padding: 12px 16px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default TimeControls