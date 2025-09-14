import Layout from '../components/Layout';
import Link from 'next/link';

const ArchitecturePage = () => {
  const ArchitectureContent = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          BlueSphere Architecture
        </h1>
        <p className="text-lg text-gray-600">
          Behind-the-scenes look at how BlueSphere processes ocean data to deliver real-time climate insights
        </p>
      </div>

      {/* System Overview */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Data Flow</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span><strong>Ingestion:</strong> 58+ global monitoring stations</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span><strong>Quality Control:</strong> Real-time validation & QC flags</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span><strong>Processing:</strong> ML predictions & anomaly detection</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span><strong>Visualization:</strong> Interactive maps & charts</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Tech Stack</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div><strong>Frontend:</strong> Next.js 14, React, TypeScript, Tailwind CSS</div>
              <div><strong>Mapping:</strong> Leaflet, React Leaflet</div>
              <div><strong>Visualization:</strong> D3.js, custom charts</div>
              <div><strong>API:</strong> Next.js API Routes, RESTful endpoints</div>
              <div><strong>Data:</strong> PostgreSQL, Time-series optimization</div>
              <div><strong>ML:</strong> TensorFlow.js, predictive modeling</div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Database Schema</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">stations</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><code className="bg-gray-100 px-1 rounded">station_id</code> VARCHAR(50) PK</div>
              <div><code className="bg-gray-100 px-1 rounded">name</code> VARCHAR(200)</div>
              <div><code className="bg-gray-100 px-1 rounded">lat</code> DECIMAL(10,6)</div>
              <div><code className="bg-gray-100 px-1 rounded">lon</code> DECIMAL(10,6)</div>
              <div><code className="bg-gray-100 px-1 rounded">provider</code> ENUM</div>
              <div><code className="bg-gray-100 px-1 rounded">is_active</code> BOOLEAN</div>
              <div><code className="bg-gray-100 px-1 rounded">metadata</code> JSONB</div>
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">observations</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><code className="bg-gray-100 px-1 rounded">id</code> BIGSERIAL PK</div>
              <div><code className="bg-gray-100 px-1 rounded">station_id</code> VARCHAR(50) FK</div>
              <div><code className="bg-gray-100 px-1 rounded">time</code> TIMESTAMPTZ</div>
              <div><code className="bg-gray-100 px-1 rounded">sst_c</code> DECIMAL(5,2)</div>
              <div><code className="bg-gray-100 px-1 rounded">qc_flag</code> INTEGER</div>
              <div><code className="bg-gray-100 px-1 rounded">source</code> VARCHAR(50)</div>
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">job_runs</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><code className="bg-gray-100 px-1 rounded">id</code> SERIAL PK</div>
              <div><code className="bg-gray-100 px-1 rounded">source</code> VARCHAR(100)</div>
              <div><code className="bg-gray-100 px-1 rounded">started</code> TIMESTAMPTZ</div>
              <div><code className="bg-gray-100 px-1 rounded">status</code> ENUM</div>
              <div><code className="bg-gray-100 px-1 rounded">rows_ingested</code> INTEGER</div>
              <div><code className="bg-gray-100 px-1 rounded">error_message</code> TEXT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibent mb-4 text-gray-900">Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">NOAA NDBC</h3>
            <p className="text-sm text-blue-700">35+ US buoy stations</p>
            <p className="text-xs text-blue-600 mt-1">Real-time & historical</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900">Australian BOM</h3>
            <p className="text-sm text-green-700">15+ Pacific stations</p>
            <p className="text-xs text-green-600 mt-1">Hourly updates</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900">European EMSO</h3>
            <p className="text-sm text-purple-700">20+ Atlantic/Med stations</p>
            <p className="text-xs text-purple-600 mt-1">High precision</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-900">Satellite Data</h3>
            <p className="text-sm text-orange-700">MODIS, VIIRS SST</p>
            <p className="text-xs text-orange-600 mt-1">Global coverage</p>
          </div>
        </div>
      </div>

      {/* Quality Control */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Quality Control System</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">QC Tests</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">Range Test</div>
                  <div className="text-sm text-gray-600">Values within oceanographic bounds</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">Spike Detection</div>
                  <div className="text-sm text-gray-600">Identify unrealistic sudden changes</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">Rate of Change</div>
                  <div className="text-sm text-gray-600">Monitor temporal gradients</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">Spatial Consistency</div>
                  <div className="text-sm text-gray-600">Compare with nearby stations</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">QC Flags</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-sm"><strong>1:</strong> Good data - passed all tests</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span className="text-sm"><strong>2:</strong> Probably good - minor issues</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                <span className="text-sm"><strong>3:</strong> Probably bad - failed some tests</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span className="text-sm"><strong>4:</strong> Bad data - failed critical tests</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded mr-3"></div>
                <span className="text-sm"><strong>9:</strong> Missing data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">API Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Data Access</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-blue-600 font-semibold">GET</span> /api/obs
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-blue-600 font-semibold">GET</span> /api/stations
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-blue-600 font-semibold">GET</span> /api/obs/summary
              </div>
              <div className="bg-green-50 p-2 rounded">
                <span className="text-green-600 font-semibold">POST</span> /api/ingestion/run
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Analytics & Alerts</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-blue-600 font-semibold">GET</span> /api/alerts/active
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-blue-600 font-semibold">GET</span> /api/predictions/forecast
              </div>
              <div className="bg-green-50 p-2 rounded">
                <span className="text-green-600 font-semibold">POST</span> /api/alerts/subscribe
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-blue-600 font-semibold">GET</span> /api/status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Monitoring */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Performance & Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">&lt; 3s</div>
            <div className="text-sm font-medium text-gray-900">Page Load Time</div>
            <div className="text-xs text-gray-600">Target response time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
            <div className="text-sm font-medium text-gray-900">Uptime Target</div>
            <div className="text-xs text-gray-600">Service availability</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">15min</div>
            <div className="text-sm font-medium text-gray-900">Data Freshness</div>
            <div className="text-xs text-gray-600">Maximum data lag</div>
          </div>
        </div>
      </div>

      {/* Documentation Links */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Technical Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">System Documentation</h3>
            <div className="space-y-1 text-sm">
              <div><Link href="/docs/architecture" className="text-blue-600 hover:text-blue-800">Complete Architecture Guide</Link></div>
              <div><Link href="/docs/api" className="text-blue-600 hover:text-blue-800">API Reference</Link></div>
              <div><Link href="/docs/data-schema" className="text-blue-600 hover:text-blue-800">Database Schema</Link></div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Development</h3>
            <div className="space-y-1 text-sm">
              <div><Link href="https://github.com/twick1234/BlueSphere" className="text-blue-600 hover:text-blue-800">GitHub Repository</Link></div>
              <div><Link href="/docs/contributing" className="text-blue-600 hover:text-blue-800">Contributing Guide</Link></div>
              <div><Link href="/docs/deployment" className="text-blue-600 hover:text-blue-800">Deployment Guide</Link></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Layout title="System Architecture - BlueSphere">
      <ArchitectureContent />
    </Layout>
  );
};

export default ArchitecturePage;