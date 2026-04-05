import React, { useState } from "react";
import Footer from "./Footer";
import BackButton from "@/components/ui/BackButton";
import AdminOverlay from "@/components/admin/AdminOverlay";
import AdminPanel from "@/components/AdminPanel";
import { UserProfile } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = "min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white",
  showBackButton = true,
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [showAdminOverlay, setShowAdminOverlay] = useState(false);
  const [showAdminPanelLocal, setShowAdminPanelLocal] = useState(false);

  return (
    <div className={className}>
      <main>
        {showBackButton && !isHomePage && (
          <div className="container mx-auto px-4 pt-6">
            <BackButton
              onClick={() => {
                window.location.href = "/";
              }}
            />
          </div>
        )}
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default PageLayout;