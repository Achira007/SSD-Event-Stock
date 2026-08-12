import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SSD Event Stock — ระบบจัดการคลังอุปกรณ์อีเวนต์',
  description: 'ระบบเบิก-คืนอุปกรณ์อีเวนต์ภายในบริษัท SSD รวดเร็ว แม่นยำ และปลอดภัย',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
