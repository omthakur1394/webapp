import type { Metadata } from "next";
import "./globals.css";

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
      className="h-full antialiased font-sans"
      style={{
        // Map local fallback font variables to match the Tailwind config
        ['--font-geist-sans' as any]: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        ['--font-geist-mono' as any]: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

