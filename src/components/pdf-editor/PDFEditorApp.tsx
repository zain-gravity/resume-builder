"use client";
import { useState, useRef, useCallback } from "react";
import {
  Upload, Download, Type, Pen, Square, Circle, Minus, Eraser, Undo, Redo,
  ZoomIn, ZoomOut, Trash2, Hand, Highlighter, Image as ImageIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  RotateCw, ChevronLeft, ChevronRight, Maximize, PenTool, Stamp,
  FileText, Scissors, Copy, Clipboard, Eye, Layers,
} from "lucide-react";
import { usePDFEditor } from "./usePDFEditor";
import { ToolType } from "./types";

const TOOL_GROUPS = [
  { label: "Pointer", tools: [
    { id: "select" as ToolType, label: "Select & Move", icon: <Hand className="w-4 h-4" />, shortcut: "V" },
  ]},
  { label: "Text", tools: [
    { id: "text" as ToolType, label: "Add Text", icon: <Type className="w-4 h-4" />, shortcut: "T" },
  ]},
  { label: "Draw", tools: [
    { id: "draw" as ToolType, label: "Pen", icon: <Pen className="w-4 h-4" />, shortcut: "P" },
    { id: "highlight" as ToolType, label: "Highlight", icon: <Highlighter className="w-4 h-4" />, shortcut: "H" },
    { id: "signature" as ToolType, label: "Signature", icon: <PenTool className="w-4 h-4" />, shortcut: "S" },
  ]},
  { label: "Shape", tools: [
    { id: "rect" as ToolType, label: "Rectangle", icon: <Square className="w-4 h-4" />, shortcut: "R" },
    { id: "circle" as ToolType, label: "Ellipse", icon: <Circle className="w-4 h-4" />, shortcut: "C" },
    { id: "line" as ToolType, label: "Line", icon: <Minus className="w-4 h-4" />, shortcut: "L" },
  ]},
  { label: "Edit", tools: [
    { id: "erase" as ToolType, label: "Whiteout", icon: <Eraser className="w-4 h-4" />, shortcut: "E" },
    { id: "stamp" as ToolType, label: "Stamp", icon: <Stamp className="w-4 h-4" />, shortcut: "M" },
    { id: "image" as ToolType, label: "Image", icon: <ImageIcon className="w-4 h-4" />, shortcut: "I" },
  ]},
];

const FONTS = [
  "Arial","Helvetica","Times New Roman","Georgia","Courier New","Verdana",
  "Trebuchet MS","Impact","Tahoma","Palatino","Garamond","Book Antiqua",
  "Comic Sans MS","Inter","Roboto","Open Sans","Lato","Montserrat",
];
const SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,28,32,36,40,48,56,64,72,96];
const STAMPS = ["APPROVED","DRAFT","CONFIDENTIAL","FINAL","COPY","VOID","URGENT","REVIEWED"];

