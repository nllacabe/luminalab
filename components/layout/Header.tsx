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
        <>
            <style>{`
        .site-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        /* Logged-out: shrink button text on small screens before wrapping */
        @media (max-width: 520px) {
          .btn-signin,
          .btn-get-started {
            font-size: 0.8125rem !important;
            padding: 0.4rem 0.75rem !important;
          }
        }

        /* Below ~380px: header wraps into two centered rows */
        @media (max-width: 380px) {
          .site-header {
            flex-wrap: wrap;
            justify-content: center !important;
            gap: 0.75rem;
            padding: 0.875rem 1rem !important;
          }
          .site-header-logo {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .site-header-actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

            <header className="site-header">
                {/* Logo */}
                <Link href={isLoggedIn ? "/dashboard" : "/"} className="site-header-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="LUMINALAB" />
                </Link>

                {isLoggedIn ? (
                    <>
                        <nav className="site-header-nav">
                            <Link
                                href="/dashboard"
                                className={`site-header-link${pathname === "/dashboard" ? " active" : ""}`}
                            >
                                Dashboard
                            </Link>
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
                        <div style={{ flex: 1 }} />
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
        </>
    );
}