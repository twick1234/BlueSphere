// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'

// Animated Counter Component
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }: { target: number, suffix?: string, duration?: number }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      setCount(Math.floor(progress * target))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])
  
  return <span>{count.toLocaleString()}{suffix}</span>
}

// Climate Stats Component
const ClimateStats = () => {
  const stats = [
    { value: 1.1, suffix: "°C", label: "Global Temperature Rise", desc: "Since pre-industrial times" },
    { value: 421, suffix: " ppm", label: "Atmospheric CO₂", desc: "Highest in 3 million years" },
    { value: 23, suffix: "cm", label: "Sea Level Rise", desc: "Since 1880" },
    { value: 13, suffix: "%", label: "Arctic Ice Lost", desc: "Per decade since 1979" }
  ]
  
  return (
    <div className="climate-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-item">
          <div className="stat-value">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </div>
          <div className="stat-label">{stat.label}</div>
          <div className="stat-desc">{stat.desc}</div>
        </div>
      ))}
    </div>
  )
}

// Feature Card Component
const FeatureCard = ({ icon, title, description, href }: { icon: string, title: string, description: string, href: string }) => (
  <Link href={href} className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
    <div className="feature-arrow">→</div>
  </Link>
)

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <>
      <style jsx>{`
        .hero-section {
          min-height: 90vh;
          background: linear-gradient(135deg, 
            #0ea5e9 0%, 
            #3b82f6 25%, 
            #1e40af 50%, 
            #1e3a8a 75%, 
            #0f172a 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          margin: -24px -16px 0;
          animation: ${isVisible ? 'fadeIn' : 'none'} 1.5s ease-out;
        }
        
        .hero-bg-effects {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.2) 0%, transparent 50%);
        }
        
        .hero-content {
          text-align: center;
          color: white;
          z-index: 2;
          max-width: 1000px;
          padding: 0 2rem;
          animation: ${isVisible ? 'slideUp' : 'none'} 1.2s ease-out 0.3s both;
        }
        
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #ffffff, #e0f2fe, #b3e5fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        
        .hero-subtitle {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 400;
          line-height: 1.4;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .urgency-banner {
          background: rgba(239, 68, 68, 0.9);
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          margin-bottom: 2rem;
          display: inline-block;
          animation: pulse 2s infinite;
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        
        .cta-primary, .cta-secondary {
          padding: 1rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          font-size: 1.1rem;
          border: 2px solid transparent;
        }
        
        .cta-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        }
        
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
          text-decoration: none;
        }
        
        .cta-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          text-decoration: none;
        }
        
        .stats-section {
          padding: 5rem 0;
          background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
          margin: 0 -16px;
        }
        
        .stats-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 4rem;
          padding: 0 2rem;
        }
        
        .stats-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
        }
        
        .stats-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          line-height: 1.6;
        }
        
        .climate-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .stat-item {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .stat-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .stat-value {
          font-size: 3rem;
          font-weight: 800;
          color: #dc2626;
          margin-bottom: 0.5rem;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }
        
        .stat-desc {
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .features-section {
          padding: 5rem 0;
          background: white;
          margin: 0 -16px;
        }
        
        .features-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 4rem;
          padding: 0 2rem;
        }
        
        .features-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .feature-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          padding: 2.5rem;
          border-radius: 20px;
          text-decoration: none;
          color: inherit;
          border: 1px solid #e2e8f0;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transition: left 0.6s ease;
        }
        
        .feature-card:hover::before {
          left: 100%;
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
          text-decoration: none;
        }
        
        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          display: block;
        }
        
        .feature-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
        }
        
        .feature-desc {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        
        .feature-arrow {
          color: #3b82f6;
          font-size: 1.5rem;
          font-weight: bold;
          transition: transform 0.3s ease;
        }
        
        .feature-card:hover .feature-arrow {
          transform: translateX(5px);
        }
        
        .cta-section {
          padding: 6rem 0;
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
          margin: 0 -16px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .cta-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(56, 189, 248, 0.2) 0%, transparent 50%);
        }
        
        .cta-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
          z-index: 2;
        }
        
        .cta-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        
        .cta-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2.5rem;
          opacity: 0.9;
          line-height: 1.6;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .stats-section {
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          }
          
          .stats-title, .features-title {
            color: #f1f5f9;
          }
          
          .stat-item {
            background: #1e293b;
            border-color: #334155;
          }
          
          .stat-label {
            color: #f1f5f9;
          }
          
          .features-section {
            background: #0b1020;
          }
          
          .feature-card {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-color: #475569;
          }
          
          .feature-title {
            color: #f1f5f9;
          }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .hero-content {
            padding: 0 1rem;
          }
          
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .climate-stats {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            padding: 0 1rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
            padding: 0 1rem;
          }
          
          .stat-value {
            font-size: 2.5rem;
          }
          
          .stats-title, .features-title, .cta-title {
            font-size: 2rem;
          }
        }
      `}</style>
      
      <Layout>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-effects"></div>
          <div className="hero-content">
            <div className="urgency-banner">
              🚨 Climate Emergency: Act Now
            </div>
            <h1 className="hero-title">
              Monitor Our Ocean.<br />
              Save Our Planet.
            </h1>
            <p className="hero-subtitle">
              Real-time ocean monitoring and climate data visualization 
              to drive urgent action on the climate crisis. 
              Every degree matters. Every action counts.
            </p>
            <div className="cta-buttons">
              <Link href="/map" className="cta-primary">
                Explore Ocean Data 🌊
              </Link>
              <Link href="/about" className="cta-secondary">
                Learn About the Crisis
              </Link>
            </div>
          </div>
        </section>
        
        {/* Climate Statistics */}
        <section className="stats-section">
          <div className="stats-header">
            <h2 className="stats-title">The Climate Reality</h2>
            <p className="stats-subtitle">
              Critical indicators showing the urgent need for ocean monitoring and climate action
            </p>
          </div>
          <ClimateStats />
        </section>
        
        {/* Features Section */}
        <section className="features-section">
          <div className="features-header">
            <h2 className="features-title">Powerful Ocean Intelligence</h2>
          </div>
          <div className="features-grid">
            <FeatureCard
              icon="🌊"
              title="Live Ocean Monitoring"
              description="Real-time sea surface temperatures, currents, and marine conditions with satellite-grade precision"
              href="/map"
            />
            <FeatureCard
              icon="🚨"
              title="Real-Time Alerts"
              description="Critical ocean condition monitoring with customizable alert zones and instant notifications"
              href="/alerts"
            />
            <FeatureCard
              icon="⏰"
              title="Time-lapse Visualization"
              description="Watch ocean temperature changes unfold over time with interactive climate animations"
              href="/timelapse"
            />
            <FeatureCard
              icon="📊"
              title="Climate Analytics"
              description="Advanced data visualization and trend analysis to understand ocean-climate interactions"
              href="/consistency"
            />
            <FeatureCard
              icon="🔬"
              title="Scientific Research"
              description="Access peer-reviewed data and methodologies used by climate scientists worldwide"
              href="/docs"
            />
            <FeatureCard
              icon="📚"
              title="Educational Resources"
              description="Comprehensive learning materials for students, educators, and climate advocates"
              href="/stories"
            />
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">
              The Ocean is Our Climate System
            </h2>
            <p className="cta-subtitle">
              Join thousands of scientists, policymakers, and activists using BlueSphere 
              to understand and communicate the climate crisis through ocean data.
            </p>
            <div className="cta-buttons">
              <Link href="/map" className="cta-primary">
                Start Exploring 🚀
              </Link>
              <Link href="/about" className="cta-secondary">
                Our Mission
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}
