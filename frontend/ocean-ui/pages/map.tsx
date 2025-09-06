import dynamic from 'next/dynamic'
import { useEffect, useState, useRef } from 'react'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr:false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr:false })

function speedToColor(s:number){
  // 0..1 → blue..cyan..green..yellow..red
  const clamp = (x:number)=>Math.max(0, Math.min(1, x))
  const t = clamp(s)
  const r = Math.round(255 * Math.max(0, (t-0.5)*2))
  const g = Math.round(255 * (t<0.5 ? t*2 : 1 - (t-0.5)*2))
  const b = Math.round(255 * (1 - t))
  return `rgb(${r},${g},${b})`
}

export default function Map(){
  const [urlBase, setUrlBase] = useState('http://localhost:8000')

  useEffect(()=>{
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet.vectorgrid@1.3.0/dist/Leaflet.VectorGrid.bundled.js'
    s.async = true
    document.body.appendChild(s)
    return () => { document.body.removeChild(s) }
  }, [])

  useEffect(()=>{
    const int = setInterval(()=>{
      // @ts-ignore
      if (typeof L !== 'undefined' && (L as any).vectorGrid){
        // @ts-ignore
        const map = (window as any)._leaflet_map
        if(map && !(window as any)._currents_layer){
          // @ts-ignore
          const vg = (L as any).vectorGrid.protobuf(`${urlBase}/tiles/currents/{z}/{x}/{y}.mvt`, {
            rendererFactory: (L as any).canvas.tile,
            vectorTileLayerStyles: {
              currents: (properties:any, zoom:number)=>{
                const u = properties.u || 0, v = properties.v || 0
                const spd = Math.sqrt(u*u + v*v) // 0..~1
                return {
                  color: speedToColor(Math.min(1, spd)),
                  weight: 2,
                  opacity: 0.9
                }
              }
            },
          })
          vg.addTo(map)
          ;(window as any)._currents_layer = vg
        }
        clearInterval(int)
      }
    }, 800)
    return ()=>clearInterval(int)
  }, [urlBase])

  return <div style={{height:'100vh', width:'100%'}}>
    <MapContainer center={[0,0]} zoom={2} style={{height:'100%', width:'100%'}}
      whenCreated={(m:any)=>{ (window as any)._leaflet_map = m }}>
      <TileLayer url={`${urlBase}/tiles/sst/{z}/{x}/{y}.png`} attribution='BlueSphere SST tiles' />
      {/* PNG fallback layer for currents */}
      <TileLayer url={`${urlBase}/tiles/currents/{z}/{x}/{y}.png`} attribution='BlueSphere currents (png fallback)' opacity={0.25} />
    </MapContainer>
  </div>
}
