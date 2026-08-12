'use client';

import { signIn } from 'next-auth/react';
import React, { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 800,
              letterSpacing: '2px',
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '4px',
            }}
          >
            SSD
          </h1>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#94a3b8',
              letterSpacing: '1px',
            }}
          >
            Event Stock
          </p>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
          ยินดีต้อนรับสู่ระบบคลังอุปกรณ์
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
          ลงชื่อเข้าใช้ด้วยบัญชี Google ของบริษัทเพื่อเริ่มต้นใช้งาน
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            padding: '14px 20px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>
      </div>
    </div>
  );
}
