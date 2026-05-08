"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Sparkles, Download, CheckCircle, Zap, Shield, ArrowRight, Star, Users, TrendingUp, Clock, Upload } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { TEMPLATES } from "@/lib/templates";

const STATS = [
  { icon: Users, value: "4.5M+", label: "Resumes Created" },
  { icon: Shield, value: "98%", label: "ATS Pass Rate" },
  { icon: Clock, value: "15 min", label: "Average Build Time" },
  { icon: TrendingUp, value: "3x", label: "More Interviews" },
];

const FEATURES = [
  { icon: Sparkles, title: "AI Content Generation", desc: "Generate ATS-optimized bullets and summaries with one click. Our AI writes content tailored to your industry.", color: "from-primary to-primary-dark" },
  { icon: Shield, title: "ATS Optimized", desc: "Every template tested against 50+ applicant tracking systems. Get a score and specific fixes.", color: "from-accent to-accent-dark" },
  { icon: Zap, title: "Live Preview", desc: "See your resume update in real-time as you type. Switch between 12 templates instantly.", color: "from-gold to-gold-dark" },
  { icon: Download, title: "Instant PDF Download", desc: "Download pixel-perfect PDFs instantly. No watermarks, no paywalls. Always free.", color: "from-success to-green-700" },
  { icon: Upload, title: "Parse Any Resume", desc: "Upload PDF, DOCX, or TXT — we auto-detect your experience, skills, and education in seconds.", color: "from-purple-500 to-purple-700" },
  { icon: ArrowRight, title: "LinkedIn Import", desc: "Export your LinkedIn PDF and convert it to a polished resume instantly. 95% parse accuracy, zero logins required.", color: "from-[#0077B5] to-[#00A0DC]" },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Software Engineer at Google", text: "I got 3 interviews in one week after using ResumeAI. The AI suggestions completely transformed my bullet points!", rating: 5, avatar: "SK" },
  { name: "Marcus T.", role: "Marketing Manager", text: "Finally a free tool that actually looks professional. The ATS checker helped me understand why I wasn't getting callbacks.", rating: 5, avatar: "MT" },
  { name: "Priya R.", role: "Data Scientist", text: "The two-column template and AI-generated summary landed me my dream job. 100% recommend to everyone.", rating: 5, avatar: "PR" },
  { name: "James L.", role: "Recent Graduate", text: "As a new grad with no experience, the simple templates and guided sections made this so easy.", rating: 5, avatar: "JL" },
  { name: "Ana S.", role: "Product Manager", text: "Switched from a paid service and honestly this is better. The live preview is a game-changer.", rating: 5, avatar: "AS" },
];

const TEMPLATE_SHOWCASE = TEMPLATES.slice(0, 6);

const CATEGORY_COLORS: Record<string, string> = {
  Professional: "bg-blue-100 text-blue-700",
  Creative: "bg-purple-100 text-purple-700",
  Modern: "bg-emerald-100 text-emerald-700",
  Simple: "bg-gray-100 text-gray-700",
  Industry: "bg-orange-100 text-orange-700",
};

const TEMPLATE_BG: Record<string, string> = {
  "modern-minimal": "from-blue-50 to-blue-100",
  "professional-blue": "from-slate-100 to-slate-200",
  "creative-purple": "from-purple-100 to-pink-100",
  "modern-dark": "from-gray-800 to-gray-900",
  "professional-classic": "from-amber-50 to-amber-100",
  "creative-gradient": "from-orange-100 to-pink-100",
};

