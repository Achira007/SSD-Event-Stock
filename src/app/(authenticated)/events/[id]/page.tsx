'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Complete event confirm
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Edit event
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartAt, setEditStartAt] = useState('');
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);

  // Borrow from event
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [borrowQty, setBorrowQty] = useState('1');
  const [borrowError, setBorrowError] = useState('');

  // Return from event
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('1');
  const [isDeclareMissing, setIsDeclareMissing] = useState(false);
  const [returnReason, setReturnReason] = useState<'DAMAGED' | 'OTHER'>('DAMAGED');
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');

  const isAdmin = session?.user?.role === 'ADMIN';

  async function loadData() {
    try {
      setErrorMsg('');
      const [eventRes, equipRes] = await Promise.all([
        fetch(`/api/events?id=${eventId}`),
        fetch('/api/equipment'),
      ]);

      if (!eventRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลงานได้');
      const eventData = await eventRes.json();
      setEvent(eventData);

      const equipData = await equipRes.json();
      setEquipmentList(Array.isArray(equipData) ? equipData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'การเชื่อมต่อขัดข้อง');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [eventId]);

  const outstandingBorrows = event?.borrows?.filter((b: any) => b.outstandingQuantity > 0) || [];
  const hasOutstanding = outstandingBorrows.length > 0;

  const handleCompleteEvent = async () => {
    setCompleting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, action: 'complete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถปิดงานได้');
      setIsCompleteOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editName.trim()) {
      setEditError('กรุณากรอกชื่องาน');
      return;
    }
    if (!editStartAt) {
      setEditError('กรุณาระบุวันเริ่มงาน');
      return;
    }

    setEditing(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          action: 'edit',
          name: editName,
          description: editDesc,
          startAt: editStartAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถแก้ไขข้อมูลงานได้');

      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBorrowError('');

    const qty = parseInt(borrowQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setBorrowError('กรุณากรอกจำนวนมากกว่า 0');
      return;
    }
    if (selectedEquipment && qty > selectedEquipment.availableQuantity) {
      setBorrowError(`ไม่สามารถเบิกเกินจำนวนที่พร้อมใช้งานได้ (สูงสุด ${selectedEquipment.availableQuantity} ชิ้น)`);
      return;
    }

    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEquipment.id,
          quantity: qty,
          purposeType: 'CURRENT_EVENT',
          purposeNote: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเบิกอุปกรณ์ได้');

      setIsBorrowOpen(false);
      setSelectedEquipment(null);
      setBorrowQty('1');
      loadData();
    } catch (err: any) {
      setBorrowError(err.message);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');

    const qty = parseInt(returnQty, 10);
    if (isNaN(qty) || qty < 0) {
      setReturnError('กรุณากรอกจำนวนที่ต้องการคืน');
      return;
    }
    if (qty > selectedBorrow.outstandingQuantity) {
      setReturnError(`ไม่สามารถคืนเกินจำนวนค้างส่งได้ (สูงสุด ${selectedBorrow.outstandingQuantity} ชิ้น)`);
      return;
    }

    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowRecordId: selectedBorrow.id,
          returnedQuantity: qty,
          isFinal: isDeclareMissing,
          unavailableReason: returnReason,
          note: returnNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถคืนอุปกรณ์ได้');

      setIsReturnOpen(false);
      setSelectedBorrow(null);
      setReturnQty('1');
      setIsDeclareMissing(false);
      setReturnNote('');
      loadData();
    } catch (err: any) {
      setReturnError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลงาน...</p>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="container">
        <button className="btn-secondary" onClick={() => router.push('/events')} style={{ marginBottom: '16px' }}>ย้อนกลับ</button>
        <div style={{ padding: '24px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ color: 'var(--status-unavailable-text)', fontWeight: 600 }}>{errorMsg || 'ไม่พบงานดังกล่าว'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <header style={{ marginBottom: '24px' }}>
        <button onClick={() => router.push('/events')} style={{ background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          ย้อนกลับรายการงาน
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>{event.name}</h1>
            {event.description && <p style={{ marginBottom: '8px' }}>{event.description}</p>}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>เริ่ม: {new Date(event.startAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {event.completedAt && <span>สิ้นสุด: {new Date(event.completedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              backgroundColor: event.status === 'ACTIVE' ? 'var(--status-available-bg)' : 'rgba(100,116,139,0.15)',
              color: event.status === 'ACTIVE' ? 'var(--status-available-text)' : 'var(--text-muted)',
            }}>
              {event.status === 'ACTIVE' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
            </span>
            {isAdmin && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditName(event.name);
                  setEditDesc(event.description || '');
                  setEditStartAt(event.startAt ? new Date(event.startAt).toISOString().split('T')[0] : '');
                  setIsEditOpen(true);
                }}
              >
                แก้ไขงาน
              </button>
            )}
            {isAdmin && event.status === 'ACTIVE' && (
              <button className="btn-danger" onClick={() => setIsCompleteOpen(true)}>ปิดงานเสร็จสิ้น</button>
            )}
          </div>
        </div>
      </header>

      {/* Borrow from event button */}
      {event.status === 'ACTIVE' && (
        <div style={{ marginBottom: '24px' }}>
          <button className="btn-primary" onClick={() => setIsBorrowOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            เบิกอุปกรณ์สำหรับงานนี้
          </button>
        </div>
      )}

      {/* Outstanding borrows for this event */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>รายการอุปกรณ์ที่เบิกสำหรับงานนี้</h2>
        {event.borrows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>ยังไม่มีอุปกรณ์ที่เบิกสำหรับงานนี้</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {event.borrows.map((borrow: any) => (
              <div key={borrow.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                  {borrow.equipmentImageUrl && <img src={borrow.equipmentImageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-main)', flexShrink: 0 }} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{borrow.equipmentName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ผู้เบิก: {borrow.borrowedBy} — จำนวน: {borrow.quantity} ชิ้น</span>
                    <span style={{ fontSize: '12px', color: borrow.status === 'OUTSTANDING' ? 'var(--status-inuse-text)' : 'var(--status-available-text)' }}>
                      {borrow.status === 'OUTSTANDING' ? `ค้างส่ง ${borrow.outstandingQuantity} ชิ้น` : 'คืนครบ'}
                    </span>
                  </div>
                </div>
                {borrow.outstandingQuantity > 0 && (
                  <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '13px', flexShrink: 0 }}
                    onClick={() => {
                      setSelectedBorrow(borrow);
                      setReturnQty(borrow.outstandingQuantity.toString());
                      setIsDeclareMissing(false);
                      setReturnNote('');
                      setIsReturnOpen(true);
                    }}>
                    คืน
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Event Confirmation Modal */}
      <Modal isOpen={isCompleteOpen} title="ยืนยันปิดงาน" onClose={() => setIsCompleteOpen(false)}>
        {hasOutstanding && (
          <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', color: 'var(--status-inuse-text)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
            <strong>คำเตือน:</strong> ยังมีอุปกรณ์ค้างส่ง {outstandingBorrows.length} รายการสำหรับงานนี้ การปิดงานจะไม่ลบหรือปิดรายการเบิกค้างส่งเหล่านั้นโดยอัตโนมัติ
          </div>
        )}
        <p style={{ marginBottom: '24px' }}>คุณต้องการปิดงาน <strong>{event.name}</strong> เป็นเสร็จสิ้นใช่หรือไม่?</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCompleteOpen(false)} disabled={completing}>ยกเลิก</button>
          <button className="btn-danger" style={{ flex: 1 }} onClick={handleCompleteEvent} disabled={completing}>{completing ? 'กำลังปิดงาน...' : 'ยืนยันปิดงาน'}</button>
        </div>
      </Modal>

      {/* Borrow from Event Modal */}
      <Modal isOpen={isBorrowOpen} title={`เบิกอุปกรณ์สำหรับงาน: ${event.name}`} onClose={() => { setIsBorrowOpen(false); setBorrowError(''); setSelectedEquipment(null); }}>
        {!selectedEquipment ? (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>เลือกอุปกรณ์ที่ต้องการเบิก</p>
            {equipmentList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>ไม่มีอุปกรณ์ในคลัง</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {equipmentList.map((eq) => (
                  <div key={eq.id} onClick={() => { setSelectedEquipment(eq); setBorrowQty('1'); setBorrowError(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer',
                      background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border-glass)', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glass)'; }}>
                    <img src={eq.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', background: 'var(--bg-main)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{eq.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>พร้อมใช้งาน: {eq.availableQuantity} ชิ้น</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleBorrowSubmit}>
            {borrowError && (
              <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: 'var(--status-unavailable-text)', marginBottom: '16px', fontSize: '14px' }}>
                {borrowError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <img src={selectedEquipment.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{selectedEquipment.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>พร้อมใช้งาน: {selectedEquipment.availableQuantity} ชิ้น</div>
              </div>
              <button type="button" onClick={() => setSelectedEquipment(null)} style={{ background: 'transparent', color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '13px' }}>เปลี่ยน</button>
            </div>

            {selectedEquipment.availableQuantity === 0 ? (
              <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: 'var(--status-unavailable-text)', marginBottom: '16px', fontSize: '14px' }}>
                <strong>ไม่มีอุปกรณ์พร้อมใช้งาน</strong> ขณะนี้สินค้าคงคลังพร้อมใช้งานเป็น 0 ไม่สามารถเบิกสินค้าได้
              </div>
            ) : (
              <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', color: 'var(--status-inuse-text)', fontSize: '13px', marginBottom: '16px' }}>
                วัตถุประสงค์: <strong>งานปัจจุบัน ({event.name})</strong>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>จำนวนที่ต้องการเบิก</label>
              <input type="number" min="1" max={selectedEquipment.availableQuantity} value={borrowQty} onChange={(e) => setBorrowQty(e.target.value)} disabled={selectedEquipment.availableQuantity === 0} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsBorrowOpen(false); setBorrowError(''); setSelectedEquipment(null); }}>ยกเลิก</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={selectedEquipment.availableQuantity === 0}>ยืนยันการเบิก</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Return from Event Modal */}
      {selectedBorrow && (
        <Modal isOpen={isReturnOpen} title={`คืนอุปกรณ์: ${selectedBorrow.equipmentName}`} onClose={() => { setIsReturnOpen(false); setReturnError(''); }}>
          <form onSubmit={handleReturnSubmit}>
            {returnError && (
              <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: 'var(--status-unavailable-text)', marginBottom: '16px', fontSize: '14px' }}>
                {returnError}
              </div>
            )}

            <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', color: 'var(--status-inuse-text)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>ผู้เบิก: <strong>{selectedBorrow.borrowedBy}</strong></div>
              <div>จำนวนเบิกตั้งต้น: <strong>{selectedBorrow.quantity}</strong> ชิ้น</div>
              <div>จำนวนที่คืนแล้วสะสม: <strong>{selectedBorrow.quantity - selectedBorrow.outstandingQuantity}</strong> ชิ้น</div>
              <div>จำนวนคงค้างส่ง: <strong>{selectedBorrow.outstandingQuantity}</strong> ชิ้น</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>จำนวนที่คืน (อุปกรณ์ที่นำมาคืนจริง)</label>
              <input type="number" min="0" max={selectedBorrow.outstandingQuantity} value={returnQty}
                onChange={(e) => {
                  setReturnQty(e.target.value);
                  const q = parseInt(e.target.value, 10);
                  if (!isNaN(q) && q < selectedBorrow.outstandingQuantity) setIsDeclareMissing(true);
                  else setIsDeclareMissing(false);
                }} />
            </div>

            {parseInt(returnQty, 10) < selectedBorrow.outstandingQuantity && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--status-inuse-text)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isDeclareMissing} onChange={(e) => setIsDeclareMissing(e.target.checked)} style={{ width: 'auto' }} />
                  ตัดยอดค้างส่งที่เหลือเป็นสูญหาย/ชำรุด (ปิดรายการเบิกนี้)
                </label>
              </div>
            )}

            {isDeclareMissing && (
              <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>สาเหตุของขาดส่ง</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#fff', cursor: 'pointer' }}>
                      <input type="radio" name="returnReason" checked={returnReason === 'DAMAGED'} onChange={() => setReturnReason('DAMAGED')} style={{ width: 'auto' }} />
                      ชำรุด
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#fff', cursor: 'pointer' }}>
                      <input type="radio" name="returnReason" checked={returnReason === 'OTHER'} onChange={() => setReturnReason('OTHER')} style={{ width: 'auto' }} />
                      อื่นๆ
                    </label>
                  </div>
                </div>
                {returnReason === 'OTHER' && (
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>หมายเหตุ *</label>
                    <input type="text" placeholder="เช่น ทำหายหน้างาน" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsReturnOpen(false); setReturnError(''); }}>ยกเลิก</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>ยืนยันการคืน</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Event Modal */}
      <Modal isOpen={isEditOpen} title="แก้ไขข้อมูลงาน" onClose={() => { setIsEditOpen(false); setEditError(''); }}>
        <form onSubmit={handleEditEvent}>
          {editError && (
            <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: 'var(--status-unavailable-text)', marginBottom: '16px', fontSize: '14px' }}>
              {editError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>ชื่องาน *</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={editing} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>รายละเอียด</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} disabled={editing} rows={3} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>วันเริ่มงาน *</label>
            <input type="date" value={editStartAt} onChange={(e) => setEditStartAt(e.target.value)} disabled={editing} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsEditOpen(false); setEditError(''); }} disabled={editing}>ยกเลิก</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={editing}>{editing ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
