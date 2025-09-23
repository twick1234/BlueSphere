/**
 * BlueSphere Accessible Data Visualization Component
 *
 * Provides accessible alternatives to visual data representations
 * WCAG 2.1 AA compliant with text alternatives and keyboard navigation
 */

import React, { useState, useMemo } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface DataPoint {
  id: string;
  label: string;
  value: number;
  description?: string;
  color?: string;
  category?: string;
}

interface AccessibleDataVisualizationProps {
  data: DataPoint[];
  title: string;
  description?: string;
  unit?: string;
  showTable?: boolean;
  showSummary?: boolean;
  onDataPointSelect?: (point: DataPoint) => void;
}

export function AccessibleDataVisualization({
  data,
  title,
  description,
  unit = '',
  showTable = true,
  showSummary = true,
  onDataPointSelect
}: AccessibleDataVisualizationProps) {
  const { announce, screenReaderMode } = useAccessibility();
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'table' | 'summary'>('visual');

  const statistics = useMemo(() => {
    const values = data.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

    return { total, average, min, max, median, count: values.length };
  }, [data]);

  const handleDataPointFocus = (point: DataPoint) => {
    setSelectedPoint(point);
    const announcement = `${point.label}: ${point.value}${unit}${point.description ? `, ${point.description}` : ''}`;
    announce(announcement, 'polite');
    onDataPointSelect?.(point);
  };

  const handleViewModeChange = (mode: 'visual' | 'table' | 'summary') => {
    setViewMode(mode);
    announce(`Switched to ${mode} view`, 'polite');
  };

  const renderSummary = () => (
    <div className="data-summary" role="region" aria-labelledby="summary-title">
      <h3 id="summary-title" className="summary-title">Data Summary</h3>
      <dl className="summary-stats">
        <div className="stat">
          <dt>Total Items:</dt>
          <dd>{statistics.count}</dd>
        </div>
        <div className="stat">
          <dt>Total Value:</dt>
          <dd>{statistics.total.toFixed(2)}{unit}</dd>
        </div>
        <div className="stat">
          <dt>Average:</dt>
          <dd>{statistics.average.toFixed(2)}{unit}</dd>
        </div>
        <div className="stat">
          <dt>Range:</dt>
          <dd>{statistics.min.toFixed(2)}{unit} - {statistics.max.toFixed(2)}{unit}</dd>
        </div>
        <div className="stat">
          <dt>Median:</dt>
          <dd>{statistics.median.toFixed(2)}{unit}</dd>
        </div>
      </dl>
    </div>
  );

  const renderTable = () => (
    <div className="data-table-container" role="region" aria-labelledby="table-title">
      <h3 id="table-title" className="table-title">Data Table</h3>
      <table className="data-table" role="table">
        <caption className="table-caption">
          {title} - {data.length} data points
        </caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Value ({unit})</th>
            {data.some(d => d.category) && <th scope="col">Category</th>}
            {data.some(d => d.description) && <th scope="col">Description</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((point, index) => (
            <tr
              key={point.id}
              className={selectedPoint?.id === point.id ? 'selected' : ''}
              onClick={() => handleDataPointFocus(point)}
              tabIndex={0}
              role="button"
              aria-describedby={`row-${index}-description`}
            >
              <td>{point.label}</td>
              <td>{point.value.toFixed(2)}</td>
              {data.some(d => d.category) && <td>{point.category || '—'}</td>}
              {data.some(d => d.description) && <td>{point.description || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderControls = () => (
    <div className="view-controls" role="group" aria-label="Data view options">
      <button
        className={`control-button ${viewMode === 'visual' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('visual')}
        aria-pressed={viewMode === 'visual'}
      >
        Visual View
      </button>
      <button
        className={`control-button ${viewMode === 'table' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('table')}
        aria-pressed={viewMode === 'table'}
      >
        Table View
      </button>
      <button
        className={`control-button ${viewMode === 'summary' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('summary')}
        aria-pressed={viewMode === 'summary'}
      >
        Summary View
      </button>
    </div>
  );

  return (
    <>
      <div className="accessible-data-viz" role="img" aria-labelledby="viz-title" aria-describedby="viz-description">
        <div className="viz-header">
          <h2 id="viz-title" className="viz-title">{title}</h2>
          {description && (
            <p id="viz-description" className="viz-description">{description}</p>
          )}
        </div>

        {!screenReaderMode && renderControls()}

        <div className="viz-content">
          {(viewMode === 'visual' && !screenReaderMode) && (
            <div className="visual-content">
              <p className="sr-only">
                Visual representation of data showing {data.length} items.
                Use the table view or summary view buttons for accessible alternatives.
              </p>
              {/* Visual representation would go here */}
            </div>
          )}

          {(viewMode === 'table' || screenReaderMode) && renderTable()}

          {(viewMode === 'summary' || screenReaderMode) && showSummary && renderSummary()}
        </div>

        {selectedPoint && (
          <div
            className="selected-point-info"
            role="status"
            aria-live="polite"
            aria-label="Selected data point information"
          >
            <h4>Selected: {selectedPoint.label}</h4>
            <p>Value: {selectedPoint.value}{unit}</p>
            {selectedPoint.description && <p>{selectedPoint.description}</p>}
          </div>
        )}
      </div>

      <style jsx>{`
        .accessible-data-viz {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: #ffffff;
        }

        .viz-header {
          margin-bottom: 20px;
        }

        .viz-title {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .viz-description {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .view-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          padding: 4px;
          background: #f3f4f6;
          border-radius: 6px;
          border: 1px solid #d1d5db;
        }

        .control-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 44px;
        }

        .control-button:hover {
          background: #e5e7eb;
        }

        .control-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .control-button.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .viz-content {
          margin-bottom: 20px;
        }

        .data-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .summary-title {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 0;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .stat:last-child {
          border-bottom: none;
        }

        .stat dt {
          font-weight: 500;
          color: #475569;
        }

        .stat dd {
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .data-table-container {
          overflow-x: auto;
          margin-bottom: 20px;
        }

        .table-title {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .table-caption {
          caption-side: top;
          padding: 8px;
          text-align: left;
          font-weight: 500;
          color: #475569;
          background: #f8fafc;
        }

        .data-table th {
          background: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
        }

        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #374151;
        }

        .data-table tr:hover {
          background: #f8fafc;
        }

        .data-table tr:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
          background: #dbeafe;
        }

        .data-table tr.selected {
          background: #dbeafe;
        }

        .selected-point-info {
          background: #dbeafe;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          padding: 16px;
          margin-top: 16px;
        }

        .selected-point-info h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .selected-point-info p {
          margin: 4px 0;
          font-size: 14px;
          color: #1e40af;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .accessible-data-viz {
            border: 3px solid #000000;
          }

          .control-button.active {
            background: #000000;
            color: #ffffff;
            border: 2px solid #ffffff;
          }

          .data-table th {
            background: #000000;
            color: #ffffff;
          }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .accessible-data-viz {
            background: #1f2937;
            border-color: #374151;
          }

          .viz-title {
            color: #f9fafb;
          }

          .viz-description {
            color: #d1d5db;
          }

          .data-summary {
            background: #374151;
            border-color: #4b5563;
          }

          .summary-title {
            color: #f3f4f6;
          }

          .data-table {
            border-color: #4b5563;
          }

          .data-table th {
            background: #374151;
            color: #f3f4f6;
          }

          .data-table td {
            color: #d1d5db;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .view-controls {
            flex-direction: column;
          }

          .summary-stats {
            grid-template-columns: 1fr;
          }

          .data-table {
            font-size: 14px;
          }

          .data-table th,
          .data-table td {
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
}