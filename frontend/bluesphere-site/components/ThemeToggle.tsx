import React, { useEffect, useState } from 'react'

const THEME_KEY = 'bs-theme' // 'light' | 'dark' | 'system'

function applyTheme(theme: string){
  const html = document.documentElement
  if(theme === 'light'){
    html.setAttribute('data-theme', 'light')
  } else if(theme === 'dark'){
    html.setAttribute('data-theme', 'dark')
  } else {
    html.removeAttribute('data-theme')
  }
  // Update header logo if present
  const el = document.getElementById('bs-logo') as HTMLImageElement | null
  if(el){
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const effectiveDark = theme === 'dark' || (theme === 'system' && prefersDark)
    el.src = effectiveDark ? '/brand/logo-mono-light.svg' : '/brand/logo.svg'
  }
}

export default function ThemeToggle(){
  const [theme, setTheme] = useState<string>('system')

  useEffect(()=>{
    const saved = localStorage.getItem(THEME_KEY) || 'system'
    setTheme(saved)
    applyTheme(saved)
  }, [])

  useEffect(()=>{
    const handler = (e: MediaQueryListEvent) => {
      if((localStorage.getItem(THEME_KEY) || 'system') === 'system'){
        applyTheme('system')
      }
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function cycle(){
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    applyTheme(next)
  }

  const label = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'
  const icon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️'

  return (
    <button onClick={cycle} title={`Theme: ${label}`} aria-label={`Theme: ${label}`} style={{border:'1px solid #e5e7eb', background:'transparent', padding:'6px 10px', borderRadius:'8px', cursor:'pointer'}}>
      <span style={{fontSize:'14px', marginRight:6}}>{icon}</span>
      <span style={{fontSize:'12px'}}>{label}</span>
    </button>
  )
}
