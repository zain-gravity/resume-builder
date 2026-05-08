"use client";
import { useRef, useState, useCallback, useEffect, RefObject } from "react";
import type { ToolType } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type FabricCanvas = any;

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
  const [fillColor, setFillColor] = useState("transparent");
  const [drawWidth, setDrawWidth] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fabricRef = useRef<FabricCanvas>(null);
  const pageDataRef = useRef<Record<number, object>>({});
  const historyRef = useRef<object[]>([]);
  const histIdxRef = useRef(-1);
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);
  // Track which text items came from the PDF (for white-out on export)
  const isLoadingPage = useRef(false);

  // ── Init Fabric.js ──────────────────────────────────────────────────────────
  const initFabric = useCallback(async (width: number, height: number) => {
    const { fabric } = await import("fabric");
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }
    const canvas = new fabric.Canvas(fabricCanvasRef.current!, {
      width, height,
      isDrawingMode: false,
      selection: true,
    });
    fabricRef.current = canvas;
    historyRef.current = [];
    histIdxRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    return canvas;
  }, [fabricCanvasRef]);

  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isLoadingPage.current) return;
    const json = fabricRef.current.toJSON(["pdfOriginal"]);
    const h = historyRef.current.slice(0, histIdxRef.current + 1);
    h.push(json);
    historyRef.current = h;
    histIdxRef.current = h.length - 1;
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  // ── Extract text items from a PDF page ──────────────────────────────────────
  async function extractTextItems(page: any, viewport: any, fabric: any) {
    const textContent = await page.getTextContent();
    const items: any[] = [];

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) continue;

      // item.transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const tx = item.transform;
      const fSize = Math.abs(tx[3]) * viewport.scale;
      // PDF coords: origin at bottom-left. Fabric coords: origin at top-left.
      const x = tx[4] * viewport.scale;
      const y = viewport.height - (tx[5] * viewport.scale) - fSize;

      // Guess font family from PDF font name
      let ff = "Arial";
      const fontName = (item.fontName || "").toLowerCase();
      if (fontName.includes("times")) ff = "Times New Roman";
      else if (fontName.includes("courier") || fontName.includes("mono")) ff = "Courier New";
      else if (fontName.includes("georgia")) ff = "Georgia";
      else if (fontName.includes("verdana")) ff = "Verdana";
      else if (fontName.includes("helvetica")) ff = "Helvetica";
      else if (fontName.includes("arial")) ff = "Arial";

      const isBold = fontName.includes("bold");
      const isItalic = fontName.includes("italic") || fontName.includes("oblique");

      const textObj = new fabric.IText(item.str, {
        left: x,
        top: y,
        fontSize: Math.max(8, Math.round(fSize)),
        fontFamily: ff,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        fill: "#000000",
        editable: true,
        selectable: true,
        // Custom property to identify original PDF text
        pdfOriginal: true,
      });

      items.push(textObj);
    }

    return items;
  }

  // ── Render PDF page ─────────────────────────────────────────────────────────
  const renderPage = useCallback(async (doc: any, pageNum: number, scale: number) => {
    isLoadingPage.current = true;
    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const { fabric } = await import("fabric");

    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Render PDF graphics (images, shapes, backgrounds) to hidden canvas
    const pdfCanvas = pdfCanvasRef.current!;
    const ctx = pdfCanvas.getContext("2d")!;
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    // Render full PDF page first
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Init Fabric canvas
    const fab = await initFabric(viewport.width, viewport.height);

    // Check for saved edits on this page
    const saved = pageDataRef.current[pageNum];
    if (saved) {
      await new Promise<void>(res => fab.loadFromJSON(saved, () => { fab.renderAll(); res(); }));
    } else {
      // First visit: extract text objects and place as editable Fabric objects
      const textItems = await extractTextItems(page, viewport, fabric);

      // White out text areas on the PDF canvas so we don't see double
      for (const obj of textItems) {
        const padding = 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
          obj.left - padding,
          obj.top - padding,
          obj.getScaledWidth() + padding * 2,
          obj.fontSize + padding * 2
        );
      }

      // Add text objects to fabric
      for (const obj of textItems) {
        fab.add(obj);
      }
      fab.renderAll();
    }

    // Wire up history after loading
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

    const arrayBuffer = await file.arrayBuffer();
    pdfBufferRef.current = arrayBuffer;
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setCurrentPage(1);
    pageDataRef.current = {};
    await renderPage(doc, 1, zoom);
  }, [renderPage, zoom]);

  // ── Page navigation ─────────────────────────────────────────────────────────
  const saveCurrent = useCallback(() => {
    if (fabricRef.current) {
      pageDataRef.current[currentPage] = fabricRef.current.toJSON(["pdfOriginal"]);
    }
  }, [currentPage]);

  const nextPage = useCallback(async () => {
    if (!pdfDoc || currentPage >= numPages) return;
    saveCurrent();
    const next = currentPage + 1;
    setCurrentPage(next);
    await renderPage(pdfDoc, next, zoom);
  }, [pdfDoc, currentPage, numPages, saveCurrent, renderPage, zoom]);

  const prevPage = useCallback(async () => {
    if (!pdfDoc || currentPage <= 1) return;
    saveCurrent();
    const prev = currentPage - 1;
    setCurrentPage(prev);
    await renderPage(pdfDoc, prev, zoom);
  }, [pdfDoc, currentPage, saveCurrent, renderPage, zoom]);

  // ── Tool changes ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fab = fabricRef.current;
    if (!fab) return;
    const { fabric } = require("fabric");

    fab.isDrawingMode = false;
    fab.selection = true;
    // Remove only custom mouse handlers (keep fabric internal ones)
    fab.off("mouse:down");
    fab.off("mouse:move");
    fab.off("mouse:up");

    if (activeTool === "draw" || activeTool === "highlight") {
      fab.isDrawingMode = true;
      fab.freeDrawingBrush.width = activeTool === "highlight" ? 20 : drawWidth;
      fab.freeDrawingBrush.color = activeTool === "highlight"
        ? hexToRgba(fontColor, 0.35) : fontColor;
    } else if (activeTool === "erase") {
      fab.isDrawingMode = true;
      fab.freeDrawingBrush.color = "#ffffff";
      fab.freeDrawingBrush.width = 20;
    } else if (activeTool === "text") {
      fab.selection = false;
      fab.on("mouse:down", (opt: any) => {
        // Don't add new text if clicking on existing object
        if (opt.target) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        const text = new fabric.IText("Type here", {
          left: x, top: y,
          fontFamily, fontSize, fill: fontColor,
          editable: true, pdfOriginal: false,
        });
        fab.add(text);
        fab.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        fab.renderAll();
      });
    } else if (activeTool === "rect") {
      fab.selection = false;
      let startX = 0, startY = 0, rect: any = null;
      fab.on("mouse:down", (opt: any) => {
        if (opt.target) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        startX = x; startY = y;
        rect = new fabric.Rect({ left: x, top: y, width: 1, height: 1, stroke: fontColor, strokeWidth: drawWidth, fill: fillColor === "transparent" ? "rgba(0,0,0,0)" : fillColor });
        fab.add(rect);
      });
      fab.on("mouse:move", (opt: any) => {
        if (!rect) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        rect.set({ width: Math.abs(x - startX), height: Math.abs(y - startY), left: Math.min(x, startX), top: Math.min(y, startY) });
        fab.renderAll();
      });
      fab.on("mouse:up", () => { rect = null; saveHistory(); });
    } else if (activeTool === "circle") {
      fab.selection = false;
      let startX = 0, startY = 0, circle: any = null;
      fab.on("mouse:down", (opt: any) => {
        if (opt.target) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        startX = x; startY = y;
        circle = new fabric.Ellipse({ left: x, top: y, rx: 1, ry: 1, stroke: fontColor, strokeWidth: drawWidth, fill: fillColor === "transparent" ? "rgba(0,0,0,0)" : fillColor });
        fab.add(circle);
      });
      fab.on("mouse:move", (opt: any) => {
        if (!circle) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        circle.set({ rx: Math.abs(x - startX) / 2, ry: Math.abs(y - startY) / 2, left: Math.min(x, startX), top: Math.min(y, startY) });
        fab.renderAll();
      });
      fab.on("mouse:up", () => { circle = null; saveHistory(); });
    } else if (activeTool === "line") {
      fab.selection = false;
      let startX = 0, startY = 0, line: any = null;
      fab.on("mouse:down", (opt: any) => {
        if (opt.target) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        startX = x; startY = y;
        line = new fabric.Line([x, y, x, y], { stroke: fontColor, strokeWidth: drawWidth });
        fab.add(line);
      });
      fab.on("mouse:move", (opt: any) => {
        if (!line) return;
        const { x, y } = opt.absolutePointer || { x: 0, y: 0 };
        line.set({ x2: x, y2: y });
        fab.renderAll();
      });
      fab.on("mouse:up", () => { line = null; saveHistory(); });
    } else {
      // select mode — all objects selectable and editable
      fab.selection = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, fontFamily, fontSize, fontColor, fillColor, drawWidth]);

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (histIdxRef.current <= 0 || !fabricRef.current) return;
    histIdxRef.current--;
    const json = historyRef.current[histIdxRef.current];
    fabricRef.current.loadFromJSON(json, () => fabricRef.current!.renderAll());
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1 || !fabricRef.current) return;
    histIdxRef.current++;
    const json = historyRef.current[histIdxRef.current];
    fabricRef.current.loadFromJSON(json, () => fabricRef.current!.renderAll());
    setCanUndo(true);
    setCanRedo(histIdxRef.current < historyRef.current.length - 1);
  }, []);

  const deleteSelected = useCallback(() => {
    const fab = fabricRef.current;
    if (!fab) return;
    const active = fab.getActiveObjects();
    fab.remove(...active);
    fab.discardActiveObject();
    fab.renderAll();
    saveHistory();
  }, [saveHistory]);

  // ── Add Image ───────────────────────────────────────────────────────────────
  const addImage = useCallback(async (file: File) => {
    const { fabric } = await import("fabric");
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img: any) => {
      img.scaleToWidth(200);
      fabricRef.current?.add(img);
      fabricRef.current?.setActiveObject(img);
      fabricRef.current?.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!pdfDoc || !pdfBufferRef.current) return;
    saveCurrent();
    const { PDFDocument } = await import("pdf-lib");
    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const { fabric } = await import("fabric");

    const exportedPdf = await PDFDocument.create();

    for (let p = 1; p <= numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const viewport = page.getViewport({ scale: zoom });

      // Render PDF base layer
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const ctx = tempCanvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Load saved annotations for this page
      const savedData = pageDataRef.current[p];
      if (savedData) {
        // White out original text areas for any pdfOriginal objects
        const tempFabCanvas = document.createElement("canvas");
        tempFabCanvas.width = viewport.width;
        tempFabCanvas.height = viewport.height;
        const tempFab = new fabric.Canvas(tempFabCanvas, { width: viewport.width, height: viewport.height });
        await new Promise<void>(r => tempFab.loadFromJSON(savedData, () => { tempFab.renderAll(); r(); }));

        // White out each original text item on the PDF canvas
        for (const obj of tempFab.getObjects()) {
          if (obj.pdfOriginal) {
            ctx.fillStyle = "#FFFFFF";
            const bounds = obj.getBoundingRect();
            ctx.fillRect(bounds.left - 2, bounds.top - 2, bounds.width + 4, bounds.height + 4);
          }
        }

        // Draw all fabric objects on top
        ctx.drawImage(tempFabCanvas, 0, 0);
        tempFab.dispose();
      }

      // Add composited page to output PDF
      const imgData = tempCanvas.toDataURL("image/png");
      const imgBytes = await fetch(imgData).then(r => r.arrayBuffer());
      const img = await exportedPdf.embedPng(imgBytes);
      const pdfPage = exportedPdf.addPage([viewport.width, viewport.height]);
      pdfPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    const pdfBytes = await exportedPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited-document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfDoc, numPages, zoom, saveCurrent]);

  return {
    pdfDoc, numPages, currentPage, zoom, activeTool, setActiveTool,
    fontFamily, setFontFamily, fontSize, setFontSize,
    fontColor, setFontColor, fillColor, setFillColor,
    drawWidth, setDrawWidth,
    loadPDF, nextPage, prevPage, setZoom,
    undo, redo, canUndo, canRedo,
    deleteSelected, exportPDF, addImage,
    fabricCanvas: fabricRef.current,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
