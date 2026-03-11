"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function GecmisPage() {
    const router = useRouter();
    const analyses = useQuery(api.analyses.getAll);
    const removeAnalysis = useMutation(api.analyses.remove);

    const handleDelete = async (id) => {
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
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                            İlk AI dental analizinizi başlatın
                        </p>
                        <Link href="/analiz" className="btn btn-primary">
                            🦷 Analiz Başlat
                        </Link>
                    </div>
                )}

                {analyses && analyses.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {analyses.map((item) => (
                            <div key={item._id} className="card" style={{ cursor: "pointer", transition: "var(--transition-base)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                                    <div style={{ flex: 1 }} onClick={() => router.push(`/rapor/${item._id}`)}>
                                        <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>
                                            {item.patientName}
                                        </h3>
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                                            {item.complaint.length > 100 ? item.complaint.slice(0, 100) + "..." : item.complaint}
                                        </p>
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                            <span className="report-patient-tag">
                                                <span className="label">Yaş:</span> {item.patientAge}
                                            </span>
                                            <span className="report-patient-tag">
                                                <span className="label">Fotoğraf:</span> {item.photoCount}
                                            </span>
                                            <span className="report-patient-tag">
                                                <span className="label">Tarih:</span>{" "}
                                                {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => router.push(`/rapor/${item._id}`)}
                                        >
                                            Raporu Gör
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                            style={{ color: "var(--danger)" }}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ textAlign: "center", marginTop: 32 }}>
                    <Link href="/analiz" className="btn btn-accent">
                        🦷 Yeni Analiz Başlat
                    </Link>
                </div>
            </div>
            <Footer />
        </>
    );
}
