"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { AuthRouter } from "@/components/AuthRouter";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";
import { migrateAllStores } from "@/lib/migrateStorage";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Use effect to run storage migration once when the component mounts
    useEffect(() => {
        // Migrate all stores on application startup
        migrateAllStores();
    }, []);

    // Define routes where you don't want to show NavBar and Footer
    const noNavBarFooterRoutes = ["/login", "/signup", "/adminYmAF8aMHrK"];

    // Check if the current route is in the noNavBarFooterRoutes array or starts with any of those paths (like /admin/*)
    const shouldShowNavBarFooter = !noNavBarFooterRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    return (
        <SessionProvider>
            <ThemeProvider>
                <AuthProvider>
                    <AuthRouter>
                        <div className="flex min-h-dvh flex-col">
                            {shouldShowNavBarFooter && <NavBar />}
                            <main className="flex-1">{children}</main>
                            {shouldShowNavBarFooter && <Footer />}
                        </div>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                className: "!bg-popover !text-popover-foreground !border !border-border !rounded-xl !shadow-2xl",
                            }}
                        />
                    </AuthRouter>
                </AuthProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
