import type { Metadata } from "next";
import "./globals.css";
import "./commerce.css";

export const metadata: Metadata = {
  title: "SAHJONY | Premium Brands for Less",
  description: "Discover premium brands, distinctive selections and exceptional value at SAHJONY.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
