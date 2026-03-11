import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot"></span>
            AI Destekli Dental Analiz
          </div>
          <h1>
            Dijital Diş Analizi
            <br />
            <span className="gradient-text">Yapay Zeka ile</span>
          </h1>
          <p>
            Ağız içi fotoğraflarınızı yükleyin, gelişmiş AI teknolojisi ile
            kapsamlı diş analizi raporu alın. Kron, veneer, implant ve kanal
            tedavisi değerlendirmesi tek bir adımda.
          </p>
          <div className="hero-actions">
            <Link href="/analiz" className="btn btn-primary btn-lg">
              🦷 Analiz Başlat
            </Link>
            <a href="#nasil-calisir" className="btn btn-secondary btn-lg">
              Nasıl Çalışır?
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" id="nasil-calisir">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Basit Adımlar</span>
            <h2>Nasıl Çalışır?</h2>
            <p>Üç kolay adımda kapsamlı dental analizinizi alın</p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Bilgi ve Fotoğraf</h3>
              <p>
                Hasta bilgilerinizi girin ve 4 farklı açıdan ağız içi
                fotoğraflarınızı yükleyin
              </p>
            </div>

            <div className="step-connector">→</div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>AI Analiz</h3>
              <p>
                Gelişmiş yapay zeka modelimiz fotoğraflarınızı detaylı şekilde
                analiz eder
              </p>
            </div>

            <div className="step-connector">→</div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Detaylı Rapor</h3>
              <p>
                Kron, veneer, implant, köprü ve kanal tedavisi önerilerini
                içeren kapsamlı rapor
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Kapsamlı Analiz</span>
            <h2>AI Doktorumuz Neleri İnceler?</h2>
            <p>Yapay zeka destekli detaylı dental değerlendirme</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👑</div>
              <h3>Kron Tedavisi</h3>
              <p>
                Hangi dişlere kron uygulanabilir, malzeme önerileri, kesim
                sırasında oluşabilecek riskler ve detaylı fizibilite analizi.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>Veneer Değerlendirmesi</h3>
              <p>
                Laminate veneer uygunluğu, minimal prep veya no-prep seçenekleri,
                estetik sonuç tahminleri ve kanal tedavisi riski.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔩</div>
              <h3>İmplant Planlaması</h3>
              <p>
                Eksik diş bölgelerinde implant uygunluğu, kemik yapısı
                değerlendirmesi ve köprü alternatifi karşılaştırması.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>Kanal Tedavisi Riski</h3>
              <p>
                Kron ve veneer kesimi sırasında oluşabilecek pulpa hasarı riski,
                diş vitalite değerlendirmesi ve önleyici tedbirler.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Diş Haritası</h3>
              <p>
                FDI numaralama sistemi ile diş diş detaylı analiz, görsel
                harita üzerinde renk kodlu durum gösterimi.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Tedavi Planı</h3>
              <p>
                Öncelik sırasına göre tedavi adımları, tahmini seans sayısı
                ve önemli notlarla kapsamlı tedavi yol haritası.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="section-inner">
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "64px 32px",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(0,212,255,0.08))",
              borderColor: "rgba(37,99,235,0.3)",
            }}
          >
            <h2 style={{ marginBottom: 16 }}>
              Hemen <span className="gradient-text">AI Analiz</span> Başlatın
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 32,
                maxWidth: 500,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Fotoğraflarınızı yükleyin, yapay zeka destekli kapsamlı dental
              analiz raporunuzu dakikalar içinde alın.
            </p>
            <Link href="/analiz" className="btn btn-accent btn-lg">
              🦷 Ücretsiz Analiz Başlat
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
