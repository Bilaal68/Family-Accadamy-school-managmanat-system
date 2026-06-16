import { motion } from "framer-motion";
import { Award, BookOpen, Target, Users, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

// Animated counter component
function AnimatedStat({ end, duration = 2, label, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="mb-2 text-4xl font-bold text-[#C2B30C]">
        {count}
        {suffix}
      </div>
      <div className="text-sm font-medium text-[#6b63a3]">{label}</div>
    </motion.div>
  );
}

export default function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f3ff] px-4 py-20 sm:px-6">
      {/* Decorative background elements */}
      <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C2B30C]/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-[#10026B]/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-[#10026B] sm:text-5xl">
            About Family Academy
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#6b63a3]">
            A leading educational institution committed to nurturing excellence,
            building character, and empowering students to become tomorrow's leaders.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div>
              <h3 className="mb-3 text-2xl font-bold text-[#10026B]">
                Our Story
              </h3>
              <p className="text-[#6b63a3] leading-relaxed">
                Founded with a vision to provide quality education that goes beyond
                textbooks, Family Academy has been shaping young minds for over a
                decade. We believe in holistic education that nurtures academic
                excellence, moral values, and creative thinking.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-2xl font-bold text-[#10026B]">
                What Makes Us Different
              </h3>
              <ul className="space-y-3">
                {[
                  "Experienced and dedicated teaching staff",
                  "Modern, well-equipped facilities and laboratories",
                  "Small class sizes for personalized attention",
                  "Focus on both academic and character development",
                  "Strong parent-school partnership",
                  "Safe and nurturing learning environment",
                ].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C2B30C]" />
                    <span className="text-[#6b63a3]">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-[#10026B] text-[#C2B30C] hover:bg-[#1a0a8a]"
              >
                <Link to="/about">Learn More About Us</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Stats & Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            {/* Statistics */}
            <Card className="border-[#E8E6FF] bg-white/80 backdrop-blur">
              <CardContent className="p-8">
                <h4 className="mb-6 text-center text-xl font-bold text-[#10026B]">
                  Our Impact
                </h4>
                <div className="grid grid-cols-3 gap-6">
                  <AnimatedStat end={1200} suffix="+" label="Students" />
                  <AnimatedStat end={80} suffix="+" label="Teachers" />
                  <AnimatedStat end={25} suffix="+" label="Programs" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <AnimatedStat end={12} label="Years of Excellence" />
                  <AnimatedStat end={98} suffix="%" label="Success Rate" />
                </div>
              </CardContent>
            </Card>

            {/* Mission & Vision Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-[#E8E6FF] bg-gradient-to-br from-[#10026B] to-[#1a0a8a] text-white">
                  <CardContent className="p-6">
                    <Target className="mb-3 h-8 w-8 text-[#C2B30C]" />
                    <h4 className="mb-2 font-bold">Our Mission</h4>
                    <p className="text-sm text-white/90">
                      Empowering students with knowledge, skills, and values for
                      lifelong success.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-[#E8E6FF] bg-gradient-to-br from-[#C2B30C] to-[#d4c50e] text-[#10026B]">
                  <CardContent className="p-6">
                    <BookOpen className="mb-3 h-8 w-8 text-[#10026B]" />
                    <h4 className="mb-2 font-bold">Our Vision</h4>
                    <p className="text-sm text-[#10026B]/90">
                      To be the leading institution recognized for excellence and
                      integrity.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick highlights */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Calendar, label: "Est. 2012" },
                { icon: Award, label: "Accredited" },
                { icon: Trophy, label: "Award Winning" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Card className="border-[#E8E6FF] bg-white/80">
                    <CardContent className="p-4 text-center">
                      <item.icon className="mx-auto mb-2 h-6 w-6 text-[#C2B30C]" />
                      <p className="text-xs font-medium text-[#10026B]">
                        {item.label}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
