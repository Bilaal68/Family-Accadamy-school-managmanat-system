import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import About from "@/pages/About";
import ApplicationStatus from "@/pages/ApplicationStatus";
import EnrollmentForm from "@/pages/EnrollmentForm";
import EnrollmentSuccess from "@/pages/EnrollmentSuccess";
import Home from "@/pages/Home";

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/enroll" element={<EnrollmentForm />} />
        <Route path="/enroll/status" element={<ApplicationStatus />} />
        <Route path="/enroll/success" element={<EnrollmentSuccess />} />
      </Routes>
    </AnimatePresence>
  );
}
