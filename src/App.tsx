import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
// TelegramAutoAuth removed — auth через бота
import CookieConsent from "@/components/CookieConsent";
import DiagonalRibbon from "@/components/DiagonalRibbon";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import Shop from "./pages/Shop";
import Schools from "./pages/Schools";
import Service from "./pages/Service";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import YandexCallback from "./pages/YandexCallback";
import UserSettings from "./pages/UserSettings";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import { UsersPage } from "./pages/UsersPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import Admin from "./pages/Admin";
import BecomeOrganization from "./pages/BecomeOrganization";
import OrganizationRegister from "./pages/OrganizationRegister";
import OrganizationSuccess from "./pages/OrganizationSuccess";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import OrganizationPage from "./pages/OrganizationPage";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import Docs from "./pages/Docs";
import UserPublicPage from "./pages/UserPublicPage";
import Emergency from "./pages/Emergency";
import Help from "./pages/Help";
import StorePage from "./pages/StorePage";
import ZMStoreDashboard from "./pages/ZMStoreDashboard";
import ZMStoreProductEdit from "./pages/ZMStoreProductEdit";
import ZMStoreSellerAdd from "./pages/ZMStoreSellerAdd";
import Gymkhana from "./pages/Gymkhana";
import PillionPage from "./pages/PillionPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
      <TooltipProvider>
        {/* TelegramAutoAuth removed */}
        <CookieConsent />
        <DiagonalRibbon />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/service" element={<Service />} />
            <Route path="/ads" element={<Announcements />} />
            <Route path="/gymkhana" element={<Gymkhana />} />
            <Route path="/pillion" element={<PillionPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/organization" element={<OrganizationDashboard />} />
            <Route path="/organization/:id" element={<OrganizationPage />} />
            <Route path="/become-organization" element={<BecomeOrganization />} />
            <Route path="/organization-register" element={<OrganizationRegister />} />
            <Route path="/organization-success" element={<OrganizationSuccess />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/yandex-callback" element={<YandexCallback />} />
            <Route
              path="/stores"
              element={
                <Stores
                  onStoreClick={(storeId) =>
                    (window.location.href = `/stores/${storeId}`)
                  }
                />
              }
            />
            <Route
              path="/stores/:storeId"
              element={
                <StoreDetail
                  storeId={window.location.pathname.split("/")[2] || ""}
                  onBack={() => (window.location.href = "/stores")}
                />
              }
            />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/u/:id" element={<UserPublicPage />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/help" element={<Help />} />
            <Route path="/zm-store" element={<ZMStoreDashboard />} />
            <Route path="/zm-store/product/:productId" element={<ZMStoreProductEdit />} />
            <Route path="/zm-store/seller/new" element={<ZMStoreSellerAdd />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;