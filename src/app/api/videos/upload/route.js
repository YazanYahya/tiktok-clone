import {NextResponse} from "next/server";
import {currentUser} from "@clerk/nextjs/server";
import {updateVideoMetadata, uploadAndSaveVideo} from "@/services/videoService";
import {analyzeVideoContent, embedText} from "@/utils/GeminiClient";

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

        // Read file data as a buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload and save the video
        const result = await uploadAndSaveVideo(fileBuffer, caption, userId);
        const {fileUrl, videoId} = result;

        // Asynchronously analyze video content and update metadata
        analyzeAndUpdateMetadata(videoId, fileUrl)
            .then(() => {
                console.log(`✅ Video metadata analysis completed for videoId: ${videoId}`);
            })
            .catch(error => {
                console.error(`❌ Error in asynchronous metadata analysis for videoId ${videoId}:`, error);
            });

        return NextResponse.json({
            status: "Video uploaded successfully",
            fileUrl: fileUrl,
            videoId: videoId,
        });
    } catch (error) {
        console.error("Error in upload API:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}

async function analyzeAndUpdateMetadata(videoId, fileUrl) {
    try {
        const {summary, interests} = await analyzeVideoContent(fileUrl);
        console.log("Video Summary:", summary);
        console.log("Related Interests:", interests);

        const embeddingText = `
            Video Description:
            "${summary}"
            This video primarily discusses topics related to ${interests.join(", ")}.
        `;

        const embeddings = await embedText(embeddingText);
        console.log("Generated Embeddings:", embeddings);

        // Update video metadata in the database
        await updateVideoMetadata(videoId, {summary, interests, embeddings});

        console.log(`Metadata updated for videoId: ${videoId}`);
    } catch (error) {
        console.error(`Error analyzing and updating metadata for videoId ${videoId}:`, error);
    }
}