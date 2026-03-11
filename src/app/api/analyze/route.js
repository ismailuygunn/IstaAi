import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const labels = expectations
        .map((e) => EXPECTATION_LABELS[e] || e)
        .join(", ");

    let sections = `\n\nHASTA TEDAVİ BEKLENTİLERİ: ${labels}\n\nHasta yukarıdaki tedavi seçeneklerini talep etmektedir. ANALİZİNİ ÖZELLİKLE BU TEDAVİ TÜRLERİNE YOĞUNLAŞTIR ve her biri için ayrıntılı uygunluk değerlendirmesi yap.\n`;

    if (expectations.includes("full_crown")) {
        sections += `\nFULL KAPLAMA KRON DETAYLI DEĞERLENDİRME:
- Zirkonya kron, metal destekli porselen kron ve e-max (lityum disilikat) karşılaştırması yap
- Her diş için en uygun kron malzemesini ve nedenini belirt
- Anterior ve posterior bölge için farklı malzeme önerileri sun
- Prep (kesim) miktarını diş bazında değerlendir (0.5mm - 2mm arası)
- Retansiyon ve stabilite değerlendirmesi yap
- Kanal tedavisi riski yüzdesi (tahmini) ver\n`;
    }

    if (expectations.includes("monolithic")) {
        sections += `\nMONOLİTİK KRON DETAYLI DEĞERLENDİRME:
- Monolitik zirkonya veya monolitik lityum disilikat uygunluğu
- Estetik sınırlamalar (özellikle anterior bölgede)
- Bruksizm/gece sıkma durumunda öneriler
- Karşıt diş aşınma riski değerlendirmesi
- Minimum kesim miktarı avantajları\n`;
    }

    if (expectations.includes("veneer")) {
        sections += `\nLAMINATE VENEER DETAYLI DEĞERLENDİRME:
- Her ön diş için prep tipi: no-prep, minimal prep (0.3-0.5mm), veya konvansiyonel prep (0.5-0.7mm)
- Porselen veneer vs kompozit veneer karşılaştırması
- Diş rengindeki uyumsuzluk düzeltme kapasitesi
- Bonding yüzey kalitesi değerlendirmesi (mine miktarı)
- Mevcut restorasyonların veneer uygulamasına etkisi
- Gülüş tasarımı (smile design) önerileri\n`;
    }

    if (expectations.includes("implant")) {
        sections += `\nİMPLANT DETAYLI DEĞERLENDİRME:
- Kemik yüksekliği ve genişliği tahmini (fotoğraflardan)
- Sinüs lifting veya kemik grefti gereksinimi
- İmplant çapı ve uzunluk önerisi
- Yükleme protokolü (erken yükleme vs geleneksel)
- Geçici protez planlaması
- İmplant üstü kron malzeme seçimi\n`;
    }

    if (expectations.includes("bridge")) {
        sections += `\nKÖPRÜ PROTEZ DETAYLI DEĞERLENDİRME:
- Dayanak dişlerin (abutment) sağlamlık ve periodontal durumu
- Köprü tipi önerisi (geleneksel, maryland, kantilever)
- Dayanak diş preparasyonu gereksinimleri
- İmplant vs köprü avantaj/dezavantaj karşılaştırması
- Uzun dönem prognoz tahmini\n`;
    }

    if (expectations.includes("whitening")) {
        sections += `\nDİŞ BEYAZLATMA DEĞERLENDİRMESİ:
- Mevcut diş rengi değerlendirmesi (VITA skalası tahmini)
- Beyazlatma uygunluğu ve beklenen sonuç
- Ofis tipi vs ev tipi beyazlatma önerisi
- Mevcut restorasyonların beyazlatma sonrasında renk uyumu sorunu
- Beyazlatma sonrası uygulanacak tedaviler için zamanlama\n`;
    }

    return sections;
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

        const prompt = `Sen çok deneyimli bir diş hekimi, protetik uzmanı ve estetik diş hekimliği konusunda uzmanlaşmış bir profesyonelsin. Sana verilen ağız içi fotoğrafları son derece detaylı ve doğru analiz edeceksin.

HASTA BİLGİLERİ:
- Ad Soyad: ${patientInfo.fullName}
- Yaş: ${patientInfo.age}
- Cinsiyet: ${patientInfo.gender}
- Şikayet/İstek: ${patientInfo.complaint}
- Dental Geçmiş: ${patientInfo.dentalHistory || "Belirtilmemiş"}
- Alerjiler: ${patientInfo.allergies || "Belirtilmemiş"}
- Mevcut Tedaviler: ${patientInfo.existingTreatments || "Belirtilmemiş"}
${expectationsPrompt}

═══════════════════════════════════════════
FOTOĞRAF ANALİZ TALİMATLARI (KRİTİK!)
═══════════════════════════════════════════

FOTOĞRAFLAR SIRASINA GÖRE ŞU AÇILARDANDIR:
1. AĞIZ TAM KAPALI (Frontal Görünüm): Hasta kameraya bakıyor, dişler sıkılmış. 
   → DİKKAT: Hastanın SAĞ tarafı senin SOL tarafındır (ayna kuralı). 
   → Sağ üst (1. kadran: 11-18) senin SOLUNDA görünür.
   → Sol üst (2. kadran: 21-28) senin SAĞINDA görünür.
   → Sağ alt (4. kadran: 41-48) senin SOLUNDA ALT'ta görünür.  
   → Sol alt (3. kadran: 31-38) senin SAĞINDA ALT'ta görünür.

2. AĞIZ YARIM AÇIK (Oklüzal İlişki): Dişlerin kapanış ilişkisi görünür.
   → Aynı ayna kuralı geçerli. Overjet, overbite ve sınıf ilişkisini değerlendir.

3. ALT ÇENE OKLÜZAL GÖRÜNÜM: Ağız içi ayna ile çekilmiş, alt çene yukarıdan görünüm.
   → DİKKAT: Ayna kullanıldığı için görüntü TERStir!
   → Görüntüde solda gördüğün dişler aslında hastanın SAĞINDADIR (4. kadran: 41-48).
   → Görüntüde sağda gördüğün dişler aslında hastanın SOLUNDADIR (3. kadran: 31-38).
   → Ön dişler (31-33, 41-43) görüntünün üst kısmında olacaktır.
   → Arka dişler (36-38, 46-48) görüntünün alt kısmında olacaktır.

4. ÜST ÇENE OKLÜZAL GÖRÜNÜM: Ağız içi ayna ile çekilmiş, üst çene alttan görünüm.
   → DİKKAT: Ayna kullanıldığı için görüntü TERStir!
   → Görüntüde solda gördüğün dişler aslında hastanın SAĞINDADIR (1. kadran: 11-18).
   → Görüntüde sağda gördüğün dişler aslında hastanın SOLUNDADIR (2. kadran: 21-28).
   → Ön dişler (11-13, 21-23) görüntünün alt kısmında olacaktır.
   → Arka dişler (16-18, 26-28) görüntünün üst kısmında olacaktır.

${images.length > 4 ? `5. PANORAMİK RÖNTGEN: Röntgende sağ-sol ters değildir, direkt okunabilir.
   → Hastanın sağı röntgenin solunda, hastanın solu röntgenin sağında görünür (radyolojik konvansiyon).
   → Kemik seviyesi, kök yapıları, gömülü dişler ve patolojileri değerlendir.` : ""}

═══════════════════════════════════════════
DETAYLI ANALİZ TALİMATLARI
═══════════════════════════════════════════

1. DİŞ DİŞ ANALİZ:
   - HER DİŞİ FDI numaralama sistemi ile tek tek değerlendir
   - Fotoğraflar arası ÇAPRAZ DOĞRULAMA yap: Bir dişi frontal, oklüzal ve varsa röntgen görüntülerinin hepsinden kontrol et
   - Çürük, restorasyon, renk değişikliği, kırık, aşınma, diastema, çapraşıklık, rotasyon gibi bulguları not et
   - Diş eti (gingiva) durumunu değerlendir: enflamasyon, çekilme, renk değişikliği

2. PROTETİK DEĞERLENDİRME:
   - Kron tedavisi uygunluğu: malzeme önerisi (zirkonya, metal seramik, e-max, monolitik), kesim miktarı ve kanal tedavisi riski
   - Veneer tedavisi uygunluğu: prep tipi (minimal prep, no-prep, full prep), estetik beklenti karşılanabilirlik
   - İmplant değerlendirmesi: eksik diş bölgeleri, kemik yeterliliği tahmini, köprü alternatifi
   - Full kaplama planlaması: anterior vs posterior strateji

3. KANAL TEDAVİSİ RİSK ANALİZİ:
   - Derin çürük veya büyük restorasyon yakınlığında pulpa durumu
   - Kron/veneer kesimi sırasında kanal tedavisi gerekme olasılığı
   - Travma veya aşınma nedeniyle risk altındaki dişler

4. TEDAVİ PLANI:
   - Öncelik sırası, tahmini seans sayısı, önemli uyarılar
   - Tedavi sıralamasında mantıksal akış (önce acil, sonra restoratif, en son estetik)

Fotoğraflar sırasıyla: ${images.map((img) => img.title).join(", ")}

═══════════════════════════════════════════
JSON ÇIKTI FORMATI
═══════════════════════════════════════════

YANITINI MUTLAKA AŞAĞIDAKİ JSON FORMATINDA VER. Sadece JSON döndür, başka hiçbir şey ekleme:

{
  "genel_degerlendirme": {
    "ozet": "Genel ağız sağlığı durumunun kısa özeti",
    "seviye": "iyi/orta/kotu",
    "detay": "Detaylı genel değerlendirme paragrafı. Tüm fotoğraflardan elde edilen bulgular sentezlenerek yazılmalı."
  },
  "dis_dis_analiz": [
    {
      "dis_no": "FDI diş numarası (örn: 11, 21, 36)",
      "bolge": "Üst sağ / Üst sol / Alt sağ / Alt sol",
      "durum": "Mevcut durum açıklaması (çürük, restorasyon, sağlıklı, eksik vb.)",
      "tedavi_onerisi": "Önerilen tedavi",
      "oncelik": "yuksek/orta/dusuk",
      "kategori": "healthy/crown/veneer/implant/canal/missing"
    }
  ],
  "kron_tedavisi": {
    "uygunluk": true,
    "uygun_disler": ["diş numaraları"],
    "detay": "Detaylı kron tedavisi değerlendirmesi",
    "malzeme_onerisi": "Önerilen kron malzemesi ve nedeni (zirkonya, e-max, metal seramik, monolitik)",
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
  "full_kaplama_plani": {
    "uygunluk": true,
    "anterior_plan": "Ön bölge (13-23) için full kaplama stratejisi",
    "posterior_plan": "Arka bölge için full kaplama stratejisi",
    "malzeme_karsilastirmasi": "Zirkonya vs E-max vs Metal Seramik vs Monolitik karşılaştırma tablosu",
    "toplam_dis_sayisi": "Toplam kaplanacak diş sayısı",
    "tahmini_seans": "Tahmini seans sayısı"
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
            if (jsonStr.includes("```json")) {
                jsonStr = jsonStr.split("```json")[1].split("```")[0];
            } else if (jsonStr.includes("```")) {
                jsonStr = jsonStr.split("```")[1].split("```")[0];
            }
            analysis = JSON.parse(jsonStr.trim());
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr, "Content:", content);
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
                full_kaplama_plani: { uygunluk: false, anterior_plan: "", posterior_plan: "", malzeme_karsilastirmasi: "", toplam_dis_sayisi: "", tahmini_seans: "" },
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
