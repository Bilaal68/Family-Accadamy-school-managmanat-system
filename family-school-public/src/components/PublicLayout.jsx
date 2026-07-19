import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

// Social Icons Component
function SocialIcons() {
  return (
    <div className="flex items-center gap-4">
      <a
        href="https://facebook.com/familyschool"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#C2B30C] hover:text-[#10026B] transition-colors duration-300"
        aria-label="Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>
      <a
        href="https://instagram.com/familyschool"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#C2B30C] hover:text-[#10026B] transition-colors duration-300"
        aria-label="Instagram"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>
      <a
        href="https://tiktok.com/@familyschool"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#C2B30C] hover:text-[#10026B] transition-colors duration-300"
        aria-label="TikTok"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.5s1.17-2.5 2.59-2.5c.31 0 .61.05.89.15v-2.99a5.564 5.564 0 0 0-.89-.07A5.589 5.589 0 0 0 4.27 15.4a5.589 5.589 0 0 0 5.59 5.6 5.589 5.589 0 0 0 5.59-5.6V9.16a7.245 7.245 0 0 0 4.18 1.34V7.51a4.278 4.278 0 0 1-3.03-1.69Z"/>
        </svg>
      </a>
      <a
        href="https://t.me/familyschool"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#C2B30C] hover:text-[#10026B] transition-colors duration-300"
        aria-label="Telegram"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M21.05 2.93a1.5 1.5 0 0 0-1.55-.27L2.7 9.6c-.96.37-.95 1.76.02 2.1l4.4 1.57 1.7 5.46c.27.86 1.36 1.1 1.97.43l2.45-2.7 4.36 3.22c.78.58 1.9.15 2.08-.8l3.27-15.1a1.5 1.5 0 0 0-.4-1.85ZM9.7 14.1l-.95-3.05 8.4-6.6-7.45 9.65Z"/>
        </svg>
      </a>
    </div>
  );
}

// Scroll-spy hook to track active section
function useActiveSection(sectionIds) {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -50% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}

