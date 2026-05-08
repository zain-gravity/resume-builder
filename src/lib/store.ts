"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParsedResume } from "./parsed-resume.types";

export interface SavedResume {
  id: string;
  name: string;
  data: ResumeData;
  template: string;
  savedAt: string; // ISO string
  atsScore?: number;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  jobTitle: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  description: string; // free-text paragraph alternative / complement to bullets
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
}

export interface ResumeStore {
  // Data
  resumeData: ResumeData;
  selectedTemplate: string;
  atsScore: number | null;
  isModified: boolean;

  // Saved Resumes (versioning)
  savedResumes: SavedResume[];
  activeResumeId: string | null;

  // Actions - Personal Info
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateSummary: (summary: string) => void;

  // Actions - Work Experience
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, data: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;
  addBullet: (jobId: string) => void;
  updateBullet: (jobId: string, index: number, value: string) => void;
  removeBullet: (jobId: string, index: number) => void;

  // Actions - Education
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  // Actions - Skills
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setSkills: (skills: string[]) => void;

  // Actions - Certifications
  addCertification: () => void;
  updateCertification: (id: string, data: Partial<Certification>) => void;
  removeCertification: (id: string) => void;

  // Actions - Resume Versioning
  saveCurrentResume: (name?: string) => string; // returns saved resume id
  loadSavedResume: (id: string) => void;
  deleteSavedResume: (id: string) => void;
  renameSavedResume: (id: string, name: string) => void;
  duplicateSavedResume: (id: string) => void;

  // Actions - UI
  setTemplate: (template: string) => void;
  setATSScore: (score: number) => void;
  loadDemoData: () => void;
  loadParsedResume: (parsed: ParsedResume) => void;
  clearResume: () => void;

  // Computed
  getCompletionPercentage: () => number;
}

const defaultPersonalInfo: PersonalInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  portfolio: "",
  jobTitle: "",
};

const defaultResumeData: ResumeData = {
  personalInfo: defaultPersonalInfo,
  summary: "",
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
};

