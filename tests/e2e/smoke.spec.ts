// SPDX-License-Identifier: MIT
// © 2024–2025 Mark Lindon — BlueSphere
import { test, expect } from '@playwright/test'
import fetch from 'node-fetch'

test.describe('BlueSphere smoke E2E', () => {
  test('API /status up', async ({}) => {
    const res = await fetch('http://localhost:8000/status')
    expect(res.ok).toBeTruthy()
    const json = await res.json()
    expect(Array.isArray(json)).toBeTruthy()
  })

  test('Tiles respond', async ({ page }) => {
    const res = await fetch('http://localhost:8000/tiles/currents/0/0/0.mvt')
    // mvt may be 204 if cache not built; accept 200 or 204
    expect([200,204]).toContain(res.status)
    const png = await fetch('http://localhost:8000/tiles/sst/0/0/0.png')
    expect(png.ok).toBeTruthy()
  })

  test('Obs endpoint works (empty ok)', async ({}) => {
    const res = await fetch('http://localhost:8000/obs?limit=1')
    expect(res.ok).toBeTruthy()
    const json = await res.json()
    expect(Array.isArray(json)).toBeTruthy()
  })

  test('Map page renders', async ({ page }) => {
    await page.goto('http://localhost:3000/map')
    await expect(page).toHaveTitle(/BlueSphere|Ocean UI|Map/i)
  })
})
