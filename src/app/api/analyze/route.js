import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel: extend serverless function timeout to 60s (Gemini needs time)
export const maxDuration = 60;

// Treatment expectation labels for prompt building
const EXPECTATION_LABELS = {
    full_crown: "Full Kaplama Kron (Zirkonya, Metal Seramik, E-max)",
    monolithic: "Monolitik Kron",
    veneer: "Laminate Veneer",
    implant: "İmplant",
    bridge: "Köprü Protez",
    composite: "Kompozit Bonding",
    whitening: "Diş Beyazlatma",
    orthodontic: "Ortodontik Tedavi (Diş Teli / Şeffaf Plak)",
};

function buildExpectationsPrompt(expectations) {
    if (!expectations || expectations.length === 0) return "";
    const labels = expectations.map((e) => EXPECTATION_LABELS[e] || e).join(", ");
    return `\nHASTA TEDAVİ BEKLENTİLERİ: ${labels}\nBu tedavi beklentilerine göre analiz yap. Veneer konusunda esnek ol — kron yerine veneer de önerebilirsin, karışık planlar sun.\n`;
}

export async function POST(request) {
    try {
        const { patientInfo, images, expectations } = await request.json();

        if (!images || images.length < 4) {
            return Response.json(
                { error: "En az 4 zorunlu fotoğraf gereklidir." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: "Gemini API anahtarı yapılandırılmamış." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

        // Build image parts for Gemini
        const imageParts = images.map((img) => {
            const matches = img.base64.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return null;
            return {
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2],
                },
            };
        }).filter(Boolean);

        const expectationsPrompt = buildExpectationsPrompt(expectations);

        const prompt = `Sen deneyimli bir diş hekimi ve protetik uzmanısın. Fotoğrafları analiz et.

ÖNEMLİ KURALLAR:
- KISA ve ÖZ yaz. Her alan maksimum 1-2 cümle olsun.
- Derin analiz yap ama ÖZET sun. Agentlar okuyacak, gereksiz detay yazma.
- dis_dis_analiz'de SADECE sorunlu veya tedavi gerektiren dişleri listele, sağlıklı dişleri YAZMA.
- Veneer konusunda ESNEK ol. Kron yerine veneer mümkünse öner, karışık planlar sun.
- Sonunda mutlaka 2-3 ALTERNATİF TEDAVİ PLANI öner (kısa formatta).

HASTA: ${patientInfo.fullName}, ${patientInfo.age} yaş, ${patientInfo.gender}
ŞİKAYET: ${patientInfo.complaint}
${patientInfo.dentalHistory ? `DENTAL GEÇMİŞ: ${patientInfo.dentalHistory}` : ""}
${patientInfo.allergies ? `ALERJİLER: ${patientInfo.allergies}` : ""}
${patientInfo.existingTreatments ? `MEVCUT TEDAVİLER: ${patientInfo.existingTreatments}` : ""}
${expectationsPrompt}

FOTOĞRAF OKUMA KURALLARI:
1. FRONTAL (Ağız Kapalı): Hastanın SAĞINI senin SOLUNDA gör (ayna kuralı). 1. kadran=solunda, 2. kadran=sağında.
2. YARIM AÇIK: Aynı ayna kuralı. Kapanış sınıfını değerlendir.
3. ALT ÇENE OKLÜZAL: Ayna ile çekilmiş, görüntü TERStir! Solda gördüğün = hastanın SAĞINDIR (4. kadran).
4. ÜST ÇENE OKLÜZAL: Ayna ile çekilmiş, görüntü TERStir! Solda gördüğün = hastanın SAĞINDIR (1. kadran).
${images.length > 4 ? "5. PANORAMİK: Radyolojik konvansiyon, direkt okunur." : ""}

Fotoğraflar: ${images.map((img) => img.title).join(", ")}

SADECE JSON döndür, başka hiçbir şey yazma:

{
  "genel_degerlendirme": {
    "ozet": "1 cümle genel durum",
    "seviye": "iyi/orta/kotu",
    "detay": "2-3 cümle temel bulgular özeti"
  },
  "dis_dis_analiz": [
    {
      "dis_no": "FDI numarası",
      "bolge": "Üst sağ/Üst sol/Alt sağ/Alt sol",
      "durum": "Kısa durum (maks 10 kelime)",
      "tedavi": "Kısa tedavi önerisi",
      "oncelik": "yuksek/orta/dusuk",
      "kategori": "crown/veneer/implant/canal/missing"
    }
  ],
  "kron_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş numaraları"],
    "malzeme": "Kısa malzeme önerisi (hangi dişe ne)",
    "kanal_riski": "Hangi dişlerde kanal riski var, kısa"
  },
  "veneer_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş numaraları"],
    "prep_tipi": "no-prep/minimal/full",
    "not": "Kısa veneer notu"
  },
  "implant_degerlendirme": {
    "gerekli": true,
    "bolgeler": [
      {
        "dis_no": "Eksik diş no",
        "oneri": "Kısa öneri (1 cümle)"
      }
    ]
  },
  "kanal_tedavisi_riski": {
    "risk_seviyesi": "dusuk/orta/yuksek",
    "riskli_disler": [
      {
        "dis_no": "Diş no",
        "risk": "Kısa risk açıklaması"
      }
    ]
  },
  "tedavi_plani": {
    "adimlar": [
      {
        "sira": 1,
        "baslik": "Kısa başlık",
        "aciklama": "1 cümle açıklama",
        "oncelik": "yuksek/orta/dusuk",
        "tahmini_seans": "sayı"
      }
    ],
    "toplam_tahmini_seans": "sayı"
  },
  "alternatif_planlar": [
    {
      "plan_adi": "Plan A — En Kapsamlı / Plan B — Orta Seviye / Plan C — Minimum Müdahale gibi",
      "ozet": "Kısa plan özeti, örn: 14-24 veneer, 16-26 kron, 36-46 implant",
      "detaylar": {
        "veneer": "Hangi dişlere veneer (FDI aralık)",
        "kron": "Hangi dişlere kron (FDI aralık)",
        "implant": "Hangi bölgelere implant",
        "kanal": "Hangi dişlerde kanal tedavisi gerekli",
        "diger": "Diğer tedaviler (beyazlatma, ortodonti vb.)"
      },
      "tahmini_seans": "sayı",
      "avantaj": "Bu planın avantajı (1 cümle)",
      "dezavantaj": "Bu planın dezavantajı (1 cümle)"
    }
  ]
}`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = result.response;
        const content = response.text();

        if (!content) {
            return Response.json(
                { error: "Gemini'dan yanıt alınamadı." },
                { status: 500 }
            );
        }

        // Parse JSON from response
        let analysis;
        try {
            let jsonStr = content;
            if (jsonStr.includes("```json")) {
                jsonStr = jsonStr.split("```json")[1].split("```")[0];
            } else if (jsonStr.includes("```")) {
                jsonStr = jsonStr.split("```")[1].split("```")[0];
            }
            analysis = JSON.parse(jsonStr.trim());
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr, "Content:", content);
            analysis = {
                genel_degerlendirme: { ozet: "Analiz tamamlandı", seviye: "orta", detay: content },
                dis_dis_analiz: [],
                kron_tedavisi: { uygunluk: false, uygun_disler: [], malzeme: "", kanal_riski: "" },
                veneer_tedavisi: { uygunluk: false, uygun_disler: [], prep_tipi: "", not: "" },
                implant_degerlendirme: { gerekli: false, bolgeler: [] },
                kanal_tedavisi_riski: { risk_seviyesi: "orta", riskli_disler: [] },
                tedavi_plani: { adimlar: [], toplam_tahmini_seans: "?" },
                alternatif_planlar: [],
            };
        }

        return Response.json({ analysis });
    } catch (err) {
        console.error("API Route Error:", err);
        const msg = err.message || "Bilinmeyen hata";
        // Extract more useful error for user
        if (msg.includes("is not found") || msg.includes("not supported")) {
            return Response.json({ error: "Gemini model hatası: " + msg }, { status: 500 });
        }
        if (msg.includes("SAFETY") || msg.includes("blocked")) {
            return Response.json({ error: "Fotoğraflar güvenlik filtresi tarafından engellendi. Lütfen farklı fotoğraflar deneyin." }, { status: 400 });
        }
        if (msg.includes("quota") || msg.includes("429")) {
            return Response.json({ error: "API kotası aşıldı. Lütfen birkaç dakika sonra tekrar deneyin." }, { status: 429 });
        }
        return Response.json(
            { error: "Sunucu hatası: " + msg },
            { status: 500 }
        );
    }
}
