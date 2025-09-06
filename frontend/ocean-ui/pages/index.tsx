import { useEffect, useState } from 'react'

export default function Home(){
  const [status, setStatus] = useState<any[]>([])
  useEffect(()=>{
    fetch('http://localhost:8000/status').then(r=>r.json()).then(setStatus).catch(()=>setStatus([]))
  },[])

  return <div style={{padding:20}}>
    <h1>BlueSphere Map UI (stub)</h1>
    <p>This UI will render heatmaps and currents wired to the API. For now it fetches /status:</p>
    <pre>{JSON.stringify(status, null, 2)}</pre>
  </div>
}
