import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GTH TechVerse 2026 | Future Skills Bootcamp",
  description: "Geeta Technical Hub's flagship 3-day bootcamp covering AI, IoT, Cybersecurity, and more. Build real projects, earn certificates, and compete on the leaderboard.",
  keywords: ["GTH", "TechVerse", "Bootcamp", "AI", "IoT", "Cybersecurity", "Geeta University"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
