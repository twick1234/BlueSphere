import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DatasetStatus {
  name: string
  cadence?: string
  last_run?: string
  freshness: string
}

export default function Home(){
  const [status, setStatus] = useState<DatasetStatus[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(()=>{
    fetch('http://localhost:8000/status')
      .then(r=>r.json())
      .then(data => {
        setStatus(Array.isArray(data) ? data : data.datasets || [])
        setLoading(false)
      })
      .catch(()=> {
        setStatus([])
        setLoading(false)
      })
  },[])

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', color: '#0369a1', marginBottom: '10px' }}>
          BlueSphere Ocean Platform
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Interactive ocean temperature data, currents, and environmental trends visualization platform
        </p>
      </header>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '40px' }}>
        <div style={{ 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '24px', 
          background: '#f8fafc',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>🗺️</span>
            Interactive Map
          </h2>
          <p style={{ color: '#475569', marginBottom: '16px' }}>
            Explore global ocean temperatures, surface currents, and environmental data with interactive maps and time navigation.
          </p>
          <Link 
            href="/map" 
            style={{ 
              background: '#0369a1', 
              color: 'white', 
              padding: '10px 20px', 
              borderRadius: '6px', 
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Open Map →
          </Link>
        </div>

        <div style={{ 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '24px', 
          background: '#f8fafc',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>📊</span>
            Data Status
          </h2>
          <p style={{ color: '#475569', marginBottom: '16px' }}>
            Monitor real-time data ingestion from NOAA buoys, ERSST datasets, and surface current models.
          </p>
          <div style={{ marginTop: '12px' }}>
            {loading ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>Loading status...</p>
            ) : status.length > 0 ? (
              <div style={{ fontSize: '14px' }}>
                {status.map((dataset, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < status.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <span style={{ fontWeight: '500' }}>{dataset.name}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      background: dataset.freshness === 'green' ? '#dcfce7' : '#fecaca',
                      color: dataset.freshness === 'green' ? '#166534' : '#dc2626'
                    }}>
                      {dataset.freshness === 'green' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#dc2626', fontSize: '14px' }}>No data sources available</p>
            )}
          </div>
        </div>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '20px' }}>Features</h2>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h3 style={{ color: '#0369a1', marginBottom: '8px' }}>🌊 Ocean Temperature Maps</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Visualize sea surface temperature data with interactive heatmaps</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h3 style={{ color: '#0369a1', marginBottom: '8px' }}>🌀 Surface Currents</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Explore ocean current flows with animated vector visualizations</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h3 style={{ color: '#0369a1', marginBottom: '8px' }}>⏱️ Time Navigation</h3>
            <p style={{ color: '64748b', fontSize: '14px' }}>Navigate through historical data with intuitive time controls</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h3 style={{ color: '#0369a1', marginBottom: '8px' }}>📈 Data Analytics</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Analyze trends and anomalies in ocean temperature patterns</p>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
        <p>BlueSphere Ocean Platform - Open source ocean data visualization and analysis</p>
      </footer>
    </div>
  )
}
