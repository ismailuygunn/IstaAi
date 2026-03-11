"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

function ToothMap({ disList }) {
    return (
        <div className="tooth-map-container">
            <h4>Diş Haritası (FDI Numaralama)</h4>
            <div className="tooth-map">
                <div className="tooth-row">
                    <span className="jaw-label">Üst Sağ</span>
                    {UPPER_RIGHT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={`Diş ${n}`}>{n}</div>
                    ))}
                    {UPPER_LEFT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={`Diş ${n}`}>{n}</div>
                    ))}
                    <span className="jaw-label" style={{ textAlign: "left", marginLeft: 8, marginRight: 0 }}>Üst Sol</span>
                </div>
                <div className="tooth-row">
                    <span className="jaw-label">Alt Sağ</span>
                    {LOWER_RIGHT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={`Diş ${n}`}>{n}</div>
                    ))}
                    {LOWER_LEFT.map((n) => (
                        <div key={n} className={`tooth-cell ${getToothClass(n, disList)}`} title={`Diş ${n}`}>{n}</div>
                    ))}
                    <span className="jaw-label" style={{ textAlign: "left", marginLeft: 8, marginRight: 0 }}>Alt Sol</span>
                </div>
            </div>
            <div className="tooth-map-legend">
                <div className="legend-item"><div className="legend-dot healthy"></div>Sağlıklı</div>
                <div className="legend-item"><div className="legend-dot crown"></div>Kron</div>
                <div className="legend-item"><div className="legend-dot veneer"></div>Veneer</div>
                <div className="legend-item"><div className="legend-dot implant"></div>İmplant</div>
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
                    {subtitle && <div className="report-section-subtitle">{subtitle}</div>}
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
                    {record.expectations && record.expectations.length > 0 && (
                        <div className="report-expectations">
                            <span className="report-exp-label">Tedavi Beklentileri:</span>
                            <div className="report-exp-tags">
                                {record.expectations.map((id) => (
                                    <span key={id} className="report-exp-tag">{EXPECTATION_LABELS[id] || id}</span>
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
                    >
                        <div className="report-content"><p>{a.genel_degerlendirme.detay}</p></div>
                        <ToothMap disList={a.dis_dis_analiz} />
                    </CollapsibleSection>
                )}

                {/* Diş Diş Analiz — compact table */}
                {a.dis_dis_analiz && a.dis_dis_analiz.length > 0 && (
                    <CollapsibleSection
                        icon="🗺️" iconColor="blue"
                        title="Sorunlu Dişler"
                        subtitle={`${a.dis_dis_analiz.length} diş tedavi gerektiriyor`}
                        defaultOpen={false}
                    >
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                        <th style={thStyle}>Diş</th><th style={thStyle}>Durum</th><th style={thStyle}>Tedavi</th><th style={thStyle}>Öncelik</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {a.dis_dis_analiz.map((dis, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                            <td style={tdStyle}><span className={`tooth-tag ${(dis.kategori || "").toLowerCase()}`}>{dis.dis_no}</span></td>
                                            <td style={tdStyle}>{dis.durum}</td>
                                            <td style={tdStyle}>{dis.tedavi || dis.tedavi_onerisi}</td>
                                            <td style={tdStyle}><SeverityBadge level={dis.oncelik} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CollapsibleSection>
                )}

                {/* Kron & Veneer — combined compact */}
                {(a.kron_tedavisi || a.veneer_tedavisi) && (
                    <CollapsibleSection
                        icon="👑" iconColor="blue"
                        title="Protetik Değerlendirme"
                        subtitle="Kron & Veneer uygunluğu"
                    >
                        <div className="report-content">
                            {a.kron_tedavisi && (
                                <div className="plan-block">
                                    <h4>👑 Kron Tedavisi {a.kron_tedavisi.uygunluk ?
                                        <span style={{ color: "var(--success)", fontSize: "0.85rem" }}> ✅ Uygun</span> :
                                        <span style={{ color: "var(--danger)", fontSize: "0.85rem" }}> ❌ Uygun Değil</span>}
                                    </h4>
                                    {a.kron_tedavisi.uygun_disler?.length > 0 && (
                                        <div className="tooth-list" style={{ marginBottom: 8 }}>
                                            {a.kron_tedavisi.uygun_disler.map((d, i) => <span key={i} className="tooth-tag crown">{d}</span>)}
                                        </div>
                                    )}
                                    {a.kron_tedavisi.malzeme && <p><strong>Malzeme:</strong> {a.kron_tedavisi.malzeme}</p>}
                                    {a.kron_tedavisi.kanal_riski && <p className="risk-text">⚠️ {a.kron_tedavisi.kanal_riski}</p>}
                                </div>
                            )}
                            {a.veneer_tedavisi && (
                                <div className="plan-block">
                                    <h4>✨ Veneer Tedavisi {a.veneer_tedavisi.uygunluk ?
                                        <span style={{ color: "var(--success)", fontSize: "0.85rem" }}> ✅ Uygun</span> :
                                        <span style={{ color: "var(--danger)", fontSize: "0.85rem" }}> ❌ Uygun Değil</span>}
                                    </h4>
                                    {a.veneer_tedavisi.uygun_disler?.length > 0 && (
                                        <div className="tooth-list" style={{ marginBottom: 8 }}>
                                            {a.veneer_tedavisi.uygun_disler.map((d, i) => <span key={i} className="tooth-tag veneer">{d}</span>)}
                                        </div>
                                    )}
                                    {a.veneer_tedavisi.prep_tipi && <p><strong>Prep:</strong> {a.veneer_tedavisi.prep_tipi}</p>}
                                    {a.veneer_tedavisi.not && <p>{a.veneer_tedavisi.not}</p>}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Kanal Riski */}
                {a.kanal_tedavisi_riski && a.kanal_tedavisi_riski.riskli_disler?.length > 0 && (
                    <CollapsibleSection
                        icon="🔬" iconColor="yellow"
                        title="Kanal Tedavisi Riski"
                        badge={<SeverityBadge level={a.kanal_tedavisi_riski.risk_seviyesi} />}
                        defaultOpen={false}
                    >
                        <div className="report-content">
                            {a.kanal_tedavisi_riski.riskli_disler.map((d, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                    <span className="tooth-tag canal">{d.dis_no}</span>
                                    <span style={{ fontSize: "0.85rem" }}>{d.risk}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* İmplant */}
                {a.implant_degerlendirme && a.implant_degerlendirme.gerekli && (
                    <CollapsibleSection
                        icon="🔩" iconColor="red"
                        title="İmplant Değerlendirmesi"
                        badge={<span style={{ color: "var(--warning)", fontSize: "0.85rem" }}>⚠️ İmplant Gerekli</span>}
                        defaultOpen={false}
                    >
                        <div className="report-content">
                            {a.implant_degerlendirme.bolgeler?.map((b, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                    <span className="tooth-tag implant">{b.dis_no}</span>
                                    <span style={{ fontSize: "0.85rem" }}>{b.oneri}</span>
                                </div>
                            ))}
                            {/* backward compat for old format */}
                            {a.implant_degerlendirme.gerekli_bolgeler?.map((b, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                    <span className="tooth-tag implant">{b.dis_no}</span>
                                    <span style={{ fontSize: "0.85rem" }}>{b.oneri}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Tedavi Planı */}
                {a.tedavi_plani && a.tedavi_plani.adimlar?.length > 0 && (
                    <CollapsibleSection
                        icon="📋" iconColor="blue"
                        title="Tedavi Planı"
                        subtitle={`Tahmini ${a.tedavi_plani.toplam_tahmini_seans || "?"} seans`}
                    >
                        <div className="report-content">
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
                        </div>
                    </CollapsibleSection>
                )}

                {/* ★ ALTERNATİF PLANLAR — new section */}
                {a.alternatif_planlar && a.alternatif_planlar.length > 0 && (
                    <CollapsibleSection
                        icon="🎯" iconColor="blue"
                        title="Alternatif Tedavi Planları"
                        subtitle="Farklı tedavi senaryoları"
                        defaultOpen={true}
                    >
                        <div className="alt-plans-grid">
                            {a.alternatif_planlar.map((plan, i) => (
                                <div key={i} className={`alt-plan-card ${i === 0 ? "recommended" : ""}`}>
                                    <div className="alt-plan-header">
                                        <span className="alt-plan-name">{plan.plan_adi}</span>
                                        {i === 0 && <span className="alt-plan-badge">Önerilen</span>}
                                        <span className="alt-plan-seans">{plan.tahmini_seans} seans</span>
                                    </div>
                                    <p className="alt-plan-ozet">{plan.ozet}</p>
                                    {plan.detaylar && (
                                        <div className="alt-plan-details">
                                            {plan.detaylar.veneer && <div className="alt-plan-row"><span className="alt-label veneer-label">Veneer</span><span>{plan.detaylar.veneer}</span></div>}
                                            {plan.detaylar.kron && <div className="alt-plan-row"><span className="alt-label crown-label">Kron</span><span>{plan.detaylar.kron}</span></div>}
                                            {plan.detaylar.implant && <div className="alt-plan-row"><span className="alt-label implant-label">İmplant</span><span>{plan.detaylar.implant}</span></div>}
                                            {plan.detaylar.kanal && <div className="alt-plan-row"><span className="alt-label canal-label">Kanal</span><span>{plan.detaylar.kanal}</span></div>}
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
                    <div>
                        <p>
                            <strong>Önemli Uyarı:</strong> Bu rapor yapay zeka destekli bir ön değerlendirme niteliğindedir
                            ve kesin tanı yerine geçmez. Tedavi kararları mutlaka bir diş hekimi muayenesi sonrasında verilmelidir.
                        </p>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Yazdır</button>
                    <button className="btn btn-secondary" onClick={() => router.push("/gecmis")}>📂 Geçmiş</button>
                    <button className="btn btn-primary" onClick={() => router.push("/analiz")}>🔄 Yeni Analiz</button>
                </div>
            </div>
            <Footer />
        </>
    );
}
