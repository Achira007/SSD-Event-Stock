'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '@/styles/components/EquipmentDetail.module.css';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const equipmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<any>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals visibility
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Form states - Borrow
  const [borrowQty, setBorrowQty] = useState('1');
  const [borrowPurpose, setBorrowPurpose] = useState<'CURRENT_EVENT' | 'GENERAL'>('CURRENT_EVENT');
  const [borrowNote, setBorrowNote] = useState('');
  const [borrowError, setBorrowError] = useState('');

  // Form states - Return
  const [selectedBorrow, setSelectedBorrow] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('1');
  const [isDeclareMissing, setIsDeclareMissing] = useState(false);
  const [returnReason, setReturnReason] = useState<'DAMAGED' | 'OTHER'>('DAMAGED');
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');

  // Form states - Admin Adjust
  const [adjustType, setAdjustType] = useState<'ADD_STOCK' | 'REMOVE_STOCK' | 'REPAIR_RETURN'>('ADD_STOCK');
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSource, setAdjustSource] = useState<'AVAILABLE' | 'UNAVAILABLE'>('AVAILABLE');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Fetch equipment and active event data
  async function loadData() {
    try {
      setErrorMsg('');
      const res = await fetch(`/api/equipment?id=${equipmentId}`);
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
      }
      const data = await res.json();
      setEquipment(data);

      const eventRes = await fetch('/api/events?active=true');
      const eventData = await eventRes.json();
      setActiveEvent(eventData);

      // Default purpose based on active event availability
      if (!eventData) {
        setBorrowPurpose('GENERAL');
      } else {
        setBorrowPurpose('CURRENT_EVENT');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'การเชื่อมต่อขัดข้อง');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Handlers
  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBorrowError('');

    const qty = parseInt(borrowQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setBorrowError('กรุณากรอกจำนวนที่ต้องการเบิกมากกว่า 0');
      return;
    }

    if (equipment.availableQuantity <= 0) {
      setBorrowError('ไม่มีอุปกรณ์พร้อมใช้งานในคลัง');
      return;
    }

    if (qty > equipment.availableQuantity) {
      setBorrowError(`ไม่สามารถเบิกเกินจำนวนที่พร้อมใช้งานได้ (สูงสุด ${equipment.availableQuantity} ชิ้น)`);
      return;
    }

    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId,
          quantity: qty,
          purposeType: borrowPurpose,
          purposeNote: borrowNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเบิก');
      }

      setIsBorrowOpen(false);
      setBorrowQty('1');
      setBorrowNote('');
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
      setReturnError('กรุณากรอกจำนวนที่ต้องการคืนให้ถูกต้อง');
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
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการทำรายการคืน');
      }

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

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');

    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setAdjustError('กรุณากรอกจำนวนให้ถูกต้อง (มากกว่า 0)');
      return;
    }

    if (adjustType === 'REMOVE_STOCK' && !adjustReason.trim()) {
      setAdjustError('กรุณาระบุสาเหตุในการปรับลดจำนวนคลัง');
      return;
    }

    try {
      const res = await fetch('/api/equipment/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId,
          adjustmentType: adjustType,
          quantity: qty,
          reason: adjustReason,
          source: adjustSource,
          note: adjustNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการปรับยอด');
      }

      setIsAdjustOpen(false);
      setAdjustQty('1');
      setAdjustReason('');
      setAdjustNote('');
      loadData();
    } catch (err: any) {
      setAdjustError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (errorMsg || !equipment) {
    return (
      <div className="container">
        <header style={{ marginBottom: '24px' }}>
          <button className="btn-secondary" onClick={() => router.push('/inventory')}>ย้อนกลับ</button>
        </header>
        <div style={{ padding: '24px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ color: 'var(--status-unavailable-text)', fontWeight: 600 }}>{errorMsg || 'ไม่พบอุปกรณ์ชิ้นนี้ในระบบ'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <header style={{ marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/inventory')}
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          ย้อนกลับคลังอุปกรณ์
        </button>
      </header>

      <div className={styles.grid}>
        {/* Left column: image and admin controls */}
        <div className={styles.imageSection}>
          <img src={equipment.imageUrl} className={styles.image} alt={equipment.name} />

          {isAdmin && (
            <div className={styles.adminSection}>
              <span className={styles.adminTitle}>แผงควบคุมผู้ดูแลระบบ</span>
              <div className={styles.adminBtnRow}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setAdjustType('ADD_STOCK');
                    setIsAdjustOpen(true);
                  }}
                >
                  ปรับยอดสต็อก
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setAdjustType('REPAIR_RETURN');
                    setIsAdjustOpen(true);
                  }}
                >
                  นำของซ่อมคืนคลัง
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: general information and buttons */}
        <div className={styles.detailsSection}>
          <div className={styles.titleHeader}>
            <span className={styles.name}>{equipment.name}</span>
          </div>

          <div className={styles.quantityGrid}>
            <div className={styles.quantityCard}>
              <span className={styles.quantityLabel}>พร้อมใช้งาน</span>
              <span className={styles.quantityVal} style={{ color: 'var(--status-available-text)' }}>
                {equipment.availableQuantity}
              </span>
            </div>
            <div className={styles.quantityCard}>
              <span className={styles.quantityLabel}>ใช้งานอยู่</span>
              <span className={styles.quantityVal} style={{ color: 'var(--status-inuse-text)' }}>
                {equipment.inUseQuantity}
              </span>
            </div>
            <div className={styles.quantityCard}>
              <span className={styles.quantityLabel}>ไม่พร้อมใช้งาน</span>
              <span className={styles.quantityVal} style={{ color: 'var(--status-unavailable-text)' }}>
                {equipment.unavailableQuantity}
              </span>
            </div>
          </div>

          <div className={styles.totalBanner}>
            จำนวนทั้งหมดในคลังระบบ: <strong>{equipment.totalQuantity}</strong> ชิ้น (Total = Available + In-Use + Unavailable)
          </div>

          {/* Outstanding borrows section */}
          <div className={styles.outstandingPanel}>
            <div className={styles.outstandingTitle}>
              <span>รายการเบิกค้างส่ง</span>
            </div>

            {equipment.borrows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                ไม่มีรายการเบิกค้างส่งในขณะนี้
              </p>
            ) : (
              equipment.borrows.map((borrow: any) => (
                <div key={borrow.id} className={styles.borrowRow}>
                  <div className={styles.borrowInfo}>
                    <span className={styles.borrowName}>ผู้เบิก: {borrow.borrowedBy}</span>
                    <span className={styles.borrowDetails}>
                      จำนวนค้าง: <strong style={{ color: 'var(--status-inuse-text)' }}>{borrow.outstandingQuantity}</strong> / {borrow.quantity} ชิ้น
                    </span>
                    <span className={styles.borrowDetails} style={{ fontSize: '11px' }}>
                      วัตถุประสงค์: {borrow.purposeType === 'CURRENT_EVENT' ? `งาน: ${borrow.eventName || ''}` : `ทั่วไป: ${borrow.purposeNote || ''}`}
                    </span>
                  </div>
                  <button
                    className={`${styles.returnBtn} btn-primary`}
                    onClick={() => {
                      setSelectedBorrow(borrow);
                      setReturnQty(borrow.outstandingQuantity.toString());
                      setIsDeclareMissing(false);
                      setIsReturnOpen(true);
                    }}
                  >
                    คืนอุปกรณ์
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.borrowActionWrapper}>
            <button
              className={`${styles.btnFull} btn-primary`}
              onClick={() => {
                setBorrowQty('1');
                setIsBorrowOpen(true);
              }}
            >
              เบิกอุปกรณ์ชิ้นนี้
            </button>
          </div>
        </div>
      </div>

      {/* Borrow Modal */}
      <Modal
        isOpen={isBorrowOpen}
        title={`เบิกอุปกรณ์: ${equipment.name}`}
        onClose={() => {
          setIsBorrowOpen(false);
          setBorrowError('');
        }}
      >
        <form onSubmit={handleBorrowSubmit}>
          {borrowError && (
            <div className={styles.warningBox} style={{ color: 'var(--status-unavailable-text)', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)' }}>
              {borrowError}
            </div>
          )}

          {equipment.availableQuantity === 0 ? (
            <div className={styles.warningBox} style={{ color: 'var(--status-unavailable-text)', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)', marginBottom: '24px' }}>
              <strong>ไม่มีอุปกรณ์พร้อมใช้งาน</strong> ขณะนี้สินค้าคงคลังพร้อมใช้งานเป็น 0 ไม่สามารถเบิกสินค้าได้
            </div>
          ) : (
            <div className={styles.warningBox} style={{ marginBottom: '20px' }}>
              มีอุปกรณ์พร้อมใช้งานจำนวน <strong>{equipment.availableQuantity}</strong> ชิ้น
            </div>
          )}

          <div className={styles.formGroup}>
            <label>จำนวนที่ต้องการเบิก</label>
            <input
              type="number"
              min="1"
              max={equipment.availableQuantity}
              value={borrowQty}
              onChange={(e) => setBorrowQty(e.target.value)}
              disabled={equipment.availableQuantity === 0}
            />
          </div>

          <div className={styles.formGroup}>
            <label>วัตถุประสงค์การเบิก</label>
            <div className={styles.radioGroup}>
              {activeEvent && (
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="purpose"
                    checked={borrowPurpose === 'CURRENT_EVENT'}
                    onChange={() => setBorrowPurpose('CURRENT_EVENT')}
                    disabled={equipment.availableQuantity === 0}
                  />
                  งานปัจจุบัน ({activeEvent.name})
                </label>
              )}
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="purpose"
                  checked={borrowPurpose === 'GENERAL'}
                  onChange={() => setBorrowPurpose('GENERAL')}
                  disabled={equipment.availableQuantity === 0}
                />
                การใช้งานทั่วไป
              </label>
            </div>
          </div>

          {borrowPurpose === 'GENERAL' && (
            <div className={styles.formGroup} style={{ animation: 'fadeIn 0.2s ease' }}>
              <label>รายละเอียดการใช้งานทั่วไป (ระบุสถานที่หรือความจำเป็น) *</label>
              <textarea
                placeholder="กรุณากรอกเหตุผลรายละเอียดในการใช้งาน..."
                value={borrowNote}
                onChange={(e) => setBorrowNote(e.target.value)}
                disabled={equipment.availableQuantity === 0}
                rows={3}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setIsBorrowOpen(false);
                setBorrowError('');
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={equipment.availableQuantity === 0}
            >
              ยืนยันการเบิก
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      {selectedBorrow && (
        <Modal
          isOpen={isReturnOpen}
          title={`คืนอุปกรณ์: ${equipment.name}`}
          onClose={() => {
            setIsReturnOpen(false);
            setReturnError('');
          }}
        >
          <form onSubmit={handleReturnSubmit}>
            {returnError && (
              <div className={styles.warningBox} style={{ color: 'var(--status-unavailable-text)', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)' }}>
                {returnError}
              </div>
            )}

            <div className={styles.warningBox} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>ผู้เบิก: <strong>{selectedBorrow.borrowedBy}</strong></div>
              <div>จำนวนเบิกตั้งต้น: <strong>{selectedBorrow.quantity}</strong> ชิ้น</div>
              <div>จำนวนที่คืนแล้วสะสม: <strong>{selectedBorrow.quantity - selectedBorrow.outstandingQuantity}</strong> ชิ้น</div>
              <div>จำนวนคงค้างส่ง: <strong>{selectedBorrow.outstandingQuantity}</strong> ชิ้น</div>
            </div>

            <div className={styles.formGroup}>
              <label>จำนวนที่คืน (ตัวเลขอุปกรณ์ที่นำมาคืนจริง)</label>
              <input
                type="number"
                min="0"
                max={selectedBorrow.outstandingQuantity}
                value={returnQty}
                onChange={(e) => {
                  setReturnQty(e.target.value);
                  const qty = parseInt(e.target.value, 10);
                  if (!isNaN(qty) && qty < selectedBorrow.outstandingQuantity) {
                    setIsDeclareMissing(true);
                  } else {
                    setIsDeclareMissing(false);
                  }
                }}
              />
            </div>

            {/* Checkbox triggers missing options */}
            {parseInt(returnQty, 10) < selectedBorrow.outstandingQuantity && (
              <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                <label className={styles.radioLabel} style={{ fontSize: '13px', color: 'var(--status-inuse-text)' }}>
                  <input
                    type="checkbox"
                    checked={isDeclareMissing}
                    onChange={(e) => setIsDeclareMissing(e.target.checked)}
                  />
                  ต้องการตัดยอดค้างส่งส่วนที่เหลือเป็นของสูญหาย / ชำรุด (ปิดรายการเบิกนี้)
                </label>
              </div>
            )}

            {isDeclareMissing && (
              <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label>สาเหตุที่ของขาดส่ง</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="returnReason"
                        checked={returnReason === 'DAMAGED'}
                        onChange={() => setReturnReason('DAMAGED')}
                      />
                      ชำรุด (จัดเก็บเข้าช่องของเสียชำรุด)
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="returnReason"
                        checked={returnReason === 'OTHER'}
                        onChange={() => setReturnReason('OTHER')}
                      />
                      อื่นๆ (ระบุสาเหตุ)
                    </label>
                  </div>
                </div>

                {returnReason === 'OTHER' && (
                  <div className={styles.formGroup}>
                    <label>ระบุหมายเหตุสูญหาย/ชำรุด *</label>
                    <input
                      type="text"
                      placeholder="เช่น ทำหายหน้างาน, ชำรุดทิ้งขยะแล้ว"
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsReturnOpen(false);
                  setReturnError('');
                }}
              >
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                ยืนยันการคืน
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Modal */}
      <Modal
        isOpen={isAdjustOpen}
        title={adjustType === 'ADD_STOCK' ? 'ปรับเพิ่ม/ลดสต็อกอุปกรณ์' : 'นำของชำรุดที่ซ่อมเสร็จคืนคลัง'}
        onClose={() => {
          setIsAdjustOpen(false);
          setAdjustError('');
        }}
      >
        <form onSubmit={handleAdjustSubmit}>
          {adjustError && (
            <div className={styles.warningBox} style={{ color: 'var(--status-unavailable-text)', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)' }}>
              {adjustError}
            </div>
          )}

          {adjustType !== 'REPAIR_RETURN' ? (
            <div className={styles.formGroup}>
              <label>ประเภทการปรับสต็อก</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="adjustSubtype"
                    checked={adjustType === 'ADD_STOCK'}
                    onChange={() => setAdjustType('ADD_STOCK')}
                  />
                  เพิ่มอุปกรณ์สต็อกเข้าคลัง (ADD_STOCK)
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="adjustSubtype"
                    checked={adjustType === 'REMOVE_STOCK'}
                    onChange={() => {
                      setAdjustType('REMOVE_STOCK');
                      setAdjustSource('AVAILABLE');
                    }}
                  />
                  ลดหรือทิ้งอุปกรณ์ออกจากสต็อก (REMOVE_STOCK)
                </label>
              </div>
            </div>
          ) : (
            <div className={styles.warningBox}>
              จำนวนสินค้าชำรุด/ไม่พร้อมใช้งานขณะนี้: <strong>{equipment.unavailableQuantity}</strong> ชิ้น
            </div>
          )}

          {adjustType === 'REMOVE_STOCK' && (
            <div className={styles.formGroup}>
              <label>หักลดจำนวนจากยอดใด</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="adjustSource"
                    checked={adjustSource === 'AVAILABLE'}
                    onChange={() => setAdjustSource('AVAILABLE')}
                  />
                  ยอดพร้อมใช้งาน (สูงสุด {equipment.availableQuantity})
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="adjustSource"
                    checked={adjustSource === 'UNAVAILABLE'}
                    onChange={() => setAdjustSource('UNAVAILABLE')}
                  />
                  ยอดชำรุด/ไม่พร้อมใช้งาน (สูงสุด {equipment.unavailableQuantity})
                </label>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>จำนวนอุปกรณ์</label>
            <input
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
          </div>

          {(adjustType === 'REMOVE_STOCK' || adjustType === 'REPAIR_RETURN') && (
            <div className={styles.formGroup}>
              <label>{adjustType === 'REMOVE_STOCK' ? 'สาเหตุการปรับลดจำนวน *' : 'ระบุสาเหตุเพิ่มเติม (ถ้ามี)'}</label>
              <input
                type="text"
                placeholder={adjustType === 'REMOVE_STOCK' ? 'เช่น ทิ้งเก้าอี้หักโยนทิ้ง' : 'เช่น ช่างซ่อมเก้าอี้กลับเข้าคลัง'}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setIsAdjustOpen(false);
                setAdjustError('');
              }}
            >
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              ยืนยันปรับปรุง
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
