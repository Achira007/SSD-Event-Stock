import React from 'react';
import Navigation from '@/components/Navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout-wrapper">
      <Navigation />
      <main className="main-content">{children}</main>
    </div>
  );
}
