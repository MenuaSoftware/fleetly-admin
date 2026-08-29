import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

// Three faces, three jobs. Space Grotesk gives headings a technical,
// slightly mechanical character that suits a fleet-ops product without
// being a novelty face; Inter carries the dense UI text where
// legibility at 12–14px is what actually matters (Space Grotesk is too
// mannered at that size); JetBrains Mono stays reserved for real data —
// plates, odometers, ids — and is never used decoratively.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fleetly Admin",
  description: "Fleet check-in and damage register — dispatcher panel.",
};

/**
 * The dashboard shell (sidebar/topbar) is applied here, once, for every
 * signed-in request — not per page.tsx anymore (the old app-header.tsx
 * this replaced was rendered from every single page). Signed-out
 * requests (login, accept-invite) render `children`
 * bare: a dispatcher panel's own nav has nothing to show someone who
 * isn't one yet, and neither of those pages ever rendered it before
 * either. getMe() is React-cache()'d, so a general-admin-gated page's
 * own separate call for its redirect check doesn't cost a second round
 * trip to the real API within the same request.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user ? await getMe() : null;

  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        spaceGrotesk.variable,
        jetbrainsMono.variable,
      )}
      suppressHydrationWarning
    >
      <body className="h-full">
        <ThemeProvider>
          {user ? (
            <AppShell email={user.email} isGeneralAdmin={me?.role === "general_admin"}>
              {children}
            </AppShell>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
