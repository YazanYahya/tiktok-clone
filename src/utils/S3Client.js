import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {v4 as uuidv4} from "uuid";

const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    },
});

export async function uploadVideo(videoData) {
    const fileName = `videos/${uuidv4()}.mp4`;

    const uploadParams = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: videoData,
        ContentType: "video/mp4",
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        return `${R2_PUBLIC_URL}/${fileName}`;
    } catch (error) {
        console.error("Error uploading video to S3:", error);
        throw new Error("Failed to upload video to S3");
    }
}