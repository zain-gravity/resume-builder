"use client";
import { useState, useRef, useEffect } from "react";
import { useResumeStore } from "@/lib/store";
import { SKILLS_DATABASE, CATEGORY_SKILLS, CATEGORY_SUMMARIES, TEMPLATE_PROFESSION_MAP, type ProfessionKey } from "@/lib/utils";
import AIButton from "./AIButton";
import { Plus, Trash2, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

export default function PersonalInfoForm() {
  const { resumeData, updatePersonalInfo } = useResumeStore();
  const { personalInfo } = resumeData;

  const fields = [
    { key: "firstName", label: "First Name", placeholder: "Alex", required: true },
    { key: "lastName", label: "Last Name", placeholder: "Johnson", required: true },
    { key: "jobTitle", label: "Job Title", placeholder: "Senior Software Engineer" },
    { key: "email", label: "Email", placeholder: "alex@email.com", required: true, type: "email" },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000", type: "tel" },
    { key: "location", label: "Location", placeholder: "San Francisco, CA" },
    { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/alexjohnson" },
    { key: "portfolio", label: "Portfolio / Website", placeholder: "yourwebsite.com" },
  ] as const;

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key} className={field.key === "jobTitle" || field.key === "email" || field.key === "linkedin" || field.key === "portfolio" ? "col-span-2" : ""}>
            <label className="form-label">
              {field.label}{(field as { required?: boolean }).required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              className="form-input"
              type={(field as { type?: string }).type || "text"}
              placeholder={field.placeholder}
              value={personalInfo[field.key]}
              onChange={(e) => updatePersonalInfo({ [field.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryForm() {
  const { resumeData, updateSummary, selectedTemplate } = useResumeStore();

  const professionKey = TEMPLATE_PROFESSION_MAP[selectedTemplate] as ProfessionKey | undefined;
  const profLabels: Record<ProfessionKey, { label: string; color: string }> = {
    sales:     { label: "Sales",     color: "#e74c3c" },
    marketing: { label: "Marketing", color: "#f39c12" },
    it:        { label: "Tech",      color: "#9b59b6" },
    finance:   { label: "Finance",   color: "#27ae60" },
    hr:        { label: "HR",        color: "#3498db" },
  };
  const profLabel = professionKey ? profLabels[professionKey] : null;

  const handleAutoFill = () => {
    if (!professionKey) return;
    updateSummary(CATEGORY_SUMMARIES[professionKey]);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="form-label !mb-0">Professional Summary</label>
        <div className="flex items-center gap-2">
          {professionKey && profLabel && (
            <button
              onClick={handleAutoFill}
              className="text-[10px] font-bold px-2 py-1 rounded-lg border transition-all duration-150 hover:opacity-90 active:scale-95 flex items-center gap-1"
              style={{
                color: profLabel.color,
                borderColor: `${profLabel.color}40`,
                background: `${profLabel.color}10`,
              }}
              title={`Auto-fill a professional summary for ${profLabel.label}`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Auto-fill {profLabel.label}
            </button>
          )}
          <AIButton type="summary" size="md" />
        </div>
      </div>
      <textarea
        className="form-input !h-28 resize-none"
        placeholder="Results-driven professional with X years of experience in..."
        value={resumeData.summary}
        onChange={(e) => updateSummary(e.target.value)}
      />
      <p className="text-xs text-gray-400 mt-1 font-opensans">{resumeData.summary.length}/500 characters · Aim for 120-150 words</p>
    </div>
  );
}


export function WorkExperienceForm() {
  const { resumeData, addWorkExperience, updateWorkExperience, removeWorkExperience, addBullet, updateBullet, removeBullet } = useResumeStore();
  const { workExperience } = resumeData;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="p-4 space-y-3">
      {workExperience.map((exp) => (
        <div key={exp.id} className="border border-gray-100 rounded-xl overflow-hidden">
          {/* ── Collapsible header ── */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
            onClick={() => toggleCollapse(exp.id)}
          >
            <div>
              <p className="font-poppins font-semibold text-sm text-gray-800">{exp.title || "Job Title"}</p>
              <p className="text-xs text-gray-500">{exp.company || "Company"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); removeWorkExperience(exp.id); }}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {collapsed[exp.id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

          {!collapsed[exp.id] && (
            <div className="p-4 space-y-3">
              {/* ── Basic fields ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" placeholder="Senior Engineer" value={exp.title} onChange={(e) => updateWorkExperience(exp.id, { title: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Company *</label>
                  <input className="form-input" placeholder="Acme Corp" value={exp.company} onChange={(e) => updateWorkExperience(exp.id, { company: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="New York, NY" value={exp.location} onChange={(e) => updateWorkExperience(exp.id, { location: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="month" value={exp.startDate} onChange={(e) => updateWorkExperience(exp.id, { startDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => updateWorkExperience(exp.id, { endDate: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id={`current-${exp.id}`}
                    checked={exp.current}
                    onChange={(e) => updateWorkExperience(exp.id, { current: e.target.checked, endDate: "" })}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor={`current-${exp.id}`} className="text-sm text-gray-600 font-opensans cursor-pointer">Current Job</label>
                </div>
              </div>

              {/* ── Experience Details: Bullet Points ↔ Description toggle ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">Experience Details</label>
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => updateWorkExperience(exp.id, { description: "" })}
                      className={`px-3 py-1 rounded-md transition-all duration-150 ${
                        !exp.description ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      • Bullet Points
                    </button>
                    <button
                      onClick={() => {
                        // Pre-fill description from bullets when switching for the first time
                        if (!exp.description && exp.bullets.some((b) => b.trim())) {
                          updateWorkExperience(exp.id, { description: exp.bullets.filter(Boolean).join("\n") });
                        } else {
                          updateWorkExperience(exp.id, { description: exp.description || " " });
                        }
                      }}
                      className={`px-3 py-1 rounded-md transition-all duration-150 ${
                        exp.description ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      ¶ Description
                    </button>
                  </div>
                </div>

                {exp.description ? (
                  /* ── Free-text description mode ── */
                  <div>
                    <textarea
                      className="form-input !h-32 resize-none"
                      placeholder={
                        "Describe your role, responsibilities and key achievements...\n\nPress Enter to start a new paragraph."
                      }
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(exp.id, { description: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 mt-1 font-opensans">
                      {exp.description.trim().length}/600 characters · Press Enter for a new paragraph
                    </p>
                  </div>
                ) : (
                  /* ── Bullet points mode ── */
                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-primary mt-2.5">•</span>
                        <input
                          className="form-input flex-1 !text-sm"
                          placeholder="Led team of 5 engineers to deliver feature ahead of schedule..."
                          value={bullet}
                          onChange={(e) => updateBullet(exp.id, bIdx, e.target.value)}
                        />
                        <AIButton type="bullet" bullet={bullet} bulletIndex={bIdx} jobId={exp.id} />
                        {exp.bullets.length > 1 && (
                          <button
                            onClick={() => removeBullet(exp.id, bIdx)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {exp.bullets.length < 5 && (
                      <button
                        onClick={() => addBullet(exp.id)}
                        className="mt-2 text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add bullet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addWorkExperience}
        disabled={workExperience.length >= 5}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-all duration-200 flex items-center justify-center gap-2 font-semibold disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> Add Work Experience ({workExperience.length}/5)
      </button>
    </div>
  );
}



export function EducationForm() {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResumeStore();
  return (
    <div className="p-4 space-y-3">
      {resumeData.education.map((edu) => (
        <div key={edu.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <p className="font-poppins font-semibold text-sm text-gray-800">{edu.school || "School Name"}</p>
            <button onClick={() => removeEducation(edu.id)} className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="form-label">School / University</label><input className="form-input" placeholder="University of California" value={edu.school} onChange={(e) => updateEducation(edu.id, { school: e.target.value })} /></div>
            <div><label className="form-label">Degree</label><input className="form-input" placeholder="Bachelor of Science" value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} /></div>
            <div><label className="form-label">Field of Study</label><input className="form-input" placeholder="Computer Science" value={edu.field} onChange={(e) => updateEducation(edu.id, { field: e.target.value })} /></div>
            <div><label className="form-label">Start Date</label><input className="form-input" type="month" value={edu.startDate} onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })} /></div>
            <div><label className="form-label">End Date</label><input className="form-input" type="month" value={edu.endDate} onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })} /></div>
            <div><label className="form-label">Location</label><input className="form-input" placeholder="Berkeley, CA" value={edu.location} onChange={(e) => updateEducation(edu.id, { location: e.target.value })} /></div>
            <div><label className="form-label">GPA (optional)</label><input className="form-input" placeholder="3.8" value={edu.gpa} onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })} /></div>
          </div>
        </div>
      ))}
      <button
        onClick={addEducation}
        disabled={resumeData.education.length >= 3}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> Add Education ({resumeData.education.length}/3)
      </button>
    </div>
  );
}

export function SkillsForm() {
  const { resumeData, addSkill, removeSkill, selectedTemplate } = useResumeStore();
  const [input, setInput] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine category-specific skills from selected template
  const professionKey = TEMPLATE_PROFESSION_MAP[selectedTemplate] as ProfessionKey | undefined;
  const categorySkills: string[] = professionKey ? CATEGORY_SKILLS[professionKey] : [];

  // Filter category skills (remove already-added ones, then filter by search)
  const filteredCategorySkills = categorySkills.filter(
    (s) => !resumeData.skills.includes(s) &&
      (input.length === 0 || s.toLowerCase().includes(input.toLowerCase()))
  );

  // General SKILLS_DATABASE suggestions (only when user is typing)
  const generalSuggestions = input.length >= 2
    ? SKILLS_DATABASE.filter(
        (s: string) =>
          !categorySkills.includes(s) &&
          !resumeData.skills.includes(s) &&
          s.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 5)
    : [];

  const showDropdown = dropdownVisible && (filteredCategorySkills.length > 0 || generalSuggestions.length > 0);

  const handleAdd = (skill: string) => {
    addSkill(skill.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      handleAdd(input.trim());
    }
    if (e.key === "Escape") setDropdownVisible(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const professionLabels: Record<ProfessionKey, { label: string; color: string; bg: string }> = {
    sales:     { label: "Sales",     color: "#e74c3c", bg: "#fdf2f2" },
    marketing: { label: "Marketing", color: "#f39c12", bg: "#fef9f0" },
    it:        { label: "Tech",      color: "#9b59b6", bg: "#f8f4fc" },
    finance:   { label: "Finance",   color: "#27ae60", bg: "#f2faf5" },
    hr:        { label: "HR",        color: "#3498db", bg: "#f0f7fd" },
  };
  const profLabel = professionKey ? professionLabels[professionKey] : null;

  return (
    <div className="p-4">
      <div className="relative mb-3" ref={containerRef}>
        <input
          className="form-input pr-10"
          placeholder={professionKey ? `Search ${profLabel?.label} skills or type your own...` : "Type a skill and press Enter..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
          onKeyDown={handleKeyDown}
        />

        {/* Smart Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-elevated z-20 overflow-hidden max-h-72 overflow-y-auto">
            {/* Category-specific skills */}
            {filteredCategorySkills.length > 0 && (
              <>
                {profLabel && (
                  <div
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50"
                    style={{ color: profLabel.color, background: profLabel.bg }}
                  >
                    ✦ Recommended for {profLabel.label}
                  </div>
                )}
                <div className="p-2 flex flex-wrap gap-1.5">
                  {filteredCategorySkills.map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => { e.preventDefault(); handleAdd(s); }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-150 hover:scale-105"
                      style={{
                        color: profLabel?.color ?? "#2E86AB",
                        borderColor: `${profLabel?.color ?? "#2E86AB"}40`,
                        background: profLabel?.bg ?? "#f0f7ff",
                      }}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* General suggestions from typing */}
            {generalSuggestions.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border-t border-b border-gray-100">
                  Other Matches
                </div>
                {generalSuggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); handleAdd(s); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 font-opensans transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Added Skill Tags */}
      <div className="flex flex-wrap gap-2">
        {resumeData.skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150 cursor-default group hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            style={{
              color: profLabel?.color ?? "#2E86AB",
              borderColor: `${profLabel?.color ?? "#2E86AB"}40`,
              background: profLabel?.bg ?? "#f0f7ff",
            }}
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="opacity-60 group-hover:opacity-100 group-hover:text-red-500 transition-all leading-none"
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
        {resumeData.skills.length === 0 && (
          <p className="text-sm text-gray-400 font-opensans">
            {professionKey ? `Click the input to see ${profLabel?.label} skill recommendations` : "Start typing to add skills..."}
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">{resumeData.skills.length}/15 skills · Aim for 8-12</p>
    </div>
  );
}

export function CertificationsForm() {
  const { resumeData, addCertification, updateCertification, removeCertification } = useResumeStore();
  return (
    <div className="p-4 space-y-3">
      {resumeData.certifications.map((cert) => (
        <div key={cert.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <p className="font-poppins font-semibold text-sm text-gray-800">{cert.name || "Certification Name"}</p>
            <button onClick={() => removeCertification(cert.id)} className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="form-label">Certification Name</label><input className="form-input" placeholder="AWS Solutions Architect" value={cert.name} onChange={(e) => updateCertification(cert.id, { name: e.target.value })} /></div>
            <div><label className="form-label">Issuing Organization</label><input className="form-input" placeholder="Amazon Web Services" value={cert.issuer} onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })} /></div>
            <div><label className="form-label">Date Issued</label><input className="form-input" type="month" value={cert.date} onChange={(e) => updateCertification(cert.id, { date: e.target.value })} /></div>
          </div>
        </div>
      ))}
      <button onClick={addCertification} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 font-semibold">
        <Plus className="w-4 h-4" /> Add Certification
      </button>
    </div>
  );
}