function StatCounter({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="flex justify-center mb-2">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="font-poppins font-black text-3xl md:text-4xl text-white">{value}</div>
      <div className="text-white/70 text-sm font-opensans mt-1">{label}</div>
    </motion.div>
  );
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";

  return (
    <div className="min-h-screen">
      <Navbar locale={locale} />

      {/* ===== HERO ===== */}
      <section className="gradient-hero min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-20 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-white text-sm font-semibold">✨ 100% Free — No Paywalls, No Watermarks</span>
              <CheckCircle className="w-4 h-4 text-green-300" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-poppins font-black text-5xl md:text-7xl text-white leading-[1.1] mb-6"
          >
            Create Your Perfect<br />
            <span className="relative">
              Resume
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gold/80 rounded-full" />
            </span>{" "}
            in 15 Minutes
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-opensans text-xl md:text-2xl text-white/85 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            AI-powered builder with 500+ ATS-optimized templates. Land more interviews with a professional resume that actually gets noticed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
          >
            <Link href={`/${locale}/builder`} className="btn-primary !text-base !px-8 !py-4 shadow-primary-glow">
              <Sparkles className="w-5 h-5" />
              Create My Resume Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={`/${locale}/upload`} className="btn-outline !text-base !px-8 !py-4">
              📁 Upload Resume
            </Link>
            <Link
              href={`/${locale}/linkedin`}
              className="flex items-center gap-2 !text-base !px-8 !py-4 rounded-xl font-semibold border-2 transition-all"
              style={{ background: "#0077B5", color: "white", borderColor: "#0077B5" }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Import from LinkedIn
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-3xl mx-auto"
          >
            {STATS.map((stat) => (
              <StatCounter key={stat.label} {...stat} />
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ===== TEMPLATE SHOWCASE ===== */}
      <section id="templates" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="badge badge-primary mb-4 inline-block">500+ Templates</span>
            <h2 className="section-title mb-4">Templates That Get You Hired</h2>
            <p className="section-subtitle">
              From executive boardrooms to creative studios — find the perfect design for your career.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
            {TEMPLATE_SHOWCASE.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative glass-card overflow-hidden cursor-pointer"
              >
                {/* Template preview mockup */}
                <div className={`aspect-[8.5/11] bg-gradient-to-br ${TEMPLATE_BG[template.id] || "from-gray-100 to-gray-200"} p-4 relative`}>
                  {/* Mini resume mockup */}
                  <div className="w-full h-full bg-white rounded shadow-sm p-3 overflow-hidden">
                    <div className="h-2.5 rounded mb-2" style={{ background: template.colors.primary, width: "70%" }} />
                    <div className="h-1.5 bg-gray-200 rounded mb-3 w-1/2" />
                    <div className="space-y-1 mb-3">
                      <div className="h-1 bg-gray-100 rounded" />
                      <div className="h-1 bg-gray-100 rounded w-5/6" />
                    </div>
                    <div className="h-1.5 rounded mb-2" style={{ background: template.colors.primary, width: "40%" }} />
                    <div className="space-y-1 mb-3">
                      <div className="h-1 bg-gray-100 rounded" />
                      <div className="h-1 bg-gray-100 rounded w-4/5" />
                      <div className="h-1 bg-gray-100 rounded w-3/4" />
                    </div>
                    <div className="h-1.5 rounded mb-2" style={{ background: template.colors.primary, width: "35%" }} />
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-2 w-8 rounded-full" style={{ background: `${template.colors.primary}30` }} />
                      ))}
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded">
                    <Link
                      href={`/${locale}/builder?template=${template.id}`}
                      className="btn-primary !py-2.5 !px-5 !text-sm shadow-lg"
                    >
                      Try Free
                    </Link>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-poppins font-semibold text-gray-900 text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-opensans">{template.description}</p>
                    </div>
                    <span className={`badge text-xs shrink-0 ${CATEGORY_COLORS[template.category] || "badge-primary"}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href={`/${locale}/templates`} className="btn-primary">
              View All 500+ Templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="badge badge-accent mb-4 inline-block">Why ResumeAI?</span>
            <h2 className="section-title mb-4">Everything You Need to Land the Job</h2>
            <p className="section-subtitle">
              Professional tools that were previously only available to career coaches — now free for everyone.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-poppins font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="font-opensans text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="section-title mb-4">Build Your Resume in 3 Steps</h2>
            <p className="section-subtitle mb-14">No account required. Start building instantly.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose a Template", desc: "Pick from 12 professionally designed templates. Filter by industry or style.", icon: "🎨" },
              { step: "02", title: "Fill In Your Details", desc: "Enter your info and let AI generate powerful bullet points and summaries.", icon: "✍️" },
              { step: "03", title: "Download for Free", desc: "Get a pixel-perfect PDF instantly. Share it and start getting interviews.", icon: "⬇️" },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="card p-8">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <div className="absolute top-4 right-4 font-poppins font-black text-5xl text-gray-100">{step.step}</div>
                  <h3 className="font-poppins font-bold text-xl text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-opensans">{step.desc}</p>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 z-10" />}
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10">
            <Link href={`/${locale}/builder`} className="btn-primary !text-base !px-10 !py-4">
              <Sparkles className="w-5 h-5" /> Start Building — It&apos;s Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="section-title mb-4">Trusted by 4.5 Million Job Seekers</h2>
            <p className="section-subtitle">Real people, real results. See what they say.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 font-opensans italic">
                  &quot;{t.text}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-poppins font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500 font-opensans">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
