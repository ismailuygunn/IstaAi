"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TREATMENT_EXPECTATIONS = [
    { id: "full_crown", label: "Full Kaplama Kron", icon: "👑", desc: "Zirkonya, Metal Seramik, E-max" },
    { id: "monolithic", label: "Monolitik Kron", icon: "💎", desc: "Tek parça, dayanıklı kron" },
    { id: "veneer", label: "Laminate Veneer", icon: "✨", desc: "İnce porselen kaplama" },
    { id: "implant", label: "İmplant", icon: "🔩", desc: "Eksik diş yerine titanyum vida" },
    { id: "bridge", label: "Köprü Protez", icon: "🌉", desc: "Komşu dişlere destekli köprü" },
    { id: "composite", label: "Kompozit Bonding", icon: "🎨", desc: "Dolgu ile estetik düzeltme" },
    { id: "whitening", label: "Diş Beyazlatma", icon: "⚪", desc: "Profesyonel beyazlatma" },
    { id: "orthodontic", label: "Ortodonti", icon: "😁", desc: "Diş teli veya şeffaf plak" },
];

const PHOTO_SLOTS = [
    {
        id: "mouth_closed",
        title: "Ağız Tam Kapalı",
        description: "Dişler kapalı, dudaklar geri çekilmiş (önden görünüm)",
        icon: "😬",
        required: true,
        guide: "Dişlerinizi sıkın ve dudaklarınızı parmaklarınızla kenarlara çekin. Tüm ön dişler görünmeli.",
    },
    {
        id: "mouth_open",
        title: "Ağız Yarım Açık",
        description: "Ağız yarı açık, oklüzal ilişki görünür",
        icon: "😮",
        required: true,
        guide: "Ağzınızı yarım açın, alt ve üst dişlerin kapanışı ve ısırma ilişkisi görünsün.",
    },
    {
        id: "lower_jaw",
        title: "Alt Çene Üstten Görünüm",
        description: "Alt çene oklüzal yüzey (ayna ile)",
        icon: "⬇️",
        required: true,
        guide: "Ağzınızı açın, ayna yardımı ile alt çenenizin üstten oklüzal görüntüsünü çekin.",
    },
    {
        id: "upper_jaw",
        title: "Üst Çene Alttan Görünüm",
        description: "Üst çene oklüzal yüzey (ayna ile)",
        icon: "⬆️",
        required: true,
        guide: "Ağzınızı açın, ayna yardımı ile üst çenenizin alttan oklüzal görüntüsünü çekin.",
    },
    {
        id: "xray",
        title: "Röntgen / Panoramik",
        description: "Panoramik röntgen filmi (varsa)",
        icon: "📷",
        required: false,
        guide: "Eğer elinizde panoramik diş röntgeniniz varsa yükleyin. Daha detaylı analiz sağlar.",
    },
];

