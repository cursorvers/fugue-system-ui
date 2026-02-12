import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "FUGUE System",
  description: "Federated Unified Governance for Universal Execution",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FUGUE",
  },
  icons: {
    icon: "/icon-512.svg",
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`h-full dark ${geist.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* iPhone splash screen: solid black background matching theme */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full antialiased bg-[var(--background)] text-[var(--foreground)]">
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`,
          }}
        />
        <a href="#main-content" className="skip-to-content">
          メインコンテンツへ
        </a>
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              <ConversationProvider>
                <ErrorBoundary>
                  <div id="main-content">
                    {children}
                  </div>
                </ErrorBoundary>
              </ConversationProvider>
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
