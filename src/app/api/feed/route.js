import {NextResponse} from "next/server";
import {currentUser} from "@clerk/nextjs/server";
import {generateRecommendations} from "@/services/recommendationService";

/**
 * API Handler for fetching personalized video recommendations.
 */
export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const recommendations = await generateRecommendations(user.id);
        return NextResponse.json(recommendations);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return NextResponse.json({error: "Failed to fetch recommendations"}, {status: 500});
    }
}