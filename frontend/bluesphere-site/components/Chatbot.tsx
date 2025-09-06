// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import { useEffect, useRef, useState } from 'react';
import { colors, Button } from './DesignSystem';

type Msg = { role: 'user'|'assistant', text: string };

const seedFAQ: Record<string,string> = {
  // local seeds; replaced when API is available
  "what is sst": "SST stands for Sea Surface Temperature — the temperature at the ocean's surface.",
  "why are oceans warming": "Greenhouse gases trap heat. Oceans absorb ~90% of the excess, raising SST and driving marine heatwaves.",
  "what is a marine heatwave": "A prolonged period of unusually warm ocean temperatures in a region, relative to the expected seasonal range.",
  "how can i help": "Reduce emissions, support conservation, learn & share, and contribute to open data initiatives like BlueSphere."
};

export default function Chatbot(){
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', text: 'Hi! I’m the BlueSphere helper. Ask me about SST, currents, or marine heatwaves.' }
  ]);
  const endRef = useRef<HTMLDivElement|null>(null);
  const [faq, setFaq] = useState<{q:string,a:string}[]>([]);

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch('/api/faq');
        const j = await r.json();
        if(j && j.ok && Array.isArray(j.qa)) setFaq(j.qa);
      }catch{}
    })();
  }, []);

  function normalize(t:string){ return t.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean); }
  function score(a:string[], b:string[]){
    const set = new Set(a); let hit=0; for(const w of b){ if(set.has(w)) hit++; }
    return hit / Math.max(1,b.length);
  }


  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs, open]);

  function reply(user: string){
    const key = user.trim().toLowerCase();
    // Retrieval over FAQ
    let bestA = '';
    if(faq.length){
      const qtok = normalize(key);
      let bestS = 0;
      for(const item of faq){
        const stok = normalize(item.q + ' ' + item.a);
        const s = score(stok, qtok);
        if(s > bestS){ bestS = s; bestA = item.a; }
      }
    }
    if(!bestA){
      const best = Object.keys(seedFAQ).find(k => key.includes(k)) || '';
      bestA = best ? seedFAQ[best] : "I’m a simple helper for now. Try: ‘What is SST?’, ‘Why are oceans warming?’, or ‘What is a marine heatwave?’";
    }
    setMsgs(m => [...m, { role:'assistant', text: bestA }]);
  }

  return <div style={{position:'fixed', right:16, bottom:16, zIndex:99}}>
    {!open && <Button onClick={()=>setOpen(true)}>💬 Chat</Button>}
    {open && (
      <div style={{ width: 340, background: 'white', border: '1px solid #eee', borderRadius: 12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
          <div style={{ fontWeight:700, color: colors.primary }}>BlueSphere Helper</div>
          <button onClick={()=>setOpen(false)} style={{ background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ height: 260, overflowY:'auto', padding:12 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ margin:'6px 0', textAlign: m.role==='user'?'right':'left' }}>
              <div style={{ display:'inline-block', padding:'8px 10px', borderRadius:10, background:m.role==='user'?colors.sky:'#f5f7fb' }}>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e)=>{ e.preventDefault(); if(!input) return; const t=input; setMsgs(m=>[...m, {role:'user', text:t}]); setInput(''); setTimeout(()=>reply(t), 200); }} style={{ display:'flex', gap:8, padding:12, borderTop:'1px solid #eee'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a question..." style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid #ddd' }} />
          <Button kind="secondary">Send</Button>
        </form>
      </div>
    )}
  </div>;
}
