import React from 'react';

export default function StatCard({ title, count, icon: Icon, color, bgColor, active, onClick }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: active ? `4px solid ${color}` : undefined
      }}
    >
      <div className="stat-info">
        <h4>{title}</h4>
        <div className="stat-number">{count ?? 0}</div>
      </div>
      <div
        className="stat-icon-wrapper"
        style={{ backgroundColor: bgColor, color }}
      >
        <Icon size={22} />
      </div>
    </div>
  );
}
