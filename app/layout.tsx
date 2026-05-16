import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// This imports the font and optimizes it perfectly for your app
const inter = Inter({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800', '900'] 
});

export const metadata: Metadata = {
  title: "ChatRax Pro",
  description: "Enterprise Intelligence & Action Command",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* This injects the custom font into the entire body of your app */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}