"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { DrawerMenu } from "./drawer-menu";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function TopBar({ title, showBack, onBack }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  // Determine if we should show back button
  const shouldShowBack = showBack ?? !isHomePage;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md border-b border-gray-100 safe-top">
      <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
        {/* Left side - Back button or Logo */}
        <div className="flex items-center gap-3">
          {shouldShowBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}

          {/* Logo/Brand - shown on home page */}
          {isHomePage && (
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-white"
                >
                  <path
                    d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M5 10C5 9.44772 5.44772 9 6 9C6.55228 9 7 9.44772 7 10V12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12V10C17 9.44772 17.4477 9 18 9C18.5523 9 19 9.44772 19 10V12C19 15.5265 16.3923 18.4439 13 18.9291V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V18.9291C7.60771 18.4439 5 15.5265 5 12V10Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                VoiceKeeper
              </span>
            </Link>
          )}

          {/* Page title when not on home */}
          {title && (
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        {/* Right side - Menu button */}
        <DrawerMenu />
      </div>
    </header>
  );
}

// Page titles mapping
export const pageTitles: Record<string, string> = {
  "/": "Record",
  "/memories": "Memories",
  "/train": "Brain Games",
  "/progress": "Progress",
  "/settings": "Privacy & Data",
  "/about": "About",
};
