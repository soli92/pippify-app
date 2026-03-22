import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pippify 🎵",
  description: "Carica, ascolta e organizza i tuoi audio. Importa direttamente da YouTube.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
