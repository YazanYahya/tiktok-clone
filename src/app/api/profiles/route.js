import {NextResponse} from "next/server";
import {getUserProfileById} from "@/services/userService";
import {currentUser} from "@clerk/nextjs/server";

export async function GET(request, {params}) {
    try {
        const user = await currentUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const userProfile = await getUserProfileById(userId);

        if (!userProfile) {
            return NextResponse.json({error: "User profile not found"}, {status: 404});
        }

        return NextResponse.json(userProfile);
    } catch (error) {
        console.error("Error fetching user profile by ID:", error.message);
        return NextResponse.json({error: "Internal Server Error", details: error.message}, {status: 500});
    }
}