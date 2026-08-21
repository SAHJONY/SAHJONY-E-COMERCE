import type { Metadata } from "next";
import CommerceTelemetry from "./components/CommerceTelemetry";
import "./globals.css";
import "./commerce.css";
import "./bag.css";
import "./polish.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sahjony.com"),
  title: { default: "SAHJONY | Premium Brands. Exceptional Value.", template: "%s | SAHJONY" },
  description: "Discover premium brands, distinctive selections and exceptional value at SAHJONY.",
  openGraph: { title: "SAHJONY", description: "Premium brands. Exceptional value.", type: "website", siteName: "SAHJONY" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <CommerceTelemetry />
        {children}
      </body>
    </html>
  );
}
