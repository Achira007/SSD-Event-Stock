'use client';

import React, { useEffect, useState } from 'react';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' น.';
}

function getTypeStyle(type: string) {
  switch (type) {
    case 'BORROW':
      return { label: 'เบิก', bg: 'var(--status-inuse-bg)', color: 'var(--status-inuse-text)' };
    case 'RETURN':
      return { label: 'คืน', bg: 'var(--status-available-bg)', color: 'var(--status-available-text)' };
    case 'ADD_STOCK':
      return { label: 'เพิ่มสต็อก', bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' };
    case 'REMOVE_STOCK':
      return { label: 'ลดสต็อก', bg: 'var(--status-unavailable-bg)', color: 'var(--status-unavailable-text)' };
    case 'REPAIR_RETURN':
      return { label: 'ซ่อมคืนคลัง', bg: 'rgba(20,184,166,0.15)', color: '#2dd4bf' };
    default:
      return { label: type, bg: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)' };
  }
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');

  async function fetchHistory(type: string) {
    try {
      setLoading(true);
      const url = type ? `/api/history?type=${type}` : '/api/history';
      const res = await fetch(url);
      const data = await res.json();
      setHistoryList(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory(filterType);
  }, [filterType]);

  const filterOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'BORROW', label: 'การเบิก' },
    { value: 'RETURN', label: 'การคืน' },
    { value: 'ADJUST', label: 'การปรับยอด' },
  ];

  return (
    <div className="container fade-in">
      <header style={{ marginBottom: '24px' }}>
        <h1>ประวัติการทำรายการ</h1>
        <p>รายการธุรกรรมทั้งหมดของระบบคลังอุปกรณ์</p>
      </header>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterType(opt.value)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              background: filterType === opt.value ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: filterType === opt.value ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filterType === opt.value ? 'var(--primary)' : 'var(--border-glass)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดประวัติ...</p>
        </div>
      ) : historyList.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '64px 32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>ไม่มีประวัติการทำรายการ{filterType ? 'ในประเภทนี้' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {historyList.map((item) => {
            const typeStyle = getTypeStyle(item.type);
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '10px',
                transition: 'all 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glass)'; }}
              >
                {item.equipmentImageUrl ? (
                  <img src={item.equipmentImageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>📦</div>
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: typeStyle.bg, color: typeStyle.color }}>
                      {item.typeLabel || typeStyle.label}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.equipmentName}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: '#fff' }}>{item.userName}</strong> — {item.details}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(item.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
