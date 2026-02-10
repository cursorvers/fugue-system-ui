import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ConversationProvider } from "@/contexts/ConversationContext";

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
    apple: "/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full dark ${geist.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              <ConversationProvider>
                <div id="main-content">
                  {children}
                </div>
              </ConversationProvider>
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
