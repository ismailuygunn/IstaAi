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
        // Photos stored as Convex file storage IDs (no 1MB limit)
        photoStorageIds: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            storageId: v.id("_storage"),
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
});
