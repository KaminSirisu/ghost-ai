import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Real-time collaborative system design workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-base text-copy-primary">
        <ClerkProvider
          signInFallbackRedirectUrl="/editor"
          signUpFallbackRedirectUrl="/editor"
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--bg-surface)",
              colorInput: "var(--bg-elevated)",
              colorInputForeground: "var(--text-primary)",
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--bg-base)",
              colorForeground: "var(--text-primary)",
              colorMutedForeground: "var(--text-secondary)",
              colorNeutral: "var(--text-muted)",
              colorDanger: "var(--state-error)",
              colorSuccess: "var(--state-success)",
              colorWarning: "var(--state-warning)",
              colorBorder: "var(--border-default)",
              colorRing: "var(--accent-primary)",
              borderRadius: "var(--radius)",
              fontFamily:
                "var(--font-geist-sans), Arial, Helvetica, sans-serif",
              fontFamilyButtons:
                "var(--font-geist-sans), Arial, Helvetica, sans-serif",
              fontFamilyMono:
                "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
            elements: {
              rootBox: "font-sans",
              cardBox:
                "w-full max-w-[38rem] bg-surface border border-surface-border shadow-none rounded-3xl",
              card: "bg-surface rounded-3xl",
              headerTitle: "font-sans text-copy-primary",
              headerSubtitle: "font-sans text-copy-secondary",
              footer: "bg-elevated border-surface-border font-sans",
              formButtonPrimary:
                "h-12 rounded-xl bg-primary font-sans text-primary-foreground hover:bg-primary/90",
              socialButtonsBlockButton:
                "h-11 rounded-xl bg-surface border-surface-border font-sans text-copy-secondary hover:bg-subtle",
              formFieldInput:
                "h-12 rounded-xl bg-elevated border-surface-border font-sans text-copy-primary",
              formFieldLabel: "font-sans text-copy-primary",
              footerActionText: "font-sans text-copy-secondary",
              footerActionLink: "font-sans text-brand hover:text-brand",
              identityPreviewText: "font-sans text-copy-primary",
            },
            captcha: {
              theme: "dark",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