const demoData: ResumeData = {
  personalInfo: {
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@email.com",
    phone: "+1 (555) 987-6543",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexjohnson",
    portfolio: "alexjohnson.dev",
    jobTitle: "Senior Software Engineer",
  },
  summary:
    "Results-driven Senior Software Engineer with 8+ years of experience building scalable web applications. Led cross-functional teams of 15+ engineers delivering products used by 2M+ users. Expert in React, Node.js, and cloud architecture with a track record of reducing infrastructure costs by 40%.",
  workExperience: [
    {
      id: "1",
      company: "TechCorp Inc.",
      title: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2021-01",
      endDate: "",
      current: true,
      bullets: [
        "Led migration of monolithic architecture to microservices, reducing deployment time by 65%",
        "Managed team of 8 engineers delivering $2.3M revenue-generating features ahead of schedule",
        "Architected real-time data pipeline processing 50K events/second with 99.9% uptime",
      ],
    },
    {
      id: "2",
      company: "StartupXYZ",
      title: "Software Engineer",
      location: "New York, NY",
      startDate: "2018-03",
      endDate: "2020-12",
      current: false,
      bullets: [
        "Built React dashboard used by 500K+ monthly active users, achieving 98% satisfaction score",
        "Reduced API response time by 80% through Redis caching and query optimization",
        "Developed CI/CD pipeline cutting release cycle from 2 weeks to 2 days",
      ],
    },
  ],
  education: [
    {
      id: "1",
      school: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2014-08",
      endDate: "2018-05",
      gpa: "3.8",
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "AWS",
    "Docker",
    "Kubernetes",
    "PostgreSQL",
    "Redis",
    "GraphQL",
    "System Design",
    "Team Leadership",
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Solutions Architect Professional",
      issuer: "Amazon Web Services",
      date: "2023-06",
      url: "aws.amazon.com/certification",
    },
  ],
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumeData: defaultResumeData,
      selectedTemplate: "modern-minimal",
      atsScore: null,
      isModified: false,

      // Versioning
      savedResumes: [],
      activeResumeId: null,

      saveCurrentResume: (name?: string) => {
        const { resumeData, selectedTemplate, atsScore, activeResumeId } = get();
        const firstName = resumeData.personalInfo.firstName || "Untitled";
        const lastName = resumeData.personalInfo.lastName || "";
        const jobTitle = resumeData.personalInfo.jobTitle || "";
        const autoName = name || `${firstName} ${lastName}${jobTitle ? ` — ${jobTitle}` : ""}`;
        const now = new Date().toISOString();

        // If we have an activeResumeId, update that saved resume
        if (activeResumeId) {
          set(state => ({
            savedResumes: state.savedResumes.map(r =>
              r.id === activeResumeId
                ? { ...r, data: resumeData, template: selectedTemplate, savedAt: now, atsScore: atsScore ?? undefined }
                : r
            ),
            isModified: false,
          }));
          return activeResumeId;
        }

        // Otherwise create new
        const id = generateId();
        const newResume: SavedResume = {
          id,
          name: autoName.trim() || "My Resume",
          data: resumeData,
          template: selectedTemplate,
          savedAt: now,
          atsScore: atsScore ?? undefined,
        };
        set(state => ({
          savedResumes: [newResume, ...state.savedResumes],
          activeResumeId: id,
          isModified: false,
        }));
        return id;
      },

      loadSavedResume: (id: string) => {
        const { savedResumes } = get();
        const resume = savedResumes.find(r => r.id === id);
        if (!resume) return;
        set({
          resumeData: resume.data,
          selectedTemplate: resume.template,
          atsScore: resume.atsScore ?? null,
          activeResumeId: id,
          isModified: false,
        });
      },

      deleteSavedResume: (id: string) => {
        set(state => ({
          savedResumes: state.savedResumes.filter(r => r.id !== id),
          activeResumeId: state.activeResumeId === id ? null : state.activeResumeId,
        }));
      },

      renameSavedResume: (id: string, name: string) => {
        set(state => ({
          savedResumes: state.savedResumes.map(r => r.id === id ? { ...r, name } : r),
        }));
      },

      duplicateSavedResume: (id: string) => {
        const { savedResumes } = get();
        const original = savedResumes.find(r => r.id === id);
        if (!original) return;
        const newId = generateId();
        const copy: SavedResume = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          savedAt: new Date().toISOString(),
        };
        set(state => ({ savedResumes: [copy, ...state.savedResumes] }));
      },

      updatePersonalInfo: (info) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            personalInfo: { ...state.resumeData.personalInfo, ...info },
          },
          isModified: true,
        })),

      updateSummary: (summary) =>
        set((state) => ({
          resumeData: { ...state.resumeData, summary },
          isModified: true,
        })),

      addWorkExperience: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            workExperience: [
              ...state.resumeData.workExperience,
              {
                id: generateId(),
                company: "",
                title: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
                bullets: [""],
                description: "",
              },
            ],
          },
          isModified: true,
        })),

      updateWorkExperience: (id, data) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            workExperience: state.resumeData.workExperience.map((exp) =>
              exp.id === id ? { ...exp, ...data } : exp
            ),
          },
          isModified: true,
        })),

      removeWorkExperience: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            workExperience: state.resumeData.workExperience.filter(
              (exp) => exp.id !== id
            ),
          },
          isModified: true,
        })),

      addBullet: (jobId) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            workExperience: state.resumeData.workExperience.map((exp) =>
              exp.id === jobId
                ? { ...exp, bullets: [...exp.bullets, ""] }
                : exp
            ),
          },
          isModified: true,
        })),

      updateBullet: (jobId, index, value) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            workExperience: state.resumeData.workExperience.map((exp) => {
              if (exp.id !== jobId) return exp;
              const newBullets = [...exp.bullets];
              newBullets[index] = value;
              return { ...exp, bullets: newBullets };
            }),
          },
          isModified: true,
        })),

      removeBullet: (jobId, index) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            workExperience: state.resumeData.workExperience.map((exp) => {
              if (exp.id !== jobId) return exp;
              const newBullets = exp.bullets.filter((_, i) => i !== index);
              return { ...exp, bullets: newBullets };
            }),
          },
          isModified: true,
        })),

      addEducation: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: [
              ...state.resumeData.education,
              {
                id: generateId(),
                school: "",
                degree: "",
                field: "",
                location: "",
                startDate: "",
                endDate: "",
                gpa: "",
              },
            ],
          },
          isModified: true,
        })),

      updateEducation: (id, data) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((edu) =>
              edu.id === id ? { ...edu, ...data } : edu
            ),
          },
          isModified: true,
        })),

      removeEducation: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.filter(
              (edu) => edu.id !== id
            ),
          },
          isModified: true,
        })),

      addSkill: (skill) =>
        set((state) => {
          if (state.resumeData.skills.includes(skill)) return state;
          return {
            resumeData: {
              ...state.resumeData,
              skills: [...state.resumeData.skills, skill],
            },
            isModified: true,
          };
        }),

      removeSkill: (skill) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.filter((s) => s !== skill),
          },
          isModified: true,
        })),

      setSkills: (skills) =>
        set((state) => ({
          resumeData: { ...state.resumeData, skills },
          isModified: true,
        })),

      addCertification: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: [
              ...state.resumeData.certifications,
              {
                id: generateId(),
                name: "",
                issuer: "",
                date: "",
                url: "",
              },
            ],
          },
          isModified: true,
        })),

      updateCertification: (id, data) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: state.resumeData.certifications.map((cert) =>
              cert.id === id ? { ...cert, ...data } : cert
            ),
          },
          isModified: true,
        })),

      removeCertification: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: state.resumeData.certifications.filter(
              (cert) => cert.id !== id
            ),
          },
          isModified: true,
        })),

      setTemplate: (template) => set({ selectedTemplate: template }),
      setATSScore: (score) => set({ atsScore: score }),

      loadDemoData: () =>
        set({ resumeData: demoData, isModified: true }),

      clearResume: () =>
        set({ resumeData: defaultResumeData, isModified: false }),

      loadParsedResume: (parsed: ParsedResume) => {
        const workExperience = parsed.experience.map((exp, i) => ({
          id: `parsed-${i}`,
          company: exp.company || "",
          title: exp.title || "",
          location: exp.location || "",
          startDate: exp.startDate || "",
          endDate: exp.endDate || "",
          current: exp.current || false,
          bullets: exp.bullets.length > 0 ? exp.bullets : [""],
          description: "",
        }));

        const education = parsed.education.map((edu, i) => ({
          id: `edu-${i}`,
          school: edu.school || "",
          degree: edu.degree || "",
          field: edu.field || "",
          location: edu.location || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          gpa: edu.gpa || "",
        }));

        const certifications = parsed.certifications.map((c, i) => ({
          id: `cert-${i}`,
          name: c.name || "",
          issuer: c.issuer || "",
          date: c.date || "",
          url: c.url || "",
        }));

        const nameParts = (parsed.personal.name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        set({
          resumeData: {
            personalInfo: {
              firstName,
              lastName,
              email: parsed.personal.email || "",
              phone: parsed.personal.phone || "",
              location: parsed.personal.location || "",
              linkedin: parsed.personal.linkedin || "",
              portfolio: parsed.personal.portfolio || "",
              jobTitle: parsed.personal.jobTitle || "",
            },
            summary: parsed.summary || "",
            workExperience,
            education,
            skills: parsed.skills || [],
            certifications,
          },
          isModified: true,
        });
      },

      getCompletionPercentage: () => {
        const { resumeData } = get();
        let score = 0;
        const { personalInfo, summary, workExperience, education, skills } =
          resumeData;

        if (personalInfo.firstName && personalInfo.lastName) score += 15;
        if (personalInfo.email) score += 10;
        if (personalInfo.phone) score += 5;
        if (personalInfo.location) score += 5;
        if (personalInfo.linkedin) score += 5;
        if (summary && summary.length > 50) score += 15;
        if (workExperience.length > 0) score += 20;
        if (workExperience.length > 1) score += 5;
        if (education.length > 0) score += 10;
        if (skills.length >= 5) score += 10;

        return Math.min(score, 100);
      },
    }),
    {
      name: "resume-builder-store",
      partialize: (state) => ({
        resumeData: state.resumeData,
        selectedTemplate: state.selectedTemplate,
        savedResumes: state.savedResumes,
        activeResumeId: state.activeResumeId,
      }),
    }
  )
);
