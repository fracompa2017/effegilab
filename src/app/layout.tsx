import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://effegi-lab.it";
const title = "Effegi Lab - Wedding Stationery Artigianale Napoli";
const description =
  "Partecipazioni, kit cerimonia e tableaux de mariage artigianali personalizzati. Scopri le nostre collezioni esclusive.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Effegi Lab",
    url: siteUrl,
    title,
    description,
    images: [
      {
        url: `${siteUrl}/favicon.ico`,
        width: 512,
        height: 512,
        alt: "Effegi Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/favicon.ico`],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    sitemap: `${siteUrl}/sitemap.xml`,
  },
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
