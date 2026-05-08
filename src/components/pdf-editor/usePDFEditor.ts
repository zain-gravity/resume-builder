"use client";
import { useRef, useState, useCallback, useEffect, RefObject } from "react";
import type { ToolType } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export function usePDFEditor(
  pdfCanvasRef: RefObject<HTMLCanvasElement>,
  fabricCanvasRef: RefObject<HTMLCanvasElement>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [drawWidth, setDrawWidth] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fabricRef = useRef<FabricCanvas>(null);
  // Store per-page fabric JSON
  const pageDataRef = useRef<Record<number, object>>({});
  const historyRef = useRef<object[]>([]);
  const histIdxRef = useRef(-1);
  // Store original PDF buffer for export
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);

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

    canvas.on("object:added", saveHistory);
    canvas.on("object:modified", saveHistory);
    canvas.on("object:removed", saveHistory);

    return canvas;
  }, [fabricCanvasRef]);

  const saveHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const json = fabricRef.current.toJSON();
    const h = historyRef.current.slice(0, histIdxRef.current + 1);
    h.push(json);
    historyRef.current = h;
    histIdxRef.current = h.length - 1;
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  // ── Render PDF page ─────────────────────────────────────────────────────────
  const renderPage = useCallback(async (doc: object, pageNum: number, scale: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (doc as any).getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = pdfCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Reinit fabric at this size, restore saved annotations
    const fab = await initFabric(viewport.width, viewport.height);
    const saved = pageDataRef.current[pageNum];
    if (saved) {
      await new Promise<void>(res => fab.loadFromJSON(saved, () => { fab.renderAll(); res(); }));
    }
  }, [pdfCanvasRef, initFabric]);

  // ── Load PDF ────────────────────────────────────────────────────────────────
  const loadPDF = useCallback(async (file: File) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      pageDataRef.current[currentPage] = fabricRef.current.toJSON();
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

  // ── Tool changes ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fab = fabricRef.current;
    if (!fab) return;
    const { fabric } = require("fabric");

    fab.isDrawingMode = false;
    fab.selection = true;
    fab.off("mouse:down");

    if (activeTool === "draw" || activeTool === "highlight") {
      fab.isDrawingMode = true;
      fab.freeDrawingBrush.width = activeTool === "highlight" ? 20 : drawWidth;
      const color = activeTool === "highlight"
        ? hexToRgba(fontColor, 0.35)
        : fontColor;
      fab.freeDrawingBrush.color = color;
    } else if (activeTool === "erase") {
      fab.isDrawingMode = true;
      fab.freeDrawingBrush.color = "#ffffff";
      fab.freeDrawingBrush.width = 20;
    } else if (activeTool === "text") {
      fab.selection = false;
      fab.on("mouse:down", (opt: object) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        const text = new fabric.IText("Click to type", {
          left: x, top: y,
          fontFamily, fontSize, fill: fontColor,
          editable: true,
        });
        fab.add(text);
        fab.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        fab.renderAll();
      });
    } else if (activeTool === "rect") {
      fab.selection = false;
      let startX = 0, startY = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rect: any = null;
      fab.on("mouse:down", (opt: object) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        startX = x; startY = y;
        rect = new fabric.Rect({ left: x, top: y, width: 1, height: 1, stroke: fontColor, strokeWidth: drawWidth, fill: fillColor === "transparent" ? "rgba(0,0,0,0)" : fillColor });
        fab.add(rect);
      });
      fab.on("mouse:move", (opt: object) => {
        if (!rect) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        rect.set({ width: Math.abs(x - startX), height: Math.abs(y - startY), left: Math.min(x, startX), top: Math.min(y, startY) });
        fab.renderAll();
      });
      fab.on("mouse:up", () => { rect = null; saveHistory(); });
    } else if (activeTool === "circle") {
      fab.selection = false;
      let startX = 0, startY = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let circle: any = null;
      fab.on("mouse:down", (opt: object) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        startX = x; startY = y;
        circle = new fabric.Ellipse({ left: x, top: y, rx: 1, ry: 1, stroke: fontColor, strokeWidth: drawWidth, fill: fillColor === "transparent" ? "rgba(0,0,0,0)" : fillColor });
        fab.add(circle);
      });
      fab.on("mouse:move", (opt: object) => {
        if (!circle) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        circle.set({ rx: Math.abs(x - startX) / 2, ry: Math.abs(y - startY) / 2, left: Math.min(x, startX), top: Math.min(y, startY) });
        fab.renderAll();
      });
      fab.on("mouse:up", () => { circle = null; saveHistory(); });
    } else if (activeTool === "line") {
      fab.selection = false;
      let startX = 0, startY = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let line: any = null;
      fab.on("mouse:down", (opt: object) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        startX = x; startY = y;
        line = new fabric.Line([x, y, x, y], { stroke: fontColor, strokeWidth: drawWidth });
        fab.add(line);
      });
      fab.on("mouse:move", (opt: object) => {
        if (!line) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { x, y } = (opt as any).absolutePointer || { x: 0, y: 0 };
        line.set({ x2: x, y2: y });
        fab.renderAll();
      });
      fab.on("mouse:up", () => { line = null; saveHistory(); });
    } else {
      // select mode
      fab.selection = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, fontFamily, fontSize, fontColor, fillColor, drawWidth]);

  // ── Undo/Redo ────────────────────────────────────────────────────────────────
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

  // ── Add Image ────────────────────────────────────────────────────────────────
  const addImage = useCallback(async (file: File) => {
    const { fabric } = await import("fabric");
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img: object) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const i = img as any;
      i.scaleToWidth(200);
      fabricRef.current?.add(i);
      fabricRef.current?.setActiveObject(i);
      fabricRef.current?.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  // ── Export PDF ───────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!pdfDoc || !pdfBufferRef.current) return;
    saveCurrent();
    const { PDFDocument } = await import("pdf-lib");

    const exportedPdf = await PDFDocument.create();

    for (let p = 1; p <= numPages; p++) {
      // Render page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const page = await pdfDoc.getPage(p);
      const viewport = page.getViewport({ scale: zoom });

      // Create temp canvas for this page
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      const ctx = tempCanvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Create temp fabric canvas and load annotations
      const tempFabricCanvas = document.createElement("canvas");
      tempFabricCanvas.width = viewport.width;
      tempFabricCanvas.height = viewport.height;
      const { fabric } = await import("fabric");
      const tempFab = new fabric.Canvas(tempFabricCanvas, { width: viewport.width, height: viewport.height });

      const savedAnnotations = pageDataRef.current[p];
      if (savedAnnotations) {
        await new Promise<void>(r => tempFab.loadFromJSON(savedAnnotations, () => { tempFab.renderAll(); r(); }));
      }

      // Merge: draw fabric on top of pdf canvas
      ctx.drawImage(tempFabricCanvas, 0, 0);
      tempFab.dispose();

      // Add to PDF
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
