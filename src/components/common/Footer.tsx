import Link from "next/link";
import { FileText, Twitter, Linkedin, Github, Heart } from "lucide-react";

interface FooterProps {
  locale?: string;
}

const FOOTER_LINKS = {
  Product: [
    { label: "Resume Builder", href: "/builder" },
    { label: "Templates", href: "/templates" },
    { label: "ATS Checker", href: "/check" },
    { label: "Cover Letter", href: "/cover-letter" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Templates: [
    { label: "Professional", href: "/templates?cat=professional" },
    { label: "Creative", href: "/templates?cat=creative" },
    { label: "Modern", href: "/templates?cat=modern" },
    { label: "Simple", href: "/templates?cat=simple" },
    { label: "Industry-Specific", href: "/templates?cat=industry" },
  ],
  Support: [
    { label: "How It Works", href: "#features" },
    { label: "ATS Guide", href: "#" },
    { label: "Resume Tips", href: "#" },
    { label: "Career Blog", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  About: [
    { label: "Our Mission", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Open Source", href: "#" },
  ],
};

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "zh", flag: "🇨🇳", label: "ZH" },
  { code: "ja", flag: "🇯🇵", label: "JA" },
  { code: "ko", flag: "🇰🇷", label: "KO" },
  { code: "ru", flag: "🇷🇺", label: "RU" },
  { code: "ar", flag: "🇸🇦", label: "AR" },
  { code: "hi", flag: "🇮🇳", label: "HI" },
  { code: "nl", flag: "🇳🇱", label: "NL" },
  { code: "pl", flag: "🇵🇱", label: "PL" },
  { code: "tr", flag: "🇹🇷", label: "TR" },
  { code: "sv", flag: "🇸🇪", label: "SV" },
  { code: "da", flag: "🇩🇰", label: "DA" },
  { code: "no", flag: "🇳🇴", label: "NO" },
  { code: "fi", flag: "🇫🇮", label: "FI" },
  { code: "cs", flag: "🇨🇿", label: "CS" },
  { code: "el", flag: "🇬🇷", label: "EL" },
  { code: "id", flag: "🇮🇩", label: "ID" },
  { code: "vi", flag: "🇻🇳", label: "VI" },
  { code: "th", flag: "🇹🇭", label: "TH" },
  { code: "ms", flag: "🇲🇾", label: "MS" },
];

export default function Footer({ locale = "en" }: FooterProps) {
  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Free Forever Banner */}
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-poppins font-black text-3xl md:text-4xl text-white mb-3">
            100% Free Forever
          </h2>
          <p className="text-white/80 text-lg mb-6 font-opensans">
            No credit card. No premium plan. No watermarks. Just a great resume.
          </p>
          <Link href={`/${locale}/builder`} className="btn-outline inline-flex">
            Start Building Now — It&apos;s Free
          </Link>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-poppins font-black text-xl text-white">
                Resume<span className="text-primary-light">AI</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-gray-500">
              The world's most powerful free resume builder. No paywalls, no watermarks, no limits.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-poppins font-semibold text-white text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={`/${locale}${link.href}`}
                      className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Language Flags */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-4">
            Available in 25 Languages
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Link
                key={lang.code}
                href={`/${lang.code}`}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  lang.code === locale
                    ? "bg-primary text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-6">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} ResumeAI. All rights reserved. Made with{" "}
            <Heart className="inline w-3 h-3 text-red-500 fill-red-500" /> for job seekers worldwide.
          </p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href={`/${locale}#`} className="hover:text-white transition-colors">Privacy</Link>
            <Link href={`/${locale}#`} className="hover:text-white transition-colors">Terms</Link>
            <Link href={`/${locale}#`} className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
