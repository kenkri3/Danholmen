import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/PublicLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import BookingCalendar from "@/pages/BookingCalendar";
import Saunas from "@/pages/Saunas";
import Members from "@/pages/Members";
import Discounts from "@/pages/Discounts";
import Campaigns from "@/pages/Campaigns";
import Reports from "@/pages/Reports";
import Admins from "@/pages/Admins";
import Payments from "@/pages/Payments";
import PublicBooking from "@/pages/PublicBooking";
import SingleSaunaBooking from "@/pages/SingleSaunaBooking";
import BookingWidget from "@/pages/BookingWidget";
import MemberDashboard from "@/pages/MemberDashboard";
import BookingConfirmed from "@/pages/BookingConfirmed";
import BookingCancelled from "@/pages/BookingCancelled";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {/* Admin routes */}
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/booking" element={<Layout><BookingCalendar /></Layout>} />
      <Route path="/saunas" element={<Layout><Saunas /></Layout>} />
      <Route path="/members" element={<Layout><Members /></Layout>} />
      <Route path="/discounts" element={<Layout><Discounts /></Layout>} />
      <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
      <Route path="/reports" element={<Layout><Reports /></Layout>} />
      <Route path="/admins" element={<Layout><Admins /></Layout>} />
      <Route path="/payments" element={<Layout><Payments /></Layout>} />
      {/* Public routes */}
      <Route path="/book" element={<PublicLayout><PublicBooking /></PublicLayout>} />
      <Route path="/book/:saunaSlug" element={<PublicLayout><SingleSaunaBooking /></PublicLayout>} />
      <Route path="/widget" element={<BookingWidget />} />
      <Route path="/min-side" element={<PublicLayout><MemberDashboard /></PublicLayout>} />
      <Route path="/booking-confirmed" element={<PublicLayout><BookingConfirmed /></PublicLayout>} />
      <Route path="/booking-cancelled" element={<PublicLayout><BookingCancelled /></PublicLayout>} />
    </Routes>
  );
}

export default App;