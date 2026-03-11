import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini 3.1 Pro + 4-5 fotoğraf analizi uzun sürebilir
export const maxDuration = 300;

const EXPECTATION_LABELS = {
    full_crown: "Full Kaplama Kron",
    monolithic: "Monolitik Kron",
    veneer: "Laminate Veneer",
    implant: "İmplant",
    bridge: "Köprü Protez",
    composite: "Kompozit Bonding",
    whitening: "Diş Beyazlatma",
    orthodontic: "Ortodonti",
};

function buildExpectationsPrompt(expectations) {
    if (!expectations || expectations.length === 0) return "";
    const labels = expectations.map((e) => EXPECTATION_LABELS[e] || e).join(", ");
    return `\nBEKLENTİLER: ${labels}`;
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
        // KESİN KURAL: En güçlü mevcut model — Gemini 3.1 Pro Preview
        const modelName = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";
        console.log(`[ISTADENTAL] Using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const imageParts = images.map((img) => {
            const matches = img.base64.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return null;
            return { inlineData: { mimeType: matches[1], data: matches[2] } };
        }).filter(Boolean);

        const prompt = `Protetik diş hekimi + estetik uzmanı + periodontologsun. Estetik klinik için DETAYLI analiz yap.

HASTA: ${patientInfo.fullName}, ${patientInfo.age}y, ${patientInfo.gender}
ŞİKAYET: ${patientInfo.complaint}
${patientInfo.dentalHistory ? `GEÇMİŞ: ${patientInfo.dentalHistory}` : ""}${patientInfo.existingTreatments ? ` TEDAVİLER: ${patientInfo.existingTreatments}` : ""}${buildExpectationsPrompt(expectations)}

FOTOĞRAFLAR: ${images.map((img, i) => `[${i + 1}:${img.title}]`).join(" ")}

AYNA KURALI VE KOORDİNAT REHBERİ:
Frontal/yarım açık (hastanın sağı=senin solun):
  Üst sıra y=28-42: 18→x=8, 17→x=14, 16→x=20, 15→x=26, 14→x=32, 13→x=38, 12→x=42, 11→x=47, 21→x=53, 22→x=58, 23→x=62, 24→x=68, 25→x=74, 26→x=80, 27→x=86, 28→x=92
  Alt sıra y=50-62: 48→x=8, 47→x=14, 46→x=20, 45→x=26, 44→x=32, 43→x=38, 42→x=43, 41→x=48, 31→x=52, 32→x=57, 33→x=62, 34→x=68, 35→x=74, 36→x=80, 37→x=86, 38→x=92
Oklüzal üst (ayna=TERS, solda gördüğün=hastanın sağı):
  Anterior y=75-85 orta, posterior y=15-35 kenarlar, sağ x=10-40, sol x=60-90
Oklüzal alt (ayna=TERS):
  Anterior y=15-25 orta, posterior y=65-85 kenarlar, sağ x=10-40, sol x=60-90

FOTOĞRAF İŞARETLEME: Tedavi gereken her dişi kendi x,y koordinatıyla işaretle.
Tedavi tipleri: kron(kırmızı), veneer(yeşil), implant(mavi), kanal(turuncu), curuk(sarı), cerrahi(mor)

SADECE JSON döndür:
{"genel_degerlendirme":{"ozet":"1 cümle","seviye":"iyi/orta/kotu","detay":"2-3 cümle detaylı","okluzyon":"Angle sınıfı, overjet mm, overbite mm"},"foto_bulgular":[{"foto_no":1,"foto_tipi":"frontal/okluzal_ust/okluzal_alt/yarim_acik/panoramik","isaret":[{"dis_no":"14","x":35,"y":40,"tedavi_tipi":"kron/veneer/implant/kanal/curuk/cerrahi","etiket":"maks 4 kelime"}]}],"dis_dis_analiz":[{"dis_no":"FDI","bolge":"Üst sağ/sol Alt sağ/sol","durum":"maks 10 kelime","tedavi":"kısa öneri","oncelik":"yuksek/orta/dusuk","kategori":"crown/veneer/implant/canal/missing/bridge","mevcut_renk":"VITA shade A1-D4","hedef_renk":"önerilen shade"}],"dis_renk_analizi":{"genel_ton":"A1-D4 arası genel ton","beyazlatma_potansiyeli":"var/yok/kısıtlı","hedef_shade":"önerilen hedef","disler":[{"dis_no":"11","mevcut":"A3","hedef":"A1","not":"kısa"}]},"diseti_durumu":{"genel":"sağlıklı/gingivitis/periodontitis","biyotip":"kalın/ince/orta","enflamasyon_bolgeler":"varsa bölgeler","resesiyon":[{"dis_no":"23","mm":2,"miller_sinif":"I/II/III"}],"papilla_kaybi":"var/yok bölgeler","tedavi_onerisi":"periodontal tedavi detay"},"gulus_analizi":{"gulus_hatti":"düşük/orta/yüksek (gummy smile)","midline":"ortada/sağa kayık/sola kayık mm","buccal_koridor":"dar/normal/geniş","gingival_zenith":"simetrik/asimetrik detay","dudak_hatti":"üst dudak pozisyonu","estetik_skor":"1-10","oneriler":"smile design önerileri"},"mevcut_restorasyonlar":[{"dis_no":"15","tip":"dolgu/kron/köprü/veneer","malzeme":"amalgam/kompozit/metal-porselen/zirkonya","durum":"iyi/orta/değişmeli","not":"kısa"}],"fonksiyonel_analiz":{"bruxism":"var/yok/şüpheli","asinma_paterni":"atrisyon/abrazyon/erozyon/yok","asinma_bolgeler":"varsa bölgeler","cene_eklemi":"normal/ağrılı/sesli","gece_plagi":"önerilir/gerekmez","oneriler":"kısa"},"dis_oranlari":{"ust_anterior_oran":"genişlik/yükseklik %","simetri":"simetrik/asimetrik detay","golden_proportion":"uygun/uygun değil","oneriler":"kısa"},"kemik_durumu":{"genel_seviye":"normal/hafif kayıp/orta kayıp/ileri kayıp","kayip_bolgeler":[{"bolge":"üst sağ posterior","seviye":"mm veya %"}],"greft_ihtiyaci":"var/yok bölgeler","sinus_lifting":"gerekli/gereksiz"},"kron_tedavisi":{"uygunluk":true,"uygun_disler":["no"],"malzeme":"anterior e-max, posterior zirkonya","kesim":"mm cinsinden","kanal_riski":"riskli dişler"},"veneer_tedavisi":{"uygunluk":true,"uygun_disler":["no"],"prep_tipi":"no-prep/minimal/full","mine_durumu":"kısa","not":"kısa"},"implant_degerlendirme":{"gerekli":true,"bolgeler":[{"dis_no":"no","oneri":"kısa","cerrahi":"greft/sinüs lifting/yok"}]},"kanal_tedavisi_riski":{"risk_seviyesi":"dusuk/orta/yuksek","riskli_disler":[{"dis_no":"no","risk":"kısa"}]},"tedavi_plani":{"adimlar":[{"sira":1,"baslik":"kısa","aciklama":"1 cümle","oncelik":"yuksek/orta/dusuk","tahmini_seans":"sayı"}],"toplam_tahmini_seans":"sayı"},"onerilen_plan":{"baslik":"Plan başlığı","toplam_dis_sayisi":12,"dis_araliklari":"Üst 13-23, Alt 33-43 gibi","full_kaplama":{"anterior":"dişler+malzeme","posterior":"dişler+malzeme"},"kanal_tedavisi":"dişler","implant":"bölgeler+adet","cerrahi":"detay","tahmini_seans":"sayı","notlar":"1 cümle"},"alternatif_planlar":[{"plan_adi":"Plan B","toplam_dis_sayisi":8,"ozet":"kısa","detaylar":{"veneer":"dişler","kron":"dişler","implant":"bölgeler","kanal":"dişler","cerrahi":"detay"},"tahmini_seans":"sayı","avantaj":"1 cümle","dezavantaj":"1 cümle"}]}`;

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
