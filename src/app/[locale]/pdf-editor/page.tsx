"use client";
import dynamic from "next/dynamic";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

const PDFEditorApp = dynamic(() => import("@/components/pdf-editor/PDFEditorApp"), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-[70vh]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 font-semibold">Loading PDF Editor…</p>
    </div>
  </div>
)});

export default function PDFEditorPage({ params }: { params: { locale: string } }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar locale={params?.locale || "en"} />
      <main className="flex-1 pt-16">
        <PDFEditorApp />
      </main>
      <Footer locale={params?.locale || "en"} />
    </div>
  );
}
