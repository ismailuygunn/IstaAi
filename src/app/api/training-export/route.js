import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

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

function buildPrompt(item) {
    const exps = (item.expectations || []).map((e) => EXPECTATION_LABELS[e] || e).join(", ");
    return `Protetik diş hekimi + estetik uzmanısın. Estetik klinik için full kaplama öncelikli analiz yap.

HASTA: ${item.patientName}, ${item.patientAge}y, ${item.patientGender}
ŞİKAYET: ${item.complaint}
${item.dentalHistory ? `GEÇMİŞ: ${item.dentalHistory}` : ""}${item.existingTreatments ? ` TEDAVİLER: ${item.existingTreatments}` : ""}${exps ? `\nBEKLENTİLER: ${exps}` : ""}

FOTOĞRAFLAR: ${(item.photoStorageIds || []).map((p, i) => `[${i + 1}:${p.title}]`).join(" ")}

SADECE JSON döndür.`;
}

export async function GET() {
    try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
            return Response.json({ error: "Convex URL yapılandırılmamış" }, { status: 500 });
        }

        const client = new ConvexHttpClient(convexUrl);
        const items = await client.query(api.training.getApprovedForExport);

        if (!items || items.length === 0) {
            return Response.json({ error: "Onaylı eğitim verisi bulunamadı" }, { status: 404 });
        }

        // Build JSONL
        const lines = [];
        for (const item of items) {
            const prompt = buildPrompt(item);

            // Build user parts: text prompt + photo references
            const userParts = [{ text: prompt }];

            // Add photo URLs as references (not inline base64 to keep file small)
            for (const photo of item.resolvedPhotos || []) {
                if (photo.url) {
                    userParts.push({
                        text: `[FOTO: ${photo.title}] URL: ${photo.url}`,
                    });
                }
            }

            const entry = {
                contents: [
                    { role: "user", parts: userParts },
                    { role: "model", parts: [{ text: item.correctedResult }] },
                ],
            };

            lines.push(JSON.stringify(entry));
        }

        const jsonl = lines.join("\n");

        return new Response(jsonl, {
            headers: {
                "Content-Type": "application/x-ndjson",
                "Content-Disposition": `attachment; filename="istadental_training_${new Date().toISOString().slice(0, 10)}.jsonl"`,
            },
        });
    } catch (err) {
        console.error("Training export error:", err);
        return Response.json({ error: "Export hatası: " + err.message }, { status: 500 });
    }
}
