import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/layout/Footer";
import { OrganizationPanel } from "@/components/organization/OrganizationPanel";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const OrganizationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" className="mr-2" size={16} />
              На главную
            </Button>
          </div>
          <OrganizationPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrganizationDashboard;