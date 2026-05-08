"use client";
import { useRef, useState, useCallback, useEffect, RefObject } from "react";
import type { ToolType } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function usePDFEditor(
  pdfCanvasRef: RefObject<HTMLCanvasElement>,
  fabricCanvasRef: RefObject<HTMLCanvasElement>
) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.3);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(3);
  const [opacity, setOpacity] = useState(35);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<string>("left");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);

  const fabricRef = useRef<any>(null);
  const pageDataRef = useRef<Record<number, any>>({});
  const historyRef = useRef<any[]>([]);
  const histIdxRef = useRef(-1);
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);
  const isLoadingPage = useRef(false);
  const clipboardRef = useRef<any>(null);
  const pageRotations = useRef<Record<number, number>>({});

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isLoadingPage.current) return;
    const json = fabricRef.current.toJSON(["pdfOriginal"]);
    const h = historyRef.current.slice(0, histIdxRef.current + 1);
    h.push(json);
    if (h.length > 50) h.shift(); // cap at 50
    historyRef.current = h;
    histIdxRef.current = h.length - 1;
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  // ── Init Fabric ─────────────────────────────────────────────────────────────
  const initFabric = useCallback(async (w: number, h: number) => {
    const { fabric } = await import("fabric");
    if (fabricRef.current) fabricRef.current.dispose();
    const c = new fabric.Canvas(fabricCanvasRef.current!, {
      width: w, height: h, isDrawingMode: false, selection: true,
    });
    fabricRef.current = c;
    historyRef.current = [];
    histIdxRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    return c;
  }, [fabricCanvasRef]);

  // ── Extract editable text items ─────────────────────────────────────────────
  async function extractTextItems(page: any, viewport: any, fabric: any) {
    const tc = await page.getTextContent();
    const items: any[] = [];
    for (const item of tc.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const tx = item.transform;
      const fs = Math.abs(tx[3]) * viewport.scale;
      const x = tx[4] * viewport.scale;
      const y = viewport.height - tx[5] * viewport.scale - fs;
      let ff = "Arial";
      const fn = (item.fontName || "").toLowerCase();
      if (fn.includes("times")) ff = "Times New Roman";
      else if (fn.includes("courier") || fn.includes("mono")) ff = "Courier New";
      else if (fn.includes("georgia")) ff = "Georgia";
      else if (fn.includes("helvetica")) ff = "Helvetica";
      else if (fn.includes("verdana")) ff = "Verdana";
      const bold = fn.includes("bold");
      const ital = fn.includes("italic") || fn.includes("oblique");
      items.push(new fabric.IText(item.str, {
        left: x, top: y, fontSize: Math.max(6, Math.round(fs)),
        fontFamily: ff, fontWeight: bold ? "bold" : "normal",
        fontStyle: ital ? "italic" : "normal", fill: "#000",
        editable: true, selectable: true, pdfOriginal: true,
      }));
    }
    return items;
  }

  // ── Render page ─────────────────────────────────────────────────────────────
  const renderPage = useCallback(async (doc: any, pageNum: number, scale: number) => {
    isLoadingPage.current = true;
    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const { fabric } = await import("fabric");
    const page = await doc.getPage(pageNum);
    const rot = pageRotations.current[pageNum] || 0;
    const viewport = page.getViewport({ scale, rotation: rot });
    const cv = pdfCanvasRef.current!;
    const ctx = cv.getContext("2d")!;
    cv.width = viewport.width;
    cv.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const fab = await initFabric(viewport.width, viewport.height);
    const saved = pageDataRef.current[pageNum];
    if (saved) {
      await new Promise<void>(r => fab.loadFromJSON(saved, () => { fab.renderAll(); r(); }));
    } else {
      const textItems = await extractTextItems(page, viewport, fabric);
      for (const obj of textItems) {
        const pad = 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(obj.left - pad, obj.top - pad, obj.getScaledWidth() + pad * 2, obj.fontSize + pad * 2);
      }
      for (const obj of textItems) fab.add(obj);
      fab.renderAll();
    }
    fab.on("object:added", saveHistory);
    fab.on("object:modified", saveHistory);
    fab.on("object:removed", saveHistory);
    isLoadingPage.current = false;
    saveHistory();
  }, [pdfCanvasRef, initFabric, saveHistory]);

  // ── Load PDF ────────────────────────────────────────────────────────────────
  const loadPDF = useCallback(async (file: File) => {
    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const ab = await file.arrayBuffer();
    pdfBufferRef.current = ab;
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setCurrentPage(1);
    pageDataRef.current = {};
    pageRotations.current = {};
    await renderPage(doc, 1, zoom);
  }, [renderPage, zoom]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const saveCurrent = useCallback(() => {
    if (fabricRef.current) pageDataRef.current[currentPage] = fabricRef.current.toJSON(["pdfOriginal"]);
  }, [currentPage]);
  const goToPage = useCallback(async (p: number) => {
    if (!pdfDoc || p < 1 || p > numPages || p === currentPage) return;
    saveCurrent();
    setCurrentPage(p);
    await renderPage(pdfDoc, p, zoom);
  }, [pdfDoc, numPages, currentPage, saveCurrent, renderPage, zoom]);
  const nextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);

  const fitToWidth = useCallback(() => setZoom(1.3), []);

  const rotatePage = useCallback(async () => {
    const cur = pageRotations.current[currentPage] || 0;
    pageRotations.current[currentPage] = (cur + 90) % 360;
    // Clear saved data for this page since dimensions change
    delete pageDataRef.current[currentPage];
    if (pdfDoc) await renderPage(pdfDoc, currentPage, zoom);
  }, [currentPage, pdfDoc, renderPage, zoom]);

  // ── Tool application ────────────────────────────────────────────────────────
  useEffect(() => {
    const fab = fabricRef.current;
    if (!fab) return;
    const { fabric } = require("fabric");
    fab.isDrawingMode = false;
    fab.selection = true;
    fab.off("mouse:down"); fab.off("mouse:move"); fab.off("mouse:up");

    switch (activeTool) {
      case "draw":
        fab.isDrawingMode = true;
        fab.freeDrawingBrush.width = drawWidth;
        fab.freeDrawingBrush.color = fontColor;
        break;
      case "highlight":
        fab.isDrawingMode = true;
        fab.freeDrawingBrush.width = 20;
        fab.freeDrawingBrush.color = hexToRgba(fontColor || "#ffff00", opacity / 100);
        break;
      case "signature":
        fab.isDrawingMode = true;
        fab.freeDrawingBrush.width = 2;
        fab.freeDrawingBrush.color = "#1a1a8a";
        break;
      case "erase":
        fab.isDrawingMode = true;
        fab.freeDrawingBrush.color = "#ffffff";
        fab.freeDrawingBrush.width = 25;
        break;
      case "text":
        fab.selection = false;
        fab.on("mouse:down", (opt: any) => {
          if (opt.target) return;
          const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
          const t = new fabric.IText("Type here", {
            left: x, top: y, fontFamily, fontSize, fill: fontColor,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            underline: isUnderline, textAlign,
            editable: true, pdfOriginal: false,
          });
          fab.add(t); fab.setActiveObject(t);
          t.enterEditing(); t.selectAll(); fab.renderAll();
        });
        break;
      case "rect": {
        fab.selection = false;
        let sx = 0, sy = 0, r: any = null;
        fab.on("mouse:down", (o: any) => {
          if (o.target) return;
          const { x, y } = o.absolutePointer || { x: 0, y: 0 };
          sx = x; sy = y;
          r = new fabric.Rect({ left: x, top: y, width: 1, height: 1, stroke: strokeColor, strokeWidth: drawWidth, fill: fillColor });
          fab.add(r);
        });
        fab.on("mouse:move", (o: any) => { if (!r) return; const { x, y } = o.absolutePointer; r.set({ width: Math.abs(x - sx), height: Math.abs(y - sy), left: Math.min(x, sx), top: Math.min(y, sy) }); fab.renderAll(); });
        fab.on("mouse:up", () => { r = null; saveHistory(); });
        break;
      }
      case "circle": {
        fab.selection = false;
        let sx = 0, sy = 0, c: any = null;
        fab.on("mouse:down", (o: any) => {
          if (o.target) return;
          const { x, y } = o.absolutePointer || { x: 0, y: 0 };
          sx = x; sy = y;
          c = new fabric.Ellipse({ left: x, top: y, rx: 1, ry: 1, stroke: strokeColor, strokeWidth: drawWidth, fill: fillColor });
          fab.add(c);
        });
        fab.on("mouse:move", (o: any) => { if (!c) return; const { x, y } = o.absolutePointer; c.set({ rx: Math.abs(x - sx) / 2, ry: Math.abs(y - sy) / 2, left: Math.min(x, sx), top: Math.min(y, sy) }); fab.renderAll(); });
        fab.on("mouse:up", () => { c = null; saveHistory(); });
        break;
      }
      case "line": {
        fab.selection = false;
        let sx = 0, sy = 0, l: any = null;
        fab.on("mouse:down", (o: any) => {
          if (o.target) return;
          const { x, y } = o.absolutePointer || { x: 0, y: 0 };
          sx = x; sy = y;
          l = new fabric.Line([x, y, x, y], { stroke: fontColor, strokeWidth: drawWidth });
          fab.add(l);
        });
        fab.on("mouse:move", (o: any) => { if (!l) return; const { x, y } = o.absolutePointer; l.set({ x2: x, y2: y }); fab.renderAll(); });
        fab.on("mouse:up", () => { l = null; saveHistory(); });
        break;
      }
      default: // select
        fab.selection = true;
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, fontFamily, fontSize, fontColor, fillColor, strokeColor, drawWidth, opacity, isBold, isItalic, isUnderline, textAlign]);

  // ── Text format toggles ─────────────────────────────────────────────────────
  const toggleBold = useCallback(() => {
    setIsBold(b => !b);
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "i-text" || obj?.type === "textbox") {
      obj.set("fontWeight", obj.fontWeight === "bold" ? "normal" : "bold");
      fabricRef.current?.renderAll(); saveHistory();
    }
  }, [saveHistory]);
  const toggleItalic = useCallback(() => {
    setIsItalic(i => !i);
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "i-text" || obj?.type === "textbox") {
      obj.set("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic");
      fabricRef.current?.renderAll(); saveHistory();
    }
  }, [saveHistory]);
  const toggleUnderline = useCallback(() => {
    setIsUnderline(u => !u);
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "i-text" || obj?.type === "textbox") {
      obj.set("underline", !obj.underline);
      fabricRef.current?.renderAll(); saveHistory();
    }
  }, [saveHistory]);

  // Update textAlign on selected
  useEffect(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "i-text" || obj?.type === "textbox") {
      obj.set("textAlign", textAlign);
      fabricRef.current?.renderAll();
    }
  }, [textAlign]);

  // Update font on selected
  useEffect(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "i-text" || obj?.type === "textbox") {
      obj.set({ fontFamily, fontSize, fill: fontColor });
      fabricRef.current?.renderAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamily, fontSize, fontColor]);

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (histIdxRef.current <= 0 || !fabricRef.current) return;
    histIdxRef.current--;
    fabricRef.current.loadFromJSON(historyRef.current[histIdxRef.current], () => fabricRef.current!.renderAll());
    setCanUndo(histIdxRef.current > 0); setCanRedo(true);
  }, []);
  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1 || !fabricRef.current) return;
    histIdxRef.current++;
    fabricRef.current.loadFromJSON(historyRef.current[histIdxRef.current], () => fabricRef.current!.renderAll());
    setCanUndo(true); setCanRedo(histIdxRef.current < historyRef.current.length - 1);
  }, []);

  // ── Delete / Copy / Paste ───────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const fab = fabricRef.current; if (!fab) return;
    fab.getActiveObjects().forEach((o: any) => fab.remove(o));
    fab.discardActiveObject(); fab.renderAll(); saveHistory();
  }, [saveHistory]);

  const copySelected = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (obj) obj.clone((c: any) => { clipboardRef.current = c; });
  }, []);

  const pasteClipboard = useCallback(() => {
    if (!clipboardRef.current || !fabricRef.current) return;
    clipboardRef.current.clone((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20, evented: true });
      if (cloned.type === "activeSelection") {
        cloned.canvas = fabricRef.current;
        cloned.forEachObject((o: any) => fabricRef.current.add(o));
        cloned.setCoords();
      } else {
        fabricRef.current.add(cloned);
      }
      fabricRef.current.setActiveObject(cloned);
      fabricRef.current.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  // ── Add Image ───────────────────────────────────────────────────────────────
  const addImage = useCallback(async (file: File) => {
    const { fabric } = await import("fabric");
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img: any) => {
      const maxW = (fabricRef.current?.width || 600) * 0.5;
      if (img.width > maxW) img.scaleToWidth(maxW);
      fabricRef.current?.add(img);
      fabricRef.current?.setActiveObject(img);
      fabricRef.current?.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  // ── Add Stamp ───────────────────────────────────────────────────────────────
  const addStamp = useCallback(async (label: string) => {
    const { fabric } = await import("fabric");
    const fab = fabricRef.current; if (!fab) return;
    const text = new fabric.IText(label, {
      left: fab.width / 2 - 80, top: fab.height / 2 - 20,
      fontSize: 36, fontFamily: "Impact", fill: "rgba(220,38,38,0.6)",
      fontWeight: "bold", angle: -15, editable: true,
      stroke: "rgba(220,38,38,0.8)", strokeWidth: 1,
      pdfOriginal: false,
    });
    fab.add(text); fab.setActiveObject(text); fab.renderAll(); saveHistory();
  }, [saveHistory]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      const fab = fabricRef.current;
      if (!fab) return;
      // Check if currently editing text
      const active = fab.getActiveObject();
      if (active?.isEditing) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "c") { e.preventDefault(); copySelected(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "v") { e.preventDefault(); pasteClipboard(); }
      else if (e.key === "Delete" || e.key === "Backspace") { if (!active?.isEditing) { e.preventDefault(); deleteSelected(); } }
      else if (e.key === "v") setActiveTool("select");
      else if (e.key === "t") setActiveTool("text");
      else if (e.key === "p") setActiveTool("draw");
      else if (e.key === "h") setActiveTool("highlight");
      else if (e.key === "e") setActiveTool("erase");
      else if (e.key === "r") setActiveTool("rect");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, copySelected, pasteClipboard, deleteSelected]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!pdfDoc || !pdfBufferRef.current) return;
    saveCurrent();
    const { PDFDocument } = await import("pdf-lib");
    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const { fabric } = await import("fabric");
    const out = await PDFDocument.create();

    for (let p = 1; p <= numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const rot = pageRotations.current[p] || 0;
      const vp = page.getViewport({ scale: zoom, rotation: rot });
      const tc = document.createElement("canvas");
      tc.width = vp.width; tc.height = vp.height;
      const ctx = tc.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      const sd = pageDataRef.current[p];
      if (sd) {
        const tfc = document.createElement("canvas");
        tfc.width = vp.width; tfc.height = vp.height;
        const tf = new fabric.Canvas(tfc, { width: vp.width, height: vp.height });
        await new Promise<void>(r => tf.loadFromJSON(sd, () => { tf.renderAll(); r(); }));
        for (const obj of tf.getObjects()) {
          if (obj.pdfOriginal) {
            const b = obj.getBoundingRect();
            ctx.fillStyle = "#FFF";
            ctx.fillRect(b.left - 2, b.top - 2, b.width + 4, b.height + 4);
          }
        }
        ctx.drawImage(tfc, 0, 0);
        tf.dispose();
      }

      const imgData = tc.toDataURL("image/png");
      const imgBytes = await fetch(imgData).then(r => r.arrayBuffer());
      const img = await out.embedPng(imgBytes);
      const pp = out.addPage([vp.width, vp.height]);
      pp.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
    }

    const bytes = await out.save();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    a.download = "edited-document.pdf";
    a.click();
  }, [pdfDoc, numPages, zoom, saveCurrent]);

  return {
    pdfDoc, numPages, currentPage, zoom, activeTool, setActiveTool,
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
    pageThumbnails, fabricCanvas: fabricRef.current,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
