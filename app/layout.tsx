import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEEP.AI - The Mind of Sommayadeep",
  description: "Futuristic AI portfolio built as a digital brain interface"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
