// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  // Phase 2: plug an AI backend here (Claude/OpenAI) with guardrails & attribution.
  // Expected request: { messages: [{role:'user'|'assistant'|'system', content:string}], context?: {...} }
  res.status(501).json({ ok:false, message: 'Chatbot API not implemented yet. Wire to LLM provider in Phase 2.' })
}
