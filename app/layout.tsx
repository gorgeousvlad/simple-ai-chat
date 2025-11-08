import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chat with Claude',
  description: 'A simple AI chat application powered by Claude',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
