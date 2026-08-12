'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/Dashboard.module.css';
import StatusBadge from '@/components/StatusBadge';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' น.'
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [totals, setTotals] = useState({ totalItems: 0, available: 0, inUse: 0, unavailable: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const eventRes = await fetch('/api/events?active=true');
        const eventData = await eventRes.json();
        setActiveEvent(eventData);

        const equipRes = await fetch('/api/equipment');
        const equipData = await equipRes.json();
        setEquipmentList(equipData);

        const histRes = await fetch('/api/history');
        const histData = await histRes.json();
        setHistoryList(histData.slice(0, 15));

        if (Array.isArray(equipData)) {
          const sums = equipData.reduce(
            (acc, eq) => {
              acc.totalItems += eq.totalQuantity;
              acc.available += eq.availableQuantity;
              acc.inUse += eq.inUseQuantity;
              acc.unavailable += eq.unavailableQuantity;
              return acc;
            },
            { totalItems: 0, available: 0, inUse: 0, unavailable: 0 }
          );
          setTotals(sums);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <header style={{ marginBottom: '16px' }}>
        <h1>ระบบควบคุมคลังสินค้า</h1>
        <p>ภาพรวมสถานะรายการอุปกรณ์และการเบิก-คืนเรียลไทม์</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <span className={styles.statTitle}>งานปัจจุบันที่กำลังทำ</span>
            <span className={styles.statVal} style={{ fontSize: '18px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {activeEvent ? activeEvent.name : 'ไม่มีงานที่ใช้งานอยู่'}
            </span>
            {activeEvent && (
              <Link href={`/events/${activeEvent.id}`} className={styles.activeEventLink}>
                ดูรายละเอียดงาน
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          <div className={styles.statCard}>
            <span className={styles.statTitle}>อุปกรณ์ทั้งหมดในคลัง</span>
            <span className={styles.statVal}>{totals.totalItems} ชิ้น</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statTitle}>พร้อมใช้งาน</span>
            <span className={styles.statVal} style={{ color: 'var(--status-available-text)' }}>
              {totals.available} ชิ้น
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statTitle}>ใช้งานอยู่</span>
            <span className={styles.statVal} style={{ color: 'var(--status-inuse-text)' }}>
              {totals.inUse} ชิ้น
            </span>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <span>กิจกรรมเบิก-คืนล่าสุด</span>
            <Link href="/history" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500' }}>
              ดูทั้งหมด
            </Link>
          </div>
          <div className={styles.scrollArea}>
            {historyList.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                ไม่มีประวัติการทำรายการในระบบ
              </p>
            ) : (
              historyList.map((item) => (
                <div key={item.id} className={styles.activityCard}>
                  {item.equipmentImageUrl ? (
                    <img src={item.equipmentImageUrl} className={styles.activityImage} alt="" />
                  ) : (
                    <div className={styles.activityImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  )}
                  <div className={styles.activityInfo}>
                    <div className={styles.activityTitle}>{item.equipmentName}</div>
                    <div className={styles.activityDesc}>
                      <strong style={{ color: '#fff' }}>{item.userName}</strong> {item.details}
                    </div>
                    <div className={styles.activityTime}>{formatTime(item.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <span>อุปกรณ์ในคลัง</span>
            <Link href="/inventory" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500' }}>
              ดูคลังสินค้า
            </Link>
          </div>
          <div className={`${styles.scrollArea} ${styles.equipList}`}>
            {equipmentList.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                ไม่มีอุปกรณ์ในคลังระบบ
              </p>
            ) : (
              equipmentList.map((item) => (
                <div
                  key={item.id}
                  className={styles.equipCard}
                  onClick={() => router.push(`/inventory/${item.id}`)}
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
