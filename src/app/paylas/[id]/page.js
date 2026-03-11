"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

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

function SeverityBadge({ level }) {
    const labels = { iyi: "İyi", dusuk: "Düşük", orta: "Orta", kotu: "Kötü", yuksek: "Yüksek" };
    const classes = { iyi: "low", dusuk: "low", orta: "medium", kotu: "high", yuksek: "high" };
    return <span className={`severity-badge ${classes[level] || "medium"}`}>{labels[level] || level}</span>;
}

export default function PaylasPage() {
    const params = useParams();
    const record = useQuery(api.analyses.getById, params.id ? { id: params.id } : "skip");

    if (record === undefined) {
        return (
            <div className="share-page">
                <div className="loading-container" style={{ minHeight: "60vh" }}>
                    <h2 className="loading-text">Rapor Yükleniyor...</h2>
                </div>
            </div>
        );
    }

    if (record === null) {
        return (
            <div className="share-page">
                <div className="loading-container" style={{ minHeight: "60vh" }}>
                    <h2 className="loading-text">Rapor Bulunamadı</h2>
                    <p className="loading-subtext">Bu paylaşım linki geçersiz veya rapor silinmiş olabilir.</p>
                </div>
            </div>
        );
    }

    let a = {};
    try { a = JSON.parse(record.analysisResult); } catch { a = {}; }

    return (
        <div className="share-page">
            <div className="share-header">
                <div className="share-logo">🦷 İSTADENTAL</div>
                <div className="share-subtitle">AI Destekli Dental Analiz Raporu</div>
            </div>

            <div className="share-container">
                {/* Hasta Bilgileri */}
                <div className="share-patient">
                    <h2>{record.patientName}</h2>
                    <div className="share-patient-meta">
                        <span>Yaş: {record.patientAge}</span>
                        <span>Cinsiyet: {record.patientGender}</span>
                        <span>Tarih: {new Date(record.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <p className="share-complaint">{record.complaint}</p>
                    {record.expectations?.length > 0 && (
                        <div className="share-expectations">
                            {record.expectations.map((id) => (
                                <span key={id} className="report-exp-tag">{EXPECTATION_LABELS[id] || id}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fotoğraflar */}
                {record.resolvedPhotos?.length > 0 && (
                    <div className="share-section">
                        <h3>📸 Analiz Edilen Fotoğraflar</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                            {record.resolvedPhotos.map((photo, idx) => (
                                <div key={idx} style={{ position: "relative" }}>
                                    <img
                                        src={photo.url}
                                        alt={photo.title}
                                        style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}
                                    />
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, textAlign: "center" }}>
                                        {photo.title}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Genel Değerlendirme */}
                {a.genel_degerlendirme && (
                    <div className="share-section">
                        <h3>🔍 Genel Değerlendirme <SeverityBadge level={a.genel_degerlendirme.seviye} /></h3>
                        <p>{a.genel_degerlendirme.detay || a.genel_degerlendirme.ozet}</p>
                        {a.genel_degerlendirme.okluzyon && (
                            <p style={{ marginTop: 6 }}><strong>Oklüzyon:</strong> {a.genel_degerlendirme.okluzyon}</p>
                        )}
                    </div>
                )}

                {/* Sorunlu Dişler */}
                {a.dis_dis_analiz?.length > 0 && (
                    <div className="share-section">
                        <h3>🗺️ Sorunlu Dişler ({a.dis_dis_analiz.length})</h3>
                        <div style={{ overflowX: "auto" }}>
                            <table className="share-table">
                                <thead>
                                    <tr><th>Diş</th><th>Durum</th><th>Tedavi</th><th>Öncelik</th></tr>
                                </thead>
                                <tbody>
                                    {a.dis_dis_analiz.map((d, i) => (
                                        <tr key={i}>
                                            <td><strong>{d.dis_no}</strong></td>
                                            <td>{d.durum}</td>
                                            <td>{d.tedavi || d.tedavi_onerisi}</td>
                                            <td><SeverityBadge level={d.oncelik} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Önerilen Plan */}
                {a.onerilen_plan && (
                    <div className="share-section" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, padding: 20 }}>
                        <h3>⭐ {a.onerilen_plan.baslik}</h3>
                        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                            {a.onerilen_plan.toplam_dis_sayisi && (
                                <div><strong>Toplam:</strong> {a.onerilen_plan.toplam_dis_sayisi} diş işlemi</div>
                            )}
                            {a.onerilen_plan.dis_araliklari && (
                                <div><strong>Aralıklar:</strong> {a.onerilen_plan.dis_araliklari}</div>
                            )}
                            {a.onerilen_plan.full_kaplama?.anterior && (
                                <div>👑 <strong>Anterior:</strong> {a.onerilen_plan.full_kaplama.anterior}</div>
                            )}
                            {a.onerilen_plan.full_kaplama?.posterior && (
                                <div>👑 <strong>Posterior:</strong> {a.onerilen_plan.full_kaplama.posterior}</div>
                            )}
                            {a.onerilen_plan.kanal_tedavisi && (
                                <div>🔶 <strong>Kanal:</strong> {a.onerilen_plan.kanal_tedavisi}</div>
                            )}
                            {a.onerilen_plan.implant && (
                                <div>🔩 <strong>İmplant:</strong> {a.onerilen_plan.implant}</div>
                            )}
                            {a.onerilen_plan.cerrahi && (
                                <div>🟣 <strong>Cerrahi:</strong> {a.onerilen_plan.cerrahi}</div>
                            )}
                            {a.onerilen_plan.tahmini_seans && (
                                <div style={{ fontWeight: 600, marginTop: 4 }}>📋 Tahmini {a.onerilen_plan.tahmini_seans} seans</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tedavi Planı */}
                {a.tedavi_plani?.adimlar?.length > 0 && (
                    <div className="share-section">
                        <h3>📋 Tedavi Planı (Tahmini {a.tedavi_plani.toplam_tahmini_seans || "?"} seans)</h3>
                        {a.tedavi_plani.adimlar.map((adim, i) => (
                            <div key={i} className="share-step">
                                <span className="share-step-num">{adim.sira}</span>
                                <div>
                                    <strong>{adim.baslik}</strong>
                                    <p>{adim.aciklama}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Alternatif Planlar */}
                {a.alternatif_planlar?.length > 0 && (
                    <div className="share-section">
                        <h3>🎯 Alternatif Tedavi Planları</h3>
                        {a.alternatif_planlar.map((plan, i) => (
                            <div key={i} className={`alt-plan-card ${i === 0 ? "recommended" : ""}`} style={{ marginBottom: 12 }}>
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
                            </div>
                        ))}
                    </div>
                )}

                <div className="share-disclaimer">
                    ⚠️ Bu rapor yapay zeka destekli ön değerlendirme niteliğindedir ve kesin tanı yerine geçmez.
                    Tedavi kararları mutlaka diş hekimi muayenesi sonrasında verilmelidir.
                </div>

                <div className="share-footer">
                    <p>İSTADENTAL AI Dental Analiz © 2026</p>
                </div>
            </div>
        </div>
    );
}
