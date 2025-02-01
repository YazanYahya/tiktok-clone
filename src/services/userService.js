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

export async function updateUserInterests(userId, interests, embeddings) {
    return db
        .update(userProfiles)
        .set({
            interests,
            embeddings
        })
        .where(eq(userProfiles.id, userId));
}

export async function fetchUserEmbedding(userId) {
    const user = await db
        .select({ embeddings: userProfiles.embeddings })
        .from(userProfiles)
        .where(eq(userProfiles.id, userId))
        .limit(1);

    return user.length > 0 ? user[0].embeddings : null;
}