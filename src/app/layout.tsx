import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/client/components/layout/Header";
import { Footer } from "@/client/components/layout/Footer";
import { Web3Providers } from "@/components/Web3Providers";

export const metadata: Metadata = {
  title: "Syllaba - Multi-Agent Academic Pacing & On-Chain Study Proof",
  description: "Transform course syllabi and assignment instructions into anti-burnout daily study roadmaps with verifiable on-chain proofs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <Web3Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Web3Providers>
      </body>
    </html>
  );
}
