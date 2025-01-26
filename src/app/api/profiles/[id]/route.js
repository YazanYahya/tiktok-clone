import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/db/db";
import {userProfiles} from "@/db/schema";

export async function GET(request, {params}) {
    const {id} = await params;

    try {
        // Query the userProfiles table for the user with the specified id
        const userProfile = await db
            .select({
                id: userProfiles.id,
                username: userProfiles.username,
                profilePic: userProfiles.profilePic
            })
            .from(userProfiles)
            .where(eq(userProfiles.id, id));

        if (!userProfile || userProfile.length !== 1) {
            return NextResponse.json({error: "User profile not found"}, {status: 404});
        }

        return NextResponse.json(userProfile[0]);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}