import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopEase Support - 24/7 E-commerce Customer Assistant",
  description: "Get instant help with your ShopEase orders, shipping, returns, and product questions. Talk to our digital support engineer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${roboto.className}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
