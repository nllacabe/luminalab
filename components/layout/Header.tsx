"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";

interface HeaderProps {
    isLoggedIn: boolean;
}

export default function Header({ isLoggedIn }: HeaderProps) {
    const pathname = usePathname();

    return (
        <header className="site-header">
            {/* Logo */}
            <Link href={isLoggedIn ? "/dashboard" : "/"} className="site-header-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="LUMINALAB" />
            </Link>

            {isLoggedIn ? (
                <>
                    {/* Nav links — center */}
                    <nav className="site-header-nav">
                        <Link
                            href="/assessment"
                            className={`site-header-link${pathname === "/assessment" ? " active" : ""}`}
                        >
                            Analyze
                        </Link>
                        <Link
                            href="/my-products"
                            className={`site-header-link${pathname === "/my-products" ? " active" : ""}`}
                        >
                            My Products
                        </Link>
                        <Link
                            href="/survey"
                            className={`site-header-link${pathname === "/survey" ? " active" : ""}`}
                        >
                            Preferences
                        </Link>
                    </nav>

                    {/* Sign Out — right */}
                    <div className="site-header-actions">
                        <form action={logout}>
                            <button type="submit" className="btn btn-ghost">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <>
                    {/* Spacer for centering */}
                    <div style={{ flex: 1 }} />

                    {/* Auth buttons — right */}
                    <div className="site-header-actions">
                        <Link href="/login" className="btn btn-signin">
                            Sign In
                        </Link>
                        <Link href="/signup" className="btn btn-primary btn-get-started">
                            Get Started
                        </Link>
                    </div>
                </>
            )}
        </header>
    );
}
