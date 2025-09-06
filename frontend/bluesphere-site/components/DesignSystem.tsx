// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import { CSSProperties, ReactNode } from 'react';

export const colors = {
  primary: '#0a2540',
  accent: '#2e7dba',
  ocean: '#0c6fb8',
  sky: '#a6d5ff',
  sand: '#f4e6d3',
  success: '#2e7d32',
  warning: '#f9a825',
  danger: '#c62828',
  text: '#09233a'
};

export const Button = ({ children, onClick, kind='primary' }:{ children: ReactNode, onClick?: ()=>void, kind?: 'primary'|'secondary'|'ghost'}) => {
  const base: CSSProperties = {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    fontWeight: 600,
    background: colors.accent,
    color: 'white'
  };
  if (kind === 'secondary') {
    base.background = 'white';
    base.border = '1px solid ' + colors.accent;
    base.color = colors.accent;
  }
  if (kind === 'ghost') {
    base.background = 'transparent';
    base.border = '1px solid transparent';
    base.color = colors.accent;
  }
  return <button onClick={onClick} style={base}>{children}</button>;
};

export const H1 = ({children}:{children: ReactNode}) => <h1 style={{fontSize:34, margin:'18px 0', color: colors.primary}}>{children}</h1>;
export const H2 = ({children}:{children: ReactNode}) => <h2 style={{fontSize:26, margin:'16px 0', color: colors.primary}}>{children}</h2>;
export const P = ({children}:{children: ReactNode}) => <p style={{fontSize:16, lineHeight:'26px', color: colors.text}}>{children}</p>;
