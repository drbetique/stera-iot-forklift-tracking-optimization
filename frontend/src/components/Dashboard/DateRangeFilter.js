import React, { useState } from 'react';
import './DateRangeFilter.css';

const DateRangeFilter = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilter, setActiveFilter] = useState('7days');

  const handleQuickFilter = (filterType) => {
    const end = new Date();
    let start = new Date();

    switch (filterType) {
      case 'today':
        start = new Date();
        break;
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      default:
        return;
    }

    setActiveFilter(filterType);
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));

    if (onDateChange) {
      onDateChange({ start, end });
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      setActiveFilter('custom');
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (onDateChange) {
        onDateChange({ start, end });
      }
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setActiveFilter('7days');

    if (onDateChange) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      onDateChange({ start, end });
    }
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="date-range-filter">
      <div className="filter-header">
        <h3>Date Range Filter</h3>
        <span className="filter-subtitle">Analyze historical data</span>
      </div>

      <div className="filter-content">
        <div className="quick-filters">
          <h4>Quick Filters</h4>
          <div className="quick-filter-buttons">
            <button
              className={`quick-filter-btn ${activeFilter === 'today' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('today')}
            >
              Today
            </button>
            <button
              className={`quick-filter-btn ${activeFilter === '7days' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('7days')}
            >
              Last 7 Days
            </button>
            <button
              className={`quick-filter-btn ${activeFilter === '30days' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('30days')}
            >
              Last 30 Days
            </button>
            <button
              className={`quick-filter-btn ${activeFilter === '90days' ? 'active' : ''}`}
              onClick={() => handleQuickFilter('90days')}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        <div className="custom-date-filter">
          <h4>Custom Range</h4>
          <div className="date-inputs">
            <div className="date-input-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || formatDateForInput(new Date())}
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="end-date">End Date</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={formatDateForInput(new Date())}
              />
            </div>
          </div>
          <div className="filter-actions">
            <button
              className="apply-btn"
              onClick={handleCustomApply}
              disabled={!startDate || !endDate}
            >
              Apply Filter
            </button>
            <button className="reset-btn" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        <div className="filter-info">
          <div className="info-icon">ℹ️</div>
          <span>
            {activeFilter === 'today' && 'Showing data from today'}
            {activeFilter === '7days' && 'Showing data from the last 7 days'}
            {activeFilter === '30days' && 'Showing data from the last 30 days'}
            {activeFilter === '90days' && 'Showing data from the last 90 days'}
            {activeFilter === 'custom' && `Custom range: ${startDate} to ${endDate}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