export default function PDFEditorApp() {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<HTMLCanvasElement>(null);
  const [showThumbs, setShowThumbs] = useState(true);

  const editor = usePDFEditor(canvasRef, fabricRef);
  const {
    pdfDoc, numPages, currentPage, zoom,
    activeTool, setActiveTool,
    fontFamily, setFontFamily, fontSize, setFontSize,
    fontColor, setFontColor, fillColor, setFillColor,
    strokeColor, setStrokeColor,
    drawWidth, setDrawWidth, opacity, setOpacity,
    isBold, toggleBold, isItalic, toggleItalic, isUnderline, toggleUnderline,
    textAlign, setTextAlign,
    loadPDF, nextPage, prevPage, goToPage, setZoom, fitToWidth,
    undo, redo, canUndo, canRedo,
    deleteSelected, copySelected, pasteClipboard,
    exportPDF, addImage, addStamp, rotatePage,
    pageThumbnails,
  } = editor;

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) await loadPDF(f);
  }, [loadPDF]);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") await loadPDF(f);
  }, [loadPDF]);
  const handleImg = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) await addImage(f);
  }, [addImage]);

  // ── LANDING (no PDF loaded) ─────────────────────────────────────────────────
  if (!pdfDoc) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col">
        <div className="py-20 px-6 text-center" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-white text-sm font-semibold mb-6 backdrop-blur-sm">
            <FileText className="w-4 h-4" /> Free PDF Editor — No Signup, No Watermarks
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
            Edit PDFs like a <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Pro</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Edit text directly in any PDF. Add signatures, stamps, images, shapes.
            Everything runs in your browser — your files never leave your device.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/50 mb-12">
            {["Edit existing text","Add text & images","Draw & highlight","Add signatures","Stamps & watermarks","Multi-page support","Undo & redo","Download edited PDF"].map(f =>
              <span key={f} className="flex items-center gap-1.5">✓ {f}</span>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-950">
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-purple-500/30 rounded-3xl p-20 text-center cursor-pointer hover:border-purple-400/60 hover:bg-purple-500/5 transition-all max-w-xl w-full group"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-12 h-12 text-purple-400" />
            </div>
            <p className="text-white text-2xl font-bold mb-2">Drop your PDF here</p>
            <p className="text-gray-400">or <span className="text-purple-400 font-semibold underline">click to browse</span></p>
            <p className="text-gray-600 text-xs mt-4">Supports any PDF up to 50 MB · 100% Private</p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
        </div>
      </div>
    );
  }

  // ── EDITOR ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#1a1a2e] text-white overflow-hidden">
      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#16162a] border-b border-white/5 flex-shrink-0 flex-wrap">
        {/* File ops */}
        <button onClick={() => fileRef.current?.click()} className="toolbar-btn"><Upload className="w-3.5 h-3.5" /> Open</button>
        <button onClick={exportPDF} className="toolbar-btn !bg-purple-600 hover:!bg-purple-500"><Download className="w-3.5 h-3.5" /> Save PDF</button>
        <Sep />
        <button onClick={undo} disabled={!canUndo} className="toolbar-icon" title="Undo"><Undo className="w-4 h-4" /></button>
        <button onClick={redo} disabled={!canRedo} className="toolbar-icon" title="Redo"><Redo className="w-4 h-4" /></button>
        <Sep />
        <button onClick={copySelected} className="toolbar-icon" title="Copy"><Copy className="w-4 h-4" /></button>
        <button onClick={pasteClipboard} className="toolbar-icon" title="Paste"><Clipboard className="w-4 h-4" /></button>
        <button onClick={deleteSelected} className="toolbar-icon !text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
        <Sep />
        {/* Text formatting (visible when text tool or text selected) */}
        {(activeTool === "text" || activeTool === "select") && <>
          <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="toolbar-select w-36" style={{fontFamily}}>
            {FONTS.map(f => <option key={f} style={{fontFamily:f}}>{f}</option>)}
          </select>
          <select value={fontSize} onChange={e => setFontSize(+e.target.value)} className="toolbar-select w-16">
            {SIZES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={toggleBold} className={`toolbar-icon ${isBold ? "!bg-white/20" : ""}`} title="Bold"><Bold className="w-4 h-4" /></button>
          <button onClick={toggleItalic} className={`toolbar-icon ${isItalic ? "!bg-white/20" : ""}`} title="Italic"><Italic className="w-4 h-4" /></button>
          <button onClick={toggleUnderline} className={`toolbar-icon ${isUnderline ? "!bg-white/20" : ""}`} title="Underline"><Underline className="w-4 h-4" /></button>
          <Sep />
          <button onClick={() => setTextAlign("left")} className={`toolbar-icon ${textAlign==="left"?"!bg-white/20":""}`}><AlignLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => setTextAlign("center")} className={`toolbar-icon ${textAlign==="center"?"!bg-white/20":""}`}><AlignCenter className="w-3.5 h-3.5" /></button>
          <button onClick={() => setTextAlign("right")} className={`toolbar-icon ${textAlign==="right"?"!bg-white/20":""}`}><AlignRight className="w-3.5 h-3.5" /></button>
          <Sep />
        </>}
        {/* Color pickers */}
        <label className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider">
          Color <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
        </label>
        {(activeTool === "rect" || activeTool === "circle") && (
          <label className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider">
            Fill <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
          </label>
        )}
        {(activeTool === "draw" || activeTool === "line" || activeTool === "signature") && (
          <label className="flex items-center gap-1 text-[10px] text-gray-400">
            Width <input type="range" min={1} max={20} value={drawWidth} onChange={e => setDrawWidth(+e.target.value)} className="w-16 accent-purple-500" /><span className="w-3 text-xs">{drawWidth}</span>
          </label>
        )}
        {activeTool === "highlight" && (
          <label className="flex items-center gap-1 text-[10px] text-gray-400">
            Opacity <input type="range" min={10} max={80} value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-16 accent-yellow-400" /><span className="w-5 text-xs">{opacity}%</span>
          </label>
        )}
        {activeTool === "stamp" && (
          <div className="flex gap-1 ml-1">
            {STAMPS.map(s => (
              <button key={s} onClick={() => addStamp(s)} className="px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors">{s}</button>
            ))}
          </div>
        )}
        <div className="flex-1" />
        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="toolbar-icon"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-xs text-gray-500 w-10 text-center font-mono">{Math.round(zoom*100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="toolbar-icon"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={fitToWidth} className="toolbar-icon" title="Fit to width"><Maximize className="w-4 h-4" /></button>
        <Sep />
        <button onClick={rotatePage} className="toolbar-icon" title="Rotate page"><RotateCw className="w-4 h-4" /></button>
        <button onClick={() => setShowThumbs(t => !t)} className={`toolbar-icon ${showThumbs ? "!bg-white/15" : ""}`} title="Thumbnails"><Layers className="w-4 h-4" /></button>
        <button onClick={() => imgRef.current?.click()} className="toolbar-btn"><ImageIcon className="w-3.5 h-3.5" /> Image</button>
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT TOOL PANEL ── */}
        <div className="w-12 bg-[#12122a] border-r border-white/5 flex flex-col items-center py-2 gap-0.5 flex-shrink-0 overflow-y-auto">
          {TOOL_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="w-6 h-px bg-white/10 my-1.5" />}
              {group.tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (tool.id === "image") { imgRef.current?.click(); return; }
                    setActiveTool(tool.id);
                  }}
                  title={`${tool.label} (${tool.shortcut})`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    activeTool === tool.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                      : "text-gray-500 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ── PAGE THUMBNAILS ── */}
        {showThumbs && numPages > 1 && (
          <div className="w-28 bg-[#12122a] border-r border-white/5 overflow-y-auto flex-shrink-0 p-2 space-y-2">
            {Array.from({length: numPages}, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                  currentPage === p ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-transparent hover:border-white/20"
                }`}
              >
                <div className="bg-white aspect-[3/4] flex items-center justify-center text-gray-400 text-xs font-bold">
                  {p}
                </div>
                <div className={`text-center text-[10px] py-0.5 ${currentPage === p ? "text-purple-400" : "text-gray-600"}`}>
                  Page {p}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── CANVAS AREA ── */}
        <div className="flex-1 overflow-auto bg-[#0f0f23] relative" style={{
          cursor: activeTool === "text" ? "text" : ["draw","highlight","signature"].includes(activeTool) ? "crosshair" : activeTool === "erase" ? "cell" : "default"
        }}>
          <div className="flex items-start justify-center p-6 min-h-full">
            <div className="relative shadow-2xl shadow-black/60 rounded-sm" style={{ width: `${Math.round(595 * zoom)}px` }}>
              <canvas ref={canvasRef} className="absolute top-0 left-0 rounded-sm" />
              <canvas ref={fabricRef} className="rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#16162a] border-t border-white/5 flex-shrink-0">
        <span className="text-[10px] text-gray-600">100% Private · Never Uploaded</span>
        <div className="flex items-center gap-3">
          <button onClick={prevPage} disabled={currentPage <= 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs text-gray-400">
            Page <input type="number" min={1} max={numPages} value={currentPage} onChange={e => goToPage(+e.target.value)} className="w-8 bg-white/10 rounded text-center text-white text-xs mx-1 py-0.5 border-0 outline-none" /> of {numPages}
          </span>
          <button onClick={nextPage} disabled={currentPage >= numPages} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <span className="text-[10px] text-gray-600">Tool: {activeTool}</span>
      </div>

      <style jsx>{`
        .toolbar-btn { @apply flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-xs font-semibold transition-colors; }
        .toolbar-icon { @apply p-1.5 rounded-md hover:bg-white/10 disabled:opacity-20 transition-colors; }
        .toolbar-select { @apply bg-white/10 border border-white/10 rounded-md px-1.5 py-1 text-xs outline-none focus:border-purple-500; }
      `}</style>
    </div>
  );
}

function Sep() { return <div className="w-px h-5 bg-white/10 mx-0.5" />; }