export default function AnalizPage() {
    const router = useRouter();
    const createAnalysis = useMutation(api.analyses.create);
    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState(null);
    const [stepDirection, setStepDirection] = useState("forward");

    // Patient info
    const [formData, setFormData] = useState({
        fullName: "",
        age: "",
        gender: "",
        complaint: "",
        dentalHistory: "",
        allergies: "",
        existingTreatments: "",
    });

    // Expectations
    const [expectations, setExpectations] = useState([]);

    // Photos
    const [photos, setPhotos] = useState({});
    const fileInputRefs = useRef({});

    // Guide modal
    const [guideModal, setGuideModal] = useState(null);

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleExpectation = (id) => {
        setExpectations((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    // Compress image to max 1200px, JPEG 0.7 quality
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1200;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL("image/jpeg", 0.7);
                resolve(compressed);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handlePhotoDrop = useCallback(async (slotId, e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Lütfen geçerli bir fotoğraf dosyası seçin (JPEG, PNG)");
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert("Dosya boyutu 20MB'den küçük olmalıdır");
            return;
        }

        const compressed = await compressImage(file);
        const preview = URL.createObjectURL(file);
        setPhotos((prev) => ({
            ...prev,
            [slotId]: { file, preview, base64: compressed },
        }));
    }, []);

    const removePhoto = (slotId) => {
        setPhotos((prev) => {
            const next = { ...prev };
            delete next[slotId];
            return next;
        });
    };

    const requiredPhotosReady = PHOTO_SLOTS.filter((s) => s.required).every(
        (s) => photos[s.id]
    );

    const formValid =
        formData.fullName.trim() && formData.age && formData.gender && formData.complaint.trim();

    const goToStep = (target) => {
        setStepDirection(target > step ? "forward" : "backward");
        setStep(target);
    };

    const loadingMessages = [
        "Fotoğraflar yükleniyor ve işleniyor...",
        "FDI numaralama sistemi ile dişler tespit ediliyor...",
        "Frontal ve oklüzal görüntüler çapraz doğrulanıyor...",
        "Kron ve full kaplama uygunluğu değerlendiriliyor...",
        "Veneer fizibilitesi ve estetik analiz yapılıyor...",
        "Kanal tedavisi riskleri hesaplanıyor...",
        "İmplant ve köprü gereksinimleri belirleniyor...",
        "Malzeme karşılaştırmaları oluşturuluyor...",
        "Tedavi planı ve öncelik sıralaması hazırlanıyor...",
        "Kapsamlı rapor oluşturuluyor...",
    ];

    const handleSubmit = async () => {
        setIsAnalyzing(true);
        setError(null);
        setLoadingStep(0);

        const interval = setInterval(() => {
            setLoadingStep((prev) => {
                if (prev < loadingMessages.length - 1) return prev + 1;
                return prev;
            });
        }, 3500);

        try {
            const images = [];
            PHOTO_SLOTS.forEach((slot) => {
                if (photos[slot.id]) {
                    images.push({
                        id: slot.id,
                        title: slot.title,
                        base64: photos[slot.id].base64,
                    });
                }
            });

            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientInfo: formData, images, expectations }),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                let errMsg = "Analiz sırasında bir hata oluştu";
                try {
                    const errData = JSON.parse(errText);
                    errMsg = errData.error || errMsg;
                } catch {
                    if (res.status === 413) errMsg = "Fotoğraflar çok büyük. Daha düşük çözünürlüklü fotoğraflar deneyin.";
                    else if (res.status === 504) errMsg = "Analiz zaman aşımına uğradı. Tekrar deneyin.";
                    else errMsg = `Sunucu hatası (${res.status}): ${errText.slice(0, 100)}`;
                }
                throw new Error(errMsg);
            }

            const data = await res.json();
            clearInterval(interval);

            const analysisId = await createAnalysis({
                patientName: formData.fullName,
                patientAge: formData.age,
                patientGender: formData.gender,
                complaint: formData.complaint,
                dentalHistory: formData.dentalHistory || undefined,
                allergies: formData.allergies || undefined,
                existingTreatments: formData.existingTreatments || undefined,
                expectations: expectations.length > 0 ? expectations : undefined,
                photoCount: images.length,
                photoTypes: images.map((img) => img.id),
                photos: images.map((img) => ({ id: img.id, title: img.title, base64: img.base64 })),
                analysisResult: JSON.stringify(data.analysis),
            });

            router.push(`/rapor/${analysisId}`);
        } catch (err) {
            clearInterval(interval);
            setIsAnalyzing(false);
            setError(err.message);
        }
    };

    // Loading screen
    if (isAnalyzing) {
        const progress = ((loadingStep + 1) / loadingMessages.length) * 100;
        return (
            <>
                <Navbar />
                <div className="loading-container">
                    <div className="loading-tooth">
                        <svg viewBox="0 0 120 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M92 10C72 2 55 8 48 18C38 8 18 0 8 18C-5 40 5 85 15 120C22 145 30 170 45 170C58 170 55 130 50 110C50 110 52 112 55 112C58 112 60 110 60 110C65 130 62 170 75 170C90 170 98 145 105 120C115 85 125 40 112 18C108 12 100 8 92 10Z" fill="#3B82F6" />
                            <path d="M60 110C60 110 58 112 55 112C52 112 50 110 50 110C50 95 48 75 42 58C38 48 30 38 28 48C24 65 32 90 35 105" fill="#60A5FA" opacity="0.4" />
                        </svg>
                    </div>

                    <div className="loading-progress-ring">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGradient)" strokeWidth="6"
                                strokeLinecap="round" strokeDasharray={`${progress * 2.64} 264`}
                                style={{ transition: "stroke-dasharray 0.6s ease", transform: "rotate(-90deg)", transformOrigin: "center" }} />
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#2563EB" />
                                    <stop offset="100%" stopColor="#00D4FF" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="loading-progress-text">{Math.round(progress)}%</span>
                    </div>

                    <h2 className="loading-text">AI Analiz Devam Ediyor</h2>
                    <p className="loading-subtext">
                        Gemini 3.1 Pro fotoğraflarınızı detaylı olarak inceliyor
                    </p>
                    <div className="loading-steps">
                        {loadingMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={`loading-step ${i < loadingStep ? "done" : ""} ${i === loadingStep ? "active" : ""}`}
                            >
                                <span>{i < loadingStep ? "✅" : i === loadingStep ? "⏳" : "⬜"}</span>
                                <span>{msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    const STEP_LABELS = ["Bilgiler", "Beklentiler", "Fotoğraflar", "Analiz"];

    return (
        <>
            <Navbar />

            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>🦷 AI Doktor&apos;a Sor</h1>
                    <p>Kapsamlı diş analizi için bilgilerinizi girin ve fotoğraflarınızı yükleyin</p>
                </div>

                {/* Step Indicator */}
                <div className="step-indicator">
                    {STEP_LABELS.map((label, idx) => {
                        const stepNum = idx + 1;
                        return (
                            <div key={label} style={{ display: "contents" }}>
                                {idx > 0 && (
                                    <div className={`step-line ${step > idx ? "active" : ""}`}></div>
                                )}
                                <div className={`step-dot ${step >= stepNum ? "active" : ""} ${step > stepNum ? "completed" : ""}`}>
                                    <div className="step-dot-circle">{step > stepNum ? "✓" : stepNum}</div>
                                    <span className="step-dot-label">{label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="error-banner">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                        <button className="error-close" onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {/* STEP 1: Patient Info */}
                <div className={`wizard-step ${step === 1 ? "active" : ""} ${step > 1 ? "exit-left" : ""}`}>
                    {step === 1 && (
                        <div className="card animate-in">
                            <h2 className="card-title">
                                <span className="card-title-icon">📋</span>
                                Hasta Bilgileri
                            </h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Ad Soyad <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Adınız ve soyadınız"
                                        value={formData.fullName}
                                        onChange={(e) => handleFormChange("fullName", e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Yaş <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Yaşınız"
                                        min="1"
                                        max="120"
                                        value={formData.age}
                                        onChange={(e) => handleFormChange("age", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Cinsiyet <span className="required">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={(e) => handleFormChange("gender", e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="erkek">Erkek</option>
                                        <option value="kadın">Kadın</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Alerjiler</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Bilinen alerjileriniz (varsa)"
                                        value={formData.allergies}
                                        onChange={(e) => handleFormChange("allergies", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Şikayet / İstek <span className="required">*</span>
                                </label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Örn: Ön dişlerimde estetik görünüm istiyorum, arka dişlerimde çürük var..."
                                    value={formData.complaint}
                                    onChange={(e) => handleFormChange("complaint", e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Dental Geçmiş</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Daha önce yapılan tedaviler, bilinen dental sorunlar..."
                                    value={formData.dentalHistory}
                                    onChange={(e) => handleFormChange("dentalHistory", e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mevcut Tedaviler</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Şu an devam eden tedaviler (varsa)"
                                    value={formData.existingTreatments}
                                    onChange={(e) => handleFormChange("existingTreatments", e.target.value)}
                                />
                            </div>

                            <div className="wizard-actions">
                                <div></div>
                                <button
                                    className="btn btn-primary"
                                    disabled={!formValid}
                                    onClick={() => goToStep(2)}
                                >
                                    Devam →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* STEP 2: Treatment Expectations */}
                <div className={`wizard-step ${step === 2 ? "active" : ""}`}>
                    {step === 2 && (
                        <div className="card animate-in">
                            <h2 className="card-title">
                                <span className="card-title-icon">🎯</span>
                                Tedavi Beklentileri
                            </h2>
                            <p className="card-subtitle">
                                Hangi tedavilerle ilgileniyorsunuz? Birden fazla seçenek işaretleyebilirsiniz.
                                AI analizi seçimlerinize göre özelleştirilecektir.
                            </p>

                            <div className="expectations-grid">
                                {TREATMENT_EXPECTATIONS.map((exp) => (
                                    <button
                                        key={exp.id}
                                        className={`expectation-chip ${expectations.includes(exp.id) ? "selected" : ""}`}
                                        onClick={() => toggleExpectation(exp.id)}
                                    >
                                        <span className="expectation-icon">{exp.icon}</span>
                                        <div className="expectation-info">
                                            <span className="expectation-label">{exp.label}</span>
                                            <span className="expectation-desc">{exp.desc}</span>
                                        </div>
                                        <span className="expectation-check">
                                            {expectations.includes(exp.id) ? "✓" : ""}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {expectations.length > 0 && (
                                <div className="expectations-summary">
                                    <span className="expectations-count">{expectations.length} tedavi seçildi</span>
                                    <div className="expectations-tags">
                                        {expectations.map((id) => {
                                            const exp = TREATMENT_EXPECTATIONS.find((e) => e.id === id);
                                            return (
                                                <span key={id} className="expectation-tag">
                                                    {exp?.icon} {exp?.label}
                                                    <button className="tag-remove" onClick={() => toggleExpectation(id)}>✕</button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="wizard-actions">
                                <button className="btn btn-secondary" onClick={() => goToStep(1)}>
                                    ← Geri
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => goToStep(3)}
                                >
                                    {expectations.length > 0 ? "Devam →" : "Atla →"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* STEP 3: Photo Upload */}
                <div className={`wizard-step ${step === 3 ? "active" : ""}`}>
                    {step === 3 && (
                        <div className="card animate-in">
                            <h2 className="card-title">
                                <span className="card-title-icon">📸</span>
                                Fotoğraf Yükleme
                            </h2>

                            <div className="upload-guide">
                                <h3>💡 İpuçları</h3>
                                <ul>
                                    <li>Net ve iyi aydınlatılmış fotoğraflar daha doğru analiz sağlar</li>
                                    <li>Ağız içi ayna kullanarak alt/üst çene fotoğrafları çekin</li>
                                    <li>Fotoğraflar JPEG veya PNG formatında, max 20MB olmalıdır</li>
                                    <li>Panoramik röntgen yüklenmesi analiz kalitesini artırır</li>
                                </ul>
                            </div>

                            <div className="upload-grid">
                                {PHOTO_SLOTS.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className={`upload-slot ${photos[slot.id] ? "has-image" : ""} ${!slot.required ? "optional" : ""}`}
                                        onClick={() => {
                                            if (!photos[slot.id]) {
                                                fileInputRefs.current[slot.id]?.click();
                                            }
                                        }}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("drag-over"); }}
                                        onDragLeave={(e) => { e.currentTarget.classList.remove("drag-over"); }}
                                        onDrop={(e) => { e.currentTarget.classList.remove("drag-over"); handlePhotoDrop(slot.id, e); }}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={(el) => (fileInputRefs.current[slot.id] = el)}
                                            onChange={(e) => handlePhotoDrop(slot.id, e)}
                                        />

                                        {photos[slot.id] ? (
                                            <>
                                                <img
                                                    src={photos[slot.id].preview}
                                                    alt={slot.title}
                                                    className="upload-preview"
                                                />
                                                <div className="upload-overlay">
                                                    <button
                                                        className="btn-replace"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            fileInputRefs.current[slot.id]?.click();
                                                        }}
                                                    >
                                                        Değiştir
                                                    </button>
                                                    <button
                                                        className="btn-remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removePhoto(slot.id);
                                                        }}
                                                    >
                                                        Kaldır
                                                    </button>
                                                </div>
                                                <div className="upload-success-badge">✓</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="upload-slot-icon">{slot.icon}</div>
                                                <div className="upload-slot-title">{slot.title}</div>
                                                <div className="upload-slot-desc">{slot.description}</div>
                                                <span className={`upload-slot-badge ${slot.required ? "required" : "optional-badge"}`}>
                                                    {slot.required ? "Zorunlu" : "Opsiyonel"}
                                                </span>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    style={{ marginTop: 10, fontSize: '0.75rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setGuideModal(slot);
                                                    }}
                                                >
                                                    📖 Nasıl Çekilir?
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-secondary" onClick={() => goToStep(2)}>
                                    ← Geri
                                </button>
                                <button
                                    className="btn btn-primary"
                                    disabled={!requiredPhotosReady}
                                    onClick={() => goToStep(4)}
                                >
                                    Devam →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* STEP 4: Review & Submit */}
                <div className={`wizard-step ${step === 4 ? "active" : ""}`}>
                    {step === 4 && (
                        <div className="card animate-in">
                            <h2 className="card-title">
                                <span className="card-title-icon">📋</span>
                                Gözden Geçir ve Analiz Başlat
                            </h2>

                            <div className="review-info-card">
                                <div className="review-info-row">
                                    <span className="label">Ad Soyad</span>
                                    <span className="value">{formData.fullName}</span>
                                </div>
                                <div className="review-info-row">
                                    <span className="label">Yaş</span>
                                    <span className="value">{formData.age}</span>
                                </div>
                                <div className="review-info-row">
                                    <span className="label">Cinsiyet</span>
                                    <span className="value">{formData.gender}</span>
                                </div>
                                <div className="review-info-row">
                                    <span className="label">Şikayet / İstek</span>
                                    <span className="value">{formData.complaint}</span>
                                </div>
                                {formData.dentalHistory && (
                                    <div className="review-info-row">
                                        <span className="label">Dental Geçmiş</span>
                                        <span className="value">{formData.dentalHistory}</span>
                                    </div>
                                )}
                                {formData.allergies && (
                                    <div className="review-info-row">
                                        <span className="label">Alerjiler</span>
                                        <span className="value">{formData.allergies}</span>
                                    </div>
                                )}
                            </div>

                            {expectations.length > 0 && (
                                <>
                                    <h3 className="review-section-title">🎯 Tedavi Beklentileri</h3>
                                    <div className="review-expectations">
                                        {expectations.map((id) => {
                                            const exp = TREATMENT_EXPECTATIONS.find((e) => e.id === id);
                                            return (
                                                <span key={id} className="review-exp-tag">
                                                    {exp?.icon} {exp?.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            <h3 className="review-section-title">
                                📸 Yüklenen Fotoğraflar ({Object.keys(photos).length})
                            </h3>
                            <div className="review-grid">
                                {PHOTO_SLOTS.filter((s) => photos[s.id]).map((slot) => (
                                    <div key={slot.id}>
                                        <div className="review-photo">
                                            <img src={photos[slot.id].preview} alt={slot.title} />
                                        </div>
                                        <div className="review-photo-label">{slot.title}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-secondary" onClick={() => goToStep(3)}>
                                    ← Geri
                                </button>
                                <button className="btn btn-accent btn-lg" onClick={handleSubmit}>
                                    🤖 AI Analiz Başlat
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Guide Modal */}
            {guideModal && (
                <div className="modal-backdrop" onClick={() => setGuideModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{guideModal.icon} {guideModal.title}</h3>
                            <button className="modal-close" onClick={() => setGuideModal(null)}>✕</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                            {guideModal.guide}
                        </p>
                        <div style={{ background: 'var(--info-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-accent)' }}>
                            💡 <strong>İpucu:</strong> İyi aydınlatma ve net odak, AI analizinin doğruluğunu artırır.
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
