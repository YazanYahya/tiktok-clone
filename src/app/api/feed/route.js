import {NextResponse} from "next/server";
import {currentUser} from "@clerk/nextjs/server";
import {fetchVideosByInteraction} from "@/services/interactionService";
import {INTERACTION_TYPES} from "@/constants/interactions";
import {getByKey} from "@/utils/Upstash";
import {fetchVideosByIds} from "@/services/videoService";

export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const userId = user.id;

        // Fetch the cached recommended videos
        const cachedRecommendedVideos = await getByKey(`recommendations:${userId}`);

        // Extract video IDs
        const videoIds = cachedRecommendedVideos.map((video) => video.video_id);
        const scoreMap = new Map(
            cachedRecommendedVideos.map((video) => [video.video_id, video.score])
        );

        // Fetch video details from the database
        const recommendedVideos = await fetchVideosByIds(videoIds);

        // Attach scores to the recommended videos
        const videosWithScores = recommendedVideos.map((video) => ({
            ...video,
            score: scoreMap.get(video.id) || 0,
        }));

        // Sort videos by their scores in descending order
        const sortedVideos = videosWithScores.sort((a, b) => b.score - a.score);

        // Fetch liked videos for the current user
        const likedVideoIds = await fetchVideosByInteraction(userId, videoIds, INTERACTION_TYPES.LIKE);

        // Add the `isLiked` field to each video
        const videoListWithLikeStatus = sortedVideos.map((video) => ({
            ...video,
            isLiked: likedVideoIds.has(video.id),
        }));

        return NextResponse.json(videoListWithLikeStatus);
    } catch (error) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({error: "Failed to fetch videos"}, {status: 500});
    }
}