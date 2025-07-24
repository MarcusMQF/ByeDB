import { Inter } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ByeDB - AI-Powered Database Assistant",
  description: "Transform your data interaction with ByeDB's intelligent database assistant.",
  icons: {
    icon: [
      { url: "/crop.png", type: "image/png" }
    ],
    apple: "/crop.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
