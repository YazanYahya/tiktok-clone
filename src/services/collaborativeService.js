import { getByKey } from "@/utils/Upstash";

/**
 * Fetches collaborative filtering recommendations from cache.
 */
export async function fetchCollaborativeRecommendations(userId) {
    let collaborativeVideos = await getByKey(`recommendations:${userId}`);
    return collaborativeVideos || [];
}