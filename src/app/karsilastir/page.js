"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

function getToothClass(toothNum, disList) {
    if (!disList?.length) return "healthy";
    const dis = disList.find((d) => String(d.dis_no) === String(toothNum));
    if (!dis) return "healthy";
    const cat = (dis.kategori || "").toLowerCase();
    if (cat === "crown") return "crown-needed";
    if (cat === "veneer") return "veneer-candidate";
    if (cat === "implant" || cat === "missing") return "implant-needed";
    if (cat === "canal") return "canal-risk";
    return "healthy";
}

function MiniToothMap({ disList, label }) {
    return (
        <div>
            <h4 style={{ fontSize: "0.85rem", marginBottom: 8, color: "var(--text-muted)" }}>{label}</h4>
            <div className="tooth-map" style={{ fontSize: "0.65rem" }}>
                <div className="tooth-row">
                    {UPPER_RIGHT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} style={{ width: 22, height: 22, fontSize: "0.6rem" }}>{n}</div>)}
                    {UPPER_LEFT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} style={{ width: 22, height: 22, fontSize: "0.6rem" }}>{n}</div>)}
                </div>
                <div className="tooth-row">
                    {LOWER_RIGHT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} style={{ width: 22, height: 22, fontSize: "0.6rem" }}>{n}</div>)}
                    {LOWER_LEFT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} style={{ width: 22, height: 22, fontSize: "0.6rem" }}>{n}</div>)}
                </div>
            </div>
        </div>
    );
}

function SeverityBadge({ level }) {
    const labels = { iyi: "İyi", orta: "Orta", kotu: "Kötü" };
    const classes = { iyi: "low", orta: "medium", kotu: "high" };
    return <span className={`severity-badge ${classes[level] || "medium"}`}>{labels[level] || level}</span>;
}

export default function KarsilastirPage() {
    const analyses = useQuery(api.analyses.getAll);
    const [leftId, setLeftId] = useState("");
    const [rightId, setRightId] = useState("");

    const leftRecord = useMemo(() => analyses?.find((a) => a._id === leftId), [analyses, leftId]);
    const rightRecord = useMemo(() => analyses?.find((a) => a._id === rightId), [analyses, rightId]);

    const leftData = useMemo(() => {
        if (!leftRecord) return null;
        try { return JSON.parse(leftRecord.analysisResult); } catch { return null; }
    }, [leftRecord]);

    const rightData = useMemo(() => {
        if (!rightRecord) return null;
        try { return JSON.parse(rightRecord.analysisResult); } catch { return null; }
    }, [rightRecord]);

    return (
        <>
            <Navbar />
            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>🔍 Analiz Karşılaştırma</h1>
                    <p>İki analizi yan yana karşılaştırın</p>
                </div>

                {analyses === undefined && (
                    <div className="card" style={{ textAlign: "center", padding: 48 }}>
                        <p style={{ color: "var(--text-secondary)" }}>Yükleniyor...</p>
                    </div>
                )}

                {analyses && analyses.length < 2 && (
                    <div className="card" style={{ textAlign: "center", padding: 48 }}>
                        <p style={{ color: "var(--text-secondary)" }}>Karşılaştırma için en az 2 analiz gereklidir.</p>
                    </div>
                )}

                {analyses && analyses.length >= 2 && (
                    <>
                        {/* Selectors */}
                        <div className="compare-selectors">
                            <div className="compare-select-box">
                                <label>📋 Sol Analiz</label>
                                <select className="form-input" value={leftId} onChange={(e) => setLeftId(e.target.value)}>
                                    <option value="">Analiz seçin...</option>
                                    {analyses.filter((a) => a._id !== rightId).map((a) => (
                                        <option key={a._id} value={a._id}>{a.patientName} — {new Date(a.createdAt).toLocaleDateString("tr-TR")}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="compare-vs">VS</div>
                            <div className="compare-select-box">
                                <label>📋 Sağ Analiz</label>
                                <select className="form-input" value={rightId} onChange={(e) => setRightId(e.target.value)}>
                                    <option value="">Analiz seçin...</option>
                                    {analyses.filter((a) => a._id !== leftId).map((a) => (
                                        <option key={a._id} value={a._id}>{a.patientName} — {new Date(a.createdAt).toLocaleDateString("tr-TR")}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Comparison */}
                        {leftData && rightData && (
                            <div className="compare-grid">
                                {/* Headers */}
                                <div className="compare-col">
                                    <div className="compare-header">
                                        <h3>{leftRecord.patientName}</h3>
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(leftRecord.createdAt).toLocaleDateString("tr-TR")}</span>
                                    </div>
                                </div>
                                <div className="compare-col">
                                    <div className="compare-header">
                                        <h3>{rightRecord.patientName}</h3>
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(rightRecord.createdAt).toLocaleDateString("tr-TR")}</span>
                                    </div>
                                </div>

                                {/* Gen. Değerlendirme */}
                                <div className="compare-col">
                                    <div className="compare-section">
                                        <h4>Genel Durum</h4>
                                        <SeverityBadge level={leftData.genel_degerlendirme?.seviye} />
                                        <p>{leftData.genel_degerlendirme?.ozet}</p>
                                    </div>
                                </div>
                                <div className="compare-col">
                                    <div className="compare-section">
                                        <h4>Genel Durum</h4>
                                        <SeverityBadge level={rightData.genel_degerlendirme?.seviye} />
                                        <p>{rightData.genel_degerlendirme?.ozet}</p>
                                    </div>
                                </div>

                                {/* Tooth Maps */}
                                <div className="compare-col">
                                    <MiniToothMap disList={leftData.dis_dis_analiz} label={`Sorunlu: ${leftData.dis_dis_analiz?.length || 0} diş`} />
                                </div>
                                <div className="compare-col">
                                    <MiniToothMap disList={rightData.dis_dis_analiz} label={`Sorunlu: ${rightData.dis_dis_analiz?.length || 0} diş`} />
                                </div>

                                {/* Treatments summary */}
                                <div className="compare-col">
                                    <div className="compare-section">
                                        <h4>Tedavi Özeti</h4>
                                        {leftData.kron_tedavisi?.uygunluk && <p>👑 Kron: {leftData.kron_tedavisi.uygun_disler?.join(", ")}</p>}
                                        {leftData.veneer_tedavisi?.uygunluk && <p>✨ Veneer: {leftData.veneer_tedavisi.uygun_disler?.join(", ")}</p>}
                                        {leftData.implant_degerlendirme?.gerekli && <p>🔩 İmplant gerekli</p>}
                                        <p style={{ marginTop: 8 }}>📋 Toplam {leftData.tedavi_plani?.toplam_tahmini_seans || "?"} seans</p>
                                    </div>
                                </div>
                                <div className="compare-col">
                                    <div className="compare-section">
                                        <h4>Tedavi Özeti</h4>
                                        {rightData.kron_tedavisi?.uygunluk && <p>👑 Kron: {rightData.kron_tedavisi.uygun_disler?.join(", ")}</p>}
                                        {rightData.veneer_tedavisi?.uygunluk && <p>✨ Veneer: {rightData.veneer_tedavisi.uygun_disler?.join(", ")}</p>}
                                        {rightData.implant_degerlendirme?.gerekli && <p>🔩 İmplant gerekli</p>}
                                        <p style={{ marginTop: 8 }}>📋 Toplam {rightData.tedavi_plani?.toplam_tahmini_seans || "?"} seans</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </>
    );
}
