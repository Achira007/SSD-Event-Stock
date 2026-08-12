import React from 'react';

type StatusType = 'AVAILABLE' | 'IN_USE' | 'UNAVAILABLE' | 'พร้อมใช้งาน' | 'ใช้งานอยู่' | 'ไม่พร้อมใช้งาน';

interface StatusBadgeProps {
  status: StatusType;
  quantity?: number;
}

export default function StatusBadge({ status, quantity }: StatusBadgeProps) {
  let label = '';
  let bg = '';
  let color = '';

  const normalized = status.toUpperCase();

  if (normalized === 'AVAILABLE' || status === 'พร้อมใช้งาน') {
    label = 'พร้อมใช้งาน';
    bg = 'var(--status-available-bg)';
    color = 'var(--status-available-text)';
  } else if (normalized === 'IN_USE' || status === 'ใช้งานอยู่') {
    label = 'ใช้งานอยู่';
    bg = 'var(--status-inuse-bg)';
    color = 'var(--status-inuse-text)';
  } else if (normalized === 'UNAVAILABLE' || status === 'ไม่พร้อมใช้งาน') {
    label = 'ไม่พร้อมใช้งาน';
    bg = 'var(--status-unavailable-bg)';
    color = 'var(--status-unavailable-text)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        gap: '6px',
      }}
    >
      <span>{label}</span>
      {quantity !== undefined && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#fff',
          }}
        >
          {quantity}
        </span>
      )}
    </span>
  );
}
