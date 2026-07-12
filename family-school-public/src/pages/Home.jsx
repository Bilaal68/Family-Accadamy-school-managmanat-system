import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  ClipboardList,
  CreditCard,
  Eye,
  FileUp,
  GraduationCap,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/PublicLayout";
import { GRADES } from "@/lib/constants";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Fill Form",
    description: "Complete the online application with your child's details.",
  },
  {
    icon: FileUp,
    title: "Upload Documents",
    description: "Attach required documents such as birth certificate and transcripts.",
  },
  {
    icon: CreditCard,
    title: "Pay Fee",
    description: "Pay the registration fee and upload your payment receipt.",
  },
  {
    icon: Award,
    title: "Get Approved",
    description: "Our team reviews your application and notifies you of the result.",
  },
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export default function Home() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = 64;
      const top = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section - ID: home */}
      <section
        id="home"
        className="relative overflow-hidden py-20 md:py-28 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80')`
        }}
      >
        {/* Lighter navy overlay so image is more visible */}
        <div className="absolute inset-0 bg-[#10026B]/50"></div>

        {/* Soft decorative blur shapes for depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C2B30C]/10 rounded-full blur-3xl -z-0"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10026B]/30 rounded-full blur-3xl -z-0"></div>

        {/* all existing hero content wrapped, must have higher z-index than overlay */}
        <div className="relative z-10">
          {/* Subtle background decorative elements */}
          <div
            style={{ animation: 'float 6s ease-in-out infinite' }}
            className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-[#C2B30C]/5 blur-3xl"
          />
          <div
            style={{ animation: 'float 6s ease-in-out infinite 3s' }}
            className="absolute -left-20 bottom-20 h-64 w-64 rounded-full bg-[#C2B30C]/5 blur-3xl"
          />

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            {/* Centered Text Content */}
            <div style={{ animation: 'fadeInUp 0.8s ease-out', animationFillMode: 'backwards' }}>
              
              {/* Eyebrow badge */}
              <div
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-[#C2B30C]/40 rounded-full px-4 py-1.5 mb-6"
                style={{ animation: 'fadeInUp 0.8s ease-out', animationFillMode: 'backwards' }}
              >
                <span className="w-2 h-2 rounded-full bg-[#C2B30C] animate-pulse"></span>
                <span className="text-[#C2B30C] text-sm font-medium">
                  Now Accepting Applications
                </span>
              </div>

              <p className="text-[#C2B30C] font-bold tracking-wider mb-6 text-base md:text-lg uppercase">
                Welcome to Family Accadamy
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.1] mb-8">
                A Perfect Start <br className="hidden md:block" />
                For <span className="bg-gradient-to-r from-[#C2B30C] to-[#e8d44a] bg-clip-text text-transparent">Your Kids.</span>
              </h1>
              <p className="text-white/90 text-xl md:text-2xl lg:text-3xl mb-12 mx-auto max-w-3xl leading-relaxed font-light">
                Quality early education from KG1 to Grade 4, in a safe and
                nurturing environment built for your child&apos;s growth.
              </p>
              
              {/* Primary CTA Buttons */}
              <div className="flex flex-wrap gap-5 justify-center mb-6">
                <Link
                  to="/enroll"
                  className="bg-[#C2B30C] text-[#10026B] font-bold text-lg px-10 py-4 rounded-full hover:bg-[#d4c40e] transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  Apply Now
                </Link>
                <button
                  onClick={() => scrollToSection('grades')}
                  className="border-2 border-white text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-white hover:text-[#10026B] transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  Read More
                </button>
              </div>
              
              {/* Trust signals row */}
              <div
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 text-white/70 text-sm"
                style={{ animation: 'fadeIn 1s ease-out 0.7s', animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C2B30C]" />
                  <span>KG1 - Grade 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C2B30C]" />
                  <span>Qualified Teachers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C2B30C]" />
                  <span>Safe Environment</span>
                </div>
              </div>
              
              {/* Secondary Link */}
              <Link
                to="/enroll/status"
                className="inline-block text-white/80 hover:text-white text-base md:text-lg underline underline-offset-4 transition-colors font-medium mt-6"
              >
                Check Application Status →
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <button
          onClick={() => scrollToSection('why-us')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-[#C2B30C] transition-colors z-10 animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* Why Choose Us Section - ID: why-us */}
      <section id="why-us" className="py-20 px-6 bg-[#0D0144] relative overflow-hidden">
        {/* Decorative blur shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/3 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Mission, Vision, Core Values */}
          <div className="text-center mb-12">
            <p className="text-[#C2B30C] font-semibold text-sm uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Why Choose Family Academy
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 max-w-xl mx-auto"
            >
              Built on a foundation of strong values and a clear purpose.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            <motion.div variants={fadeInUp}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-md p-8 text-center hover:bg-white/10 hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-full bg-[#C2B30C]/15 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-7 h-7 text-[#C2B30C]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Our Mission</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  To provide quality early education that nurtures every child&apos;s
                  curiosity, character, and confidence in a safe and caring environment.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-md p-8 text-center hover:bg-white/10 hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-full bg-[#C2B30C]/15 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-7 h-7 text-[#C2B30C]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Our Vision</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  To be a leading early childhood institution known for shaping
                  confident, capable, and compassionate young learners.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-md p-8 text-center hover:bg-white/10 hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-full bg-[#C2B30C]/15 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 text-[#C2B30C]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Core Values</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Respect, integrity, curiosity, and care guide everything we do —
                  for our students, families, and staff.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Highlight Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: GraduationCap,
                title: "Qualified Teachers",
                content: "Experienced and caring educators dedicated to your child's success.",
              },
              {
                icon: Shield,
                title: "Safe Environment",
                content: "Secure, clean facilities where children can learn and play safely.",
              },
              {
                icon: BookOpen,
                title: "Modern Curriculum",
                content: "Age-appropriate learning that builds essential skills and knowledge.",
              },
              {
                icon: Users,
                title: "Individual Attention",
                content: "Small class sizes ensure every child gets personal care and support.",
              },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeInUp}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:-translate-y-1 transition-all h-full">
                  <div className="w-12 h-12 rounded-full bg-[#C2B30C]/15 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-[#C2B30C]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Grades Section - ID: grades */}
      <section id="grades" className="bg-[#0D0144] px-4 py-20 sm:px-6 relative overflow-hidden">
        {/* Decorative blur shape */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <p className="text-[#C2B30C] font-semibold text-sm uppercase tracking-widest mb-2">
              What We Offer
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Grades We Offer
            </motion.h2>
            <p className="text-white/60 text-sm max-w-xl mx-auto">
              Following the Ethiopian National Curriculum
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4"
          >
            {GRADES.map((grade, index) => {
              let label = 'Early Years';
              if (grade === 'Grade 1' || grade === 'Grade 2') {
                label = 'Lower Primary';
              } else if (grade === 'Grade 3' || grade === 'Grade 4') {
                label = 'Upper Primary';
              }
              
              return (
                <motion.div
                  key={grade}
                  variants={scaleIn}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6 text-center hover:bg-[#C2B30C] hover:border-[#C2B30C] group transition-all cursor-default min-w-[120px]"
                >
                  <p className="text-2xl font-bold text-white group-hover:text-[#10026B] transition-colors">
                    {grade}
                  </p>
                  <p className="text-xs text-white/50 group-hover:text-[#10026B]/70 transition-colors mt-1">
                    {label}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          <p className="text-center text-white/60 text-sm mt-8 max-w-xl mx-auto">
            Following the Ethiopian National Curriculum, designed to build strong
            foundations from kindergarten through grade four.
          </p>
        </div>
      </section>

      {/* How to Apply Section - ID: how-to-apply */}
      <section id="how-to-apply" className="px-4 py-20 sm:px-6 bg-[#0D0144] relative overflow-hidden">
        {/* Decorative blur shapes */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <p className="text-[#C2B30C] font-semibold text-sm uppercase tracking-widest mb-2">
              Enrollment
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              How to Apply
            </motion.h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Simple steps to get your child started at Family Academy.
            </p>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STEPS.map((step, index) => (
              <motion.div key={step.title} variants={fadeInUp}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-[#C2B30C]/30 transition-all"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: index * 0.1,
                    }}
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C2B30C] text-lg font-bold text-[#10026B]"
                  >
                    {index + 1}
                  </motion.div>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <step.icon className="mx-auto mb-3 h-8 w-8 text-[#C2B30C]" />
                  </motion.div>
                  <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Location Section - ID: location */}
      <section id="location" className="py-20 px-6 bg-[#0D0144] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-12">
            <p className="text-[#C2B30C] font-semibold text-sm uppercase tracking-widest mb-2">
              Find Us
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Our Location
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Come visit us — we would love to show you around.
            </p>
          </div>

          {/* Two columns: map left, details right */}
          <div className="grid md:grid-cols-2 gap-10 items-start">
            
            {/* Left — Google Maps embed */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <iframe
                src="https://maps.google.com/maps?q=9.0082768,38.7605718&z=16&output=embed"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Family Academy Location"
                className="w-full"
              />
            </div>

            {/* Right — Address details */}
            <div className="space-y-5">
              
              <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#C2B30C]/15 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[#C2B30C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Address</h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Family Academy<br />
                    Addis Ababa, Ethiopia<br />
                    Near [Landmark — update later]
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#C2B30C]/15 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-[#C2B30C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Office Hours</h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Monday – Friday: 8:00 AM – 4:00 PM<br />
                    Saturday: 9:00 AM – 12:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#C2B30C]/15 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-[#C2B30C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Phone</h4>
                  <p className="text-white/60 text-sm">[Add phone number — update later]</p>
                </div>
              </div>

              {/* Get Directions button */}
              <a
                href="https://maps.app.goo.gl/TySeHrxGWX74yR6U7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#C2B30C] text-[#10026B] font-bold py-3 rounded-xl hover:bg-[#d4c40e] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
             
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - ID: contact */}
      <section id="contact" className="bg-[#0D0144] px-4 py-20 sm:px-6 relative overflow-hidden">
        {/* Decorative blur shape */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C2B30C]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <p className="text-[#C2B30C] font-semibold text-sm uppercase tracking-widest mb-2">
              Contact
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Get in Touch
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 max-w-xl mx-auto"
            >
              Have a question? We'd love to hear from you.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mx-auto grid max-w-2xl gap-6"
          >
            {[
              {
                icon: MapPin,
                label: "Address",
                content: "Bole Road, Addis Ababa, Ethiopia",
              },
              {
                icon: Phone,
                label: "Phone",
                content: "+251 11 123 4567",
              },
              {
                icon: Mail,
                label: "Email",
                content: "admissions@familyacademy.edu.et",
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeInUp}
                whileHover={{ x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#C2B30C]/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-[#C2B30C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{item.label}</h4>
                  <p className="text-white/60 text-sm">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
