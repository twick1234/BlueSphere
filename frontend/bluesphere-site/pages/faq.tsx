// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import Layout from '../components/Layout'
import { useEffect, useMemo, useState } from 'react'
import { getPage } from '../lib/content'
import Chatbot from '../components/Chatbot'
import { Button } from '../components/DesignSystem'

export default function FAQ({ html }: { html: string }){
  const [q, setQ] = useState('');

  // naive filter: split by double newlines and filter blocks containing query (client-side only)
  const blocks = useMemo(()=>{
    const div = document.createElement('div'); div.innerHTML = html;
    const text = div.innerText;
    const lines = text.split('\n\n');
    if (!q) return lines;
    const rq = q.toLowerCase();
    return lines.filter(l => l.toLowerCase().includes(rq));
  }, [html, q]);

  useEffect(()=>{}, [q]);

  return <Layout title="FAQ">
    <h1>Frequently Asked Questions</h1>
    <div style={{display:'flex', gap:8, alignItems:'center', margin:'12px 0'}}>
      <input placeholder="Search questions..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid #ddd'}} />
      <Button kind="ghost" onClick={()=>setQ('marine heatwave')}>Heatwaves</Button>
      <Button kind="ghost" onClick={()=>setQ('SST')}>SST</Button>
      <Button kind="ghost" onClick={()=>setQ('currents')}>Currents</Button>
    </div>
    <div>
      {!q && <div dangerouslySetInnerHTML={{__html: html}} />}
      {q && <div>{blocks.map((b,i)=>(<p key={i}>{b}</p>))}</div>}
    </div>
    <Chatbot />
  </Layout>
}

export async function getStaticProps(){
  const page = await getPage('faq')
  return { props: { html: page.html } }
}
