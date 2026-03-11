"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

function StatCard({ icon, label, value, sub }) {
    return (
        <div className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    );
}

function BarItem({ label, count, max, color }) {
    const pct = max > 0 ? (count / max) * 100 : 0;
    return (
        <div className="bar-item">
            <span className="bar-label">{label}</span>
            <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: color }}></div>
            </div>
            <span className="bar-count">{count}</span>
        </div>
    );
}

export default function IstatistikPage() {
    const analyses = useQuery(api.analyses.getAll);

    if (analyses === undefined) {
        return (
            <>
                <Navbar />
                <div className="loading-container" style={{ minHeight: "60vh" }}>
                    <h2 className="loading-text">Yükleniyor...</h2>
                </div>
                <Footer />
            </>
        );
    }

    const total = analyses.length;
    const now = Date.now();
    const thisMonth = analyses.filter((a) => now - a.createdAt < 30 * 24 * 60 * 60 * 1000).length;
    const thisWeek = analyses.filter((a) => now - a.createdAt < 7 * 24 * 60 * 60 * 1000).length;

    // Gender distribution
    const male = analyses.filter((a) => a.patientGender === "erkek").length;
    const female = analyses.filter((a) => a.patientGender === "kadın").length;

    // Age distribution
    const ageGroups = { "0-17": 0, "18-30": 0, "31-45": 0, "46-60": 0, "60+": 0 };
    analyses.forEach((a) => {
        const age = parseInt(a.patientAge) || 0;
        if (age <= 17) ageGroups["0-17"]++;
        else if (age <= 30) ageGroups["18-30"]++;
        else if (age <= 45) ageGroups["31-45"]++;
        else if (age <= 60) ageGroups["46-60"]++;
        else ageGroups["60+"]++;
    });
    const maxAge = Math.max(...Object.values(ageGroups), 1);

    // Treatment expectations distribution
    const expCounts = {};
    const expLabels = {
        full_crown: "👑 Full Kaplama Kron",
        monolithic: "💎 Monolitik Kron",
        veneer: "✨ Laminate Veneer",
        implant: "🔩 İmplant",
        bridge: "🌉 Köprü Protez",
        composite: "🎨 Kompozit Bonding",
        whitening: "⚪ Diş Beyazlatma",
        orthodontic: "😁 Ortodonti",
    };
    analyses.forEach((a) => {
        (a.expectations || []).forEach((e) => {
            expCounts[e] = (expCounts[e] || 0) + 1;
        });
    });
    const sortedExps = Object.entries(expCounts).sort((a, b) => b[1] - a[1]);
    const maxExp = sortedExps.length > 0 ? sortedExps[0][1] : 1;

    // Monthly trend (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth();
        const year = d.getFullYear();
        const count = analyses.filter((a) => {
            const ad = new Date(a.createdAt);
            return ad.getMonth() === month && ad.getFullYear() === year;
        }).length;
        monthlyData.push({
            label: d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
            count,
        });
    }
    const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

    // Average photo count
    const avgPhotos = total > 0 ? (analyses.reduce((s, a) => s + a.photoCount, 0) / total).toFixed(1) : "0";

    return (
        <>
            <Navbar />
            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>📊 İstatistik Dashboard</h1>
                    <p>AI dental analizlerinin genel istatistikleri</p>
                </div>

                {total === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: 48 }}>
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}>📊</div>
                        <h3 style={{ marginBottom: 8 }}>Henüz Veri Yok</h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>İlk analizinizi yaparak istatistikleri görmeye başlayın</p>
                        <Link href="/analiz" className="btn btn-primary">🦷 Analiz Başlat</Link>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div className="stats-grid">
                            <StatCard icon="📋" label="Toplam Analiz" value={total} />
                            <StatCard icon="📅" label="Bu Ay" value={thisMonth} />
                            <StatCard icon="📆" label="Bu Hafta" value={thisWeek} />
                            <StatCard icon="📸" label="Ort. Fotoğraf" value={avgPhotos} />
                        </div>

                        <div className="stats-row">
                            {/* Gender */}
                            <div className="card stats-half">
                                <h3 className="stats-section-title">👥 Cinsiyet Dağılımı</h3>
                                <div className="gender-chart">
                                    <div className="gender-bar">
                                        <div className="gender-fill male" style={{ width: `${total > 0 ? (male / total) * 100 : 50}%` }}>
                                            {male > 0 && `Erkek ${male}`}
                                        </div>
                                        <div className="gender-fill female" style={{ width: `${total > 0 ? (female / total) * 100 : 50}%` }}>
                                            {female > 0 && `Kadın ${female}`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Age */}
                            <div className="card stats-half">
                                <h3 className="stats-section-title">📊 Yaş Dağılımı</h3>
                                {Object.entries(ageGroups).map(([group, count]) => (
                                    <BarItem key={group} label={group} count={count} max={maxAge} color="var(--primary)" />
                                ))}
                            </div>
                        </div>

                        {/* Treatment Expectations */}
                        {sortedExps.length > 0 && (
                            <div className="card">
                                <h3 className="stats-section-title">🎯 En Çok Talep Edilen Tedaviler</h3>
                                {sortedExps.map(([key, count]) => (
                                    <BarItem
                                        key={key}
                                        label={expLabels[key] || key}
                                        count={count}
                                        max={maxExp}
                                        color="var(--accent)"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Monthly Trend */}
                        <div className="card">
                            <h3 className="stats-section-title">📈 Aylık Analiz Trendi</h3>
                            <div className="trend-chart">
                                {monthlyData.map((m, i) => (
                                    <div key={i} className="trend-bar-wrap">
                                        <div className="trend-count">{m.count}</div>
                                        <div className="trend-bar" style={{ height: `${(m.count / maxMonthly) * 120}px` }}></div>
                                        <div className="trend-label">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </>
    );
}
