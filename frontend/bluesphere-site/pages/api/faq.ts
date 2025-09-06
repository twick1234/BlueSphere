// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    const file = path.join(process.cwd(), '..', '..', 'website', 'faq.md')
    const md = fs.readFileSync(file, 'utf8')
    // naive parse: lines starting with **Question** pattern
    const qa: {q:string, a:string}[] = []
    const lines = md.split('\n')
    for(let i=0;i<lines.length;i++){
      const L = lines[i].trim()
      const qmatch = L.match(/^\*\*(.+?)\*\*/)
      if(qmatch){
        const q = qmatch[1]
        const answers: string[] = []
        let j = i+1
        while(j<lines.length && !lines[j].trim().startsWith('**')){
          answers.push(lines[j])
          j++
        }
        qa.push({ q, a: answers.join('\n').trim() })
        i = j-1
      }
    }
    res.status(200).json({ ok:true, qa })
  }catch(e:any){
    res.status(500).json({ ok:false, message: e?.message || 'parse error' })
  }
}
