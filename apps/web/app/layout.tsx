import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", axes: ["opsz", "SOFT"] });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "WorthIt · Is your skincare actually worth it?",
  description: "WorthIt scans your skin with YouCam AI, tracks sleep and stress with your Galaxy Watch, and tells you if a product is worth it, not worth it, or too early to tell.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#13110f" },
  ],
};

// Applies a saved theme before first paint, so there is no flash of the wrong palette.
const themeScript = `try{var t=localStorage.getItem("proof-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${serif.variable} ${sans.variable} ${mono.variable} font-sans text-ink antialiased`}>{children}</body>
    </html>
  );
}
