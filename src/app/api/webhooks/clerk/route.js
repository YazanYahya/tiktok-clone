import {NextResponse} from "next/server";
import {createUserProfile} from "@/services/userService";

function verifyClerkSignature(request) {
    // add verification logic later
    return true;
}

export async function POST(request) {
    if (!verifyClerkSignature(request)) {
        return NextResponse.json({error: "Invalid webhook signature"}, {status: 401});
    }

    const body = await request.json();

    if (body.type !== "user.created") {
        return NextResponse.json({error: "Unhandled event type"}, {status: 400});
    }

    const {id, email_addresses, first_name, last_name, image_url} = body.data;
    const email = email_addresses?.find((emailObj) => emailObj.verification.status === "verified")?.email_address || null;

    try {
        await createUserProfile({
            id,
            username: `${first_name || ""} ${last_name || ""}`.trim(),
            email,
            profilePic: image_url || null,
        });

        return NextResponse.json({status: "User profiles created successfully"});
    } catch (error) {
        console.error("Error creating user profiles:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}