import React from 'react'
import Link from 'next/link'
import HeadMeta from './HeadMeta'
import ThemeToggle from './ThemeToggle'

const NavLink: React.FC<{href:string, children:any}> = ({ href, children }) => (
  <Link className="bs-link" href={href}>{children}</Link>
)

const Layout: React.FC<{children:any, title?:string}> = ({ children, title }) => {
  return (
    <div className="bs-root">
      <HeadMeta />
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try{
              var pref = localStorage.getItem('bs-theme') || 'system';
              if(pref==='light'){ document.documentElement.setAttribute('data-theme','light'); }
              else if(pref==='dark'){ document.documentElement.setAttribute('data-theme','dark'); }
            }catch(e){}
          })();
        `}} />
    
      <header className="bs-header">
        <div className="bs-container bs-header-inner">
          <div className="bs-brand">
            <Link href="/"><img id="bs-logo" src="/brand/logo.svg" alt="BlueSphere" style={{height:28, verticalAlign:"middle", marginRight:8}} />BlueSphere</Link>
          </div>
          <nav className="bs-nav">
            <NavLink href="/map">Map</NavLink>
            <NavLink href="/consistency">Consistency</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/sources">Sources</NavLink>
          <div style={{display:'flex', gap:12, alignItems:'center'}}><ThemeToggle /></div>
          </nav>
        </div>
      
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            var el = document.getElementById('bs-logo');
            if(!el) return;
            var light = '/brand/logo-mono-light.svg';
            var dark = '/brand/logo.svg';
            function apply(mq){
              if(mq.matches){ el.src = light; } else { el.src = dark; }
            }
            var mq = window.matchMedia('(prefers-color-scheme: dark)');
            apply(mq);
            mq.addEventListener('change', apply);
          })();
        `}} />
    
      </header>
      <main className="bs-container bs-main">
        {children}
      </main>
      <footer className="bs-footer">
        <div className="bs-container">© {new Date().getFullYear()} BlueSphere</div>
      </footer>
    </div>
  )
}

export default Layout
