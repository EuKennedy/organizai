import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-[calc(3.5rem+env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
