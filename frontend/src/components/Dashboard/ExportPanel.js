import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ExportPanel.css';
import {
  formatPercentage,
  formatCoordinates,
  formatDateTime,
  formatNumber
} from '../../utils/formatters';

const ExportPanel = ({ forklifts, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    setExportSuccess(false);
  };

  const closePanel = () => {
    setIsOpen(false);
    setExportSuccess(false);
  };

  // Handle ESC key to close panel and prevent background scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const exportToCSV = () => {
    setIsExporting(true);

    // Create CSV content
    const headers = ['ID', 'Name', 'Activity', 'Battery', 'Location', 'Last Updated'];
    const rows = forklifts.map(fork => [
      fork.forkliftId || fork.id || 'N/A',
      fork.name || 'Unknown',
      fork.currentActivity || fork.activity || 'N/A',
      formatPercentage(fork.batteryLevel || fork.battery || 0),
      fork.currentLocation ? formatCoordinates(fork.currentLocation.latitude, fork.currentLocation.longitude) : 'N/A',
      formatDateTime(fork.lastSeen || fork.lastUpdated || new Date())
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forklift-data-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    }, 1000);
  };

  const exportToJSON = () => {
    setIsExporting(true);

    // Create JSON content
    const data = {
      exportDate: new Date().toISOString(),
      stats: stats,
      forklifts: forklifts.map(fork => ({
        id: fork.forkliftId || fork.id,
        name: fork.name,
        activity: fork.currentActivity || fork.activity,
        battery: fork.batteryLevel || fork.battery,
        location: fork.currentLocation || fork.location,
        lastUpdated: fork.lastSeen || fork.lastUpdated
      }))
    };

    const jsonContent = JSON.stringify(data, null, 2);

    // Download file
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forklift-data-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    }, 1000);
  };

  const exportToPDF = () => {
    setIsExporting(true);

    // Create HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forklift Fleet Report</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            background-color: #f5f5f5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f97316;
          }
          .header h1 {
            color: #1a202c;
            margin: 0;
          }
          .header p {
            color: #6b7280;
            margin: 10px 0 0 0;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
          }
          .stat-card h3 {
            color: #6b7280;
            font-size: 14px;
            margin: 0 0 10px 0;
            text-transform: uppercase;
          }
          .stat-card p {
            color: #f97316;
            font-size: 32px;
            font-weight: bold;
            margin: 0;
          }
          .table-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #4a5568;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover {
            background-color: #f9fafb;
          }
          .status-working { color: #10b981; font-weight: 600; }
          .status-idle { color: #f59e0b; font-weight: 600; }
          .status-driving { color: #3b82f6; font-weight: 600; }
          .status-charging { color: #8b5cf6; font-weight: 600; }
          .status-parked { color: #6b7280; font-weight: 600; }
          .battery-critical { color: #ef4444; font-weight: 600; }
          .battery-low { color: #f59e0b; font-weight: 600; }
          .battery-good { color: #10b981; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Stera Forklift Fleet Report</h1>
          <p>Generated on ${formatDateTime(new Date())}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total Forklifts</h3>
            <p>${formatNumber(stats.total)}</p>
          </div>
          <div class="stat-card">
            <h3>Active</h3>
            <p>${formatNumber(stats.active)}</p>
          </div>
          <div class="stat-card">
            <h3>Working</h3>
            <p>${formatNumber(stats.working)}</p>
          </div>
          <div class="stat-card">
            <h3>Average Battery</h3>
            <p>${formatPercentage(stats.avgBattery)}</p>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Activity</th>
                <th>Battery</th>
                <th>Location</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              ${forklifts.map(fork => {
                const batteryLevel = fork.batteryLevel || fork.battery || 0;
                const activity = fork.currentActivity || fork.activity || 'UNKNOWN';
                const location = fork.currentLocation || fork.location || { latitude: 0, longitude: 0 };
                return `
                  <tr>
                    <td>${fork.forkliftId || fork.id || 'N/A'}</td>
                    <td>${fork.name || 'Unknown'}</td>
                    <td class="status-${activity.toLowerCase()}">${activity}</td>
                    <td class="${batteryLevel < 20 ? 'battery-critical' : batteryLevel < 40 ? 'battery-low' : 'battery-good'}">${formatPercentage(batteryLevel)}</td>
                    <td>${formatCoordinates(location.latitude, location.longitude)}</td>
                    <td>${formatDateTime(fork.lastSeen || fork.lastUpdated || new Date())}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    }, 1000);
  };

  // Modal content to be rendered via Portal
  const modalContent = isOpen && (
    <div className="export-modal-overlay" onClick={closePanel}>
      <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>Export Fleet Data</h3>
          <button className="close-modal-btn" onClick={closePanel} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="export-modal-body">
          {isExporting ? (
            <div className="export-loading">
              <div className="export-spinner"></div>
              <p>Preparing export...</p>
            </div>
          ) : exportSuccess ? (
            <div className="export-success">
              <div className="export-success-icon">✓</div>
              <p>Export successful!</p>
            </div>
          ) : (
            <div className="export-options">
              <div className="export-option" onClick={exportToCSV}>
                <div className="export-option-icon">📄</div>
                <div className="export-option-text">
                  <h4>Export to CSV</h4>
                  <p>Spreadsheet format for Excel</p>
                </div>
              </div>

              <div className="export-option" onClick={exportToJSON}>
                <div className="export-option-icon">📋</div>
                <div className="export-option-text">
                  <h4>Export to JSON</h4>
                  <p>Raw data for processing</p>
                </div>
              </div>

              <div className="export-option" onClick={exportToPDF}>
                <div className="export-option-icon">📑</div>
                <div className="export-option-text">
                  <h4>Export to PDF</h4>
                  <p>Formatted report with stats</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button className="export-button" onClick={togglePanel}>
        📊 Export
      </button>

      {/* Render modal using Portal to ensure it's on top */}
      {modalContent && ReactDOM.createPortal(
        modalContent,
        document.body
      )}
    </>
  );
};

export default ExportPanel;
