'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '@/styles/components/Dashboard.module.css';
import StatusBadge from '@/components/StatusBadge';

export default function InventoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const res = await fetch('/api/equipment');
        const data = await res.json();
        setEquipmentList(data);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEquipment();
  }, []);

  const isAdmin = session?.user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>กำลังโหลดคลังอุปกรณ์...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1>คลังอุปกรณ์</h1>
          <p>รายการอุปกรณ์ทั้งหมดในคลังสินค้าพร้อมจำนวนควบคุม</p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => router.push('/inventory/add')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            เพิ่มอุปกรณ์
          </button>
        )}
      </header>

      {equipmentList.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '64px 32px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>ไม่มีอุปกรณ์ในระบบขณะนี้</p>
          {isAdmin && (
            <button className="btn-primary" onClick={() => router.push('/inventory/add')}>
              เริ่มเพิ่มอุปกรณ์ชิ้นแรก
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {equipmentList.map((item) => (
            <div
              key={item.id}
              className={styles.equipCard}
              onClick={() => router.push(`/inventory/${item.id}`)}
              style={{ background: 'var(--bg-surface)' }}
            >
              <img src={item.imageUrl} className={styles.equipImg} alt={item.name} />
              <div className={styles.equipInfo}>
                <span className={styles.equipName}>{item.name}</span>
                <div className={styles.badgeRow}>
                  <StatusBadge status="พร้อมใช้งาน" quantity={item.availableQuantity} />
                  <StatusBadge status="ใช้งานอยู่" quantity={item.inUseQuantity} />
                  <StatusBadge status="ไม่พร้อมใช้งาน" quantity={item.unavailableQuantity} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
