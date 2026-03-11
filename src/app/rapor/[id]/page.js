"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Treatment Labels
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

// FDI tooth numbers
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

function getToothClass(toothNum, disList) {
    if (!disList || !Array.isArray(disList)) return "";
    const dis = disList.find((d) => String(d.dis_no) === String(toothNum));
    if (!dis) return "healthy";
    const cat = (dis.kategori || "").toLowerCase();
    if (cat === "crown") return "crown-needed";
    if (cat === "veneer") return "veneer-candidate";
    if (cat === "implant" || cat === "missing") return "implant-needed";
    if (cat === "canal") return "canal-risk";
    return "healthy";
}

function getToothTooltip(toothNum, disList) {
    if (!disList || !Array.isArray(disList)) return `Diş ${toothNum}`;
    const dis = disList.find((d) => String(d.dis_no) === String(toothNum));
    if (!dis) return `Diş ${toothNum} — Sağlıklı`;
    return `Diş ${toothNum} — ${dis.durum || ""} | ${dis.tedavi_onerisi || ""}`;
}

function ToothMap({ disList }) {
    return (
        <div className="tooth-map-container">
            <h4>Diş Haritası (FDI Numaralama)</h4>
            <div className="tooth-map">
                <div className="tooth-row">
                    <span className="jaw-label">Üst Sağ</span>
                    {UPPER_RIGHT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={getToothTooltip(n, disList)}>{n}</div>
                    ))}
                    {UPPER_LEFT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={getToothTooltip(n, disList)}>{n}</div>
                    ))}
                    <span className="jaw-label" style={{ textAlign: "left", marginLeft: 8, marginRight: 0 }}>Üst Sol</span>
                </div>
                <div className="tooth-row">
                    <span className="jaw-label">Alt Sağ</span>
                    {LOWER_RIGHT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={getToothTooltip(n, disList)}>{n}</div>
                    ))}
                    {LOWER_LEFT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={getToothTooltip(n, disList)}>{n}</div>
                    ))}
                    <span className="jaw-label" style={{ textAlign: "left", marginLeft: 8, marginRight: 0 }}>Alt Sol</span>
                </div>
            </div>
            <div className="tooth-map-legend">
                <div className="legend-item"><div className="legend-dot healthy"></div>Sağlıklı</div>
                <div className="legend-item"><div className="legend-dot crown"></div>Kron Gerekli</div>
                <div className="legend-item"><div className="legend-dot veneer"></div>Veneer Uygun</div>
                <div className="legend-item"><div className="legend-dot implant"></div>İmplant Gerekli</div>
                <div className="legend-item"><div className="legend-dot canal"></div>Kanal Riski</div>
            </div>
        </div>
    );
}

function SeverityBadge({ level }) {
    const labels = { iyi: "İyi", dusuk: "Düşük", orta: "Orta", kotu: "Kötü", yuksek: "Yüksek", low: "Düşük", medium: "Orta", high: "Yüksek" };
    const classes = { iyi: "low", dusuk: "low", low: "low", orta: "medium", medium: "medium", kotu: "high", yuksek: "high", high: "high" };
    return <span className={`severity-badge ${classes[level] || "medium"}`}>{labels[level] || level}</span>;
}

function CollapsibleSection({ icon, iconColor, title, subtitle, badge, children, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`report-section ${isOpen ? "open" : "collapsed"}`}>
            <div className="report-section-header clickable" onClick={() => setIsOpen(!isOpen)}>
                <div className={`report-section-icon ${iconColor}`}>{icon}</div>
                <div style={{ flex: 1 }}>
                    <div className="report-section-title">{title} {badge}</div>
                    <div className="report-section-subtitle">{subtitle}</div>
                </div>
                <div className={`collapse-arrow ${isOpen ? "open" : ""}`}>▼</div>
            </div>
            <div className={`report-section-body ${isOpen ? "open" : ""}`}>
                {children}
            </div>
        </div>
    );
}

const thStyle = { textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "10px 12px", color: "var(--text-secondary)", verticalAlign: "top" };

