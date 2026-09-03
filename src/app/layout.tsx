import type { Metadata } from 'next';
import { Nunito, Lora } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Akshaya Swadam — Shop Fresh Spices',
  description:
    'Order authentic South-Indian spices online. Talk to our AI assistant to build your cart and pay securely with Razorpay.',
  keywords: 'spices, masala, garam masala, sambar powder, Indian spices, Akshaya Swadam',
  openGraph: {
    title: 'Akshaya Swadam — Authentic South-Indian Spices',
    description: 'Order fresh spices through our conversational shop assistant.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌶️</text></svg>" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
