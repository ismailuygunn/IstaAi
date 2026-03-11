import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

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
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

        const imageParts = images.map((img) => {
            const matches = img.base64.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return null;
            return { inlineData: { mimeType: matches[1], data: matches[2] } };
        }).filter(Boolean);

        const prompt = `Protetik diş hekimi + estetik uzmanısın. Estetik klinik için full kaplama öncelikli analiz yap.

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
{"genel_degerlendirme":{"ozet":"1 cümle","seviye":"iyi/orta/kotu","detay":"2 cümle","okluzyon":"Angle, overjet, overbite"},"foto_bulgular":[{"foto_no":1,"foto_tipi":"frontal/okluzal_ust/okluzal_alt/yarim_acik/panoramik","isaret":[{"dis_no":"14","x":35,"y":40,"tedavi_tipi":"kron/veneer/implant/kanal/curuk/cerrahi","etiket":"maks 4 kelime"}]}],"dis_dis_analiz":[{"dis_no":"FDI","bolge":"Üst sağ/sol Alt sağ/sol","durum":"maks 10 kelime","tedavi":"kısa öneri","oncelik":"yuksek/orta/dusuk","kategori":"crown/veneer/implant/canal/missing/bridge"}],"kron_tedavisi":{"uygunluk":true,"uygun_disler":["no"],"malzeme":"anterior e-max, posterior zirkonya gibi","kesim":"mm cinsinden","kanal_riski":"riskli dişler"},"veneer_tedavisi":{"uygunluk":true,"uygun_disler":["no"],"prep_tipi":"no-prep/minimal/full","mine_durumu":"kısa","not":"kısa"},"implant_degerlendirme":{"gerekli":true,"bolgeler":[{"dis_no":"no","oneri":"kısa","cerrahi":"greft/sinüs lifting/yok"}]},"kanal_tedavisi_riski":{"risk_seviyesi":"dusuk/orta/yuksek","riskli_disler":[{"dis_no":"no","risk":"kısa"}]},"tedavi_plani":{"adimlar":[{"sira":1,"baslik":"kısa","aciklama":"1 cümle","oncelik":"yuksek/orta/dusuk","tahmini_seans":"sayı"}],"toplam_tahmini_seans":"sayı"},"onerilen_plan":{"baslik":"Plan başlığı","toplam_dis_sayisi":12,"dis_araliklari":"Üst 13-23 6üye, Alt 33-43 6üye gibi","full_kaplama":{"anterior":"dişler+malzeme+üye","posterior":"dişler+malzeme+üye"},"kanal_tedavisi":"dişler","implant":"bölgeler+adet","cerrahi":"greft/sinüs detay","tahmini_seans":"sayı","notlar":"1 cümle"},"alternatif_planlar":[{"plan_adi":"Plan B","toplam_dis_sayisi":8,"ozet":"kısa","detaylar":{"veneer":"dişler","kron":"dişler","implant":"bölgeler","kanal":"dişler","cerrahi":"detay","diger":"diğer"},"tahmini_seans":"sayı","avantaj":"1 cümle","dezavantaj":"1 cümle"}]}`;

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
