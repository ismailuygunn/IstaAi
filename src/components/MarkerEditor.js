"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const COLORS = {
    kron:    { fill: "rgba(239, 68, 68, 0.25)",  stroke: "#EF4444", text: "#EF4444", label: "Kron" },
    veneer:  { fill: "rgba(16, 185, 129, 0.25)", stroke: "#10B981", text: "#10B981", label: "Veneer" },
    implant: { fill: "rgba(59, 130, 246, 0.25)", stroke: "#3B82F6", text: "#3B82F6", label: "İmplant" },
    kanal:   { fill: "rgba(249, 115, 22, 0.25)", stroke: "#F97316", text: "#F97316", label: "Kanal" },
    curuk:   { fill: "rgba(234, 179, 8, 0.25)",  stroke: "#EAB308", text: "#EAB308", label: "Çürük" },
    cerrahi: { fill: "rgba(139, 92, 246, 0.25)", stroke: "#8B5CF6", text: "#8B5CF6", label: "Cerrahi" },
};
const DEFAULT_COLOR = COLORS.kron;
const TREATMENT_TYPES = Object.entries(COLORS).map(([key, val]) => ({ key, label: val.label }));

const TOOTH_NUMBERS = [];
for (let q = 1; q <= 4; q++) for (let t = 1; t <= 8; t++) TOOTH_NUMBERS.push(`${q}${t}`);

