import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel: extend serverless function timeout to 60s
export const maxDuration = 60;

const EXPECTATION_LABELS = {
    full_crown: "Full Kaplama Kron (Zirkonya, Metal Seramik, E-max)",
    monolithic: "Monolitik Kron",
    veneer: "Laminate Veneer",
    implant: "İmplant",
    bridge: "Köprü Protez",
    composite: "Kompozit Bonding",
    whitening: "Diş Beyazlatma",
    orthodontic: "Ortodontik Tedavi",
};

function buildExpectationsPrompt(expectations) {
    if (!expectations || expectations.length === 0) return "";
    const labels = expectations.map((e) => EXPECTATION_LABELS[e] || e).join(", ");
    return `\nHASTA TEDAVİ BEKLENTİLERİ: ${labels}\nBu tedavi beklentilerine göre DETAYLI analiz yap.\n`;
}

export async function POST(request) {
    try {
        const { patientInfo, images, expectations } = await request.json();

        if (!images || images.length < 4) {
            return Response.json({ error: "En az 4 zorunlu fotoğraf gereklidir." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return Response.json({ error: "Gemini API anahtarı yapılandırılmamış." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

        const imageParts = images.map((img) => {
            const matches = img.base64.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return null;
            return { inlineData: { mimeType: matches[1], data: matches[2] } };
        }).filter(Boolean);

        const expectationsPrompt = buildExpectationsPrompt(expectations);

        const prompt = `Sen çok deneyimli bir protetik diş hekimi ve estetik uzmanısın. ESTETİK BİR DİŞ KLİNİĞİ için çalışıyorsun. Full kaplama ve estetik restorasyon ÖNCELIKLI yaklaşım sergileyeceksin.

HASTA: ${patientInfo.fullName}, ${patientInfo.age} yaş, ${patientInfo.gender}
ŞİKAYET: ${patientInfo.complaint}
${patientInfo.dentalHistory ? `DENTAL GEÇMİŞ: ${patientInfo.dentalHistory}` : ""}
${patientInfo.allergies ? `ALERJİLER: ${patientInfo.allergies}` : ""}
${patientInfo.existingTreatments ? `MEVCUT TEDAVİLER: ${patientInfo.existingTreatments}` : ""}
${expectationsPrompt}

═══════════════════════════════════════════
FOTOĞRAF OKUMA KURALLARI (KRİTİK!)
═══════════════════════════════════════════
1. FRONTAL (Ağız Kapalı): Ayna kuralı — hastanın SAĞI senin SOLUN.
2. YARIM AÇIK: Kapanış sınıfı, overjet, overbite değerlendirmesi.
3. ALT ÇENE OKLÜZAL: Ayna ile çekilmiş, TERStir! Solda = hastanın SAĞINDIR.
4. ÜST ÇENE OKLÜZAL: Ayna ile çekilmiş, TERStir! Solda = hastanın SAĞINDIR.
${images.length > 4 ? "5. PANORAMİK: Radyolojik konvansiyon." : ""}

Fotoğraflar: ${images.map((img, i) => `[Fotoğraf ${i + 1}: ${img.title}]`).join(", ")}

═══════════════════════════════════════════
FOTOĞRAF İŞARETLEME TALİMATLARI (ÇOK ÖNEMLİ!)
═══════════════════════════════════════════
Her fotoğrafta gördüğün bulguları "foto_bulgular" altında listele.
Her bulgu için fotoğraf üzerindeki YÜZDE BAZLI KOORDİNATLARI ver:
- x: Sol kenardan yüzde (0=en sol, 100=en sağ)
- y: Üst kenardan yüzde (0=en üst, 100=en alt)
- Dişin fotoğraftaki GERÇEK konumunu tahmin et
- Frontal fotoğrafta: Üst anterior dişler y=25-40, alt anterior y=45-60, üst premolar y=25-35 kenarlar, alt premolar y=55-65 kenarlar
- Oklüzal fotoğrafta: Dişler daire şeklinde, anterior ortada, posterior kenarlarda
- Birden çok dişi ayrı ayrı işaretle, her birinin kendi x,y koordinatını ver
- HER TEDAVİ GEREKTİREN DİŞ İÇİN bir marker oluştur

Tedavi tiplerine göre renk kodları:
- "kron" = KIRMIZI daire — Full kaplama kron yapılacak dişler
- "veneer" = YEŞİL daire — Veneer uygulanacak dişler
- "implant" = MAVİ daire — İmplant yapılacak bölgeler (eksik dişler)
- "kanal" = TURUNCU daire — Kanal tedavisi riski
- "curuk" = SARI daire — Çürük/restorasyon
- "cerrahi" = MOR daire — Cerrahi müdahale gereken bölge

═══════════════════════════════════════════
ÖNEMLİ TALİMATLAR
═══════════════════════════════════════════

1. KISA VE ÖZ YAZ — her alan maks 1-2 cümle
2. Sadece sorunlu dişleri listele
3. FOTOĞRAF İŞARETLEMELERİ ÇOK ÖNEMLİ — mümkün olduğunca çok diş işaretle
4. VENEER/KRON analizi DETAYLI olsun:
   - Kesim miktarı (mm cinsinden tahmini)
   - Oklüzal kapanış durumu (Angle sınıfı, overjet, overbite)
   - Karşıt diş aşınması
   - Parafonksiyon/bruksizm bulgusu
   - Mine kalınlığı ve bonding yüzey kalitesi
5. ESTETİK KLİNİK ODAKLI — full kaplama (zirkonya/e-max) her zaman düşünülecek
6. ÖNERİLEN PLAN mutlaka olacak:
   - Toplam kaç dişe işlem (üye sayısı)
   - FDI aralıkları (ör: "13-23 arası 6 üye e-max")
   - Cerrahi gereksinimler: implant, greft, sinüs lifting detayları
   - Kanal tedavisi gereken dişler
   - Tahmini seans

SADECE JSON döndür:

{
  "genel_degerlendirme": {
    "ozet": "1 cümle",
    "seviye": "iyi/orta/kotu",
    "detay": "2-3 cümle",
    "okluzyon": "Angle sınıfı, overjet/overbite bilgisi"
  },
  "foto_bulgular": [
    {
      "foto_no": 1,
      "foto_tipi": "frontal/okluzal_ust/okluzal_alt/yarim_acik/panoramik",
      "isaret": [
        {
          "dis_no": "FDI numarası (tek diş, ör: 14)",
          "x": 35,
          "y": 40,
          "tedavi_tipi": "kron/veneer/implant/kanal/curuk/cerrahi",
          "etiket": "Kısa açıklama (maks 4 kelime, ör: Zirkonya kron gerekli)"
        }
      ]
    }
  ],
  "dis_dis_analiz": [
    {
      "dis_no": "FDI numarası",
      "bolge": "Üst sağ/Üst sol/Alt sağ/Alt sol",
      "durum": "Kısa (maks 10 kelime)",
      "tedavi": "Kısa tedavi önerisi",
      "oncelik": "yuksek/orta/dusuk",
      "kategori": "crown/veneer/implant/canal/missing/bridge"
    }
  ],
  "kron_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş no"],
    "malzeme": "Hangi dişe hangi malzeme (anterior: e-max, posterior: zirkonya gibi)",
    "kesim": "Tahmini kesim miktarları (mm) ve prep detayı",
    "kanal_riski": "Hangi dişlerde kanal riski ve yüzde tahmini"
  },
  "veneer_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş no"],
    "prep_tipi": "no-prep/minimal (0.3-0.5mm)/full (0.5-0.7mm)",
    "mine_durumu": "Mine kalınlığı ve bonding yüzey durumu",
    "not": "Kısa veneer notu"
  },
  "implant_degerlendirme": {
    "gerekli": true,
    "bolgeler": [
      {
        "dis_no": "Eksik diş no",
        "oneri": "İmplant detayı (çap, boy tahmini)",
        "cerrahi": "Ek cerrahi gereksinim: greft / sinüs lifting / yok"
      }
    ]
  },
  "kanal_tedavisi_riski": {
    "risk_seviyesi": "dusuk/orta/yuksek",
    "riskli_disler": [
      { "dis_no": "Diş no", "risk": "Risk nedeni ve yüzde" }
    ]
  },
  "tedavi_plani": {
    "adimlar": [
      {
        "sira": 1,
        "baslik": "Kısa başlık",
        "aciklama": "1 cümle",
        "oncelik": "yuksek/orta/dusuk",
        "tahmini_seans": "sayı"
      }
    ],
    "toplam_tahmini_seans": "sayı"
  },
  "onerilen_plan": {
    "baslik": "Ör: Full Estetik Rehabilitasyon Planı",
    "toplam_dis_sayisi": 12,
    "dis_araliklari": "Ör: Üst 13-23 arası 6 üye, Alt 33-43 arası 6 üye",
    "full_kaplama": {
      "anterior": "Hangi dişler, malzeme, üye sayısı (ör: 13-23 e-max, 6 üye)",
      "posterior": "Hangi dişler, malzeme, üye sayısı (ör: 14-16, 24-26 zirkonya, 6 üye)"
    },
    "kanal_tedavisi": "Hangi dişlerde gerekli (ör: 16, 47 — toplam 2 diş)",
    "implant": "Hangi bölgelere, kaç adet (ör: 36, 46 — 2 implant)",
    "cerrahi": "Greft, sinüs lifting detayı (ör: 25 bölgesi sinüs lifting gerekli)",
    "tahmini_seans": "toplam seans sayısı",
    "notlar": "Önemli klinik notlar (1-2 cümle)"
  },
  "alternatif_planlar": [
    {
      "plan_adi": "Plan B — Alternatif isim",
      "toplam_dis_sayisi": 8,
      "ozet": "Kısa plan özeti",
      "detaylar": {
        "veneer": "Hangi dişler",
        "kron": "Hangi dişler",
        "implant": "Hangi bölgeler",
        "kanal": "Hangi dişler",
        "cerrahi": "Greft/sinüs lifting",
        "diger": "Diğer tedaviler"
      },
      "tahmini_seans": "sayı",
      "avantaj": "1 cümle",
      "dezavantaj": "1 cümle"
    }
  ]
}`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = result.response;
        const content = response.text();

        if (!content) {
            return Response.json({ error: "Gemini'dan yanıt alınamadı." }, { status: 500 });
        }

        let analysis;
        try {
            let jsonStr = content;
            if (jsonStr.includes("```json")) jsonStr = jsonStr.split("```json")[1].split("```")[0];
            else if (jsonStr.includes("```")) jsonStr = jsonStr.split("```")[1].split("```")[0];
            analysis = JSON.parse(jsonStr.trim());
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr, "Content:", content.slice(0, 500));
            analysis = {
                genel_degerlendirme: { ozet: "Analiz tamamlandı", seviye: "orta", detay: content.slice(0, 500) },
                foto_bulgular: [],
                dis_dis_analiz: [],
                kron_tedavisi: { uygunluk: false, uygun_disler: [] },
                veneer_tedavisi: { uygunluk: false, uygun_disler: [] },
                implant_degerlendirme: { gerekli: false, bolgeler: [] },
                kanal_tedavisi_riski: { risk_seviyesi: "orta", riskli_disler: [] },
                tedavi_plani: { adimlar: [], toplam_tahmini_seans: "?" },
                onerilen_plan: null,
                alternatif_planlar: [],
            };
        }

        return Response.json({ analysis });
    } catch (err) {
        console.error("API Route Error:", err);
        const msg = err.message || "Bilinmeyen hata";
        if (msg.includes("is not found") || msg.includes("not supported")) {
            return Response.json({ error: "Gemini model hatası: " + msg }, { status: 500 });
        }
        if (msg.includes("SAFETY") || msg.includes("blocked")) {
            return Response.json({ error: "Fotoğraflar güvenlik filtresi tarafından engellendi." }, { status: 400 });
        }
        if (msg.includes("quota") || msg.includes("429")) {
            return Response.json({ error: "API kotası aşıldı. Birkaç dakika sonra tekrar deneyin." }, { status: 429 });
        }
        return Response.json({ error: "Sunucu hatası: " + msg }, { status: 500 });
    }
}
