import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { BuyerProvider } from '@/context/BuyerContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import HideOnAdmin from '@/components/layout/HideOnAdmin';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'Vintage & Pre-Loved Catalog — Thriftpedia',
  description: 'Every piece is curated, one-of-one, and 100% original.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="bg-[#FAF7F2] font-body text-[#2B2118] antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <BuyerProvider>
          <HideOnAdmin>
            <Navbar />
          </HideOnAdmin>
          {children}
          <HideOnAdmin>
            <Footer />
          </HideOnAdmin>
          </BuyerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
