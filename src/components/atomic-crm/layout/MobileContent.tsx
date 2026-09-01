import { type ReactNode } from "react";

export const MobileContent = ({ children }: { children: ReactNode }) => (
  <main
    className="relative z-[1] max-w-screen-xl mx-auto pt-18 px-4 pb-20 min-h-screen overflow-y-auto bg-transparent"
    id="main-content"
  >
    {children}
  </main>
);
