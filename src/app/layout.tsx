import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/components/notification-provider";
import { AuthProvider } from "@/components/auth/auth-provider-client";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Grand Master Fantasy - FPL AI Advisor",
  description: "Your ultimate AI-powered Fantasy Premier League companion. Get expert insights, player recommendations, and winning strategies.",
  keywords: ["FPL", "Fantasy Premier League", "Football", "AI", "Premier League", "Fantasy Football", "EPL"],
  authors: [{ name: "Grand Master Fantasy Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Grand Master Fantasy - FPL AI Advisor",
    description: "AI-powered Fantasy Premier League insights and strategies",
    siteName: "Grand Master Fantasy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grand Master Fantasy - FPL AI Advisor",
    description: "Your ultimate Fantasy Premier League companion",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased font-sans"
      >
        <ErrorBoundary fallback={
          <div className="p-4">
            <h1 className="text-xl font-bold">Application Error</h1>
            <p>The application encountered an error during initialization. Please refresh the page.</p>
            {children}
          </div>
        }>
          <ErrorBoundary fallback={
            <div className="p-4">
              <p>Authentication service is temporarily unavailable. Some features may not work properly.</p>
              {children}
            </div>
          }>
            <AuthProvider>
              <ErrorBoundary fallback={
                <div className="p-4">
                  <p>Notification service is temporarily unavailable.</p>
                </div>
              }>
                <NotificationProvider>
                  {children}
                  <Toaster />
                </NotificationProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
