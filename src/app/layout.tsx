import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Effegi Lab Ecommerce",
  description: "Base progetto ecommerce moderno per Effegi Lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}
