import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/jaseir-kit.css";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { agentMetadata } from "../lib/agent-metadata";
import type { SiteZone } from "../lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = agentMetadata("conversion-friction");

const zone: SiteZone = { kind: "agent", slug: "conversion-friction" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader zone={zone} />
        {children}
        <SiteFooter
          zone={zone}
          cta={{
            title: "Want the fixes shipped and measured?",
            text: "We turn the friction report into page changes, set up the tracking and report back on the conversion lift — not just a list of ideas.",
          }}
        />
      </body>
    </html>
  );
}
