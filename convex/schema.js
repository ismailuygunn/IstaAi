import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    analyses: defineTable({
        // Patient info
        patientName: v.string(),
        patientAge: v.string(),
        patientGender: v.string(),
        complaint: v.string(),
        dentalHistory: v.optional(v.string()),
        allergies: v.optional(v.string()),
        existingTreatments: v.optional(v.string()),
        // Analysis metadata
        photoCount: v.number(),
        photoTypes: v.array(v.string()),
        // AI analysis result (stored as JSON string)
        analysisResult: v.string(),
        // Timestamps
        createdAt: v.number(),
    })
        .index("by_creation", ["createdAt"]),
});
