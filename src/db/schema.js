import {doublePrecision, integer, jsonb, pgTable, serial, text, timestamp, vector} from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    profilePic: text("profile_pic"),
    interests: jsonb("interests").default([]),
    embeddings: vector("embeddings", {dimensions: 768}).default(null),
    createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
    id: serial("id").primaryKey(),
    url: text("url").notNull(),
    caption: text("caption"),
    summary: text("summary").default(null),
    duration: doublePrecision("duration").default(null),
    inferredInterests: jsonb("inferred_interests").default([]),
    embeddings: vector("embeddings", {dimensions: 768}).default(null),
    likesCount: integer("likes_count").default(0),
    userId: text("user_id")
        .notNull()
        .references(() => userProfiles.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const userInteractions = pgTable("user_interactions", {
    id: serial("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userProfiles.id),
    videoId: integer("video_id")
        .notNull()
        .references(() => videos.id),
    interaction: text("interaction").notNull(),
    watch_time: integer("watch_time").default(null),
    timestamp: timestamp("timestamp").defaultNow(),
});