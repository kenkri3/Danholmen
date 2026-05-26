import { Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookingCalendar from "./pages/BookingCalendar";
import Saunas from "./pages/Saunas";
import Members from "./pages/Members";
import Discounts from "./pages/Discounts";
import Reports from "./pages/Reports";
import Admins from "./pages/Admins";
import Payments from "./pages/Payments";
import PublicBooking from "./pages/PublicBooking";
import SingleSaunaBooking from "./pages/SingleSaunaBooking";
import MemberDashboard from "./pages/MemberDashboard";
import BookingWidget from "./pages/BookingWidget";
import BookingConfirmed from "./pages/BookingConfirmed";
import BookingCancelled from "./pages/BookingCancelled";

const Campaigns = lazy(() => import("./pages/Campaigns"));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-off-white">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/" element={<Login />} />
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
        path="/campaigns"
        element={
          <PrivateRoute>
            <Campaigns />
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

      {/* Public booking routes (NO sidebar) */}
      <Route
        path="/book"
        element={
          <PublicLayout>
            <PublicBooking />
          </PublicLayout>
        }
      />
      <Route
        path="/book/:saunaSlug"
        element={
          <PublicLayout>
            <SingleSaunaBooking />
          </PublicLayout>
        }
      />

      {/* Member dashboard (NO sidebar) */}
      <Route
        path="/min-side"
        element={
          <PublicLayout>
            <MemberDashboard />
          </PublicLayout>
        }
      />

      {/* Stripe Checkout return pages */}
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

      {/* Embeddable widget (NO sidebar, compact) */}
      <Route
        path="/widget"
        element={
          <PublicLayout>
            <BookingWidget />
          </PublicLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
