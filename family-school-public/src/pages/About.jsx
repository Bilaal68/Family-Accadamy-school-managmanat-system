import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  Heart,
  Lightbulb,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/PublicLayout";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function About() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#10026B] via-[#1a0a8a] to-[#10026B] px-4 py-20 text-white sm:px-6">
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
          className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-[#C2B30C]/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <GraduationCap className="mx-auto mb-6 h-20 w-20 text-[#C2B30C]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 text-4xl font-bold sm:text-5xl md:text-6xl"
          >
            About Family Academy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl"
          >
            Building Tomorrow's Leaders Through Excellence, Character, and Innovation
          </motion.p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-12 lg:grid-cols-2 lg:gap-16"
          >
            {/* Text Content */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <h2 className="text-3xl font-bold text-[#10026B] sm:text-4xl">
                Our Story
              </h2>
              <div className="space-y-4 text-[#6b63a3] leading-relaxed">
                <p>
                  Founded in 2012, Family Academy began with a simple yet powerful
                  vision: to create a learning environment where every child could
                  thrive academically, socially, and emotionally. What started as a
                  small school with just 50 students has grown into a vibrant
                  educational institution serving over 1,200 students from diverse
                  backgrounds.
                </p>
                <p>
                  Our journey has been marked by continuous innovation, dedication to
                  excellence, and an unwavering commitment to holistic education. We
                  believe that education extends far beyond textbooks and examinations
                  — it's about nurturing curious minds, building strong character, and
                  preparing students to become responsible global citizens.
                </p>
                <p>
                  Today, Family Academy stands as a testament to what passionate
                  educators, supportive parents, and motivated students can achieve
                  together. Our alumni have gone on to excel in various fields,
                  carrying forward the values and knowledge they gained within our
                  walls.
                </p>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, value: "1200+", label: "Students Enrolled" },
                { icon: Award, value: "80+", label: "Expert Teachers" },
                { icon: Calendar, value: "12", label: "Years of Excellence" },
                { icon: Trophy, value: "98%", label: "Success Rate" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Card className="border-[#E8E6FF] bg-gradient-to-br from-white to-[#f4f3ff]">
                    <CardContent className="p-6 text-center">
                      <stat.icon className="mx-auto mb-3 h-10 w-10 text-[#C2B30C]" />
                      <div className="mb-1 text-3xl font-bold text-[#10026B]">
                        {stat.value}
                      </div>
                      <div className="text-sm text-[#6b63a3]">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gradient-to-b from-white to-[#f4f3ff] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold text-[#10026B] sm:text-4xl"
          >
            Mission & Vision
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 lg:grid-cols-2"
          >
            <motion.div variants={fadeInUp}>
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-[#E8E6FF] bg-gradient-to-br from-[#10026B] to-[#1a0a8a] text-white">
                  <CardContent className="p-8">
                    <Target className="mb-4 h-12 w-12 text-[#C2B30C]" />
                    <h3 className="mb-4 text-2xl font-bold">Our Mission</h3>
                    <p className="text-white/90 leading-relaxed">
                      To provide a safe, inclusive, and stimulating learning
                      environment where every student can discover their unique
                      potential and develop the knowledge, skills, and values needed
                      for lifelong success. We are committed to fostering academic
                      excellence, critical thinking, creativity, and strong moral
                      character in all our students.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-[#E8E6FF] bg-gradient-to-br from-[#C2B30C] to-[#d4c50e]">
                  <CardContent className="p-8">
                    <BookOpen className="mb-4 h-12 w-12 text-[#10026B]" />
                    <h3 className="mb-4 text-2xl font-bold text-[#10026B]">
                      Our Vision
                    </h3>
                    <p className="text-[#10026B]/90 leading-relaxed">
                      To be recognized as a leading educational institution that
                      transforms lives through academic excellence, moral integrity,
                      and innovative teaching practices. We envision a future where
                      our graduates become compassionate, responsible, and successful
                      global citizens who contribute positively to society and make a
                      meaningful difference in the world.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold text-[#10026B] sm:text-4xl"
          >
            Our Core Values
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                icon: Star,
                title: "Excellence",
                description:
                  "We strive for the highest standards in teaching, learning, and personal development.",
              },
              {
                icon: Heart,
                title: "Compassion",
                description:
                  "We foster empathy, kindness, and respect for all members of our community.",
              },
              {
                icon: Shield,
                title: "Integrity",
                description:
                  "We promote honesty, ethical behavior, and accountability in all our actions.",
              },
              {
                icon: Lightbulb,
                title: "Innovation",
                description:
                  "We embrace creativity, critical thinking, and modern teaching methodologies.",
              },
              {
                icon: Users,
                title: "Collaboration",
                description:
                  "We believe in teamwork, partnership, and building strong relationships.",
              },
              {
                icon: Trophy,
                title: "Achievement",
                description:
                  "We celebrate success and encourage students to reach their full potential.",
              },
            ].map((value, index) => (
              <motion.div key={value.title} variants={fadeInUp}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full border-[#E8E6FF] bg-white transition-shadow hover:shadow-xl">
                    <CardContent className="p-6">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <value.icon className="mb-4 h-10 w-10 text-[#C2B30C]" />
                      </motion.div>
                      <h3 className="mb-2 text-xl font-bold text-[#10026B]">
                        {value.title}
                      </h3>
                      <p className="text-sm text-[#6b63a3]">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold text-[#10026B] sm:text-4xl"
          >
            What Makes Us Different
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-2"
          >
            {[
              {
                title: "Experienced & Dedicated Faculty",
                description:
                  "Our team of 80+ qualified teachers brings years of expertise and a genuine passion for education. They are committed to nurturing each student's unique abilities.",
              },
              {
                title: "Modern Facilities & Resources",
                description:
                  "State-of-the-art classrooms, well-equipped laboratories, extensive library, sports facilities, and technology-integrated learning spaces.",
              },
              {
                title: "Small Class Sizes",
                description:
                  "We maintain optimal student-teacher ratios to ensure personalized attention and meaningful interaction with every student.",
              },
              {
                title: "Holistic Education Approach",
                description:
                  "Beyond academics, we focus on character development, leadership skills, creative expression, and physical fitness.",
              },
              {
                title: "Strong Parent Partnership",
                description:
                  "We believe in open communication and collaboration with parents to support each child's educational journey.",
              },
              {
                title: "Safe & Nurturing Environment",
                description:
                  "A secure campus with comprehensive safety measures, where students feel valued, respected, and encouraged to explore.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="flex gap-4"
              >
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C2B30C] text-sm font-bold text-[#10026B]">
                    {index + 1}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[#10026B]">
                    {feature.title}
                  </h3>
                  <p className="text-[#6b63a3]">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#10026B] via-[#1a0a8a] to-[#10026B] px-4 py-16 text-white sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to Join Our Community?
          </h2>
          <p className="mb-8 text-lg text-white/90">
            Take the first step towards your child's bright future. Apply now and
            become part of the Family Academy family.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <a
              href="/enroll"
              className="inline-block rounded-lg bg-[#C2B30C] px-8 py-4 text-lg font-semibold text-[#10026B] transition hover:bg-[#d4c50e]"
            >
              Start Your Application
            </a>
          </motion.div>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
