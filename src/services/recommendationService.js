import {fetchCollaborativeRecommendations} from "./collaborativeService";
import {fetchContentBasedRecommendations, scaleSimilarityScores} from "./contentFilteringService";
import {fetchVideosByInteraction} from "@/services/interactionService";
import {INTERACTION_TYPES} from "@/constants/interactions";
import {fetchVideosByIds} from "@/services/videoService";

/**
 * Generates video recommendations using both collaborative and content-based filtering.
 */
export async function generateRecommendations(userId) {
    // Fetch recommendations from both filtering methods
    let collaborativeVideos = await fetchCollaborativeRecommendations(userId);
    let contentVideos = await fetchContentBasedRecommendations(userId);
    contentVideos = scaleSimilarityScores(contentVideos);

    // Merge recommendations into a single score
    let videoScores = mergeRecommendations(collaborativeVideos, contentVideos);

    // Fetch video details
    let recommendedVideos = await fetchVideosByIds([...videoScores.keys()]);

    // Attach scores & determine the source of recommendation
    recommendedVideos = recommendedVideos.map(video => {
        const isBasedCollaborative = collaborativeVideos.some(v => v.video_id === video.id);
        const isBasedContent = contentVideos.some(v => v.id === video.id);

        return {
            ...video,
            score: videoScores.get(video.id) || 0,
            isBasedCollaborative,
            isBasedContent
        };
    });

    // Apply diversity control
    recommendedVideos = applyDiversityControl(recommendedVideos);

    // Sort videos by score (highest to lowest)
    recommendedVideos.sort((a, b) => b.score - a.score);

    // Fetch liked videos for the user
    const likedVideoIds = await fetchVideosByInteraction(userId, [...videoScores.keys()], INTERACTION_TYPES.LIKE);

    // Add `isLiked` field
    return recommendedVideos.map(video => ({
        ...video,
        isLiked: likedVideoIds.has(video.id),
    }));
}

/**
 * Merges collaborative and content-based recommendations into a single score.
 */
function mergeRecommendations(collaborativeVideos, contentVideos) {
    const CONTENT_WEIGHT = 0.3;
    const COLLAB_WEIGHT = 0.7;
    const videoScores = new Map();

    // Apply collaborative filtering scores
    for (const video of collaborativeVideos) {
        videoScores.set(video.video_id, (videoScores.get(video.video_id) || 0) + video.score * COLLAB_WEIGHT);
    }

    // Apply content-based filtering scores
    for (const video of contentVideos) {
        videoScores.set(video.id, (videoScores.get(video.id) || 0) + video.score * CONTENT_WEIGHT);
    }

    return videoScores;
}

/**
 * Applies diversity control to ensure varied recommendations.
 * Penalizes videos that are too similar to already recommended ones.
 */
export function applyDiversityControl(videos, similarityThreshold = 0.8, penaltyWeight = 0.2) {
    let adjustedVideos = [];
    let seenEmbeddings = [];

    for (const video of videos) {
        let avgSimilarity = 0;

        if (seenEmbeddings.length > 0 && video.embeddings) {
            const similarities = seenEmbeddings.map(emb => cosineSimilarity(video.embeddings, emb));
            avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
        }

        // Apply penalty if similarity is high
        if (avgSimilarity > similarityThreshold) {
            video.score -= avgSimilarity * penaltyWeight;
        }

        // Ensure score is non-negative
        video.score = Math.max(video.score, 0);

        adjustedVideos.push(video);
        if (video.embeddings) {
            seenEmbeddings.push(video.embeddings); // Track seen embeddings
        }
    }

    return adjustedVideos;
}

export function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

    return magA && magB ? dotProduct / (magA * magB) : 0;
}