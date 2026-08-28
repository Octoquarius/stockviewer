import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockViewer — Stock & price tracking across every site",
  description:
    "Search clothing, shoe, and bag stock across every site on one screen; see stock and price by size/number, and get notified when it's back in stock.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <StoreProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-6">
              {children}
            </main>
            <footer className="border-t border-border/70 py-6 text-center text-sm text-muted">
              StockViewer · Track products you couldn&apos;t find in stock, all in one place 🛍️
            </footer>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
