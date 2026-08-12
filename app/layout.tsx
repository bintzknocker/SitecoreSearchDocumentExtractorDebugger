import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Sitecore Search Document Extractor Debugger",
  description: "Debug Sitecore Search document extractors against sample HTML/JSON input",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
