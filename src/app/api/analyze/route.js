import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { patientInfo, images } = await request.json();

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-05-06" });

    // Build image parts for Gemini
    const imageParts = images.map((img) => {
      // Extract base64 data and mime type from data URL
      const matches = img.base64.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return null;
      }
      return {
        inlineData: {
          mimeType: matches[1],
          data: matches[2],
        },
      };
    }).filter(Boolean);

    const prompt = `Sen çok deneyimli bir diş hekimi ve protetik uzmanısın. Sana verilen ağız içi fotoğrafları detaylı analiz edeceksin.

HASTA BİLGİLERİ:
- Ad Soyad: ${patientInfo.fullName}
- Yaş: ${patientInfo.age}
- Cinsiyet: ${patientInfo.gender}
- Şikayet/İstek: ${patientInfo.complaint}
- Dental Geçmiş: ${patientInfo.dentalHistory || "Belirtilmemiş"}
- Alerjiler: ${patientInfo.allergies || "Belirtilmemiş"}
- Mevcut Tedaviler: ${patientInfo.existingTreatments || "Belirtilmemiş"}

FOTOĞRAFLAR (sırasıyla):
1. Ağız tam kapalı (frontal görünüm)
2. Ağız yarım açık (oklüzal ilişki)
3. Alt çene oklüzal görünüm
4. Üst çene oklüzal görünüm
${images.length > 4 ? "5. Panoramik röntgen" : ""}

DETAYLI ANALİZ TALİMATLARI:
- Her dişi FDI numaralama sistemi ile değerlendir
- Kron tedavisi uygunluğunu incele: hangi dişlere kron yapılabilir, malzeme önerisi (zirkonya, metal seramik, e-max, vb.), kesim miktarı ve kanal tedavisi riski
- Veneer tedavisi uygunluğunu incele: laminate veneer uygun mu, prep tipi (minimal prep, no-prep, full prep), estetik beklenti karşılanabilir mi, kesim sırasında pulpa hasarı riski
- İmplant değerlendirmesi: eksik diş bölgeleri, kemik yeterliliği tahmini, köprü alternatifi karşılaştırması
- Kanal tedavisi riski: hangi dişlerde kron/veneer kesimi sırasında kanal tedavisi gerekebilir, risk seviyesi ve nedenleri
- Tedavi planı: öncelik sırası, tahmini seans sayısı, önemli uyarılar

Lütfen bu hastanın ağız içi fotoğraflarını detaylı analiz et. Fotoğraflar sırasıyla: ${images.map((img) => img.title).join(", ")}.

YANITINI MUTLAKA AŞAĞIDAKİ JSON FORMATINDA VER. Sadece JSON döndür, başka hiçbir şey ekleme:

{
  "genel_degerlendirme": {
    "ozet": "Genel ağız sağlığı durumunun özeti",
    "seviye": "iyi/orta/kotu",
    "detay": "Detaylı genel değerlendirme paragrafı"
  },
  "dis_dis_analiz": [
    {
      "dis_no": "FDI diş numarası (örn: 11, 21, 36)",
      "bolge": "Üst sağ / Üst sol / Alt sağ / Alt sol",
      "durum": "Mevcut durum açıklaması",
      "tedavi_onerisi": "Önerilen tedavi",
      "oncelik": "yuksek/orta/dusuk",
      "kategori": "healthy/crown/veneer/implant/canal/missing"
    }
  ],
  "kron_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş numaraları"],
    "detay": "Detaylı kron tedavisi değerlendirmesi",
    "malzeme_onerisi": "Önerilen kron malzemesi ve nedeni",
    "kesim_detayi": "Kesim tipi ve miktarı hakkında bilgi",
    "riskler": "Kron tedavisi sırasında oluşabilecek riskler",
    "kanal_tedavisi_riski": "Kesim sırasında kanal tedavisi gerekme olasılığı ve nedenleri"
  },
  "veneer_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş numaraları"],
    "detay": "Detaylı veneer değerlendirmesi",
    "prep_tipi": "Önerilen prep tipi (minimal/no-prep/full)",
    "estetik_beklenti": "Estetik sonuç tahminleri",
    "kanal_tedavisi_riski": "Veneer kesimi sırasında pulpa hasarı riski değerlendirmesi",
    "riskler": "Veneer tedavisi riskleri"
  },
  "implant_degerlendirme": {
    "gerekli": true,
    "gerekli_bolgeler": [
      {
        "bolge": "Bölge açıklaması",
        "dis_no": "Eksik diş numarası",
        "kemik_durumu": "Kemik yeterliliği tahmini",
        "oneri": "İmplant veya köprü önerisi ve nedeni"
      }
    ],
    "detay": "Genel implant değerlendirmesi",
    "kopru_alternatifi": "Köprü alternatifi değerlendirmesi"
  },
  "kanal_tedavisi_riski": {
    "risk_seviyesi": "dusuk/orta/yuksek",
    "aciklama": "Kanal tedavisi riski hakkında detaylı açıklama",
    "riskli_disler": [
      {
        "dis_no": "Diş numarası",
        "risk": "Risk nedeni ve seviyesi"
      }
    ],
    "onleyici_tedbirler": "Riskleri azaltmak için alınabilecek önlemler"
  },
  "tedavi_plani": {
    "adimlar": [
      {
        "sira": 1,
        "baslik": "Tedavi adımı başlığı",
        "aciklama": "Detaylı açıklama",
        "oncelik": "yuksek/orta/dusuk",
        "tahmini_seans": "Tahmini seans sayısı"
      }
    ],
    "toplam_tahmini_seans": "Toplam tahmini seans",
    "onemli_notlar": ["Önemli not 1", "Önemli not 2"]
  }
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

    // Parse JSON from response (handle potential markdown code blocks)
    let analysis;
    try {
      let jsonStr = content;
      // Remove markdown code blocks if present
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1].split("```")[0];
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1].split("```")[0];
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr, "Content:", content);
      // If JSON parsing fails, return the raw text
      analysis = {
        genel_degerlendirme: {
          ozet: "Analiz tamamlandı",
          seviye: "orta",
          detay: content,
        },
        dis_dis_analiz: [],
        kron_tedavisi: { uygunluk: false, detay: "Ayrıntılı analiz metni alındı ancak yapılandırılamadı.", uygun_disler: [] },
        veneer_tedavisi: { uygunluk: false, detay: "Ham analiz metni için genel değerlendirmeye bakınız.", uygun_disler: [] },
        implant_degerlendirme: { gerekli: false, detay: "Detaylar genel değerlendirmede.", gerekli_bolgeler: [] },
        kanal_tedavisi_riski: { risk_seviyesi: "orta", aciklama: "Detaylar genel değerlendirmede.", riskli_disler: [] },
        tedavi_plani: { adimlar: [], toplam_tahmini_seans: "Belirsiz", onemli_notlar: ["Ham analiz metni genel değerlendirme bölümünde yer almaktadır."] },
      };
    }

    return Response.json({ analysis });
  } catch (err) {
    console.error("API Route Error:", err);
    return Response.json(
      { error: "Sunucu hatası: " + err.message },
      { status: 500 }
    );
  }
}
