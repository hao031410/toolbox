import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '你的工具箱',
  description: '简洁、顺手、直接可用的个人工具站。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
