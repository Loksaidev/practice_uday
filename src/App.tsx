import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import BrowserTracker from "@/components/BrowserTracker";
import Index from "./pages/Index";
import Organizations from "./pages/Organizations";
import Store from "./pages/Store";
import StoreItem from "./pages/StoreItem";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import GameLobby from "./pages/GameLobby";
import GameRoom from "./pages/GameRoom";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import OrganizationApplication from "./pages/OrganizationApplication";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import OrganizationPlay from "./pages/OrganizationPlay";
import OrganizationLanding from "./pages/OrganizationLanding";
import OrganizationGameRoom from "./pages/OrganizationGameRoom";
import OrganizationStore from "./pages/OrganizationStore";
import OrganizationStoreItem from "./pages/OrganizationStoreItem";
import OrganizationCart from "./pages/OrganizationCart";
import OrganizationAuth from "./pages/OrganizationAuth";
import QRCode from "./pages/QRCode";
import HowItWorks from "./pages/HowItWorks";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import GameTopics from "./pages/GameTopics";
import WhiteLabel from "./pages/WhiteLabel";
import Analytics from "./pages/Analytics";
import CaseStudies from "./pages/CaseStudies";
import ContactSales from "./pages/ContactSales";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResetPassword from "./pages/ResetPassword";
import ScrollToTop from "./components/ScrollToTop";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import HowToPlayPage from "./pages/HowToPlayPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BrowserTracker />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/:id" element={<StoreItem />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/apply" element={<OrganizationApplication />} />
            <Route path="/dashboard" element={<OrganizationDashboard />} />
            <Route path="/play" element={<GameLobby />} />
            <Route path="/game/:roomCode" element={<GameRoom />} />
            <Route path="/org/:slug" element={<OrganizationLanding />} />
            <Route path="/org/:slug/play" element={<OrganizationPlay />} />
            <Route path="/org/:slug/game/:roomCode" element={<OrganizationGameRoom />} />
            <Route path="/org/:slug/store" element={<OrganizationStore />} />
            <Route path="/org/:slug/store/:id" element={<OrganizationStoreItem />} />
            <Route path="/org/:slug/cart" element={<OrganizationCart />} />
            <Route path="/org/:slug/login" element={<OrganizationAuth />} />
            <Route path="/qrcode" element={<QRCode />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/how-to-play" element={<HowToPlayPage />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/topics" element={<GameTopics />} />
            <Route path="/white-label" element={<WhiteLabel />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/contact-sales" element={<ContactSales />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/my-orders" element={<MyOrders />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
