import {db} from "@/db/db";
import {userProfiles} from "@/db/schema";
import {eq} from "drizzle-orm";

export async function createUserProfile({id, username, email, profilePic}) {
    return db.insert(userProfiles).values({id, username, email, profilePic});
}

export async function getUserProfileById(userId) {
    const [profile] = await db
        .select({
            id: userProfiles.id,
            username: userProfiles.username,
            profilePic: userProfiles.profilePic,
        })
        .from(userProfiles)
        .where(eq(userProfiles.id, userId));

    return profile || null;
}

export async function updateUserInterests(userId, interests) {
    return db
        .update(userProfiles)
        .set({interests})
        .where(eq(userProfiles.id, userId));
}