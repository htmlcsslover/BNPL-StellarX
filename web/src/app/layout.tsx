import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { UserProvider } from "@/hooks/useUser";
import { WalletProvider } from "@/hooks/useWallet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarBNPL - Decentralized BNPL",
  description: "Community-funded BNPL for the Philippines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground dark">
        <WalletProvider>
          <UserProvider>
            <Navbar />
            <main className="pt-20">
              {children}
            </main>
          </UserProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
