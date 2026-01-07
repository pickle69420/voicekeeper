"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Mic,
  Search,
  Brain,
  BarChart3,
  Settings,
  Info,
  ChevronRight,
  Loader2
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Record",
    icon: <Mic className="h-5 w-5" />,
    description: "Capture your memories",
  },
  {
    href: "/memories",
    label: "Memories",
    icon: <Search className="h-5 w-5" />,
    description: "Search and browse recordings",
  },
  {
    href: "/train",
    label: "Brain Games",
    icon: <Brain className="h-5 w-5" />,
    description: "Keep your mind sharp",
  },
  {
    href: "/progress",
    label: "Progress",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Track your journey",
  },
];

const secondaryItems: NavItem[] = [
  {
    href: "/settings",
    label: "Privacy & Data",
    icon: <Settings className="h-5 w-5" />,
    description: "Export or delete your data",
  },
  {
    href: "/about",
    label: "About",
    icon: <Info className="h-5 w-5" />,
    description: "About VoiceKeeper",
  },
];

export function DrawerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isTablet, setIsTablet] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on tablet/desktop
  useEffect(() => {
    const checkIsTablet = () => {
      setIsTablet(window.innerWidth >= 768);
    };
    checkIsTablet();
    window.addEventListener("resize", checkIsTablet);
    return () => window.removeEventListener("resize", checkIsTablet);
  }, []);

  const handleNavClick = (href: string) => {
    if (pathname === href) {
      setIsOpen(false);
      return;
    }
    setNavigatingTo(href);
    router.push(href);
    setTimeout(() => {
      setIsOpen(false);
      setNavigatingTo(null);
    }, 300);
  };

  // Drawer width for tablet
  const drawerWidth = isTablet ? "320px" : "100%";

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        style={{
          background: "transparent",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          position: "relative",
          zIndex: 50,
        }}
      >
        <Menu style={{ width: 24, height: 24, color: "#374151" }} />
      </button>

      {/* Drawer Overlay and Content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 100,
              }}
            />

            {/* Drawer - Side drawer on tablet, full screen on mobile */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                width: drawerWidth,
                maxWidth: "100%",
                height: "100vh",
                backgroundColor: "#ffffff",
                zIndex: 101,
                display: "flex",
                flexDirection: "column",
                boxShadow: isTablet ? "-4px 0 20px rgba(0,0,0,0.15)" : "none",
                borderLeft: isTablet ? "1px solid #e5e7eb" : "none",
              }}
            >
              {/* Header */}
              <div
                style={{
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "8px",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 24, height: 24, color: "#374151" }} />
                </button>
              </div>

              {/* Content wrapper - scrollable */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ maxWidth: isTablet ? "none" : "400px", margin: "0 auto" }}>
                  {/* Navigation */}
                  <nav style={{ padding: "16px", backgroundColor: "#ffffff" }}>
                    {navItems.map((item) => {
                      const isNavigating = navigatingTo === item.href;
                      const isActive = pathname === item.href;
                      
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          disabled={isNavigating}
                          className="transition-all duration-150 hover:scale-[1.02] hover:bg-gray-100 active:scale-[0.98]"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "16px",
                            borderRadius: "12px",
                            textDecoration: "none",
                            marginBottom: "4px",
                            backgroundColor: isActive ? "#eff6ff" : isNavigating ? "#f3f4f6" : undefined,
                            color: isActive ? "#2563eb" : "#374151",
                            width: "100%",
                            border: "none",
                            cursor: isNavigating ? "wait" : "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isActive ? "#dbeafe" : "#f3f4f6",
                            }}
                          >
                            {isNavigating ? (
                              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#6b7280" }} />
                            ) : (
                              item.icon
                            )}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>
                              {item.label}
                            </p>
                            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                              {item.description}
                            </p>
                          </div>
                          {isNavigating ? (
                            <span style={{ fontSize: "12px", color: "#9ca3af" }}>Loading...</span>
                          ) : (
                            <ChevronRight style={{ width: 20, height: 20, color: "#9ca3af" }} />
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div style={{ margin: "0 16px", height: "1px", backgroundColor: "#e5e7eb" }} />

                  <nav style={{ padding: "16px", backgroundColor: "#ffffff" }}>
                    {secondaryItems.map((item) => {
                      const isNavigating = navigatingTo === item.href;
                      const isActive = pathname === item.href;
                      
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          disabled={isNavigating}
                          className="transition-all duration-150 hover:scale-[1.02] hover:bg-gray-100 active:scale-[0.98]"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "16px",
                            borderRadius: "12px",
                            textDecoration: "none",
                            marginBottom: "4px",
                            backgroundColor: isActive ? "#eff6ff" : isNavigating ? "#f3f4f6" : undefined,
                            color: isActive ? "#2563eb" : "#374151",
                            width: "100%",
                            border: "none",
                            cursor: isNavigating ? "wait" : "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isActive ? "#dbeafe" : "#f3f4f6",
                            }}
                          >
                            {isNavigating ? (
                              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#6b7280" }} />
                            ) : (
                              item.icon
                            )}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>
                              {item.label}
                            </p>
                            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                              {item.description}
                            </p>
                          </div>
                          {isNavigating ? (
                            <span style={{ fontSize: "12px", color: "#9ca3af" }}>Loading...</span>
                          ) : (
                            <ChevronRight style={{ width: 20, height: 20, color: "#9ca3af" }} />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Footer - pinned to bottom */}
              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                  VoiceKeeper v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
