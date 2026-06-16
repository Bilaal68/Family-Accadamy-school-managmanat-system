import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

export default function PublicLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f3ff]">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? "border-[#E8E6FF] bg-white/95 shadow-md backdrop-blur-md"
            : "border-[#E8E6FF] bg-white shadow-sm"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10026B] text-lg font-bold text-[#C2B30C]"
            >
              F
            </motion.div>
            <span className="text-xl font-bold text-[#10026B]">Family Academy</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/about"
                className={`group relative hidden text-sm font-medium sm:inline ${
                  isActive("/about") ? "text-[#C2B30C]" : "text-[#10026B]"
                }`}
              >
                About
                <motion.span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-[#C2B30C] transition-all ${
                    isActive("/about") ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/enroll/status"
                className={`group relative hidden text-sm font-medium sm:inline ${
                  isActive("/enroll/status") ? "text-[#C2B30C]" : "text-[#10026B]"
                }`}
              >
                Check Status
                <motion.span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-[#C2B30C] transition-all ${
                    isActive("/enroll/status") ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/enroll"
                className="rounded-md bg-[#C2B30C] px-4 py-2 text-sm font-semibold text-[#10026B] transition hover:bg-[#d4c50e]"
              >
                Apply Now
              </Link>
            </motion.div>
          </nav>
        </div>
      </motion.header>

      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="flex-1"
      >
        {children}
      </motion.main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="border-t border-[#E8E6FF] bg-[#10026B] text-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-lg font-semibold">Family Academy</p>
            <p className="text-sm text-white/70">
              &copy; {new Date().getFullYear()} Family Academy. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