export default function MarkerEditor({ src, markers = [], onChange, title = "" }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [imgLoaded, setImgLoaded] = useState(false);
    const imgRef = useRef(null);

    // Editing state
    const [dragging, setDragging] = useState(null); // index of marker being dragged
    const [addMode, setAddMode] = useState(false);
    const [editIdx, setEditIdx] = useState(null);
    const [editForm, setEditForm] = useState({ dis_no: "11", tedavi_tipi: "kron", etiket: "" });

    // Load image
    useEffect(() => {
        if (!src) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imgRef.current = img;
            setImgLoaded(true);
        };
        img.onerror = () => setImgLoaded(false);
        img.src = src;
    }, [src]);

    // Draw canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        const container = containerRef.current;
        const maxW = container ? container.clientWidth : 600;
        const scale = Math.min(maxW / img.width, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
        setDims({ w, h });

        // Draw image
        ctx.drawImage(img, 0, 0, w, h);

        // Draw markers
        const R = Math.max(14, w * 0.025);
        markers.forEach((m, i) => {
            const color = COLORS[m.tedavi_tipi] || DEFAULT_COLOR;
            const cx = (m.x / 100) * w;
            const cy = (m.y / 100) * h;

            // Highlight selected
            if (editIdx === i) {
                ctx.beginPath();
                ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Circle
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fillStyle = color.fill;
            ctx.fill();
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Tooth number
            ctx.font = `bold ${Math.max(11, w * 0.02)}px 'Outfit', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "rgba(0,0,0,0.6)";
            ctx.lineWidth = 2;
            ctx.strokeText(String(m.dis_no), cx, cy);
            ctx.fillText(String(m.dis_no), cx, cy);

            // Label below
            if (m.etiket) {
                ctx.font = `600 ${Math.max(9, w * 0.014)}px 'Outfit', sans-serif`;
                ctx.fillStyle = color.text;
                ctx.fillText(m.etiket, cx, cy + R + 12);
            }
        });

        // Add mode cursor hint
        if (addMode) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#10B981";
            ctx.font = "bold 14px 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("📍 Marker eklemek için tıklayın", w / 2, 20);
        }
    }, [markers, imgLoaded, addMode, editIdx]);

    useEffect(() => { draw(); }, [draw]);

    // Click handler
    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (addMode) {
            // Add new marker
            const newMarker = { dis_no: "11", x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, tedavi_tipi: "kron", etiket: "" };
            const updated = [...markers, newMarker];
            onChange(updated);
            setAddMode(false);
            setEditIdx(updated.length - 1);
            setEditForm({ dis_no: "11", tedavi_tipi: "kron", etiket: "" });
            return;
        }

        // Check if clicked on existing marker
        const R = Math.max(14, dims.w * 0.025);
        const clickedIdx = markers.findIndex((m) => {
            const mx = (m.x / 100) * dims.w;
            const my = (m.y / 100) * dims.h;
            const px = (x / 100) * dims.w;
            const py = (y / 100) * dims.h;
            return Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < R + 5;
        });

        if (clickedIdx >= 0) {
            setEditIdx(clickedIdx);
            setEditForm({
                dis_no: markers[clickedIdx].dis_no,
                tedavi_tipi: markers[clickedIdx].tedavi_tipi,
                etiket: markers[clickedIdx].etiket || "",
            });
        } else {
            setEditIdx(null);
        }
    };

    // Drag handler
    const handleMouseDown = (e) => {
        if (addMode) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const R = Math.max(14, dims.w * 0.025);
        const idx = markers.findIndex((m) => {
            const mx = (m.x / 100) * dims.w;
            const my = (m.y / 100) * dims.h;
            const px = (x / 100) * dims.w;
            const py = (y / 100) * dims.h;
            return Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < R + 5;
        });
        if (idx >= 0) setDragging(idx);
    };

    const handleMouseMove = (e) => {
        if (dragging === null) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
        const updated = markers.map((m, i) => i === dragging ? { ...m, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : m);
        onChange(updated);
    };

    const handleMouseUp = () => setDragging(null);

    // Edit form handlers
    const updateMarker = (field, value) => {
        if (editIdx === null) return;
        const updated = markers.map((m, i) => i === editIdx ? { ...m, [field]: value } : m);
        onChange(updated);
        setEditForm((f) => ({ ...f, [field]: value }));
    };

    const deleteMarker = () => {
        if (editIdx === null) return;
        onChange(markers.filter((_, i) => i !== editIdx));
        setEditIdx(null);
    };

    return (
        <div className="marker-editor" ref={containerRef}>
            <div className="marker-editor-header">
                <span className="marker-editor-title">{title}</span>
                <div className="marker-editor-actions">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{markers.length} marker</span>
                    <button
                        className={`btn btn-sm ${addMode ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => { setAddMode(!addMode); setEditIdx(null); }}
                    >
                        {addMode ? "❌ İptal" : "📍 Marker Ekle"}
                    </button>
                </div>
            </div>

            <div
                className="marker-editor-canvas-wrap"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{ borderRadius: 8, display: "block", width: "100%", cursor: addMode ? "crosshair" : dragging !== null ? "grabbing" : "default" }}
                />
            </div>

            {/* Edit form for selected marker */}
            {editIdx !== null && editIdx < markers.length && (
                <div className="marker-edit-form">
                    <div className="marker-edit-row">
                        <label>Diş No</label>
                        <select value={editForm.dis_no} onChange={(e) => updateMarker("dis_no", e.target.value)}>
                            {TOOTH_NUMBERS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div className="marker-edit-row">
                        <label>Tedavi</label>
                        <select value={editForm.tedavi_tipi} onChange={(e) => updateMarker("tedavi_tipi", e.target.value)}>
                            {TREATMENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="marker-edit-row">
                        <label>Etiket</label>
                        <input
                            type="text"
                            value={editForm.etiket}
                            onChange={(e) => updateMarker("etiket", e.target.value)}
                            placeholder="ör: Çürük, Kırık"
                            maxLength={30}
                        />
                    </div>
                    <div className="marker-edit-row">
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            x: {markers[editIdx].x.toFixed(1)}% y: {markers[editIdx].y.toFixed(1)}%
                        </span>
                        <button className="btn btn-sm" style={{ color: "var(--danger)" }} onClick={deleteMarker}>🗑️ Sil</button>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="marker-editor-legend">
                {TREATMENT_TYPES.map((t) => (
                    <span key={t.key} className="marker-legend-item">
                        <span className="marker-legend-dot" style={{ background: COLORS[t.key].stroke }}></span>
                        {t.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
