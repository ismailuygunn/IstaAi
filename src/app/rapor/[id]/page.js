"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnotatedPhoto from "@/components/AnnotatedPhoto";

const EXPECTATION_LABELS = {
    full_crown: "👑 Full Kaplama Kron",
    monolithic: "💎 Monolitik Kron",
    veneer: "✨ Laminate Veneer",
    implant: "🔩 İmplant",
    bridge: "🌉 Köprü Protez",
    composite: "🎨 Kompozit Bonding",
    whitening: "⚪ Diş Beyazlatma",
    orthodontic: "😁 Ortodonti",
};

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

function getToothClass(toothNum, disList) {
    if (!disList?.length) return "healthy";
    const dis = disList.find((d) => String(d.dis_no) === String(toothNum));
    if (!dis) return "healthy";
    const cat = (dis.kategori || "").toLowerCase();
    if (cat === "crown" || cat === "bridge") return "crown-needed";
    if (cat === "veneer") return "veneer-candidate";
    if (cat === "implant" || cat === "missing") return "implant-needed";
    if (cat === "canal") return "canal-risk";
    return "healthy";
}

function ToothMap({ disList }) {
    return (
        <div className="tooth-map-container">
            <h4>Diş Haritası (FDI)</h4>
            <div className="tooth-map">
                <div className="tooth-row">
                    <span className="jaw-label">Üst Sağ</span>
                    {UPPER_RIGHT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`}>{n}</div>)}
                    {UPPER_LEFT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`}>{n}</div>)}
                    <span className="jaw-label" style={{ textAlign: "left", marginLeft: 8, marginRight: 0 }}>Üst Sol</span>
                </div>
                <div className="tooth-row">
                    <span className="jaw-label">Alt Sağ</span>
                    {LOWER_RIGHT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`}>{n}</div>)}
                    {LOWER_LEFT.map((n) => <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`}>{n}</div>)}
                    <span className="jaw-label" style={{ textAlign: "left", marginLeft: 8, marginRight: 0 }}>Alt Sol</span>
                </div>
            </div>
            <div className="tooth-map-legend">
                <div className="legend-item"><div className="legend-dot healthy"></div>Sağlıklı</div>
                <div className="legend-item"><div className="legend-dot crown"></div>Kron</div>
                <div className="legend-item"><div className="legend-dot veneer"></div>Veneer</div>
                <div className="legend-item"><div className="legend-dot implant"></div>İmplant</div>
                <div className="legend-item"><div className="legend-dot canal"></div>Kanal</div>
            </div>
        </div>
    );
}

function SeverityBadge({ level }) {
    const labels = { iyi: "İyi", dusuk: "Düşük", orta: "Orta", kotu: "Kötü", yuksek: "Yüksek" };
    const classes = { iyi: "low", dusuk: "low", orta: "medium", kotu: "high", yuksek: "high" };
    return <span className={`severity-badge ${classes[level] || "medium"}`}>{labels[level] || level}</span>;
}

function CollapsibleSection({ icon, title, subtitle, badge, children, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`report-section ${isOpen ? "open" : "collapsed"}`}>
            <div className="report-section-header clickable" onClick={() => setIsOpen(!isOpen)}>
                <div className="report-section-icon blue">{icon}</div>
                <div style={{ flex: 1 }}>
                    <div className="report-section-title">{title} {badge}</div>
                    {subtitle && <div className="report-section-subtitle">{subtitle}</div>}
                </div>
                <div className={`collapse-arrow ${isOpen ? "open" : ""}`}>▼</div>
            </div>
            <div className={`report-section-body ${isOpen ? "open" : ""}`}>{children}</div>
        </div>
    );
}

