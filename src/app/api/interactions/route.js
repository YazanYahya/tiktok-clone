import {currentUser} from "@clerk/nextjs/server";
import {INTERACTION_TYPES} from "@/constants/interactions";
import {addInteraction, checkInteraction, removeInteraction} from "@/services/interactionService";

export async function POST(request) {
    try {
        const {videoId, interaction, watchTime} = await request.json();
        const user = await currentUser();
        const userId = user.id;

        // Validate input
        if (!userId || !videoId || !interaction) {
            return new Response(JSON.stringify({error: "Missing required fields"}), {status: 400});
        }

        if (!Object.values(INTERACTION_TYPES).includes(interaction)) {
            return new Response(JSON.stringify({error: "Invalid interaction type"}), {status: 400});
        }

        if (interaction === INTERACTION_TYPES.LIKE) {
            // Check if already liked
            const existingInteraction = await checkInteraction(userId, videoId, INTERACTION_TYPES.LIKE);

            if (!existingInteraction.length) {
                // Add like and increment likes count
                await addInteraction({userId, videoId, interaction: INTERACTION_TYPES.LIKE});
            }
        } else if (interaction === INTERACTION_TYPES.REMOVE_LIKE) {
            // Remove like if exists and decrement likes count
            await removeInteraction(userId, videoId, INTERACTION_TYPES.LIKE);
        } else if (interaction === INTERACTION_TYPES.WATCH) {
            if (watchTime) {
                await addInteraction({userId, videoId, interaction: INTERACTION_TYPES.WATCH, watchTime});
            } else {
                return new Response(JSON.stringify({error: "Missing watchTime"}), {status: 400});
            }
        }

        return new Response(JSON.stringify({status: "success"}), {status: 200});
    } catch (error) {
        console.error("Error handling interaction:", error);

        return new Response(
            JSON.stringify({error: "Internal Server Error", details: error.message}),
            {status: 500}
        );
    }
}