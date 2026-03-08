import React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-2 bg-dark-card p-2 rounded-lg border border-dark-border">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="bg-dark-bg text-dark-text text-sm rounded p-1 border border-dark-border"
      />
      <span className="text-dark-muted">đến</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="bg-dark-bg text-dark-text text-sm rounded p-1 border border-dark-border"
      />
    </div>
  );
}
