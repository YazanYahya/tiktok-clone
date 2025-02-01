import { fetchContentBasedRecommendedVideos } from "@/services/videoService";

/**
 * Fetches content-based recommendations from the database.
 */
export async function fetchContentBasedRecommendations(userId) {
    return await fetchContentBasedRecommendedVideos(userId);
}

/**
 * Normalizes content-based similarity scores from (0-1) to (0-5).
 */
export function scaleSimilarityScores(videos) {
    return videos.map(video => ({
        ...video,
        score: video.similarity * 5,
    }));
}