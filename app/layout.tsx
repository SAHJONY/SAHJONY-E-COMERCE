import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAHJONY | Premium Brands for Less",
  description: "Independent multi-brand premium retailer powered by intelligent sourcing and controlled fulfillment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
