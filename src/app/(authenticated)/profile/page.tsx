'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="container fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>ข้อมูลส่วนตัว</h1>
        <p>ข้อมูลจากบัญชี Google ที่ใช้เข้าสู่ระบบ</p>
      </header>

      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '20px',
        padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
      }}>
        {user.image ? (
          <img src={user.image} alt={user.name || 'Profile'} style={{
            width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover',
            border: '3px solid var(--border-glass)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }} />
        ) : (
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700, color: '#fff',
          }}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px', color: '#fff' }}>{user.name}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{user.email}</p>
          <span style={{
            display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
            background: user.role === 'ADMIN' ? 'rgba(99,102,241,0.15)' : 'var(--status-available-bg)',
            color: user.role === 'ADMIN' ? '#a5b4fc' : 'var(--status-available-text)',
          }}>
            {user.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'พนักงาน (Staff)'}
          </span>
        </div>

        <div style={{ width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>ชื่อแสดง</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{user.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>อีเมล</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{user.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>บทบาทในระบบ</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>
              {user.role === 'ADMIN' ? 'Admin' : 'Staff'}
            </span>
          </div>
        </div>

        <button
          className="btn-danger"
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
