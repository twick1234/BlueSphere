import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/faq'
import fs from 'fs'
import path from 'path'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/faq', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should parse and return FAQ data successfully', async () => {
      const mockFaqContent = `**What is BlueSphere?**
BlueSphere is a marine monitoring platform that tracks ocean conditions globally.
It provides real-time data on sea surface temperatures, marine heatwaves, and ecosystem health.

**How accurate are the predictions?**
Our predictions use state-of-the-art machine learning models trained on decades of ocean data.
Forecast accuracy varies by region and time horizon, typically 85-95% for 7-day forecasts.

**What data sources do you use?**
We integrate data from NDBC buoys, satellite observations, and international ocean monitoring networks.
All data is quality-controlled and validated before integration into our systems.`

      mockFs.readFileSync.mockReturnValue(mockFaqContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('ok', true)
      expect(response).toHaveProperty('qa')
      expect(Array.isArray(response.qa)).toBe(true)
      expect(response.qa).toHaveLength(3)

      expect(response.qa[0]).toEqual({
        q: 'What is BlueSphere?',
        a: expect.stringContaining('BlueSphere is a marine monitoring platform')
      })

      expect(response.qa[1]).toEqual({
        q: 'How accurate are the predictions?',
        a: expect.stringContaining('state-of-the-art machine learning models')
      })

      expect(response.qa[2]).toEqual({
        q: 'What data sources do you use?',
        a: expect.stringContaining('NDBC buoys, satellite observations')
      })
    })

    it('should handle empty FAQ file', async () => {
      mockFs.readFileSync.mockReturnValue('')

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: true,
        qa: []
      })
    })

    it('should handle FAQ with only whitespace', async () => {
      mockFs.readFileSync.mockReturnValue('   \n\n   \t   \n   ')

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: true,
        qa: []
      })
    })

    it('should handle malformed FAQ format', async () => {
      const malformedContent = `This is not a proper FAQ format
      Just some random text without the expected **Question** format
      Another line of text`

      mockFs.readFileSync.mockReturnValue(malformedContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: true,
        qa: []
      })
    })

    it('should handle mixed format with some valid questions', async () => {
      const mixedContent = `Random text at the start

**Valid Question 1?**
This is a valid answer.

Some random text in between

**Valid Question 2?**
This is another valid answer.
With multiple lines.

More random text`

      mockFs.readFileSync.mockReturnValue(mixedContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.ok).toBe(true)
      expect(response.qa).toHaveLength(2)
      expect(response.qa[0].q).toBe('Valid Question 1?')
      expect(response.qa[1].q).toBe('Valid Question 2?')
    })

    it('should handle questions with no answers', async () => {
      const contentWithEmptyAnswers = `**Question with no answer?**

**Another question?**
This one has an answer.

**Question at end?**`

      mockFs.readFileSync.mockReturnValue(contentWithEmptyAnswers)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.ok).toBe(true)
      expect(response.qa).toHaveLength(3)
      expect(response.qa[0].a).toBe('')
      expect(response.qa[1].a).toBe('This one has an answer.')
      expect(response.qa[2].a).toBe('')
    })

    it('should preserve markdown in answers', async () => {
      const markdownContent = `**How do I use the API?**
You can access our API using the following endpoints:

- GET /api/status - System status
- POST /api/predictions/forecast - Generate forecasts
- GET /api/alerts/marine-heatwaves - Current alerts

For more information, visit our [documentation](/docs).

**What formats are supported?**
We support **JSON** and _XML_ formats.`

      mockFs.readFileSync.mockReturnValue(markdownContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.ok).toBe(true)
      expect(response.qa).toHaveLength(2)
      expect(response.qa[0].a).toContain('- GET /api/status')
      expect(response.qa[0].a).toContain('[documentation](/docs)')
      expect(response.qa[1].a).toContain('**JSON**')
      expect(response.qa[1].a).toContain('_XML_')
    })

    it('should handle very long FAQ content', async () => {
      const longAnswer = 'x'.repeat(10000)
      const longContent = `**What is a very long answer?**
${longAnswer}`

      mockFs.readFileSync.mockReturnValue(longContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.ok).toBe(true)
      expect(response.qa).toHaveLength(1)
      expect(response.qa[0].a).toHaveLength(10000)
    })
  })

  describe('Error handling', () => {
    it('should handle file not found error', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: false,
        message: 'ENOENT: no such file or directory'
      })
    })

    it('should handle permission denied error', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: false,
        message: 'EACCES: permission denied'
      })
    })

    it('should handle generic filesystem errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Disk full')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: false,
        message: 'Disk full'
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw 'String error'
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: false,
        message: 'parse error'
      })
    })

    it('should handle null error objects', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw null
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        ok: false,
        message: 'parse error'
      })
    })
  })

  describe('HTTP methods', () => {
    it('should handle POST requests', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'POST',
        body: { test: 'data' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.ok).toBe(true)
    })

    it('should handle PUT requests', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'PUT',
        body: { test: 'data' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle DELETE requests', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle OPTIONS requests', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'OPTIONS',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('File path construction', () => {
    it('should construct correct file path', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('faq.md'),
        'utf8'
      )

      // Verify the path construction logic
      const callArgs = mockFs.readFileSync.mock.calls[0]
      const filePath = callArgs[0] as string
      expect(filePath).toContain('website')
      expect(filePath).toContain('faq.md')
    })
  })

  describe('Response format validation', () => {
    it('should always return JSON', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = res._getData()
      expect(() => JSON.parse(response)).not.toThrow()
    })

    it('should have consistent success response structure', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('ok')
      expect(response).toHaveProperty('qa')
      expect(typeof response.ok).toBe('boolean')
      expect(Array.isArray(response.qa)).toBe(true)
    })

    it('should have consistent error response structure', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Test error')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('ok')
      expect(response).toHaveProperty('message')
      expect(response.ok).toBe(false)
      expect(typeof response.message).toBe('string')
    })
  })

  describe('Edge cases with question parsing', () => {
    it('should handle questions with special characters', async () => {
      const specialContent = `**What's the API rate limit?**
The rate limit is 1000 requests/hour.

**How do I use "quotes" in queries?**
Use escaping: \\"like this\\".

**Can I use <HTML> tags?**
No, only plain text is supported.`

      mockFs.readFileSync.mockReturnValue(specialContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.qa).toHaveLength(3)
      expect(response.qa[0].q).toBe("What's the API rate limit?")
      expect(response.qa[1].q).toBe('How do I use "quotes" in queries?')
      expect(response.qa[2].q).toBe('Can I use <HTML> tags?')
    })

    it('should handle nested markdown formatting', async () => {
      const nestedContent = `**What are the **important** features?**
Here are the key features:
- **Real-time** monitoring
- _Advanced_ analytics
- **_Combined_** formatting`

      mockFs.readFileSync.mockReturnValue(nestedContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.qa).toHaveLength(1)
      expect(response.qa[0].q).toContain('important')
    })

    it('should handle unicode characters', async () => {
      const unicodeContent = `**What about émojis and spëcial charâcters? 🌊**
We support ünicode characters including émojis! 🦈🌊

**Китайский текст поддерживается?**
Yes, all UTF-8 characters are supported.`

      mockFs.readFileSync.mockReturnValue(unicodeContent)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.qa).toHaveLength(2)
      expect(response.qa[0].q).toContain('🌊')
      expect(response.qa[0].a).toContain('🦈🌊')
      expect(response.qa[1].q).toContain('Китайский')
    })
  })

  describe('Performance', () => {
    it('should respond quickly for small files', async () => {
      mockFs.readFileSync.mockReturnValue('**Test?**\nAnswer')

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should be very fast
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle large files efficiently', async () => {
      // Create a large FAQ with many questions
      const questions = Array.from({ length: 1000 }, (_, i) =>
        `**Question ${i}?**\nThis is answer ${i} with some content.\n`
      ).join('\n')

      mockFs.readFileSync.mockReturnValue(questions)

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.qa).toHaveLength(1000)
    })
  })
})