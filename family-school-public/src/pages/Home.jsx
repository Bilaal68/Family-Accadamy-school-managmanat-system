import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileUp,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/PublicLayout";
import AboutSection from "@/components/AboutSection";
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
  return (
    <PublicLayout>
      {/* Hero Section with Animations */}
      <section className="relative overflow-hidden bg-[#10026B] px-4 py-16 text-white sm:px-6 sm:py-24">
        {/* Animated background elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C2B30C]/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#C2B30C]/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Icon with bounce animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
          >
            <GraduationCap className="mx-auto mb-6 h-16 w-16 text-[#C2B30C]" />
          </motion.div>

          {/* Main heading with slide-up animation */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Family Academy
          </motion.h1>

          {/* Subtitle with fade-in */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-white/80 sm:text-xl"
          >
            Nurturing excellence, building character, and shaping tomorrow&apos;s leaders
            through quality education.
          </motion.p>

          {/* CTA Buttons with stagger animation */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className="w-full bg-[#C2B30C] text-[#10026B] hover:bg-[#d4c50e] sm:w-auto"
              >
                <Link to="/enroll">Apply Now</Link>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white bg-transparent text-white hover:bg-white hover:text-[#10026B] sm:w-auto"
              >
                <Link to="/enroll/status">Check Application Status</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section Component */}
      <AboutSection />

      {/* About Cards - Old About Section kept as feature highlights */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center text-3xl font-bold text-[#10026B]"
          >
            Our Core Values
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              {
                icon: Target,
                title: "Our Mission",
                content:
                  "To provide a safe, inclusive learning environment where every student can discover their potential and develop the skills needed for lifelong success.",
              },
              {
                icon: BookOpen,
                title: "Our Vision",
                content:
                  "To be a leading institution recognized for academic excellence, moral integrity, and producing well-rounded citizens who contribute positively to society.",
              },
              {
                icon: Award,
                title: "Why Choose Us",
                content:
                  "Experienced teachers, modern facilities, a balanced curriculum, and a strong focus on both academic achievement and character development.",
              },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeInUp}>
                <motion.div whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.3 }}>
                  <Card className="h-full border-[#E8E6FF] transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <item.icon className="mb-2 h-8 w-8 text-[#C2B30C]" />
                      </motion.div>
                      <CardTitle className="text-[#10026B]">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-[#6b63a3]">{item.content}</CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Grades Section with Animation */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-3xl font-bold text-[#10026B]"
          >
            Grades Offered
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 text-[#6b63a3]"
          >
            We welcome students from Grade 1 through Grade 8.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-3"
          >
            {GRADES.map((grade, index) => (
              <motion.span
                key={grade}
                variants={scaleIn}
                whileHover={{ scale: 1.1, y: -3 }}
                transition={{ duration: 0.2 }}
                className="cursor-default rounded-full border border-[#E8E6FF] bg-[#f4f3ff] px-4 py-2 text-sm font-medium text-[#10026B] shadow-sm"
              >
                {grade}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How to Apply Section with Step Animations */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center text-3xl font-bold text-[#10026B]"
          >
            How to Apply
          </motion.h2>
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
                >
                  <Card className="h-full border-[#E8E6FF] text-center transition-shadow hover:shadow-xl">
                    <CardContent className="pt-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: index * 0.1,
                        }}
                        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#10026B] text-lg font-bold text-white"
                      >
                        {index + 1}
                      </motion.div>
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <step.icon className="mx-auto mb-3 h-8 w-8 text-[#C2B30C]" />
                      </motion.div>
                      <h3 className="mb-2 font-semibold text-[#10026B]">{step.title}</h3>
                      <p className="text-sm text-[#6b63a3]">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section with Slide-in Animations */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center text-3xl font-bold text-[#10026B]"
          >
            Contact Us
          </motion.h2>
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
                className="flex items-start gap-4 rounded-lg border border-[#E8E6FF] bg-[#f4f3ff] p-4 transition-colors hover:bg-white"
              >
                <item.icon className="mt-1 h-5 w-5 shrink-0 text-[#C2B30C]" />
                <div>
                  <p className="font-medium text-[#10026B]">{item.label}</p>
                  <p className="text-[#6b63a3]">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
