// Data ingestion trigger API endpoint
// Allows manual triggering of NDBC data ingestion pipeline
import { NextApiRequest, NextApiResponse } from 'next'
import { dataIngestionService } from '../../../lib/data-ingestion'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    console.log('Starting NDBC data ingestion...')
    
    // Initialize stations if needed
    await dataIngestionService.initializeStations()
    
    // Run ingestion
    const jobResult = await dataIngestionService.ingestNDBCData()
    
    const response = {
      message: 'Data ingestion completed',
      job_result: jobResult,
      performance: {
        execution_time_ms: jobResult.ended && jobResult.started 
          ? new Date(jobResult.ended).getTime() - new Date(jobResult.started).getTime()
          : null,
        status: jobResult.status,
        rows_ingested: jobResult.rows_ingested || 0
      },
      next_steps: [
        'Check /api/ingestion/status for ongoing monitoring',
        'Query /api/obs for the ingested observation data',
        'View /api/stations for updated station metadata'
      ]
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error('Ingestion failed:', error)
    res.status(500).json({ 
      error: 'Data ingestion failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}