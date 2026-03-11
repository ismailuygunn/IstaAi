"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-logo">
                    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 44, width: 'auto' }}>
                        <g transform="translate(150, 5) scale(0.55)">
                            <path d="M92 10C72 2 55 8 48 18C38 8 18 0 8 18C-5 40 5 85 15 120C22 145 30 170 45 170C58 170 55 130 50 110C50 110 52 112 55 112C58 112 60 110 60 110C65 130 62 170 75 170C90 170 98 145 105 120C115 85 125 40 112 18C108 12 100 8 92 10Z" fill="#3B82F6" />
                            <path d="M60 110C60 110 58 112 55 112C52 112 50 110 50 110C50 95 48 75 42 58C38 48 30 38 28 48C24 65 32 90 35 105" fill="#60A5FA" opacity="0.3" />
                        </g>
                        <text x="200" y="165" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="42" fontWeight="bold" fill="#F8FAFC" letterSpacing="4">
                            <tspan fontWeight="400">ISTA</tspan><tspan fontWeight="700">DENTAL</tspan>
                        </text>
                    </svg>
                </Link>

                <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü">
                    {menuOpen ? "✕" : "☰"}
                </button>

                <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
                    <li><Link href="/" onClick={() => setMenuOpen(false)}>Ana Sayfa</Link></li>
                    <li><Link href="/analiz" onClick={() => setMenuOpen(false)}>AI Analiz</Link></li>
                    <li><Link href="/gecmis" onClick={() => setMenuOpen(false)}>Geçmiş</Link></li>
                    <li><Link href="/karsilastir" onClick={() => setMenuOpen(false)}>🔍 Karşılaştır</Link></li>
                    <li><Link href="/istatistik" onClick={() => setMenuOpen(false)}>📊 İstatistik</Link></li>
                    <li><Link href="/egitim" onClick={() => setMenuOpen(false)}>🧠 Eğitim</Link></li>
                    <li><Link href="/analiz" className="navbar-cta" onClick={() => setMenuOpen(false)}>🦷 Analiz Başlat</Link></li>
                </ul>
            </div>
        </nav>
    );
}
