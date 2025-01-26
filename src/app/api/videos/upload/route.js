import {NextResponse} from "next/server";
import {currentUser} from "@clerk/nextjs/server";
import {uploadAndSaveVideo} from "@/services/videoService";

export async function POST(request) {
    try {
        const user = await currentUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        // Parse formData
        const formData = await request.formData();
        const file = formData.get("file");
        const caption = formData.get("caption");
        const tags = formData.get("tags");

        // Validate input
        if (!file || !caption) {
            return NextResponse.json({error: "Missing required fields"}, {status: 400});
        }

        if (caption.length > 255) {
            return NextResponse.json({error: "Caption is too long"}, {status: 400});
        }

        const allowedMimeTypes = ["video/mp4"];
        if (!allowedMimeTypes.includes(file.type)) {
            return NextResponse.json({error: "Unsupported file type"}, {status: 400});
        }

        // Process tags
        const tagArray = tags ? tags.split(",").map((tag) => tag.trim()).filter((tag) => tag) : [];

        // Read file data as a buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload and save the video
        const result = await uploadAndSaveVideo(fileBuffer, caption, tagArray, userId);

        return NextResponse.json({
            status: "Video uploaded successfully",
            fileUrl: result.fileUrl,
            videoId: result.videoId,
        });
    } catch (error) {
        console.error("Error in upload API:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}