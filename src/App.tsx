import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./components/Layout";
import { CookieConsent } from "./components/CookieConsent";
import { useExpiredCleanup } from "./hooks/useExpiredCleanup";
import { useAutoReport } from "./hooks/useAutoReport";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import WebsiteAdmin from "./pages/WebsiteAdmin";
import Dashboard from "./pages/Dashboard";
import BookingCalendar from "./pages/BookingCalendar";
import Saunas from "./pages/Saunas";
import Members from "./pages/Members";
import Discounts from "./pages/Discounts";
import Reports from "./pages/Reports";
import Admins from "./pages/Admins";
import Payments from "./pages/Payments";
import PublicBooking from "./pages/PublicBooking";
/* SingleSaunaBooking removed - all booking goes through PublicBooking */import MemberDashboard from "./pages/MemberDashboard";
import BookingWidget from "./pages/BookingWidget";
import BookingConfirmed from "./pages/BookingConfirmed";
import BookingCancelled from "./pages/BookingCancelled";
import Personvern from "./pages/Personvern";
import Vilkar from "./pages/Vilkar";
import Kontakt from "./pages/Kontakt";
import Medlemskap from "./pages/Medlemskap";
import MemberLogin from "./pages/MemberLogin";
import MembershipTiers from "./pages/MembershipTiers";

const Campaigns = lazy(() => import("./pages/Campaigns"));

/* ------------------------------------------------------------------ */
/*  Auth check                                                        */
/* ------------------------------------------------------------------ */
function isAdminAuthenticated(): boolean {
  return !!localStorage.getItem("danholmen_current_admin");
}

/* ------------------------------------------------------------------ */
/*  Private Route — requires admin login                              */
/* ------------------------------------------------------------------ */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

/* ------------------------------------------------------------------ */
/*  Public Layout                                                     */
/* ------------------------------------------------------------------ */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-off-white">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lazy fallback                                                     */
/* ------------------------------------------------------------------ */
function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */
export default function App() {
  // Auto-cleanup expired bookings
  useExpiredCleanup();
  
  // Auto-generate monthly report
  useAutoReport();

  return (
    <>
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <PrivateRoute>
            <BookingCalendar />
          </PrivateRoute>
        }
      />
      <Route
        path="/saunas"
        element={
          <PrivateRoute>
            <Saunas />
          </PrivateRoute>
        }
      />
      <Route
        path="/members"
        element={
          <PrivateRoute>
            <Members />
          </PrivateRoute>
        }
      />
      <Route
        path="/discounts"
        element={
          <PrivateRoute>
            <Discounts />
          </PrivateRoute>
        }
      />
      <Route
        path="/membership-tiers"
        element={
          <PrivateRoute>
            <MembershipTiers />
          </PrivateRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <PrivateRoute>
            <Suspense fallback={<LazyFallback />}>
              <Campaigns />
            </Suspense>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        }
      />
      <Route
        path="/admins"
        element={
          <PrivateRoute>
            <Admins />
          </PrivateRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <PrivateRoute>
            <Payments />
          </PrivateRoute>
        }
      />
      <Route
        path="/website"
        element={
          <PrivateRoute>
            <WebsiteAdmin />
          </PrivateRoute>
        }
      />

      {/* Public booking routes */}
      <Route
        path="/book"
        element={
          <PublicLayout>
            <PublicBooking />
          </PublicLayout>
        }
      />
      {/* Individual sauna booking route removed - all booking goes through /book */}

      {/* Member dashboard */}
      <Route
        path="/min-side"
        element={
          <PublicLayout>
            <MemberDashboard />
          </PublicLayout>
        }
      />

      {/* Stripe return pages */}
      <Route
        path="/booking-confirmed"
        element={
          <PublicLayout>
            <BookingConfirmed />
          </PublicLayout>
        }
      />
      <Route
        path="/booking-cancelled"
        element={
          <PublicLayout>
            <BookingCancelled />
          </PublicLayout>
        }
      />

      {/* Widget */}
      <Route
        path="/widget"
        element={
          <PublicLayout>
            <BookingWidget />
          </PublicLayout>
        }
      />

      {/* Legal pages */}
      <Route
        path="/personvern"
        element={
          <PublicLayout>
            <Personvern />
          </PublicLayout>
        }
      />
      <Route
        path="/vilkar"
        element={
          <PublicLayout>
            <Vilkar />
          </PublicLayout>
        }
      />
      <Route
        path="/kontakt"
        element={
          <PublicLayout>
            <Kontakt />
          </PublicLayout>
        }
      />
      <Route
        path="/medlemskap"
        element={
          <PublicLayout>
            <Medlemskap />
          </PublicLayout>
        }
      />
      <Route
        path="/login-medlem"
        element={
          <PublicLayout>
            <MemberLogin />
          </PublicLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CookieConsent />
    </>
  );
}
