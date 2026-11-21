"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/client/components/layout/Header";
import { Footer } from "@/client/components/layout/Footer";
import { BackToTopButton } from "@/client/components/common/BackToTopButton";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.has(pathname);

  if (isAuthPage) {
    return <main className="min-h-screen bg-[#F7F7F5]">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <BackToTopButton />
      <Footer />
    </>
  );
}
