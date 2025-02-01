CREATE TABLE "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"video_id" integer NOT NULL,
	"interaction" text NOT NULL,
	"watch_time" integer DEFAULT null,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"profile_pic" text,
	"interests" jsonb DEFAULT '[]'::jsonb,
	"embeddings" vector(768) DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"summary" text DEFAULT null,
	"duration" double precision DEFAULT null,
	"inferred_interests" jsonb DEFAULT '[]'::jsonb,
	"embeddings" vector(768) DEFAULT null,
	"likes_count" integer DEFAULT 0,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;