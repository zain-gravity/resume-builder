"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Menu, X, Sparkles, ChevronDown, Globe, Upload } from "lucide-react";

const LOCALES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

interface NavbarProps {
  locale?: string;
}

export default function Navbar({ locale = "en" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: `/${locale}/builder`, label: "Builder" },
    { href: `/${locale}/upload`, label: "📁 Upload" },
    { href: `/${locale}/linkedin`, label: "🔗 LinkedIn" },
    { href: `/${locale}/templates`, label: "Templates" },
    { href: `/${locale}/check`, label: "ATS Check" },
    { href: `/${locale}/jd-match`, label: "🎯 JD Match" },
    { href: `/${locale}/interview-prep`, label: "🎓 Interview" },
    { href: `/${locale}/dashboard`, label: "Dashboard" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2E86AB 0%, #A23B72 100%)" }}
            >
              <FileText className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <span className="font-poppins font-800 text-lg text-gray-900">
                Resume<span className="gradient-text font-black">AI</span>
              </span>
              <div className="text-[10px] text-gray-500 -mt-1 font-opensans">100% Free</div>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium font-opensans transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary font-semibold"
                    : scrolled
                    ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  scrolled ? "text-gray-600 hover:bg-gray-100" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-medium">{locale}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-50"
                  >
                    {LOCALES.map((l) => (
                      <Link
                        key={l.code}
                        href={pathname.replace(`/${locale}`, `/${l.code}`) || `/${l.code}`}
                        onClick={() => setLangOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${l.code === locale ? "bg-primary/5 text-primary font-semibold" : "text-gray-700"}`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="font-opensans">{l.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href={`/${locale}/upload`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${
                scrolled
                  ? "border-primary/30 text-primary hover:bg-primary/5"
                  : "border-white/40 text-white hover:bg-white/10"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </Link>

            <Link
              href={`/${locale}/builder`}
              className="btn-primary !py-2 !px-5 !text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Create Resume Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? "text-gray-700" : "text-white"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                <Link href={`/${locale}/builder`} className="btn-primary w-full justify-center !text-sm">
                  <Sparkles className="w-4 h-4" />
                  Create Resume Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