export default function PublicLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = useActiveSection(["home", "why-us", "grades", "how-to-apply", "location", "contact"]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    // Close mobile menu when clicking a link
    setIsMobileMenuOpen(false);
    
    // If not on home page, navigate there first, then scroll
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const navbarHeight = 64;
          const top = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(id);
      if (element) {
        const navbarHeight = 64;
        const top = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  // Only show scroll nav on home page
  const isHomePage = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0220]">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[#0D0144]/80 backdrop-blur-xl shadow-2xl border-b border-white/10"
            : "bg-[#10026B]/60 backdrop-blur-md border-b border-white/5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <motion.button
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg overflow-hidden shadow-lg group-hover:shadow-[#C2B30C]/50 transition-shadow duration-300"
            >
              <img
                src="/logo.PNG"
                alt="Family Academy Logo"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div className="hidden sm:block">
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-[#C2B30C] transition-colors duration-300">
                Family Academy
              </span>
              <p className="text-xs text-[#C2B30C] font-medium hidden sm:block">Akkadaamii Faamilii</p>
            </div>
          </motion.button>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 lg:gap-8">
              {isHomePage ? (
                <>
                  {/* Scroll navigation for home page */}
                  <motion.div 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => scrollToSection("why-us")}
                      className={`group relative text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                        activeSection === "why-us" 
                          ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                          : "text-white/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Why Us
                      <span
                        className={`absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] rounded-full transition-all duration-300 ${
                          activeSection === "why-us" ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        }`}
                      />
                    </button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => scrollToSection("grades")}
                      className={`group relative text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                        activeSection === "grades" 
                          ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                          : "text-white/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Grades
                      <span
                        className={`absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] rounded-full transition-all duration-300 ${
                          activeSection === "grades" ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        }`}
                      />
                    </button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => scrollToSection("location")}
                      className={`group relative text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                        activeSection === "location" 
                          ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                          : "text-white/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Location
                      <span
                        className={`absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] rounded-full transition-all duration-300 ${
                          activeSection === "location" ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        }`}
                      />
                    </button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => scrollToSection("contact")}
                      className={`group relative text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                        activeSection === "contact" 
                          ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                          : "text-white/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Contact
                      <span
                        className={`absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] rounded-full transition-all duration-300 ${
                          activeSection === "contact" ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        }`}
                      />
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Route navigation for other pages */}
                  <motion.div 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => scrollToSection("home")}
                      className="group relative text-sm font-semibold px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300"
                    >
                      Home
                      <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] rounded-full opacity-0 group-hover:opacity-50 transition-all duration-300" />
                    </button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/enroll/status"
                      className={`group relative text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                        location.pathname === "/enroll/status" 
                          ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                          : "text-white/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Check Status
                      <span
                        className={`absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] rounded-full transition-all duration-300 ${
                          location.pathname === "/enroll/status" ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        }`}
                      />
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
            
            {/* Apply Now Button - Desktop */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }} 
              whileTap={{ scale: 0.95 }}
              className="hidden sm:block"
            >
              <Link
                to="/enroll"
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-[#10026B] shadow-lg shadow-[#C2B30C]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#C2B30C]/50 group"
              >
                <span className="relative z-10">Apply Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4c40e] to-[#C2B30C] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </motion.div>

            {/* Mobile Hamburger Menu - Shown on mobile only */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </nav>

          {/* Mobile Menu - Full-width dropdown */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: isMobileMenuOpen ? 1 : 0, 
              height: isMobileMenuOpen ? "auto" : 0,
              transition: { duration: 0.2 }
            }}
            className="md:hidden absolute top-full left-0 right-0 bg-[#0D0144]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {isHomePage ? (
                <>
                  <button
                    onClick={() => scrollToSection("why-us")}
                    className={`block w-full text-left px-4 py-3 rounded-lg font-semibold text-base min-h-12 transition-all duration-300 ${
                      activeSection === "why-us" 
                        ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Why Us
                  </button>
                  <button
                    onClick={() => scrollToSection("grades")}
                    className={`block w-full text-left px-4 py-3 rounded-lg font-semibold text-base min-h-12 transition-all duration-300 ${
                      activeSection === "grades" 
                        ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Grades
                  </button>
                  <button
                    onClick={() => scrollToSection("location")}
                    className={`block w-full text-left px-4 py-3 rounded-lg font-semibold text-base min-h-12 transition-all duration-300 ${
                      activeSection === "location" 
                        ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Location
                  </button>
                  <button
                    onClick={() => scrollToSection("contact")}
                    className={`block w-full text-left px-4 py-3 rounded-lg font-semibold text-base min-h-12 transition-all duration-300 ${
                      activeSection === "contact" 
                        ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Contact
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => scrollToSection("home")}
                    className="block w-full text-left px-4 py-3 rounded-lg font-semibold text-base min-h-12 text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    Home
                  </button>
                  <Link
                    to="/enroll/status"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block w-full text-left px-4 py-3 rounded-lg font-semibold text-base min-h-12 transition-all duration-300 ${
                      location.pathname === "/enroll/status" 
                        ? "text-[#C2B30C] bg-[#C2B30C]/10" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Check Status
                  </Link>
                </>
              )}
              
              {/* Apply Now Button - Mobile */}
              <Link
                to="/enroll"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center bg-[#C2B30C] text-[#10026B] font-bold py-3 rounded-lg hover:bg-[#d4c40e] transition-all min-h-12 flex items-center justify-center mt-4 text-base"
              >
                Apply Now
              </Link>
            </div>
          </motion.div>
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
        className="border-t border-white/5 bg-[#0A0130] text-white relative overflow-hidden"
      >
        {/* Decorative blur shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#10026B]/30 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 relative z-10">
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {/* Top Row: School Name & Social Icons */}
            <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 w-full sm:flex-row">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src="/logo.PNG"
                  alt="Family Academy Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">Family Academy</p>
                  <p className="text-xs sm:text-sm text-[#C2B30C]">Akkadaamii Faamilii</p>
                </div>
              </div>
              <div className="flex items-center justify-center w-full sm:w-auto sm:justify-end">
                <SocialIcons />
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {/* Bottom Row: Copyright & VRLX Credit */}
            <div className="flex flex-col gap-3 sm:gap-4 w-full items-center justify-between text-center sm:text-left sm:flex-row">
              <p className="text-xs sm:text-sm text-white/40">
                &copy; {new Date().getFullYear()} Family Academy — Akkadaamii Faamilii. All rights reserved.
              </p>
              <a
                href="https://vrlx-digital.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/40 hover:text-[#C2B30C] transition-colors text-xs sm:text-sm group"
              >
                <span>Built by</span>
                <span className="font-bold text-white/60 group-hover:text-[#C2B30C] transition-colors">
                  VRLX Digital
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-4l-8 8m0 0l4-4m-4 4l4 4" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
