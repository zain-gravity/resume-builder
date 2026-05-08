"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Edit2, Download, Trash2, FileText, Target, TrendingUp, Briefcase, Copy, Pencil, Check, X, Clock, BookOpen } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useResumeStore, type SavedResume } from "@/lib/store";
import { generateResumeHTML } from "@/lib/templates";
import { toast } from "sonner";
import { Toaster } from "sonner";

type JobStatus = "Applied" | "Interviewing" | "Offer" | "Rejected" | "Saved";
interface Job { id: string; company: string; position: string; status: JobStatus; appliedDate: string; notes: string; }

const STATUS_COLORS: Record<JobStatus, string> = {
  Applied: "bg-blue-100 text-blue-700",
  Interviewing: "bg-amber-100 text-amber-700",
  Offer: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
  Saved: "bg-gray-100 text-gray-600",
};
const STATUS_EMOJI: Record<JobStatus, string> = { Applied: "📤", Interviewing: "🎯", Offer: "🎉", Rejected: "❌", Saved: "🔖" };
const KANBAN_COLS: JobStatus[] = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];

function generateId() { return Math.random().toString(36).substring(2, 9); }

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ResumeCard({ resume, isActive, onLoad, onDelete, onDuplicate, onRename }: {
  resume: SavedResume; isActive: boolean;
  onLoad: () => void; onDelete: () => void; onDuplicate: () => void; onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(resume.name);

  const saveRename = () => { if (name.trim()) { onRename(name.trim()); setEditing(false); } };

  const handleDownload = () => {
    const html = generateResumeHTML(resume.data, resume.template);
    const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Open Sans',sans-serif}@media print{@page{size:letter;margin:0}html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body>${html}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open(); doc.write(fullHTML); doc.close();
    setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 3000); }, 900);
  };

  const completion = (() => {
    const d = resume.data;
    let s = 0;
    if (d.personalInfo.firstName && d.personalInfo.lastName) s += 15;
    if (d.personalInfo.email) s += 10;
    if (d.summary?.length > 50) s += 15;
    if (d.workExperience.length > 0) s += 25;
    if (d.education.length > 0) s += 10;
    if (d.skills.length >= 5) s += 10;
    return Math.min(s, 100);
  })();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`card p-5 ${isActive ? "ring-2 ring-primary/40" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-1">
          {isActive && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>}
          <button onClick={onDuplicate} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2 mb-1">
          <input className="form-input !py-1 !text-sm flex-1" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveRename()} autoFocus />
          <button onClick={saveRename} className="p-1.5 text-green-500"><Check className="w-4 h-4" /></button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-poppins font-bold text-gray-900 text-sm truncate">{resume.name}</h3>
          <button onClick={() => setEditing(true)}><Pencil className="w-3 h-3 text-gray-300 hover:text-gray-500" /></button>
        </div>
      )}

      <p className="text-xs text-gray-400 font-opensans mb-3 flex items-center gap-1">
        <Clock className="w-3 h-3" />{formatRelative(resume.savedAt)}
        {resume.atsScore && <span className="ml-1 text-primary font-semibold">· ATS: {resume.atsScore}%</span>}
      </p>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-400">Completion</span>
          <span className="text-[10px] font-bold text-primary">{completion}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onLoad} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors">
          <Edit2 className="w-3 h-3" /> {isActive ? "Continue" : "Load & Edit"}
        </button>
        <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors">
          <Download className="w-3 h-3" /> Download
        </button>
      </div>
    </motion.div>
  );
}

export default function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { resumeData, getCompletionPercentage, savedResumes, activeResumeId, loadSavedResume, deleteSavedResume, renameSavedResume, duplicateSavedResume, saveCurrentResume } = useResumeStore();
  const [jobs, setJobs] = useState<Job[]>([
    { id: "1", company: "Google", position: "Software Engineer", status: "Interviewing", appliedDate: "2026-04-28", notes: "" },
    { id: "2", company: "Meta", position: "Frontend Engineer", status: "Applied", appliedDate: "2026-05-01", notes: "" },
    { id: "3", company: "Stripe", position: "Full Stack Engineer", status: "Saved", appliedDate: "", notes: "" },
  ]);
  const [addingJob, setAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({ company: "", position: "", status: "Saved" as JobStatus });
  const [kanbanView, setKanbanView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const completion = getCompletionPercentage();
  const name = resumeData.personalInfo.firstName || "there";

  const addJob = () => {
    if (!newJob.company || !newJob.position) return;
    setJobs(j => [...j, { id: generateId(), ...newJob, appliedDate: new Date().toISOString().split("T")[0], notes: "" }]);
    setNewJob({ company: "", position: "", status: "Saved" });
    setAddingJob(false);
  };
  const removeJob = (id: string) => setJobs(j => j.filter(job => job.id !== id));
  const updateStatus = (id: string, status: JobStatus) => setJobs(j => j.map(job => job.id === id ? { ...job, status } : job));
  const moveJob = (id: string, status: JobStatus) => updateStatus(id, status);

  const stats = [
    { label: "Resumes Saved", value: savedResumes.length.toString(), icon: FileText, color: "text-primary" },
    { label: "Jobs Tracked", value: jobs.length.toString(), icon: Briefcase, color: "text-accent" },
    { label: "Interviews", value: jobs.filter(j => j.status === "Interviewing").length.toString(), icon: Target, color: "text-amber-500" },
    { label: "Resume Score", value: `${completion}%`, icon: TrendingUp, color: "text-success" },
  ];

  if (!loaded) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      <Navbar locale={locale} />
      <div className="pt-20 pb-8 px-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-poppins font-black text-3xl text-gray-900">Welcome back, {name}! 👋</h1>
              <p className="text-gray-500 font-opensans mt-1">Manage your resumes and track your job applications.</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/${locale}/interview-prep`} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                <BookOpen className="w-4 h-4" /> Interview Prep
              </Link>
              <Link href={`/${locale}/builder`} className="btn-primary">
                <Plus className="w-4 h-4" /> Create New Resume
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-5 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="font-poppins font-black text-3xl text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-opensans">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: `/${locale}/jd-match`, icon: "🎯", label: "JD Matcher", desc: "Score your resume vs job" },
            { href: `/${locale}/check`, icon: "⚡", label: "ATS Check", desc: "Optimize for ATS systems" },
            { href: `/${locale}/cover-letter`, icon: "✉️", label: "Cover Letter", desc: "AI-generated letters" },
            { href: `/${locale}/interview-prep`, icon: "🎓", label: "Interview Prep", desc: "Practice questions" },
          ].map(link => (
            <Link key={link.href} href={link.href} className="card p-4 hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="text-2xl mb-2">{link.icon}</div>
              <p className="font-poppins font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">{link.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>

        {/* My Resumes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-bold text-xl text-gray-900">My Resumes ({savedResumes.length})</h2>
            {resumeData.personalInfo.firstName && (
              <button
                onClick={() => { saveCurrentResume(); toast.success("Current resume saved!"); }}
                className="flex items-center gap-1.5 px-3 py-2 border border-primary/30 text-primary text-xs font-semibold rounded-xl hover:bg-primary/5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Save Current
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedResumes.map(resume => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                isActive={activeResumeId === resume.id}
                onLoad={() => { loadSavedResume(resume.id); toast.success(`Loaded: ${resume.name}`); }}
                onDelete={() => { deleteSavedResume(resume.id); toast.success("Resume deleted"); }}
                onDuplicate={() => { duplicateSavedResume(resume.id); toast.success("Resume duplicated"); }}
                onRename={name => renameSavedResume(resume.id, name)}
              />
            ))}
            <Link href={`/${locale}/builder`} className="card p-5 border-2 border-dashed border-gray-200 hover:border-primary/50 flex flex-col items-center justify-center gap-3 text-center transition-all duration-200 group min-h-[220px]">
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-poppins font-semibold text-gray-600 group-hover:text-primary transition-colors text-sm">New Resume</p>
                <p className="text-xs text-gray-400 mt-0.5">Start from scratch or import</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Job Tracker */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-bold text-xl text-gray-900">Job Tracker ({jobs.length})</h2>
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setKanbanView(false)} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!kanbanView ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}>List</button>
                <button onClick={() => setKanbanView(true)} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${kanbanView ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}>Kanban</button>
              </div>
              <button onClick={() => setAddingJob(true)} className="btn-primary !py-2 !px-4 !text-sm">
                <Plus className="w-4 h-4" /> Add Job
              </button>
            </div>
          </div>

          {addingJob && (
            <div className="card p-4 mb-4 bg-blue-50 border border-blue-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <input className="form-input flex-1" placeholder="Company" value={newJob.company} onChange={e => setNewJob(j => ({ ...j, company: e.target.value }))} />
                <input className="form-input flex-1" placeholder="Position" value={newJob.position} onChange={e => setNewJob(j => ({ ...j, position: e.target.value }))} />
                <select className="form-input w-36" value={newJob.status} onChange={e => setNewJob(j => ({ ...j, status: e.target.value as JobStatus }))}>
                  {KANBAN_COLS.map(s => <option key={s}>{s}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={addJob} className="btn-primary !py-2 !px-4 !text-sm">Add</button>
                  <button onClick={() => setAddingJob(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {!kanbanView ? (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Company", "Position", "Status", "Applied", ""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-poppins font-semibold text-sm text-gray-900">{job.company}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{job.position}</td>
                      <td className="px-4 py-3">
                        <select value={job.status} onChange={e => updateStatus(job.id, e.target.value as JobStatus)} className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[job.status]}`}>
                          {KANBAN_COLS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{job.appliedDate || "—"}</td>
                      <td className="px-4 py-3"><button onClick={() => removeJob(job.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {jobs.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No jobs tracked yet. Add one above!</div>}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {KANBAN_COLS.map(col => (
                <div key={col} className="bg-white rounded-2xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span>{STATUS_EMOJI[col]}</span>
                      <span className="text-xs font-bold text-gray-700">{col}</span>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">{jobs.filter(j => j.status === col).length}</span>
                  </div>
                  <div className="space-y-2">
                    {jobs.filter(j => j.status === col).map(job => (
                      <div key={job.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="font-poppins font-semibold text-xs text-gray-900 truncate">{job.company}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{job.position}</p>
                        <div className="flex gap-1 mt-2">
                          {KANBAN_COLS.filter(s => s !== col).slice(0, 2).map(s => (
                            <button key={s} onClick={() => moveJob(job.id, s)} className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 hover:border-primary hover:text-primary transition-all">→{s}</button>
                          ))}
                          <button onClick={() => removeJob(job.id)} className="ml-auto text-gray-200 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                    {jobs.filter(j => j.status === col).length === 0 && (
                      <div className="py-6 text-center text-gray-300 text-[10px]">Drop here</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
