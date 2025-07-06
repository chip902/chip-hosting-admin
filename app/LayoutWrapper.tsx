"use client";

import { usePathname } from "next/navigation";
import MainLayout from "./MainLayout";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  
  console.log('LayoutWrapper - pathname:', pathname, 'isAdminRoute:', isAdminRoute);

  // For admin routes, render children directly without MainLayout
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // For non-admin routes, wrap with MainLayout
  return <MainLayout>{children}</MainLayout>;
}
