"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const EXPECTATION_LABELS = {
    full_crown: "👑 Kron",
    monolithic: "💎 Monolitik",
    veneer: "✨ Veneer",
    implant: "🔩 İmplant",
    bridge: "🌉 Köprü",
    composite: "🎨 Kompozit",
    whitening: "⚪ Beyazlatma",
    orthodontic: "😁 Ortodonti",
};

function getSeverityFromResult(resultStr) {
    try {
        const data = JSON.parse(resultStr);
        return data?.genel_degerlendirme?.seviye || "orta";
    } catch { return "orta"; }
}

function SeverityBadge({ level }) {
    const labels = { iyi: "İyi", orta: "Orta", kotu: "Kötü" };
    const classes = { iyi: "low", orta: "medium", kotu: "high" };
    return <span className={`severity-badge ${classes[level] || "medium"}`}>{labels[level] || level}</span>;
}

export default function GecmisPage() {
    const router = useRouter();
    const analyses = useQuery(api.analyses.getAll);
    const removeAnalysis = useMutation(api.analyses.remove);

    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [viewMode, setViewMode] = useState("list");

    const filtered = useMemo(() => {
        if (!analyses) return [];
        let items = analyses;

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter((a) =>
                a.patientName.toLowerCase().includes(q) ||
                a.complaint.toLowerCase().includes(q)
            );
        }

        // Date filter
        const now = Date.now();
        if (dateFilter === "week") {
            items = items.filter((a) => now - a.createdAt < 7 * 24 * 60 * 60 * 1000);
        } else if (dateFilter === "month") {
            items = items.filter((a) => now - a.createdAt < 30 * 24 * 60 * 60 * 1000);
        }

        return items;
    }, [analyses, search, dateFilter]);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (confirm("Bu analizi silmek istediğinizden emin misiniz?")) {
            await removeAnalysis({ id });
        }
    };

    return (
        <>
            <Navbar />
            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>📂 Geçmiş Analizler</h1>
                    <p>Daha önce yapılan tüm AI dental analizleri</p>
                </div>

                {analyses === undefined && (
                    <div className="card" style={{ textAlign: "center", padding: 48 }}>
                        <p style={{ color: "var(--text-secondary)" }}>Yükleniyor...</p>
                    </div>
                )}

                {analyses && analyses.length === 0 && (
                    <div className="card" style={{ textAlign: "center", padding: 48 }}>
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🦷</div>
                        <h3 style={{ marginBottom: 8 }}>Henüz Analiz Yok</h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>İlk AI dental analizinizi başlatın</p>
                        <Link href="/analiz" className="btn btn-primary">🦷 Analiz Başlat</Link>
                    </div>
                )}

                {analyses && analyses.length > 0 && (
                    <>
                        {/* Toolbar */}
                        <div className="history-toolbar">
                            <div className="history-search">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Hasta adı veya şikayet ara..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                            <div className="history-filters">
                                {["all", "week", "month"].map((f) => (
                                    <button
                                        key={f}
                                        className={`filter-btn ${dateFilter === f ? "active" : ""}`}
                                        onClick={() => setDateFilter(f)}
                                    >
                                        {f === "all" ? "Tümü" : f === "week" ? "Bu Hafta" : "Bu Ay"}
                                    </button>
                                ))}
                            </div>
                            <div className="view-toggle">
                                <button className={`toggle-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>☰</button>
                                <button className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>▦</button>
                            </div>
                        </div>

                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
                            {filtered.length} / {analyses.length} analiz gösteriliyor
                        </p>

                        {/* List View */}
                        {viewMode === "list" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {filtered.map((item) => {
                                    const level = getSeverityFromResult(item.analysisResult);
                                    return (
                                        <div key={item._id} className="history-card" onClick={() => router.push(`/rapor/${item._id}`)}>
                                            <div className="history-card-main">
                                                {item.thumbnailUrl && (
                                                    <img src={item.thumbnailUrl} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                                                )}
                                                <div className="history-card-info">
                                                    <div className="history-card-top">
                                                        <h3>{item.patientName}</h3>
                                                        <SeverityBadge level={level} />
                                                    </div>
                                                    <p className="history-complaint">
                                                        {item.complaint.length > 80 ? item.complaint.slice(0, 80) + "..." : item.complaint}
                                                    </p>
                                                    <div className="history-meta">
                                                        <span className="report-patient-tag"><span className="label">Yaş:</span> {item.patientAge}</span>
                                                        <span className="report-patient-tag"><span className="label">Foto:</span> {item.photoCount}</span>
                                                        <span className="report-patient-tag"><span className="label">Tarih:</span> {new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                                                    </div>
                                                    {item.expectations?.length > 0 && (
                                                        <div className="history-exps">
                                                            {item.expectations.slice(0, 3).map((e) => (
                                                                <span key={e} className="history-exp-tag">{EXPECTATION_LABELS[e] || e}</span>
                                                            ))}
                                                            {item.expectations.length > 3 && <span className="history-exp-tag">+{item.expectations.length - 3}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="history-card-actions">
                                                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); router.push(`/rapor/${item._id}`); }}>Rapor</button>
                                                    <button className="btn btn-sm btn-secondary" style={{ color: "var(--danger)" }} onClick={(e) => handleDelete(item._id, e)}>Sil</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Grid View */}
                        {viewMode === "grid" && (
                            <div className="history-grid">
                                {filtered.map((item) => {
                                    const level = getSeverityFromResult(item.analysisResult);
                                    return (
                                        <div key={item._id} className="history-grid-card" onClick={() => router.push(`/rapor/${item._id}`)}>
                                            {item.thumbnailUrl && (
                                                <img src={item.thumbnailUrl} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: "8px 8px 0 0", marginBottom: 8 }} />
                                            )}
                                            <div className="history-grid-top">
                                                <SeverityBadge level={level} />
                                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                                                </span>
                                            </div>
                                            <h3>{item.patientName}</h3>
                                            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                                                {item.complaint.length > 60 ? item.complaint.slice(0, 60) + "..." : item.complaint}
                                            </p>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {(item.expectations || []).slice(0, 2).map((e) => (
                                                    <span key={e} className="history-exp-tag">{EXPECTATION_LABELS[e] || e}</span>
                                                ))}
                                            </div>
                                            <div className="history-grid-footer">
                                                <span>📸 {item.photoCount}</span>
                                                <span>Yaş: {item.patientAge}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                <div style={{ textAlign: "center", marginTop: 32 }}>
                    <Link href="/analiz" className="btn btn-accent">🦷 Yeni Analiz Başlat</Link>
                </div>
            </div>
            <Footer />
        </>
    );
}
