import type { Metadata } from "next";
import "./globals.css";
import { Web3Providers } from "@/components/Web3Providers";
import { AuthProvider } from "@/client/components/auth/AuthProvider";
import { LanguageProvider } from "@/client/context/LanguageContext";
import { AppShell } from "@/client/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Syllaba - Multi-Agent Academic Pacing & On-Chain Study Proof",
  description:
    "Transform course syllabi and assignment instructions into anti-burnout daily study roadmaps with verifiable on-chain proofs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-[#F7F7F5] text-[#111111]">
        <Web3Providers>
          <AuthProvider>
            <LanguageProvider>
              <AppShell>{children}</AppShell>
            </LanguageProvider>
          </AuthProvider>
        </Web3Providers>
      </body>
    </html>
  );
}
