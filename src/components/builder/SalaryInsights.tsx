"use client";
import { motion } from "framer-motion";
import { TrendingUp, MapPin, DollarSign, BarChart2, Info } from "lucide-react";
import { useResumeStore } from "@/lib/store";

interface SalaryRange {
  low: number;
  mid: number;
  high: number;
  currency: string;
  period: string;
}

// Salary data by job title keywords (annual USD)
const SALARY_DATA: Record<string, { range: SalaryRange; demand: "high" | "medium" | "low"; growth: string; topPaying: string[] }> = {
  "software engineer": { range: { low: 95000, mid: 135000, high: 195000, currency: "$", period: "/yr" }, demand: "high", growth: "+22% (2023-2033)", topPaying: ["Google", "Meta", "Apple", "Netflix", "Airbnb"] },
  "frontend engineer": { range: { low: 85000, mid: 120000, high: 175000, currency: "$", period: "/yr" }, demand: "high", growth: "+16%", topPaying: ["Stripe", "Figma", "Vercel", "Shopify", "Twilio"] },
  "backend engineer": { range: { low: 90000, mid: 130000, high: 185000, currency: "$", period: "/yr" }, demand: "high", growth: "+18%", topPaying: ["Amazon", "Microsoft", "Oracle", "Salesforce"] },
  "full stack": { range: { low: 88000, mid: 125000, high: 180000, currency: "$", period: "/yr" }, demand: "high", growth: "+20%", topPaying: ["Slack", "Atlassian", "HubSpot", "Zoom"] },
  "data scientist": { range: { low: 90000, mid: 128000, high: 175000, currency: "$", period: "/yr" }, demand: "high", growth: "+35%", topPaying: ["Google", "Amazon", "Microsoft", "Tesla", "Spotify"] },
  "data analyst": { range: { low: 60000, mid: 82000, high: 115000, currency: "$", period: "/yr" }, demand: "high", growth: "+23%", topPaying: ["McKinsey", "Deloitte", "Facebook", "LinkedIn"] },
  "product manager": { range: { low: 100000, mid: 145000, high: 210000, currency: "$", period: "/yr" }, demand: "high", growth: "+12%", topPaying: ["Google", "Apple", "Amazon", "Uber", "Lyft"] },
  "designer": { range: { low: 65000, mid: 95000, high: 145000, currency: "$", period: "/yr" }, demand: "medium", growth: "+8%", topPaying: ["Adobe", "Figma", "Apple", "Airbnb"] },
  "ux": { range: { low: 70000, mid: 100000, high: 150000, currency: "$", period: "/yr" }, demand: "high", growth: "+13%", topPaying: ["Google", "Apple", "Microsoft", "Spotify"] },
  "marketing": { range: { low: 50000, mid: 75000, high: 120000, currency: "$", period: "/yr" }, demand: "medium", growth: "+10%", topPaying: ["HubSpot", "Salesforce", "Nike", "Meta"] },
  "sales": { range: { low: 55000, mid: 85000, high: 180000, currency: "$", period: "/yr" }, demand: "high", growth: "+4%", topPaying: ["Salesforce", "Oracle", "SAP", "Cisco"] },
  "finance": { range: { low: 70000, mid: 100000, high: 175000, currency: "$", period: "/yr" }, demand: "medium", growth: "+7%", topPaying: ["Goldman Sachs", "JP Morgan", "BlackRock", "Citadel"] },
  "accountant": { range: { low: 55000, mid: 78000, high: 110000, currency: "$", period: "/yr" }, demand: "medium", growth: "+6%", topPaying: ["Deloitte", "PwC", "EY", "KPMG"] },
  "hr": { range: { low: 55000, mid: 78000, high: 120000, currency: "$", period: "/yr" }, demand: "medium", growth: "+5%", topPaying: ["Google", "Amazon", "Meta", "Workday"] },
  "devops": { range: { low: 100000, mid: 140000, high: 200000, currency: "$", period: "/yr" }, demand: "high", growth: "+26%", topPaying: ["Netflix", "Spotify", "Amazon", "Google"] },
  "machine learning": { range: { low: 110000, mid: 155000, high: 230000, currency: "$", period: "/yr" }, demand: "high", growth: "+40%", topPaying: ["OpenAI", "DeepMind", "Google", "Meta AI"] },
  "cybersecurity": { range: { low: 90000, mid: 125000, high: 185000, currency: "$", period: "/yr" }, demand: "high", growth: "+33%", topPaying: ["CrowdStrike", "Palo Alto", "Microsoft", "Cisco"] },
  "project manager": { range: { low: 70000, mid: 100000, high: 155000, currency: "$", period: "/yr" }, demand: "medium", growth: "+7%", topPaying: ["Boeing", "Lockheed", "Amazon", "Deloitte"] },
};

function getSalaryData(jobTitle: string) {
  const lower = jobTitle.toLowerCase();
  for (const [key, data] of Object.entries(SALARY_DATA)) {
    if (lower.includes(key)) return { ...data, matched: key };
  }
  return null;
}

function formatSalary(amount: number, currency: string) {
  return `${currency}${(amount / 1000).toFixed(0)}K`;
}

export default function SalaryInsights() {
  const { resumeData } = useResumeStore();
  const jobTitle = resumeData.personalInfo.jobTitle;
  const location = resumeData.personalInfo.location;

  if (!jobTitle) return null;

  const data = getSalaryData(jobTitle);
  if (!data) return null;

  const { range, demand, growth, topPaying } = data;
  const demandColors = {
    high: { bg: "bg-green-100", text: "text-green-700", label: "High Demand 🔥" },
    medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Medium Demand" },
    low: { bg: "bg-gray-100", text: "text-gray-600", label: "Low Demand" },
  };
  const dc = demandColors[demand];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 border-l-4 border-l-primary"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-bold text-gray-900 text-sm">Salary Insights</h3>
            <p className="text-xs text-gray-500">For: {jobTitle}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dc.bg} ${dc.text}`}>
          {dc.label}
        </span>
      </div>

      {/* Salary Range Visual */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-2">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Entry</p>
            <p className="font-poppins font-bold text-gray-600 text-sm">{formatSalary(range.low, range.currency)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary font-bold mb-0.5">Median</p>
            <p className="font-poppins font-black text-primary text-xl">{formatSalary(range.mid, range.currency)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Senior</p>
            <p className="font-poppins font-bold text-gray-600 text-sm">{formatSalary(range.high, range.currency)}</p>
          </div>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)" }}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="absolute inset-y-0 left-[50%] -translate-x-1/2 w-1 bg-white rounded-full" />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[10px] text-gray-400 font-opensans">{range.currency}{range.low.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 font-opensans">{range.currency}{range.high.toLocaleString()}{range.period}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <BarChart2 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="font-poppins font-bold text-blue-700 text-sm">{growth}</p>
          <p className="text-[10px] text-blue-500">Job Growth</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <DollarSign className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <p className="font-poppins font-bold text-purple-700 text-sm">{formatSalary(range.mid, range.currency)}/yr</p>
          <p className="text-[10px] text-purple-500">US Median</p>
        </div>
      </div>

      {location && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <MapPin className="w-3 h-3" />
          <span>Range may vary for {location} — major tech hubs pay 20-40% more</span>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top-Paying Companies</p>
        <div className="flex flex-wrap gap-1.5">
          {topPaying.map(co => (
            <span key={co} className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-700 border border-gray-100 font-medium">
              {co}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-700 font-opensans">Data sourced from industry surveys. Actual salaries depend on experience, location, and company size.</p>
      </div>
    </motion.div>
  );
}