// Notes component
function NotesPanel({ analysisId, section }) {
    const notes = useQuery(api.notes.getByAnalysis, { analysisId });
    const createNote = useMutation(api.notes.create);
    const removeNote = useMutation(api.notes.remove);
    const [input, setInput] = useState("");
    const [showForm, setShowForm] = useState(false);
    const sectionNotes = (notes || []).filter((n) => n.section === section);

    const handleAdd = async () => {
        if (!input.trim()) return;
        await createNote({ analysisId, section, content: input.trim() });
        setInput("");
        setShowForm(false);
    };

    return (
        <div className="notes-panel">
            {sectionNotes.map((note) => (
                <div key={note._id} className="note-item">
                    <span className="note-content">📝 {note.content}</span>
                    <button className="note-delete" onClick={() => removeNote({ id: note._id })}>✕</button>
                </div>
            ))}
            {showForm ? (
                <div className="note-form">
                    <input type="text" className="form-input" placeholder="Not yazın..." value={input}
                        onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
                    <button className="btn btn-sm btn-primary" onClick={handleAdd}>Kaydet</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setShowForm(false); setInput(""); }}>İptal</button>
                </div>
            ) : (
                <button className="note-add-btn" onClick={() => setShowForm(true)}>+ Not Ekle</button>
            )}
        </div>
    );
}

// getMarkers: extract markers from foto_bulgular for a specific photo index
function getMarkers(fotoBulgular, photoIndex) {
    if (!fotoBulgular?.length) return [];
    const item = fotoBulgular.find((f) => f.foto_no === photoIndex + 1);
    return item?.isaret || item?.bulgular || [];
}

const thStyle = { textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "10px 12px", color: "var(--text-secondary)", verticalAlign: "top" };

