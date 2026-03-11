import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    analyses: defineTable({
        patientName: v.string(),
        patientAge: v.string(),
        patientGender: v.string(),
        complaint: v.string(),
        dentalHistory: v.optional(v.string()),
        allergies: v.optional(v.string()),
        existingTreatments: v.optional(v.string()),
        expectations: v.optional(v.array(v.string())),
        photoCount: v.number(),
        photoTypes: v.array(v.string()),
        // NEW: Photos stored as Convex file storage IDs
        photoStorageIds: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            storageId: v.id("_storage"),
        }))),
        // OLD: Backward compat — eski inline base64 photos
        photos: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            base64: v.string(),
        }))),
        analysisResult: v.string(),
        createdAt: v.number(),
    })
        .index("by_creation", ["createdAt"]),

    notes: defineTable({
        analysisId: v.id("analyses"),
        section: v.string(),
        content: v.string(),
        createdAt: v.number(),
    })
        .index("by_analysis", ["analysisId"]),

    training_data: defineTable({
        // Referans
        analysisId: v.id("analyses"),

        // AI'ın orijinal çıktısı (karşılaştırma için)
        originalResult: v.string(),

        // Doktorun düzelttiği sonuç (tam JSON string)
        correctedResult: v.string(),

        // Düzeltilmiş fotoğraf markerları (JSON string)
        correctedMarkers: v.string(),

        // Hasta bilgileri (prompt reproduce için)
        patientName: v.string(),
        patientAge: v.string(),
        patientGender: v.string(),
        complaint: v.string(),
        dentalHistory: v.optional(v.string()),
        existingTreatments: v.optional(v.string()),
        expectations: v.optional(v.array(v.string())),

        // Fotoğraf referansları
        photoStorageIds: v.array(v.object({
            id: v.string(),
            title: v.string(),
            storageId: v.id("_storage"),
        })),

        // Durum yönetimi
        status: v.string(), // "draft" | "approved"
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_analysis", ["analysisId"]),
});
