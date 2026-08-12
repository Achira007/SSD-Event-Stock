'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Modal from '@/components/Modal';

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  // Create event form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventStartAt, setEventStartAt] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  async function fetchEvents() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!eventName.trim()) {
      setCreateError('กรุณากรอกชื่องาน');
      return;
    }
    if (!eventStartAt) {
      setCreateError('กรุณาระบุวันเริ่มงาน');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          description: eventDesc,
          startAt: eventStartAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถสร้างงานได้');

      setIsCreateOpen(false);
      setEventName('');
      setEventDesc('');
      setEventStartAt('');
      fetchEvents();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>กำลังโหลดรายการงาน...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>งานอีเวนต์</h1>
          <p>รายการงานทั้งหมดที่มีในระบบ รวมถึงงานที่ดำเนินอยู่และที่เสร็จสิ้นแล้ว</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setIsCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            สร้างงานใหม่
          </button>
        )}
      </header>

      {events.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '64px 32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>ยังไม่มีงานในระบบ</p>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>สร้างงานแรก</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/events/${event.id}`)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glass)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {event.name}
                </span>
                {event.description && (
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{event.description}</span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  เริ่ม: {new Date(event.startAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <span
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  backgroundColor: event.status === 'ACTIVE' ? 'var(--status-available-bg)' : 'rgba(100, 116, 139, 0.15)',
                  color: event.status === 'ACTIVE' ? 'var(--status-available-text)' : 'var(--text-muted)',
                }}
              >
                {event.status === 'ACTIVE' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal isOpen={isCreateOpen} title="สร้างงานอีเวนต์ใหม่" onClose={() => { setIsCreateOpen(false); setCreateError(''); }}>
        <form onSubmit={handleCreate}>
          {createError && (
            <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: 'var(--status-unavailable-text)', marginBottom: '20px', fontSize: '14px' }}>
              {createError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>ชื่องาน *</label>
            <input type="text" placeholder="เช่น งานติดตั้งเวทีคอนเสิร์ต" value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={creating} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>รายละเอียด</label>
            <textarea placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับงาน (ไม่บังคับ)" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} disabled={creating} rows={3} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>วันเริ่มงาน *</label>
            <input type="date" value={eventStartAt} onChange={(e) => setEventStartAt(e.target.value)} disabled={creating} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsCreateOpen(false); setCreateError(''); }} disabled={creating}>ยกเลิก</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={creating}>{creating ? 'กำลังสร้าง...' : 'สร้างงาน'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
