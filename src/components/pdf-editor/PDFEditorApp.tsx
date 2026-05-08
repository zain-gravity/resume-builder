"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Type, Pen, Square, Circle, Minus, Eraser, Image as ImageIcon, Undo, Redo, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Trash2, Hand, Highlighter, AlignLeft } from "lucide-react";
import { usePDFEditor } from "./usePDFEditor";
import { ToolType } from "./types";

const TOOLS: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <Hand className="w-4 h-4" /> },
  { id: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
  { id: "draw", label: "Draw", icon: <Pen className="w-4 h-4" /> },
  { id: "highlight", label: "Highlight", icon: <Highlighter className="w-4 h-4" /> },
  { id: "erase", label: "Erase", icon: <Eraser className="w-4 h-4" /> },
  { id: "rect", label: "Rectangle", icon: <Square className="w-4 h-4" /> },
  { id: "circle", label: "Circle", icon: <Circle className="w-4 h-4" /> },
  { id: "line", label: "Line", icon: <Minus className="w-4 h-4" /> },
  { id: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
];

const FONTS = ["Arial","Helvetica","Times New Roman","Georgia","Courier New","Verdana","Trebuchet MS","Impact","Comic Sans MS","Inter","Roboto","Open Sans"];
const FONT_SIZES = [8,10,12,14,16,18,20,24,28,32,36,48,64,72];

export default function PDFEditorApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<HTMLCanvasElement>(null);

  const {
    pdfDoc, numPages, currentPage, zoom,
    activeTool, setActiveTool,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    fontColor, setFontColor,
    fillColor, setFillColor,
    drawWidth, setDrawWidth,
    loadPDF, nextPage, prevPage, setZoom,
    undo, redo, canUndo, canRedo,
    deleteSelected, exportPDF, addImage,
    fabricCanvas,
  } = usePDFEditor(canvasRef, fabricRef);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadPDF(file);
  }, [loadPDF]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") await loadPDF(file);
  }, [loadPDF]);

  const handleImageInsert = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await addImage(file);
  }, [addImage]);

  if (!pdfDoc) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col">
        {/* Hero */}
        <div className="py-16 px-6 text-center" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" }}>
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
            ✏️ Free PDF Editor — No Signup Required
          </span>
          <h1 className="text-5xl font-black text-white mb-4">Edit Any PDF. Free Forever.</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-2">Add text, draw, highlight, erase, insert images. Better than Sejda — 100% free, 100% private.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-white/60">
            {["✅ No Upload to Server","✅ All Fonts Included","✅ Undo / Redo","✅ Multi-Page","✅ Download PDF"].map(f => <span key={f}>{f}</span>)}
          </div>
        </div>
        {/* Drop Zone */}
        <div className="flex-1 flex items-center justify-center p-10">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-purple-500/40 rounded-3xl p-16 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-500/5 transition-all max-w-lg w-full"
          >
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-white text-xl font-bold mb-2">Drop your PDF here</p>
            <p className="text-gray-400 text-sm">or <span className="text-purple-400 font-semibold">click to browse</span></p>
            <p className="text-gray-600 text-xs mt-3">PDF files up to 50MB</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-950 text-white">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0 flex-wrap">
        {/* File */}
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition-colors">
          <Upload className="w-3.5 h-3.5" /> Open
        </button>
        <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-colors">
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        {/* Undo/Redo */}
        <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors"><Undo className="w-4 h-4" /></button>
        <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors"><Redo className="w-4 h-4" /></button>
        <button onClick={deleteSelected} className="p-1.5 rounded-lg hover:bg-red-900/50 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><ZoomIn className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        {/* Font Controls */}
        {(activeTool === "text") && <>
          <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs">
            {FONTS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs w-16">
            {FONT_SIZES.map(s => <option key={s}>{s}</option>)}
          </select>
        </>}
        {/* Color */}
        <label className="flex items-center gap-1 text-xs text-gray-400">
          {activeTool === "highlight" ? "Highlight:" : activeTool === "erase" ? "Erase:" : "Color:"}
          <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
        </label>
        {(activeTool === "rect" || activeTool === "circle") && (
          <label className="flex items-center gap-1 text-xs text-gray-400">Fill:
            <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
          </label>
        )}
        {(activeTool === "draw" || activeTool === "line") && (
          <label className="flex items-center gap-1 text-xs text-gray-400">Width:
            <input type="range" min={1} max={20} value={drawWidth} onChange={e => setDrawWidth(Number(e.target.value))} className="w-20" />
            <span className="w-4">{drawWidth}</span>
          </label>
        )}
        {/* Image Insert */}
        <button onClick={() => { setActiveTool("image"); imgInputRef.current?.click(); }} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs transition-colors">
          <ImageIcon className="w-3.5 h-3.5" /> Image
        </button>
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Tool Panel */}
        <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-1 flex-shrink-0">
          {TOOLS.filter(t => t.id !== "image").map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTool === tool.id ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-950 relative" style={{ cursor: activeTool === "text" ? "text" : activeTool === "draw" || activeTool === "highlight" ? "crosshair" : activeTool === "erase" ? "cell" : "default" }}>
          <div className="flex items-start justify-center p-8 min-h-full">
            <div className="relative shadow-2xl shadow-black/50" style={{ width: `${Math.round(595 * zoom)}px` }}>
              <canvas ref={canvasRef} className="absolute top-0 left-0 rounded-sm" />
              <canvas ref={fabricRef} className="rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Page Bar */}
      <div className="flex items-center justify-center gap-4 py-2 bg-gray-900 border-t border-gray-800 flex-shrink-0">
        <button onClick={prevPage} disabled={currentPage <= 1} className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm text-gray-400">Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{numPages}</strong></span>
        <button onClick={nextPage} disabled={currentPage >= numPages} className="p-1 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
