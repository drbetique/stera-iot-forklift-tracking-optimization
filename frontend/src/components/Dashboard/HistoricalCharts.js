import React, { useState, useEffect } from 'react';
import './HistoricalCharts.css';

const HistoricalCharts = ({ forklifts, dateRange }) => {
  const [chartData, setChartData] = useState({
    batteryTrends: [],
    activityDistribution: [],
    utilizationTrends: []
  });

  useEffect(() => {
    if (forklifts && forklifts.length > 0) {
      generateChartData();
    }
  }, [forklifts, dateRange]);

  const generateChartData = () => {
    // Generate time points for the last 7 days
    const days = 7;
    const timePoints = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      timePoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date
      });
    }

    // Generate battery trend data
    const batteryData = timePoints.map((point, index) => {
      const avgBattery = forklifts.reduce((sum, fork) => {
        // Simulate historical variance
        const variance = Math.sin(index * 0.5) * 10;
        return sum + Math.max(0, Math.min(100, fork.battery + variance));
      }, 0) / forklifts.length;

      return {
        date: point.date,
        average: Math.round(avgBattery),
        min: Math.round(avgBattery - 15),
        max: Math.round(avgBattery + 10)
      };
    });

    // Generate activity distribution data
    const activityData = timePoints.map((point, index) => {
      const variance = Math.sin(index * 0.7);
      return {
        date: point.date,
        parked: Math.round(20 + variance * 5),
        idle: Math.round(15 + variance * 3),
        driving: Math.round(25 + variance * 4),
        working: Math.round(30 + variance * 6),
        charging: Math.round(10 + variance * 2)
      };
    });

    // Generate utilization trends
    const utilizationData = timePoints.map((point, index) => {
      const baseUtil = 75;
      const variance = Math.sin(index * 0.6) * 10;
      return {
        date: point.date,
        utilization: Math.round(baseUtil + variance),
        target: 80
      };
    });

    setChartData({
      batteryTrends: batteryData,
      activityDistribution: activityData,
      utilizationTrends: utilizationData
    });
  };

  const renderBatteryTrendChart = () => {
    const maxValue = 100;
    const chartHeight = 200;

    return (
      <div className="chart-container">
        <h3>Battery Levels Over Time</h3>
        <div className="line-chart">
          <div className="chart-y-axis">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          <div className="chart-plot-area">
            <svg width="100%" height={chartHeight} className="chart-svg">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <line
                  key={val}
                  x1="0"
                  y1={chartHeight - (val / maxValue * chartHeight)}
                  x2="100%"
                  y2={chartHeight - (val / maxValue * chartHeight)}
                  stroke="#4a5568"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              ))}

              {/* Average line */}
              <polyline
                points={chartData.batteryTrends.map((point, index) => {
                  const x = (index / (chartData.batteryTrends.length - 1)) * 100;
                  const y = chartHeight - (point.average / maxValue * chartHeight);
                  return `${x}%,${y}`;
                }).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {chartData.batteryTrends.map((point, index) => {
                const x = (index / (chartData.batteryTrends.length - 1)) * 100;
                const y = chartHeight - (point.average / maxValue * chartHeight);
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={y}
                    r="5"
                    fill="#f97316"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            <div className="chart-x-axis">
              {chartData.batteryTrends.map((point, index) => (
                <span key={index}>{point.date}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
            <span>Average Battery Level</span>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityDistributionChart = () => {
    const activities = ['parked', 'idle', 'driving', 'working', 'charging'];
    const colors = {
      parked: '#6b7280',
      idle: '#f59e0b',
      driving: '#3b82f6',
      working: '#10b981',
      charging: '#8b5cf6'
    };

    return (
      <div className="chart-container">
        <h3>Activity Distribution Trends</h3>
        <div className="stacked-bar-chart">
          {chartData.activityDistribution.map((dayData, index) => {
            const total = activities.reduce((sum, act) => sum + dayData[act], 0);
            let cumulativePercent = 0;

            return (
              <div key={index} className="stacked-bar-group">
                <div className="stacked-bar">
                  {activities.map(activity => {
                    const percent = (dayData[activity] / total) * 100;
                    const segment = (
                      <div
                        key={activity}
                        className="bar-segment"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: colors[activity]
                        }}
                        title={`${activity}: ${dayData[activity]}%`}
                      />
                    );
                    cumulativePercent += percent;
                    return segment;
                  })}
                </div>
                <span className="bar-label">{dayData.date}</span>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          {activities.map(activity => (
            <div key={activity} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: colors[activity] }}></div>
              <span>{activity.charAt(0).toUpperCase() + activity.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUtilizationChart = () => {
    const maxValue = 100;
    const chartHeight = 200;

    return (
      <div className="chart-container">
        <h3>Fleet Utilization Trends</h3>
        <div className="line-chart">
          <div className="chart-y-axis">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          <div className="chart-plot-area">
            <svg width="100%" height={chartHeight} className="chart-svg">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <line
                  key={val}
                  x1="0"
                  y1={chartHeight - (val / maxValue * chartHeight)}
                  x2="100%"
                  y2={chartHeight - (val / maxValue * chartHeight)}
                  stroke="#4a5568"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              ))}

              {/* Target line */}
              <line
                x1="0"
                y1={chartHeight - (80 / maxValue * chartHeight)}
                x2="100%"
                y2={chartHeight - (80 / maxValue * chartHeight)}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="8 4"
              />

              {/* Utilization line */}
              <polyline
                points={chartData.utilizationTrends.map((point, index) => {
                  const x = (index / (chartData.utilizationTrends.length - 1)) * 100;
                  const y = chartHeight - (point.utilization / maxValue * chartHeight);
                  return `${x}%,${y}`;
                }).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {chartData.utilizationTrends.map((point, index) => {
                const x = (index / (chartData.utilizationTrends.length - 1)) * 100;
                const y = chartHeight - (point.utilization / maxValue * chartHeight);
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={y}
                    r="5"
                    fill="#f97316"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            <div className="chart-x-axis">
              {chartData.utilizationTrends.map((point, index) => (
                <span key={index}>{point.date}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
            <span>Fleet Utilization</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981', opacity: 0.6 }}></div>
            <span>Target (80%)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="historical-charts">
      <div className="charts-grid">
        {renderBatteryTrendChart()}
        {renderActivityDistributionChart()}
        {renderUtilizationChart()}
      </div>
    </div>
  );
};

export default HistoricalCharts;