export default function RaporPage() {
    const params = useParams();
    const router = useRouter();
    const record = useQuery(api.analyses.getById, params.id ? { id: params.id } : "skip");

    if (record === undefined) {
        return (
            <>
                <Navbar />
                <div className="loading-container">
                    <div className="loading-tooth">
                        <svg viewBox="0 0 120 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M92 10C72 2 55 8 48 18C38 8 18 0 8 18C-5 40 5 85 15 120C22 145 30 170 45 170C58 170 55 130 50 110C50 110 52 112 55 112C58 112 60 110 60 110C65 130 62 170 75 170C90 170 98 145 105 120C115 85 125 40 112 18C108 12 100 8 92 10Z" fill="#3B82F6" />
                        </svg>
                    </div>
                    <h2 className="loading-text">Rapor Yükleniyor...</h2>
                </div>
            </>
        );
    }

    if (record === null) {
        return (
            <>
                <Navbar />
                <div className="loading-container">
                    <h2 className="loading-text">Rapor Bulunamadı</h2>
                    <p className="loading-subtext">Bu ID ile kayıtlı bir analiz bulunamadı.</p>
                    <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => router.push("/analiz")}>
                        Yeni Analiz Başlat
                    </button>
                </div>
            </>
        );
    }

    let a = {};
    try { a = JSON.parse(record.analysisResult); } catch { a = {}; }

    const handlePrint = () => window.print();
    const handleNewAnalysis = () => router.push("/analiz");

    return (
        <>
            <Navbar />
            <div className="report-container">
                {/* Header */}
                <div className="report-header">
                    <h1>🦷 Dental Analiz Raporu</h1>
                    <p style={{ color: "var(--text-secondary)" }}>İSTADENTAL AI Destekli Analiz — Gemini 3.1 Pro</p>
                    <div className="report-patient-info">
                        <div className="report-patient-tag"><span className="label">Hasta:</span> {record.patientName}</div>
                        <div className="report-patient-tag"><span className="label">Yaş:</span> {record.patientAge}</div>
                        <div className="report-patient-tag"><span className="label">Cinsiyet:</span> {record.patientGender}</div>
                        <div className="report-patient-tag"><span className="label">Tarih:</span> {new Date(record.createdAt).toLocaleDateString("tr-TR")}</div>
                    </div>
                    {record.expectations && record.expectations.length > 0 && (
                        <div className="report-expectations">
                            <span className="report-exp-label">Tedavi Beklentileri:</span>
                            <div className="report-exp-tags">
                                {record.expectations.map((id) => (
                                    <span key={id} className="report-exp-tag">
                                        {EXPECTATION_LABELS[id] || id}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Genel Değerlendirme */}
                {a.genel_degerlendirme && (
                    <CollapsibleSection
                        icon="🔍" iconColor="blue"
                        title="Genel Değerlendirme"
                        badge={<SeverityBadge level={a.genel_degerlendirme.seviye} />}
                        subtitle={a.genel_degerlendirme.ozet}
                        defaultOpen={true}
                    >
                        <div className="report-content"><p>{a.genel_degerlendirme.detay}</p></div>
                        <ToothMap disList={a.dis_dis_analiz} />
                    </CollapsibleSection>
                )}

                {/* Diş Diş Analiz */}
                {a.dis_dis_analiz && a.dis_dis_analiz.length > 0 && (
                    <CollapsibleSection
                        icon="🗺️" iconColor="blue"
                        title="Diş Diş Detaylı Analiz"
                        subtitle={`FDI numaralama sistemi ile ${a.dis_dis_analiz.length} diş değerlendirildi`}
                        defaultOpen={false}
                    >
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                        <th style={thStyle}>Diş No</th><th style={thStyle}>Bölge</th><th style={thStyle}>Durum</th><th style={thStyle}>Tedavi Önerisi</th><th style={thStyle}>Öncelik</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {a.dis_dis_analiz.map((dis, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                            <td style={tdStyle}><span className={`tooth-tag ${(dis.kategori || "").toLowerCase()}`}>{dis.dis_no}</span></td>
                                            <td style={tdStyle}>{dis.bolge}</td>
                                            <td style={tdStyle}>{dis.durum}</td>
                                            <td style={tdStyle}>{dis.tedavi_onerisi}</td>
                                            <td style={tdStyle}><SeverityBadge level={dis.oncelik} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CollapsibleSection>
                )}

                {/* Full Kaplama Planı */}
                {a.full_kaplama_plani && a.full_kaplama_plani.uygunluk && (
                    <CollapsibleSection
                        icon="👑" iconColor="blue"
                        title="Full Kaplama Planı"
                        badge={<span style={{ color: "var(--success)", fontSize: "0.85rem" }}>✅ Uygun</span>}
                        subtitle={`Toplam ${a.full_kaplama_plani.toplam_dis_sayisi || "?"} diş — Tahmini ${a.full_kaplama_plani.tahmini_seans || "?"} seans`}
                        defaultOpen={true}
                    >
                        <div className="report-content">
                            {a.full_kaplama_plani.anterior_plan && (
                                <div className="plan-block">
                                    <h4>🦷 Anterior Bölge (Ön Dişler)</h4>
                                    <p>{a.full_kaplama_plani.anterior_plan}</p>
                                </div>
                            )}
                            {a.full_kaplama_plani.posterior_plan && (
                                <div className="plan-block">
                                    <h4>🦷 Posterior Bölge (Arka Dişler)</h4>
                                    <p>{a.full_kaplama_plani.posterior_plan}</p>
                                </div>
                            )}
                            {a.full_kaplama_plani.malzeme_karsilastirmasi && (
                                <div className="plan-block highlight">
                                    <h4>📊 Malzeme Karşılaştırması</h4>
                                    <p>{a.full_kaplama_plani.malzeme_karsilastirmasi}</p>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Kron Tedavisi */}
                {a.kron_tedavisi && (
                    <CollapsibleSection
                        icon="👑" iconColor="blue"
                        title="Kron Tedavisi Değerlendirmesi"
                        badge={
                            <span style={{ color: a.kron_tedavisi.uygunluk ? "var(--success)" : "var(--danger)", fontSize: "0.85rem" }}>
                                {a.kron_tedavisi.uygunluk ? "✅ Uygun" : "❌ Uygun Değil"}
                            </span>
                        }
                        subtitle="Kron tedavisi fizibilite analizi"
                        defaultOpen={true}
                    >
                        <div className="report-content">
                            <p>{a.kron_tedavisi.detay}</p>
                            {a.kron_tedavisi.uygun_disler?.length > 0 && (
                                <><p style={{ marginTop: 12 }}><strong>Uygun Dişler:</strong></p>
                                    <div className="tooth-list">{a.kron_tedavisi.uygun_disler.map((d, i) => <span key={i} className="tooth-tag crown">{d}</span>)}</div></>
                            )}
                            {a.kron_tedavisi.malzeme_onerisi && <p style={{ marginTop: 12 }}><strong>Malzeme Önerisi:</strong> {a.kron_tedavisi.malzeme_onerisi}</p>}
                            {a.kron_tedavisi.kesim_detayi && <p style={{ marginTop: 8 }}><strong>Kesim Detayı:</strong> {a.kron_tedavisi.kesim_detayi}</p>}
                            {a.kron_tedavisi.riskler && <p style={{ marginTop: 8 }}><strong>Riskler:</strong> {a.kron_tedavisi.riskler}</p>}
                            {a.kron_tedavisi.kanal_tedavisi_riski && (
                                <div className="risk-warning">
                                    ⚠️ <strong>Kanal Tedavisi Riski:</strong> {a.kron_tedavisi.kanal_tedavisi_riski}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Veneer Tedavisi */}
                {a.veneer_tedavisi && (
                    <CollapsibleSection
                        icon="✨" iconColor="green"
                        title="Veneer Tedavisi Değerlendirmesi"
                        badge={
                            <span style={{ color: a.veneer_tedavisi.uygunluk ? "var(--success)" : "var(--danger)", fontSize: "0.85rem" }}>
                                {a.veneer_tedavisi.uygunluk ? "✅ Uygun" : "❌ Uygun Değil"}
                            </span>
                        }
                        subtitle="Laminate veneer fizibilite analizi"
                        defaultOpen={true}
                    >
                        <div className="report-content">
                            <p>{a.veneer_tedavisi.detay}</p>
                            {a.veneer_tedavisi.uygun_disler?.length > 0 && (
                                <><p style={{ marginTop: 12 }}><strong>Uygun Dişler:</strong></p>
                                    <div className="tooth-list">{a.veneer_tedavisi.uygun_disler.map((d, i) => <span key={i} className="tooth-tag veneer">{d}</span>)}</div></>
                            )}
                            {a.veneer_tedavisi.prep_tipi && <p style={{ marginTop: 12 }}><strong>Prep Tipi:</strong> {a.veneer_tedavisi.prep_tipi}</p>}
                            {a.veneer_tedavisi.estetik_beklenti && <p style={{ marginTop: 8 }}><strong>Estetik Beklenti:</strong> {a.veneer_tedavisi.estetik_beklenti}</p>}
                            {a.veneer_tedavisi.kanal_tedavisi_riski && (
                                <div className="risk-warning">
                                    ⚠️ <strong>Kanal Tedavisi Riski:</strong> {a.veneer_tedavisi.kanal_tedavisi_riski}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Kanal Tedavisi Riski */}
                {a.kanal_tedavisi_riski && (
                    <CollapsibleSection
                        icon="🔬" iconColor="yellow"
                        title="Kanal Tedavisi Risk Değerlendirmesi"
                        badge={<SeverityBadge level={a.kanal_tedavisi_riski.risk_seviyesi} />}
                        subtitle="Kesim sırasında pulpa hasarı riski"
                        defaultOpen={false}
                    >
                        <div className="report-content">
                            <p>{a.kanal_tedavisi_riski.aciklama}</p>
                            {a.kanal_tedavisi_riski.riskli_disler?.length > 0 && (
                                <>{a.kanal_tedavisi_riski.riskli_disler.map((d, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                        <span className="tooth-tag canal">{d.dis_no}</span><span style={{ fontSize: "0.85rem" }}>{d.risk}</span>
                                    </div>
                                ))}</>
                            )}
                            {a.kanal_tedavisi_riski.onleyici_tedbirler && (
                                <div style={{ marginTop: 16, padding: 12, background: "var(--info-bg)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
                                    💡 <strong>Önleyici Tedbirler:</strong> {a.kanal_tedavisi_riski.onleyici_tedbirler}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* İmplant Değerlendirme */}
                {a.implant_degerlendirme && (
                    <CollapsibleSection
                        icon="🔩" iconColor="red"
                        title="İmplant / Köprü Değerlendirmesi"
                        badge={
                            <span style={{ color: a.implant_degerlendirme.gerekli ? "var(--warning)" : "var(--success)", fontSize: "0.85rem" }}>
                                {a.implant_degerlendirme.gerekli ? "⚠️ İmplant Gerekli" : "✅ İmplant Gerekmez"}
                            </span>
                        }
                        subtitle="Eksik diş bölgeleri ve restorasyon seçenekleri"
                        defaultOpen={true}
                    >
                        <div className="report-content">
                            <p>{a.implant_degerlendirme.detay}</p>
                            {a.implant_degerlendirme.gerekli_bolgeler?.length > 0 && (
                                <>{a.implant_degerlendirme.gerekli_bolgeler.map((b, i) => (
                                    <div key={i} className="card" style={{ marginTop: 8, padding: 16 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                            <span className="tooth-tag implant">{b.dis_no}</span><strong>{b.bolge}</strong>
                                        </div>
                                        <p style={{ fontSize: "0.85rem", marginBottom: 4 }}><strong>Kemik Durumu:</strong> {b.kemik_durumu}</p>
                                        <p style={{ fontSize: "0.85rem" }}><strong>Öneri:</strong> {b.oneri}</p>
                                    </div>
                                ))}</>
                            )}
                            {a.implant_degerlendirme.kopru_alternatifi && <p style={{ marginTop: 12 }}><strong>Köprü Alternatifi:</strong> {a.implant_degerlendirme.kopru_alternatifi}</p>}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Tedavi Planı */}
                {a.tedavi_plani && (
                    <CollapsibleSection
                        icon="📋" iconColor="blue"
                        title="Tedavi Planı"
                        subtitle={`Tahmini toplam seans: ${a.tedavi_plani.toplam_tahmini_seans || "—"}`}
                        defaultOpen={true}
                    >
                        <div className="report-content">
                            {a.tedavi_plani.adimlar?.length > 0 && (
                                <div className="treatment-timeline">
                                    {a.tedavi_plani.adimlar.map((adim, i) => (
                                        <div key={i} className="treatment-item">
                                            <div className="priority">
                                                {adim.oncelik === "yuksek" ? "🔴" : adim.oncelik === "orta" ? "🟡" : "🟢"} Adım {adim.sira} — {adim.tahmini_seans || "?"} seans
                                            </div>
                                            <h4>{adim.baslik}</h4>
                                            <p>{adim.aciklama}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {a.tedavi_plani.onemli_notlar?.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                    <strong>Önemli Notlar:</strong>
                                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                        {a.tedavi_plani.onemli_notlar.map((not, i) => (
                                            <li key={i} style={{ marginBottom: 4, fontSize: "0.9rem", color: "var(--text-secondary)" }}>{not}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Disclaimer */}
                <div className="report-disclaimer">
                    <div className="report-disclaimer-icon">⚠️</div>
                    <div>
                        <p>
                            <strong>Önemli Uyarı:</strong> Bu rapor yapay zeka destekli bir ön değerlendirme niteliğindedir
                            ve kesin tanı yerine geçmez. Tedavi kararları mutlaka bir diş hekimi muayenesi,
                            klinik değerlendirme ve gerekli radyografik incelemeler sonrasında verilmelidir.
                            İSTADENTAL olarak profesyonel muayene için randevu almanızı öneriyoruz.
                        </p>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Raporu Yazdır</button>
                    <button className="btn btn-secondary" onClick={() => router.push("/gecmis")}>📂 Geçmiş Analizler</button>
                    <button className="btn btn-primary" onClick={handleNewAnalysis}>🔄 Yeni Analiz</button>
                </div>
            </div>
            <Footer />
        </>
    );
}
