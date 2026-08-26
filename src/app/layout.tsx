import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/client/components/layout/Header";
import { Footer } from "@/client/components/layout/Footer";

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
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
