import {doublePrecision, integer, jsonb, pgTable, serial, text, timestamp, vector} from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    profilePic: text("profile_pic"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
    id: serial("id").primaryKey(),
    url: text("url").notNull(),
    caption: text("caption"),
    tags: jsonb("tags"),
    duration: doublePrecision("duration").default(null),
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

export const videoFeatures = pgTable("video_features", {
    id: serial("id").primaryKey(),
    videoId: integer("video_id")
        .notNull()
        .references(() => videos.id),
    embedding: vector("embedding", {dimensions: 1408}).notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
});