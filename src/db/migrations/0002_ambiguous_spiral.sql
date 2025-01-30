ALTER TABLE "video_features" ALTER COLUMN "embedding" SET DATA TYPE vector(1408);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "interests" jsonb DEFAULT '[]'::jsonb;