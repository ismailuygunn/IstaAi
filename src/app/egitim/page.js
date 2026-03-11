"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const STATUS_LABELS = { draft: "📝 Taslak", approved: "✅ Onaylı" };
const STATUS_COLORS = {
    draft: { bg: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" },
    approved: { bg: "rgba(16, 185, 129, 0.12)", color: "#10B981" },
};

export default function EgitimPage() {
    const stats = useQuery(api.training.getStats);
    const allData = useQuery(api.training.getAll);
    const approve = useMutation(api.training.approve);
    const revertToDraft = useMutation(api.training.revertToDraft);
    const remove = useMutation(api.training.remove);

    const [filter, setFilter] = useState("all");
    const [exporting, setExporting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const filtered = (allData || []).filter((d) =>
        filter === "all" ? true : d.status === filter
    );

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/training-export");
            if (!res.ok) throw new Error("Export başarısız");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `istadental_training_${new Date().toISOString().slice(0, 10)}.jsonl`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export hatası: " + err.message);
        }
        setExporting(false);
    };

    return (
        <>
            <Navbar />
            <div className="page-container" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 64px" }}>
                <h1 style={{ marginBottom: 8 }}>🧠 Eğitim Verisi Yönetimi</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                    Doktor düzeltmelerini yönetin ve Google AI Studio için JSONL export yapın
                </p>

                {/* Stats */}
                <div className="training-stats">
                    <div className="training-stat-card">
                        <div className="training-stat-num">{stats?.total ?? "—"}</div>
                        <div className="training-stat-label">Toplam Kayıt</div>
                    </div>
                    <div className="training-stat-card" style={{ borderColor: "#10B981" }}>
                        <div className="training-stat-num" style={{ color: "#10B981" }}>{stats?.approved ?? "—"}</div>
                        <div className="training-stat-label">✅ Onaylı (Eğitime Hazır)</div>
                    </div>
                    <div className="training-stat-card" style={{ borderColor: "#F59E0B" }}>
                        <div className="training-stat-num" style={{ color: "#F59E0B" }}>{stats?.draft ?? "—"}</div>
                        <div className="training-stat-label">📝 Taslak</div>
                    </div>
                </div>

                {/* Progress + Export */}
                {(stats?.approved || 0) > 0 && (
                    <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                            <strong>{stats.approved}/50 örnek</strong>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginLeft: 8 }}>
                                {stats.approved >= 50 ? "✅ Fine-tuning için yeterli!" : `(${50 - stats.approved} daha gerekli)`}
                            </span>
                            <div style={{ marginTop: 8, height: 6, background: "var(--bg-glass)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%",
                                    width: `${Math.min(100, (stats.approved / 50) * 100)}%`,
                                    background: stats.approved >= 50 ? "#10B981" : "var(--primary)",
                                    borderRadius: 4,
                                    transition: "width 0.5s ease",
                                }} />
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                            {exporting ? "⏳ Hazırlanıyor..." : "📥 JSONL İndir"}
                        </button>
                    </div>
                )}

                {/* Filter */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {[
                        { key: "all", label: "Tümü" },
                        { key: "approved", label: "✅ Onaylı" },
                        { key: "draft", label: "📝 Taslak" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "2rem", marginBottom: 12 }}>📭</p>
                        <p>Henüz eğitim verisi yok</p>
                        <p style={{ fontSize: "0.82rem", marginTop: 8 }}>
                            Rapor sayfasında "✏️ Düzelt & Eğit" butonunu kullanarak eğitim verisi oluşturabilirsiniz
                        </p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        <table className="training-table">
                            <thead>
                                <tr>
                                    <th>Hasta</th>
                                    <th>Durum</th>
                                    <th>Tarih</th>
                                    <th style={{ textAlign: "right" }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => {
                                    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.draft;
                                    return (
                                        <tr key={item._id}>
                                            <td>
                                                <strong>{item.patientName}</strong>
                                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                                    {item.patientAge}y, {item.patientGender} — {item.complaint?.slice(0, 40)}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: "3px 10px",
                                                    borderRadius: "var(--radius-full)",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    background: sc.bg,
                                                    color: sc.color,
                                                }}>
                                                    {STATUS_LABELS[item.status] || item.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: "0.8rem" }}>
                                                {new Date(item.updatedAt).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                                    {item.status === "draft" ? (
                                                        <button className="btn btn-sm btn-primary" onClick={() => approve({ id: item._id })}>✅ Onayla</button>
                                                    ) : (
                                                        <button className="btn btn-sm btn-secondary" onClick={() => revertToDraft({ id: item._id })}>↩️ Taslak</button>
                                                    )}
                                                    {confirmDelete === item._id ? (
                                                        <>
                                                            <button className="btn btn-sm" style={{ color: "var(--danger)" }} onClick={() => { remove({ id: item._id }); setConfirmDelete(null); }}>Evet</button>
                                                            <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDelete(null)}>İptal</button>
                                                        </>
                                                    ) : (
                                                        <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDelete(item._id)}>🗑️</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* AI Studio Link */}
                <div className="card" style={{ marginTop: 24, textAlign: "center" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
                        JSONL dosyasını indirdikten sonra Google AI Studio'da fine-tune başlatın
                    </p>
                    <a href="https://aistudio.google.com/app/tuned_models/new" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        🚀 Google AI Studio'ya Git
                    </a>
                </div>
            </div>
            <Footer />
        </>
    );
}
