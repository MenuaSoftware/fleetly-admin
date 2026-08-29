import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

// Matches ../fleetly/docs/index.html's established Fleetly identity —
// Poppins carries UI text, JetBrains Mono is reserved for actual data
// (odometer readings, ids, timestamps), never used decoratively.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
