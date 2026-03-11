"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MarkerEditor from "./MarkerEditor";

const TREATMENT_CATEGORIES = [
    { key: "crown", label: "Kron" },
    { key: "veneer", label: "Veneer" },
    { key: "implant", label: "İmplant" },
    { key: "canal", label: "Kanal" },
    { key: "missing", label: "Eksik Diş" },
    { key: "bridge", label: "Köprü" },
];

const PRIORITY_OPTIONS = [
    { key: "yuksek", label: "Yüksek" },
    { key: "orta", label: "Orta" },
    { key: "dusuk", label: "Düşük" },
];

const TOOTH_NUMBERS = [];
for (let q = 1; q <= 4; q++) for (let t = 1; t <= 8; t++) TOOTH_NUMBERS.push(`${q}${t}`);

export default function CorrectionPanel({ record, analysis, onClose }) {
    const saveCorrection = useMutation(api.training.saveCorrection);
    const existingCorrection = useQuery(
        api.training.getByAnalysis,
        record?._id ? { analysisId: record._id } : "skip"
    );

    // State for each section
    const [genelSeviye, setGenelSeviye] = useState("orta");
    const [genelDetay, setGenelDetay] = useState("");
    const [genelOkluzyon, setGenelOkluzyon] = useState("");
    const [disAnaliz, setDisAnaliz] = useState([]);
    const [tedaviAdimlar, setTedaviAdimlar] = useState([]);
    const [photoMarkers, setPhotoMarkers] = useState({}); // { foto_idx: [markers] }
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    // Initialize from AI result or existing correction
    useEffect(() => {
        const source = existingCorrection
            ? JSON.parse(existingCorrection.correctedResult)
            : analysis;
        if (!source) return;

        const gd = source.genel_degerlendirme || {};
        setGenelSeviye(gd.seviye || "orta");
        setGenelDetay(gd.detay || gd.ozet || "");
        setGenelOkluzyon(gd.okluzyon || "");

        setDisAnaliz((source.dis_dis_analiz || []).map((d, i) => ({ ...d, _key: i })));

        setTedaviAdimlar((source.tedavi_plani?.adimlar || []).map((a, i) => ({ ...a, _key: i })));

        // Load markers
        const markerData = existingCorrection
            ? JSON.parse(existingCorrection.correctedMarkers || "{}")
            : {};
        if (Object.keys(markerData).length > 0) {
            setPhotoMarkers(markerData);
        } else {
            // Initialize from AI foto_bulgular
            const fm = {};
            (source.foto_bulgular || []).forEach((fb) => {
                const idx = (fb.foto_no || 1) - 1;
                fm[idx] = (fb.isaret || []).map((m) => ({
                    dis_no: String(m.dis_no),
                    x: m.x,
                    y: m.y,
                    tedavi_tipi: m.tedavi_tipi || "kron",
                    etiket: m.etiket || "",
                }));
            });
            setPhotoMarkers(fm);
        }
    }, [analysis, existingCorrection]);

    // Build corrected JSON
    const buildCorrectedResult = () => {
        return JSON.stringify({
            ...analysis,
            genel_degerlendirme: {
                ...analysis?.genel_degerlendirme,
                seviye: genelSeviye,
                detay: genelDetay,
                okluzyon: genelOkluzyon,
            },
            dis_dis_analiz: disAnaliz.map(({ _key, ...d }) => d),
            tedavi_plani: {
                ...analysis?.tedavi_plani,
                adimlar: tedaviAdimlar.map(({ _key, ...a }) => a),
                toplam_tahmini_seans: tedaviAdimlar.reduce((s, a) => s + (parseInt(a.tahmini_seans) || 0), 0) || analysis?.tedavi_plani?.toplam_tahmini_seans,
            },
            // Keep other sections from original
            foto_bulgular: Object.entries(photoMarkers).map(([idx, markers]) => ({
                foto_no: parseInt(idx) + 1,
                foto_tipi: analysis?.foto_bulgular?.[parseInt(idx)]?.foto_tipi || "frontal",
                isaret: markers,
            })),
        });
    };

    const handleSave = async (status) => {
        if (!record?._id) return;
        setSaving(true);
        setSaveMsg("");

        try {
            await saveCorrection({
                analysisId: record._id,
                originalResult: record.analysisResult,
                correctedResult: buildCorrectedResult(),
                correctedMarkers: JSON.stringify(photoMarkers),
                patientName: record.patientName,
                patientAge: record.patientAge,
                patientGender: record.patientGender,
                complaint: record.complaint,
                dentalHistory: record.dentalHistory || undefined,
                existingTreatments: record.existingTreatments || undefined,
                expectations: record.expectations || undefined,
                photoStorageIds: record.photoStorageIds || [],
                status,
            });
            setSaveMsg(status === "approved" ? "✅ Eğitim verisi olarak onaylandı!" : "💾 Taslak kaydedildi");
        } catch (err) {
            setSaveMsg("❌ Hata: " + err.message);
        }
        setSaving(false);
    };

    // Diş analiz table helpers
    const addDis = () => {
        setDisAnaliz([...disAnaliz, { _key: Date.now(), dis_no: "11", durum: "", kategori: "crown", tedavi: "", oncelik: "orta" }]);
    };
    const updateDis = (idx, field, value) => {
        setDisAnaliz(disAnaliz.map((d, i) => i === idx ? { ...d, [field]: value } : d));
    };
    const removeDis = (idx) => setDisAnaliz(disAnaliz.filter((_, i) => i !== idx));

    // Tedavi adım helpers
    const addAdim = () => {
        setTedaviAdimlar([...tedaviAdimlar, { _key: Date.now(), sira: tedaviAdimlar.length + 1, baslik: "", aciklama: "", tahmini_seans: "1" }]);
    };
    const updateAdim = (idx, field, value) => {
        setTedaviAdimlar(tedaviAdimlar.map((a, i) => i === idx ? { ...a, [field]: value } : a));
    };
    const removeAdim = (idx) => setTedaviAdimlar(tedaviAdimlar.filter((_, i) => i !== idx));

    const photos = record?.resolvedPhotos || [];

    return (
        <div className="correction-panel">
            <div className="correction-header">
                <h2>✏️ Düzelt & Eğit</h2>
                <button className="btn btn-sm btn-secondary" onClick={onClose}>✕ Kapat</button>
            </div>

            {/* Section 1: Photo Markers */}
            {photos.length > 0 && (
                <div className="correction-section">
                    <h3>📸 Fotoğraf İşaretleme</h3>
                    <p className="correction-hint">Fotoğrafa tıklayarak marker ekleyin, sürükleyerek taşıyın, seçip düzenleyin</p>
                    <div className="correction-photos-grid">
                        {photos.map((photo, idx) => (
                            <MarkerEditor
                                key={idx}
                                src={photo.url}
                                title={photo.title}
                                markers={photoMarkers[idx] || []}
                                onChange={(newMarkers) => setPhotoMarkers({ ...photoMarkers, [idx]: newMarkers })}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2: Genel Değerlendirme */}
            <div className="correction-section">
                <h3>🔍 Genel Değerlendirme</h3>
                <div className="correction-form-grid">
                    <div className="correction-field">
                        <label>Seviye</label>
                        <select value={genelSeviye} onChange={(e) => setGenelSeviye(e.target.value)}>
                            <option value="iyi">✅ İyi</option>
                            <option value="orta">⚠️ Orta</option>
                            <option value="kotu">❌ Kötü</option>
                        </select>
                    </div>
                    <div className="correction-field">
                        <label>Oklüzyon</label>
                        <input type="text" value={genelOkluzyon} onChange={(e) => setGenelOkluzyon(e.target.value)} placeholder="Angle sınıfı, overjet, overbite..." />
                    </div>
                    <div className="correction-field full-width">
                        <label>Detay</label>
                        <textarea rows={3} value={genelDetay} onChange={(e) => setGenelDetay(e.target.value)} placeholder="Genel değerlendirme detayı..." />
                    </div>
                </div>
            </div>

            {/* Section 3: Diş Diş Analiz */}
            <div className="correction-section">
                <h3>🦷 Diş Diş Analiz <button className="btn btn-sm btn-secondary" onClick={addDis}>➕ Diş Ekle</button></h3>
                <div className="correction-table-wrap">
                    <table className="correction-table">
                        <thead>
                            <tr><th>Diş</th><th>Durum</th><th>Kategori</th><th>Tedavi</th><th>Öncelik</th><th></th></tr>
                        </thead>
                        <tbody>
                            {disAnaliz.map((d, i) => (
                                <tr key={d._key}>
                                    <td>
                                        <select value={d.dis_no} onChange={(e) => updateDis(i, "dis_no", e.target.value)}>
                                            {TOOTH_NUMBERS.map((n) => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </td>
                                    <td><input type="text" value={d.durum || ""} onChange={(e) => updateDis(i, "durum", e.target.value)} placeholder="Durum" /></td>
                                    <td>
                                        <select value={d.kategori || "crown"} onChange={(e) => updateDis(i, "kategori", e.target.value)}>
                                            {TREATMENT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                        </select>
                                    </td>
                                    <td><input type="text" value={d.tedavi || d.tedavi_onerisi || ""} onChange={(e) => updateDis(i, "tedavi", e.target.value)} placeholder="Tedavi önerisi" /></td>
                                    <td>
                                        <select value={d.oncelik || "orta"} onChange={(e) => updateDis(i, "oncelik", e.target.value)}>
                                            {PRIORITY_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                                        </select>
                                    </td>
                                    <td><button className="btn-icon-sm" onClick={() => removeDis(i)}>🗑️</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {disAnaliz.length === 0 && <p className="correction-empty">Henüz diş eklenmedi</p>}
                </div>
            </div>

            {/* Section 4: Tedavi Planı */}
            <div className="correction-section">
                <h3>📋 Tedavi Planı <button className="btn btn-sm btn-secondary" onClick={addAdim}>➕ Adım Ekle</button></h3>
                {tedaviAdimlar.map((a, i) => (
                    <div key={a._key} className="correction-step-card">
                        <div className="correction-step-num">{i + 1}</div>
                        <div className="correction-step-fields">
                            <input type="text" value={a.baslik || ""} onChange={(e) => updateAdim(i, "baslik", e.target.value)} placeholder="Başlık" />
                            <textarea rows={2} value={a.aciklama || ""} onChange={(e) => updateAdim(i, "aciklama", e.target.value)} placeholder="Açıklama" />
                            <div className="correction-step-meta">
                                <input type="number" min="1" max="20" value={a.tahmini_seans || "1"} onChange={(e) => updateAdim(i, "tahmini_seans", e.target.value)} style={{ width: 60 }} />
                                <span>seans</span>
                                <button className="btn-icon-sm" onClick={() => removeAdim(i)}>🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
                {tedaviAdimlar.length === 0 && <p className="correction-empty">Henüz tedavi adımı eklenmedi</p>}
            </div>

            {/* Section 5: Save */}
            <div className="correction-save-bar">
                {saveMsg && <span className="correction-save-msg">{saveMsg}</span>}
                <button className="btn btn-secondary" onClick={() => handleSave("draft")} disabled={saving}>
                    {saving ? "⏳" : "💾"} Taslak Kaydet
                </button>
                <button className="btn btn-primary" onClick={() => handleSave("approved")} disabled={saving}>
                    {saving ? "⏳" : "✅"} Onayla & Eğitim Verisi Yap
                </button>
            </div>
        </div>
    );
}
