import Link from "next/link";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-logo">
                    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 30, width: 'auto' }}>
                        <g transform="translate(150, 5) scale(0.55)">
                            <path d="M92 10C72 2 55 8 48 18C38 8 18 0 8 18C-5 40 5 85 15 120C22 145 30 170 45 170C58 170 55 130 50 110C50 110 52 112 55 112C58 112 60 110 60 110C65 130 62 170 75 170C90 170 98 145 105 120C115 85 125 40 112 18C108 12 100 8 92 10Z" fill="#3B82F6" />
                        </g>
                        <text x="200" y="165" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="42" fontWeight="bold" fill="#64748B" letterSpacing="4">
                            <tspan fontWeight="400">ISTA</tspan><tspan fontWeight="700">DENTAL</tspan>
                        </text>
                    </svg>
                </div>

                <div className="footer-links">
                    <Link href="/">Ana Sayfa</Link>
                    <Link href="/analiz">AI Analiz</Link>
                    <a href="https://istadentalclinic.com" target="_blank" rel="noopener noreferrer">İSTADENTAL Clinic</a>
                </div>

                <p className="footer-copy">
                    © 2026 İSTADENTAL. AI destekli analiz sonuçları bilgilendirme amaçlıdır, kesin tanı için diş hekiminize danışınız.
                </p>
            </div>
        </footer>
    );
}
