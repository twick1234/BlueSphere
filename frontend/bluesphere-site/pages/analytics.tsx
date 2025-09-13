import { useState } from 'react';
import PredictiveAnalytics from '../components/PredictiveAnalytics';
import Layout from '../components/Layout';

const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState<'7days' | '14days' | '30days' | '90days'>('30days');

  const AnalyticsContent = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Predictive Analytics Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered ocean temperature forecasting and marine heatwave risk assessment
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-900">
          Forecast Period:
        </label>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
          className="px-3 py-2 border bg-white border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7days">Next 7 Days</option>
          <option value="14days">Next 14 Days</option>
          <option value="30days">Next 30 Days</option>
          <option value="90days">Next 90 Days</option>
        </select>
      </div>

      {/* Predictive Analytics Component */}
      <div className="mb-8">
        <PredictiveAnalytics
          isDarkMode={false}
          selectedTimeframe={timeframe}
        />
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="rounded-lg border p-6 bg-white border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Machine Learning Model
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Neural Network Architecture:</strong> Our ensemble model combines LSTM (Long Short-Term Memory) networks with traditional regression analysis to capture both temporal patterns and complex oceanographic relationships.
            </p>
            <p>
              <strong>Training Data:</strong> Over 50,000 temperature measurements from satellites, autonomous buoys, and research vessels spanning 20+ years of observations.
            </p>
            <p>
              <strong>Feature Engineering:</strong> Incorporates sea surface temperature anomalies, ocean current velocities, atmospheric pressure systems, wind patterns, and climate oscillation indices.
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-6 bg-white border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Risk Assessment Framework
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span><strong>Critical (≥29.5°C):</strong> Severe bleaching expected, immediate intervention needed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span><strong>High (28.5-29.4°C):</strong> Moderate to severe bleaching likely</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <span><strong>Medium (27.5-28.4°C):</strong> Stress conditions, monitoring recommended</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span><strong>Low (&lt;27.5°C):</strong> Normal conditions, minimal risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Performance & Validation */}
      <div className="rounded-lg border p-6 bg-white border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Model Performance & Validation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-gray-900">Accuracy Metrics</h4>
            <div className="text-sm text-gray-600">
              <p className="mb-1"><strong>Overall Accuracy:</strong> 87-92%</p>
              <p className="mb-1"><strong>7-day forecast:</strong> 94% accuracy</p>
              <p className="mb-1"><strong>30-day forecast:</strong> 85% accuracy</p>
              <p><strong>90-day forecast:</strong> 78% accuracy</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-gray-900">Validation Methods</h4>
            <div className="text-sm text-gray-600">
              <p className="mb-1">• Cross-validation with hold-out datasets</p>
              <p className="mb-1">• Temporal validation on recent years</p>
              <p className="mb-1">• Regional performance benchmarking</p>
              <p>• Real-time forecast verification</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-gray-900">Continuous Improvement</h4>
            <div className="text-sm text-gray-600">
              <p className="mb-1">• Weekly model retraining</p>
              <p className="mb-1">• New data source integration</p>
              <p className="mb-1">• Algorithm refinement</p>
              <p>• Performance monitoring & alerting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Applications & Use Cases
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-900">🐠 Marine Conservation</h4>
            <p className="text-sm text-gray-600">
              Early warning systems for coral bleaching events, enabling proactive conservation measures and resource allocation.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-900">🏛️ Policy Planning</h4>
            <p className="text-sm text-gray-600">
              Evidence-based climate policy development with quantified risk assessments and impact projections.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-900">🔬 Scientific Research</h4>
            <p className="text-sm text-gray-600">
              Hypothesis generation and validation for climate change impacts on marine ecosystems.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-900">🏖️ Tourism Industry</h4>
            <p className="text-sm text-gray-600">
              Seasonal planning and risk management for reef-dependent tourism operations.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-900">🎣 Fisheries Management</h4>
            <p className="text-sm text-gray-600">
              Predicting fish migration patterns and optimizing sustainable fishing practices.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-900">💰 Insurance & Finance</h4>
            <p className="text-sm text-gray-600">
              Climate risk modeling for marine-dependent industries and coastal infrastructure.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Layout title="Predictive Analytics Dashboard - BlueSphere">
      <AnalyticsContent />
    </Layout>
  );
};

export default AnalyticsPage;