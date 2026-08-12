'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddEquipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('กรุณากรอกชื่ออุปกรณ์');
      return;
    }

    const qty = parseInt(initialQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      setError('จำนวนเริ่มต้นต้องเป็นตัวเลขที่ไม่ติดลบ');
      return;
    }

    if (!imageFile) {
      setError('กรุณาอัปโหลดรูปภาพอุปกรณ์');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('initialQuantity', initialQuantity);
    formData.append('image', imageFile);

    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      router.push('/inventory');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'การเชื่อมต่อขัดข้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
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
          ย้อนกลับ
        </button>
        <h1>เพิ่มอุปกรณ์ใหม่</h1>
        <p>นำอุปกรณ์ชิ้นใหม่เข้าสู่ระบบควบคุมคลังสินค้า</p>
      </header>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            color: 'var(--status-unavailable-text)',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
            ชื่ออุปกรณ์ <span style={{ color: 'var(--status-unavailable-text)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="เช่น เก้าอี้เบาะนวมสีดำ, โต๊ะพับหน้าขาว"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
            จำนวนเริ่มต้นเข้าคลัง <span style={{ color: 'var(--status-unavailable-text)' }}>*</span>
          </label>
          <input
            type="number"
            min="0"
            value={initialQuantity}
            onChange={(e) => setInitialQuantity(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#fff' }}>
            รูปภาพอุปกรณ์ <span style={{ color: 'var(--status-unavailable-text)' }}>*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            disabled={loading}
            style={{ padding: '8px' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            รองรับไฟล์รูปภาพ เช่น JPEG, PNG หรือ WebP
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
            disabled={loading}
            style={{ flex: 1 }}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'กำลังบันทึก...' : 'บันทึกอุปกรณ์'}
          </button>
        </div>
      </form>
    </div>
  );
}
