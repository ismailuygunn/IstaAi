"use client";

import { useRef, useEffect, useState } from "react";

/*
  Treatment-type → color mapping
  kron    = Red      | Full kaplama kron
  veneer  = Green    | Veneer
  implant = Blue     | İmplant
  kanal   = Orange   | Kanal tedavisi riski
  curuk   = Yellow   | Çürük/restorasyon
  cerrahi = Purple   | Cerrahi müdahale
*/
const COLORS = {
    kron:    { fill: "rgba(239, 68, 68, 0.25)",  stroke: "#EF4444", text: "#EF4444", label: "Kron" },
    veneer:  { fill: "rgba(16, 185, 129, 0.25)", stroke: "#10B981", text: "#10B981", label: "Veneer" },
    implant: { fill: "rgba(59, 130, 246, 0.25)", stroke: "#3B82F6", text: "#3B82F6", label: "İmplant" },
    kanal:   { fill: "rgba(249, 115, 22, 0.25)", stroke: "#F97316", text: "#F97316", label: "Kanal" },
    curuk:   { fill: "rgba(234, 179, 8, 0.25)",  stroke: "#EAB308", text: "#EAB308", label: "Çürük" },
    cerrahi: { fill: "rgba(139, 92, 246, 0.25)", stroke: "#8B5CF6", text: "#8B5CF6", label: "Cerrahi" },
};

const DEFAULT_COLOR = COLORS.kron;

export default function AnnotatedPhoto({ src, markers = [], title = "" }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
    const [showLabels, setShowLabels] = useState(true);

    useEffect(() => {
        if (!src || !canvasRef.current) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Set canvas size to image size for sharp rendering
            const container = containerRef.current;
            const maxW = container ? container.clientWidth : 600;
            const scale = Math.min(maxW / img.width, 1);
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);

            // High-DPI support
            const dpr = window.devicePixelRatio || 1;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";

            const ctx = canvas.getContext("2d");
            ctx.scale(dpr, dpr);

            setDimensions({ w, h });

            // Draw image
            ctx.drawImage(img, 0, 0, w, h);

            if (!markers.length || !showLabels) return;

            // Draw annotations
            const RADIUS = Math.max(12, w * 0.022);
            const FONT_SIZE = Math.max(10, w * 0.018);
            const LABEL_FONT = Math.max(9, w * 0.015);

            markers.forEach((m, idx) => {
                const color = COLORS[m.tedavi_tipi] || DEFAULT_COLOR;
                const cx = (m.x / 100) * w;
                const cy = (m.y / 100) * h;

                // Outer glow
                ctx.shadowColor = color.stroke;
                ctx.shadowBlur = 8;

                // Filled circle
                ctx.beginPath();
                ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = color.fill;
                ctx.fill();
                ctx.strokeStyle = color.stroke;
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Inner dot
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fillStyle = color.stroke;
                ctx.fill();

                // Tooth number inside circle
                ctx.font = `bold ${FONT_SIZE}px 'Outfit', 'Inter', sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#fff";
                ctx.strokeStyle = "rgba(0,0,0,0.6)";
                ctx.lineWidth = 2.5;
                ctx.strokeText(String(m.dis_no), cx, cy);
                ctx.fillText(String(m.dis_no), cx, cy);

                // Label with leader line
                if (m.etiket) {
                    // Calculate label position (offset from circle)
                    const labelOffset = RADIUS + 6;
                    // Alternate label side based on x position
                    const labelOnRight = cx < w * 0.6;
                    const lx = labelOnRight ? cx + labelOffset : cx - labelOffset;
                    // Stack labels vertically to avoid overlap
                    const ly = cy - 4 + (idx % 3) * (LABEL_FONT + 6);

                    // Leader line
                    ctx.beginPath();
                    ctx.moveTo(cx + (labelOnRight ? RADIUS : -RADIUS), cy);
                    ctx.lineTo(lx, ly);
                    ctx.strokeStyle = color.stroke;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 2]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Label background
                    ctx.font = `600 ${LABEL_FONT}px 'Outfit', 'Inter', sans-serif`;
                    const textW = ctx.measureText(m.etiket).width;
                    const pad = 5;
                    const bgX = labelOnRight ? lx : lx - textW - pad * 2;
                    const bgY = ly - LABEL_FONT / 2 - pad;
                    const bgW = textW + pad * 2;
                    const bgH = LABEL_FONT + pad * 2;

                    // Rounded rect background
                    ctx.beginPath();
                    const r = 4;
                    ctx.moveTo(bgX + r, bgY);
                    ctx.lineTo(bgX + bgW - r, bgY);
                    ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + r);
                    ctx.lineTo(bgX + bgW, bgY + bgH - r);
                    ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - r, bgY + bgH);
                    ctx.lineTo(bgX + r, bgY + bgH);
                    ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - r);
                    ctx.lineTo(bgX, bgY + r);
                    ctx.quadraticCurveTo(bgX, bgY, bgX + r, bgY);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
                    ctx.fill();
                    ctx.strokeStyle = color.stroke;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Label text
                    ctx.fillStyle = color.text;
                    ctx.textAlign = labelOnRight ? "left" : "right";
                    ctx.textBaseline = "middle";
                    ctx.fillText(m.etiket, labelOnRight ? lx + pad : lx - pad, ly);
                }
            });
        };
        img.src = src;
    }, [src, markers, showLabels]);

    // Get unique treatment types for legend
    const treatmentTypes = [...new Set(markers.map((m) => m.tedavi_tipi).filter(Boolean))];

    return (
        <div className="annotated-photo" ref={containerRef}>
            <div className="annotated-photo-header">
                <span className="annotated-photo-title">{title}</span>
                <div className="annotated-photo-controls">
                    <span className="annotated-badge">{markers.length} işaret</span>
                    <button
                        className={`annotated-toggle ${showLabels ? "active" : ""}`}
                        onClick={() => setShowLabels(!showLabels)}
                        title={showLabels ? "İşaretleri gizle" : "İşaretleri göster"}
                    >
                        {showLabels ? "👁 Gizle" : "👁‍🗨 Göster"}
                    </button>
                </div>
            </div>
            <div className="annotated-canvas-wrap">
                <canvas ref={canvasRef} style={{ borderRadius: 8, display: "block", width: "100%" }} />
            </div>
            {treatmentTypes.length > 0 && (
                <div className="annotated-legend">
                    {treatmentTypes.map((t) => {
                        const c = COLORS[t] || DEFAULT_COLOR;
                        return (
                            <div key={t} className="annotated-legend-item">
                                <span className="annotated-legend-dot" style={{ background: c.stroke }}></span>
                                <span>{c.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
