import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Header } from "@/client/components/layout/Header";
import { Footer } from "@/client/components/layout/Footer";
import { Web3Providers } from "@/components/Web3Providers";

export const metadata: Metadata = {
  title: "Syllaba - AI Study & Task Roadmap Generator",
  description: "Transform course syllabi and assignment instructions into anti-burnout daily study roadmaps.",
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
