import {db} from "@/db/db";
import {userInteractions} from "@/db/schema";
import {and, eq, inArray} from "drizzle-orm";
import {INTERACTION_TYPES} from "@/constants/interactions";
import {decrementVideoLikes, incrementVideoLikes} from "@/services/videoService";

export async function checkInteraction(userId, videoId, interaction) {
    return db
        .select()
        .from(userInteractions)
        .where(
            and(
                eq(userInteractions.userId, userId),
                eq(userInteractions.videoId, videoId),
                eq(userInteractions.interaction, interaction)
            )
        )
        .limit(1);
}

export async function addInteraction({userId, videoId, interaction, watchTime = null}) {
    await db.insert(userInteractions).values({
        userId,
        videoId,
        interaction,
        watch_time: watchTime,
        timestamp: new Date(),
    });

    if (interaction === INTERACTION_TYPES.LIKE) {
        await incrementVideoLikes(videoId);
    }
}

export async function removeInteraction(userId, videoId, interaction) {
    const result = await db.delete(userInteractions)
        .where(
            and(
                eq(userInteractions.userId, userId),
                eq(userInteractions.videoId, videoId),
                eq(userInteractions.interaction, interaction)
            )
        );
    if (result && result.rowCount > 0) {
        await decrementVideoLikes(videoId);
    }
}

export async function fetchVideosByInteraction(userId, videoIds, interaction) {
    const likedVideos = await db
        .select({videoId: userInteractions.videoId})
        .from(userInteractions)
        .where(
            and(
                eq(userInteractions.userId, userId),
                eq(userInteractions.interaction, interaction),
                inArray(userInteractions.videoId, videoIds)
            )
        );

    return new Set(likedVideos.map((like) => like.videoId));
}