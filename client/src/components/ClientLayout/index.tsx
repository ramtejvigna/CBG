"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
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
    const noNavBarFooterRoutes = ["/login", "/signup", "/admin"];

    // Check if the current route is in the noNavBarFooterRoutes array or starts with any of those paths (like /admin/*)
    const shouldShowNavBarFooter = !noNavBarFooterRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    return (
        <SessionProvider>
            <AuthProvider>
                <AuthRouter>
                    {shouldShowNavBarFooter && <NavBar />}
                    {children}
                    {shouldShowNavBarFooter && <Footer />}
                    <Toaster position="top-right" />
                </AuthRouter>
            </AuthProvider>
        </SessionProvider>
    );
}