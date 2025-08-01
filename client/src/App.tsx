import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SentryErrorBoundary } from "@/components/SentryErrorBoundary";
import SentryTestComponent from "@/components/SentryTestComponent";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DocumentAnalysis from "@/pages/analysis/DocumentAnalysis";
import DocumentProcessing from "@/pages/analysis/DocumentProcessing";
import ReportView from "@/pages/analysis/ReportView";
import TenantRights from "@/pages/tenant-rights";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import TenancyAnalysisFAQ from "@/pages/faqs/tenancy-analysis";
import CommonTenancyAgreementFAQs from "@/pages/faqs/common-tenancy-agreement-faqs";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import AdminLogin from "@/pages/admin/AdminLogin";
import { AdminRoute } from "@/lib/admin-route";
import { AuthProvider } from "@/hooks/use-auth";
import CookieConsent from "@/components/CookieConsent";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7FAFC]">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/processing/:id" component={DocumentProcessing} />
          <Route path="/analysis/:id" component={DocumentAnalysis} />
          <Route path="/analysis/:id/report" component={ReportView} />
          <Route path="/tenant-rights" component={TenantRights} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/faqs/tenancy-analysis" component={TenancyAnalysisFAQ} />
          <Route path="/faqs/common-tenancy-agreement-faqs" component={CommonTenancyAgreementFAQs} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/admin">
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </Route>
          <Route path="/admin/users">
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          </Route>
          <Route path="/admin/login" component={AdminLogin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <SentryErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <AnalyticsTracker />
          <Toaster />
          <SentryTestComponent />
        </AuthProvider>
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
}

export default App;
