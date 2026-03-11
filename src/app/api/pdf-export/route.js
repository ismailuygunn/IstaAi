import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Turkish character support via built-in helvetica (basic latin)
// For full Turkish, we use unicode-compatible approach

export async function POST(request) {
    try {
        const { record, analysis } = await request.json();

        if (!record || !analysis) {
            return Response.json({ error: "Eksik veri" }, { status: 400 });
        }

        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 15;

        // Helper: safe text (replace Turkish chars for basic PDF)
        const tr = (text) => {
            if (!text) return "";
            return String(text)
                .replace(/ı/g, "i").replace(/İ/g, "I")
                .replace(/ş/g, "s").replace(/Ş/g, "S")
                .replace(/ç/g, "c").replace(/Ç/g, "C")
                .replace(/ğ/g, "g").replace(/Ğ/g, "G")
                .replace(/ö/g, "o").replace(/Ö/g, "O")
                .replace(/ü/g, "u").replace(/Ü/g, "U");
        };

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 35, "F");
        doc.setTextColor(248, 250, 252);
        doc.setFontSize(18);
        doc.text("ISTADENTAL", pageWidth / 2, 15, { align: "center" });
        doc.setFontSize(10);
        doc.text("AI Destekli Dental Analiz Raporu", pageWidth / 2, 23, { align: "center" });
        doc.setFontSize(8);
        doc.text(`Tarih: ${new Date(record.createdAt).toLocaleDateString("tr-TR")}`, pageWidth / 2, 30, { align: "center" });

        y = 42;

        // Patient Info Box
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, "F");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text(`Hasta: ${tr(record.patientName)}`, margin + 5, y + 7);
        doc.text(`Yas: ${record.patientAge}  |  Cinsiyet: ${tr(record.patientGender)}`, margin + 5, y + 14);
        doc.text(`Sikayet: ${tr(record.complaint?.slice(0, 80))}`, margin + 5, y + 20);
        y += 28;

        // Expectations
        if (record.expectations && record.expectations.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Tedavi Beklentileri: ${record.expectations.join(", ")}`, margin, y);
            y += 6;
        }

        // General Assessment
        if (analysis.genel_degerlendirme) {
            doc.setFillColor(37, 99, 235);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("Genel Degerlendirme", margin + 4, y + 6);
            y += 12;

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(tr(analysis.genel_degerlendirme.detay || analysis.genel_degerlendirme.ozet), pageWidth - margin * 2 - 5);
            doc.text(lines, margin + 2, y);
            y += lines.length * 4.5 + 4;
        }

        // Problem Teeth Table
        if (analysis.dis_dis_analiz && analysis.dis_dis_analiz.length > 0) {
            doc.setFillColor(37, 99, 235);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("Sorunlu Disler", margin + 4, y + 6);
            y += 12;

            doc.autoTable({
                startY: y,
                margin: { left: margin, right: margin },
                head: [["Dis No", "Durum", "Tedavi", "Oncelik"]],
                body: analysis.dis_dis_analiz.map((d) => [
                    String(d.dis_no),
                    tr(d.durum),
                    tr(d.tedavi || d.tedavi_onerisi || ""),
                    tr(d.oncelik),
                ]),
                theme: "grid",
                headStyles: { fillColor: [37, 99, 235], fontSize: 8, cellPadding: 2 },
                bodyStyles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
                alternateRowStyles: { fillColor: [241, 245, 249] },
                columnStyles: {
                    0: { cellWidth: 18 },
                    3: { cellWidth: 20 },
                },
            });
            y = doc.lastAutoTable.finalY + 6;
        }

        // Check page overflow
        const checkPage = () => {
            if (y > 260) {
                doc.addPage();
                y = 15;
            }
        };

        // Kron & Veneer
        checkPage();
        if (analysis.kron_tedavisi || analysis.veneer_tedavisi) {
            doc.setFillColor(37, 99, 235);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("Protetik Degerlendirme", margin + 4, y + 6);
            y += 12;

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(9);

            if (analysis.kron_tedavisi) {
                doc.setFont(undefined, "bold");
                doc.text("Kron: " + (analysis.kron_tedavisi.uygunluk ? "Uygun" : "Uygun Degil"), margin + 2, y);
                doc.setFont(undefined, "normal");
                y += 5;
                if (analysis.kron_tedavisi.uygun_disler?.length) {
                    doc.text(`Disler: ${analysis.kron_tedavisi.uygun_disler.join(", ")}`, margin + 2, y);
                    y += 5;
                }
                if (analysis.kron_tedavisi.malzeme) {
                    const ml = doc.splitTextToSize(`Malzeme: ${tr(analysis.kron_tedavisi.malzeme)}`, pageWidth - margin * 2 - 5);
                    doc.text(ml, margin + 2, y);
                    y += ml.length * 4 + 2;
                }
            }

            if (analysis.veneer_tedavisi) {
                doc.setFont(undefined, "bold");
                doc.text("Veneer: " + (analysis.veneer_tedavisi.uygunluk ? "Uygun" : "Uygun Degil"), margin + 2, y);
                doc.setFont(undefined, "normal");
                y += 5;
                if (analysis.veneer_tedavisi.uygun_disler?.length) {
                    doc.text(`Disler: ${analysis.veneer_tedavisi.uygun_disler.join(", ")}`, margin + 2, y);
                    y += 5;
                }
            }
            y += 4;
        }

        // Treatment Plan
        checkPage();
        if (analysis.tedavi_plani?.adimlar?.length) {
            doc.setFillColor(37, 99, 235);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text(`Tedavi Plani (Tahmini ${analysis.tedavi_plani.toplam_tahmini_seans || "?"} seans)`, margin + 4, y + 6);
            y += 12;

            doc.autoTable({
                startY: y,
                margin: { left: margin, right: margin },
                head: [["Sira", "Baslik", "Aciklama", "Seans"]],
                body: analysis.tedavi_plani.adimlar.map((a) => [
                    String(a.sira),
                    tr(a.baslik),
                    tr(a.aciklama),
                    String(a.tahmini_seans || "?"),
                ]),
                theme: "grid",
                headStyles: { fillColor: [37, 99, 235], fontSize: 8, cellPadding: 2 },
                bodyStyles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
                alternateRowStyles: { fillColor: [241, 245, 249] },
                columnStyles: {
                    0: { cellWidth: 12 },
                    1: { cellWidth: 35 },
                    3: { cellWidth: 14 },
                },
            });
            y = doc.lastAutoTable.finalY + 6;
        }

        // Önerilen Plan
        checkPage();
        if (analysis.onerilen_plan) {
            const op = analysis.onerilen_plan;
            doc.setFillColor(234, 179, 8);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(11);
            doc.text(tr(op.baslik || "Onerilen Plan"), margin + 4, y + 6);
            y += 12;

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(9);

            if (op.toplam_dis_sayisi) {
                doc.setFont(undefined, "bold");
                doc.text(`Toplam ${op.toplam_dis_sayisi} dis islemi`, margin + 2, y);
                doc.setFont(undefined, "normal");
                y += 5;
            }
            if (op.dis_araliklari) {
                doc.text(`Araliklar: ${tr(op.dis_araliklari)}`, margin + 2, y); y += 5;
            }
            if (op.full_kaplama) {
                if (op.full_kaplama.anterior) { doc.text(`  Anterior: ${tr(op.full_kaplama.anterior)}`, margin + 4, y); y += 4; }
                if (op.full_kaplama.posterior) { doc.text(`  Posterior: ${tr(op.full_kaplama.posterior)}`, margin + 4, y); y += 4; }
            }
            if (op.kanal_tedavisi) { doc.text(`Kanal: ${tr(op.kanal_tedavisi)}`, margin + 2, y); y += 5; }
            if (op.implant) { doc.text(`Implant: ${tr(op.implant)}`, margin + 2, y); y += 5; }
            if (op.cerrahi) { doc.text(`Cerrahi: ${tr(op.cerrahi)}`, margin + 2, y); y += 5; }
            if (op.tahmini_seans) {
                doc.setFont(undefined, "bold");
                doc.text(`Tahmini ${op.tahmini_seans} seans`, margin + 2, y);
                doc.setFont(undefined, "normal");
                y += 5;
            }
            if (op.notlar) {
                const nl = doc.splitTextToSize(`Not: ${tr(op.notlar)}`, pageWidth - margin * 2 - 5);
                doc.text(nl, margin + 2, y); y += nl.length * 4 + 2;
            }
            y += 4;
        }

        // Alternative Plans
        checkPage();
        if (analysis.alternatif_planlar?.length) {
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("Alternatif Tedavi Planlari", margin + 4, y + 6);
            y += 12;

            analysis.alternatif_planlar.forEach((plan, idx) => {
                checkPage();
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(9);
                doc.setFont(undefined, "bold");
                doc.text(tr(plan.plan_adi) + ` (${plan.tahmini_seans || "?"} seans)`, margin + 2, y);
                doc.setFont(undefined, "normal");
                y += 5;
                if (plan.ozet) {
                    const sl = doc.splitTextToSize(tr(plan.ozet), pageWidth - margin * 2 - 5);
                    doc.text(sl, margin + 2, y);
                    y += sl.length * 4 + 2;
                }
                if (plan.detaylar) {
                    const details = Object.entries(plan.detaylar).filter(([, v]) => v);
                    details.forEach(([key, val]) => {
                        doc.setFontSize(8);
                        doc.text(`  ${key}: ${tr(val)}`, margin + 4, y);
                        y += 4;
                    });
                }
                if (plan.avantaj) { doc.setFontSize(8); doc.text(`  + ${tr(plan.avantaj)}`, margin + 4, y); y += 4; }
                if (plan.dezavantaj) { doc.text(`  - ${tr(plan.dezavantaj)}`, margin + 4, y); y += 4; }
                y += 3;
            });
        }

        // Disclaimer
        checkPage();
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, "F");
        doc.setTextColor(146, 64, 14);
        doc.setFontSize(7);
        doc.text(
            "UYARI: Bu rapor yapay zeka destekli on degerlendirme niteligindedir ve kesin tani yerine gecmez.",
            margin + 4, y + 5
        );
        doc.text(
            "Tedavi kararlari mutlaka dis hekimi muayenesi sonrasinda verilmelidir. ISTADENTAL",
            margin + 4, y + 10
        );

        // Generate PDF buffer
        const pdfOutput = doc.output("arraybuffer");

        return new Response(pdfOutput, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="ISTADENTAL_Rapor_${record.patientName?.replace(/\s/g, "_") || "hasta"}.pdf"`,
            },
        });
    } catch (err) {
        console.error("PDF Error:", err);
        return Response.json({ error: "PDF oluşturulurken hata: " + err.message }, { status: 500 });
    }
}
