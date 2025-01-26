import {db} from "@/db/db";
import {videos} from "@/db/schema";
import {eq, inArray} from "drizzle-orm";
import {uploadVideo} from "@/utils/S3Client";


export async function uploadAndSaveVideo(fileBuffer, caption, tags, userId) {
    // Upload the video to S3
    const fileUrl = await uploadVideo(fileBuffer);

    // Save video metadata in the database
    const [insertedVideo] = await uploadVideoToDB(fileUrl, caption, tags, userId);

    return {
        fileUrl,
        videoId: insertedVideo.id,
    };
}

export async function uploadVideoToDB(url, caption, tags, userId) {
    return db
        .insert(videos)
        .values({url, caption, tags, userId, createdAt: new Date()})
        .returning({id: videos.id});
}

export async function fetchLatestVideos(limit = 10) {
    return db
        .select({
            id: videos.id,
            url: videos.url,
            caption: videos.caption,
            tags: videos.tags,
            likesCount: videos.likesCount,
            userId: videos.userId,
            createdAt: videos.createdAt,
        })
        .from(videos)
        .orderBy(videos.createdAt, "desc")
        .limit(limit);
}

export async function incrementVideoLikes(videoId) {
    const video = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

    if (video.length) {
        return db
            .update(videos)
            .set({likesCount: video[0].likesCount + 1})
            .where(eq(videos.id, videoId));
    }
}

export async function decrementVideoLikes(videoId) {
    const video = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

    if (video.length) {
        return db
            .update(videos)
            .set({likesCount: Math.max(0, video[0].likesCount - 1)})
            .where(eq(videos.id, videoId));
    }
}

export async function fetchVideosByIds(videoIds) {
    if (!videoIds || videoIds.length === 0) {
        return [];
    }
    return db
        .select({
            id: videos.id,
            url: videos.url,
            caption: videos.caption,
            tags: videos.tags,
            likesCount: videos.likesCount,
            userId: videos.userId,
            createdAt: videos.createdAt,
        })
        .from(videos)
        .where(inArray(videos.id, videoIds));
}