'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '@/styles/components/Navigation.module.css';

// SVG Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const InventoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const EventsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M12 2a10 10 0 1 0 10 10" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'แดชบอร์ด', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'คลังอุปกรณ์', path: '/inventory', icon: <InventoryIcon /> },
    { name: 'งานอีเวนต์', path: '/events', icon: <EventsIcon /> },
    { name: 'ประวัติ', path: '/history', icon: <HistoryIcon /> },
    { name: 'โปรไฟล์', path: '/profile', icon: <ProfileIcon /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className={styles.brand}>
            <span className={styles.brandTitle}>SSD</span>
            <span className={styles.brandSubtitle}>Event Stock</span>
          </div>

          <nav className={styles.navLinks}>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${styles.link} ${isActive ? styles.activeLink : ''}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {session?.user && (
          <div className={styles.profileCard}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User Profile'}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155' }}>
                {session.user.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{session.user.name}</span>
              <span className={styles.profileRole}>
                {session.user.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'พนักงาน (Staff)'}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={styles.bottombar}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}
            >
              <div className={styles.mobileIcon}>{item.icon}</div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
