import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Storybook Maker",
  description:
    "Turn a grandparent or parent interview recording into an editable keepsake storybook PDF."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