export default function RaporPage() {
    const params = useParams();
    const router = useRouter();
    const record = useQuery(api.analyses.getById, params.id ? { id: params.id } : "skip");
    const [shareToast, setShareToast] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    if (record === undefined) return (<><Navbar /><div className="loading-container"><h2 className="loading-text">Rapor Yükleniyor...</h2></div></>);
    if (record === null) return (<><Navbar /><div className="loading-container"><h2 className="loading-text">Rapor Bulunamadı</h2><button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => router.push("/analiz")}>Yeni Analiz</button></div></>);

    let a = {};
    try { a = JSON.parse(record.analysisResult); } catch { a = {}; }

    const handlePDF = async () => {
        setPdfLoading(true);
        try {
            const res = await fetch("/api/pdf-export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record, analysis: a }) });
            if (!res.ok) throw new Error("PDF oluşturulamadı");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `ISTADENTAL_${record.patientName?.replace(/\s/g, "_")}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) { alert("PDF hatası: " + err.message); }
        setPdfLoading(false);
    };

    const handleShare = () => {
        const url = `${window.location.origin}/paylas/${params.id}`;
        navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 3000);
    };

    return (
        <>
            <Navbar />
            <div className="report-container">
                {/* Header */}
                <div className="report-header">
                    <h1>🦷 Dental Analiz Raporu</h1>
                    <p style={{ color: "var(--text-secondary)" }}>İSTADENTAL AI — Gemini 3.1 Pro</p>
                    <div className="report-patient-info">
                        <div className="report-patient-tag"><span className="label">Hasta:</span> {record.patientName}</div>
                        <div className="report-patient-tag"><span className="label">Yaş:</span> {record.patientAge}</div>
                        <div className="report-patient-tag"><span className="label">Cinsiyet:</span> {record.patientGender}</div>
                        <div className="report-patient-tag"><span className="label">Tarih:</span> {new Date(record.createdAt).toLocaleDateString("tr-TR")}</div>
                    </div>
                    {record.expectations?.length > 0 && (
                        <div className="report-expectations">
                            <span className="report-exp-label">Beklentiler:</span>
                            <div className="report-exp-tags">
                                {record.expectations.map((id) => <span key={id} className="report-exp-tag">{EXPECTATION_LABELS[id] || id}</span>)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Fotoğraflar + AI İşaretlemeleri */}
                {record.resolvedPhotos?.length > 0 && (
                    <CollapsibleSection icon="📸" title="Fotoğraflar ve AI Bulguları" subtitle={`${record.resolvedPhotos.length} fotoğraf analiz edildi`}>
                        <div className="annotated-photos-grid">
                            {record.resolvedPhotos.map((photo, idx) => (
                                <AnnotatedPhoto
                                    key={idx}
                                    src={photo.url}
                                    title={photo.title}
                                    markers={getMarkers(a.foto_bulgular, idx)}
                                />
                            ))}
                        </div>
                        <NotesPanel analysisId={record._id} section="fotograflar" />
                    </CollapsibleSection>
                )}

                {/* Genel Değerlendirme */}
                {a.genel_degerlendirme && (
                    <CollapsibleSection icon="🔍" title="Genel Değerlendirme" badge={<SeverityBadge level={a.genel_degerlendirme.seviye} />} subtitle={a.genel_degerlendirme.ozet}>
                        <div className="report-content">
                            <p>{a.genel_degerlendirme.detay}</p>
                            {a.genel_degerlendirme.okluzyon && <p style={{ marginTop: 8 }}><strong>Oklüzyon:</strong> {a.genel_degerlendirme.okluzyon}</p>}
                        </div>
                        <ToothMap disList={a.dis_dis_analiz} />
                        <NotesPanel analysisId={record._id} section="genel" />
                    </CollapsibleSection>
                )}

                {/* Sorunlu Dişler */}
                {a.dis_dis_analiz?.length > 0 && (
                    <CollapsibleSection icon="🗺️" title="Sorunlu Dişler" subtitle={`${a.dis_dis_analiz.length} diş`} defaultOpen={false}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead><tr style={{ borderBottom: "1px solid var(--border-subtle)" }}><th style={thStyle}>Diş</th><th style={thStyle}>Durum</th><th style={thStyle}>Tedavi</th><th style={thStyle}>Öncelik</th></tr></thead>
                                <tbody>
                                    {a.dis_dis_analiz.map((d, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                            <td style={tdStyle}><span className={`tooth-tag ${(d.kategori || "").toLowerCase()}`}>{d.dis_no}</span></td>
                                            <td style={tdStyle}>{d.durum}</td>
                                            <td style={tdStyle}>{d.tedavi || d.tedavi_onerisi}</td>
                                            <td style={tdStyle}><SeverityBadge level={d.oncelik} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <NotesPanel analysisId={record._id} section="disler" />
                    </CollapsibleSection>
                )}

                {/* Protetik */}
                {(a.kron_tedavisi || a.veneer_tedavisi) && (
                    <CollapsibleSection icon="👑" title="Protetik Değerlendirme" subtitle="Kron & Veneer Detay">
                        <div className="report-content">
                            {a.kron_tedavisi && (
                                <div className="plan-block">
                                    <h4>👑 Kron {a.kron_tedavisi.uygunluk ? <span style={{ color: "var(--success)" }}> ✅</span> : <span style={{ color: "var(--danger)" }}> ❌</span>}</h4>
                                    {a.kron_tedavisi.uygun_disler?.length > 0 && <div className="tooth-list" style={{ marginBottom: 8 }}>{a.kron_tedavisi.uygun_disler.map((d, i) => <span key={i} className="tooth-tag crown">{d}</span>)}</div>}
                                    {a.kron_tedavisi.malzeme && <p><strong>Malzeme:</strong> {a.kron_tedavisi.malzeme}</p>}
                                    {a.kron_tedavisi.kesim && <p><strong>Kesim:</strong> {a.kron_tedavisi.kesim}</p>}
                                    {a.kron_tedavisi.kanal_riski && <p className="risk-text">⚠️ {a.kron_tedavisi.kanal_riski}</p>}
                                </div>
                            )}
                            {a.veneer_tedavisi && (
                                <div className="plan-block">
                                    <h4>✨ Veneer {a.veneer_tedavisi.uygunluk ? <span style={{ color: "var(--success)" }}> ✅</span> : <span style={{ color: "var(--danger)" }}> ❌</span>}</h4>
                                    {a.veneer_tedavisi.uygun_disler?.length > 0 && <div className="tooth-list" style={{ marginBottom: 8 }}>{a.veneer_tedavisi.uygun_disler.map((d, i) => <span key={i} className="tooth-tag veneer">{d}</span>)}</div>}
                                    {a.veneer_tedavisi.prep_tipi && <p><strong>Prep:</strong> {a.veneer_tedavisi.prep_tipi}</p>}
                                    {a.veneer_tedavisi.mine_durumu && <p><strong>Mine Durumu:</strong> {a.veneer_tedavisi.mine_durumu}</p>}
                                    {a.veneer_tedavisi.not && <p>{a.veneer_tedavisi.not}</p>}
                                </div>
                            )}
                        </div>
                        <NotesPanel analysisId={record._id} section="protetik" />
                    </CollapsibleSection>
                )}

                {/* Kanal Tedavisi Riski */}
                {a.kanal_tedavisi_riski?.riskli_disler?.length > 0 && (
                    <CollapsibleSection icon="🔬" title="Kanal Tedavisi Riski" badge={<SeverityBadge level={a.kanal_tedavisi_riski.risk_seviyesi} />} defaultOpen={false}>
                        <div className="report-content">
                            {a.kanal_tedavisi_riski.riskli_disler.map((d, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                    <span className="tooth-tag canal">{d.dis_no}</span><span style={{ fontSize: "0.85rem" }}>{d.risk}</span>
                                </div>
                            ))}
                        </div>
                        <NotesPanel analysisId={record._id} section="kanal" />
                    </CollapsibleSection>
                )}

                {/* İmplant */}
                {a.implant_degerlendirme?.gerekli && (
                    <CollapsibleSection icon="🔩" title="İmplant Değerlendirme" defaultOpen={false}>
                        <div className="report-content">
                            {(a.implant_degerlendirme.bolgeler || []).map((b, i) => (
                                <div key={i} className="implant-row">
                                    <span className="tooth-tag implant">{b.dis_no}</span>
                                    <div>
                                        <span style={{ fontSize: "0.85rem" }}>{b.oneri}</span>
                                        {b.cerrahi && b.cerrahi !== "yok" && <div className="risk-text" style={{ fontSize: "0.8rem" }}>🏥 {b.cerrahi}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <NotesPanel analysisId={record._id} section="implant" />
                    </CollapsibleSection>
                )}

                {/* ÖNERİLEN PLAN — Primary */}
                {a.onerilen_plan && (
                    <div className="recommended-plan-card">
                        <div className="rp-header">
                            <div className="rp-icon">⭐</div>
                            <div>
                                <h3>{a.onerilen_plan.baslik || "Önerilen Tedavi Planı"}</h3>
                                <p className="rp-subtitle">Toplam <strong>{a.onerilen_plan.toplam_dis_sayisi}</strong> üye · Tahmini <strong>{a.onerilen_plan.tahmini_seans}</strong> seans</p>
                            </div>
                        </div>

                        {a.onerilen_plan.dis_araliklari && (
                            <div className="rp-ranges">
                                <span className="rp-ranges-label">📐 Diş Aralıkları:</span>
                                <span>{a.onerilen_plan.dis_araliklari}</span>
                            </div>
                        )}

                        <div className="rp-details">
                            {a.onerilen_plan.full_kaplama && (
                                <div className="rp-detail-section">
                                    <h4>👑 Full Kaplama</h4>
                                    {a.onerilen_plan.full_kaplama.anterior && <p><strong>Anterior:</strong> {a.onerilen_plan.full_kaplama.anterior}</p>}
                                    {a.onerilen_plan.full_kaplama.posterior && <p><strong>Posterior:</strong> {a.onerilen_plan.full_kaplama.posterior}</p>}
                                </div>
                            )}
                            {a.onerilen_plan.kanal_tedavisi && (
                                <div className="rp-detail-row"><span className="rp-label canal-label">🔬 Kanal</span><span>{a.onerilen_plan.kanal_tedavisi}</span></div>
                            )}
                            {a.onerilen_plan.implant && (
                                <div className="rp-detail-row"><span className="rp-label implant-label">🔩 İmplant</span><span>{a.onerilen_plan.implant}</span></div>
                            )}
                            {a.onerilen_plan.cerrahi && (
                                <div className="rp-detail-row"><span className="rp-label cerrahi-label">🏥 Cerrahi</span><span>{a.onerilen_plan.cerrahi}</span></div>
                            )}
                        </div>

                        {a.onerilen_plan.notlar && (
                            <div className="rp-notes">📋 {a.onerilen_plan.notlar}</div>
                        )}
                        <NotesPanel analysisId={record._id} section="onerilen_plan" />
                    </div>
                )}

                {/* Tedavi Planı Adımları */}
                {a.tedavi_plani?.adimlar?.length > 0 && (
                    <CollapsibleSection icon="📋" title="Tedavi Adımları" subtitle={`Tahmini ${a.tedavi_plani.toplam_tahmini_seans || "?"} seans`} defaultOpen={false}>
                        <div className="report-content">
                            <div className="treatment-timeline">
                                {a.tedavi_plani.adimlar.map((adim, i) => (
                                    <div key={i} className="treatment-item">
                                        <div className="priority">{adim.oncelik === "yuksek" ? "🔴" : adim.oncelik === "orta" ? "🟡" : "🟢"} Adım {adim.sira}</div>
                                        <h4>{adim.baslik}</h4><p>{adim.aciklama}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <NotesPanel analysisId={record._id} section="tedavi" />
                    </CollapsibleSection>
                )}

                {/* Alternatif Planlar */}
                {a.alternatif_planlar?.length > 0 && (
                    <CollapsibleSection icon="🎯" title="Alternatif Planlar" subtitle="Farklı senaryolar" defaultOpen={false}>
                        <div className="alt-plans-grid">
                            {a.alternatif_planlar.map((plan, i) => (
                                <div key={i} className="alt-plan-card">
                                    <div className="alt-plan-header">
                                        <span className="alt-plan-name">{plan.plan_adi}</span>
                                        {plan.toplam_dis_sayisi && <span className="alt-plan-badge">{plan.toplam_dis_sayisi} üye</span>}
                                        <span className="alt-plan-seans">{plan.tahmini_seans} seans</span>
                                    </div>
                                    <p className="alt-plan-ozet">{plan.ozet}</p>
                                    {plan.detaylar && (
                                        <div className="alt-plan-details">
                                            {plan.detaylar.veneer && <div className="alt-plan-row"><span className="alt-label veneer-label">Veneer</span><span>{plan.detaylar.veneer}</span></div>}
                                            {plan.detaylar.kron && <div className="alt-plan-row"><span className="alt-label crown-label">Kron</span><span>{plan.detaylar.kron}</span></div>}
                                            {plan.detaylar.implant && <div className="alt-plan-row"><span className="alt-label implant-label">İmplant</span><span>{plan.detaylar.implant}</span></div>}
                                            {plan.detaylar.kanal && <div className="alt-plan-row"><span className="alt-label canal-label">Kanal</span><span>{plan.detaylar.kanal}</span></div>}
                                            {plan.detaylar.cerrahi && <div className="alt-plan-row"><span className="alt-label cerrahi-label">Cerrahi</span><span>{plan.detaylar.cerrahi}</span></div>}
                                            {plan.detaylar.diger && <div className="alt-plan-row"><span className="alt-label other-label">Diğer</span><span>{plan.detaylar.diger}</span></div>}
                                        </div>
                                    )}
                                    <div className="alt-plan-pros-cons">
                                        {plan.avantaj && <div className="alt-pro">✅ {plan.avantaj}</div>}
                                        {plan.dezavantaj && <div className="alt-con">⚠️ {plan.dezavantaj}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Disclaimer */}
                <div className="report-disclaimer">
                    <div className="report-disclaimer-icon">⚠️</div>
                    <p><strong>Önemli:</strong> Bu rapor AI ön değerlendirmesidir. Tedavi kararları diş hekimi muayenesi sonrasında verilmelidir.</p>
                </div>

                {/* Actions */}
                <div className="report-actions">
                    <button className="btn btn-secondary" onClick={handlePDF} disabled={pdfLoading}>{pdfLoading ? "⏳ Oluşturuluyor..." : "📥 PDF İndir"}</button>
                    <button className="btn btn-secondary" onClick={handleShare}>🔗 Paylaş</button>
                    <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Yazdır</button>
                    <button className="btn btn-secondary" onClick={() => router.push("/gecmis")}>📂 Geçmiş</button>
                    <button className="btn btn-primary" onClick={() => router.push("/analiz")}>🔄 Yeni Analiz</button>
                </div>
            </div>

            {shareToast && <div className="toast-notification">✅ Paylaşım linki panoya kopyalandı!</div>}
            <Footer />
        </>
    );
}
