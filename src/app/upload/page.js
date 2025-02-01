"use client";

import {useState} from "react";
import Sidebar from "@/components/Sidebar";

export default function UploadVideoPage() {
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith("video/")) {
            setFile(selectedFile);
            setMessage("");
        } else {
            setFile(null);
            setMessage("Please select a valid video file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage("Please select a video file.");
            return;
        }
        if (!caption.trim()) {
            setMessage("Caption is required.");
            return;
        }

        setIsUploading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", caption.trim());

        try {
            const response = await fetch("/api/videos/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                await response.json();
                setMessage("Video uploaded successfully!");
                // Clear the form after successful upload
                setFile(null);
                setCaption("");
            } else {
                const error = await response.json();
                setMessage(`Error: ${error.error || "Something went wrong."}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message || "Something went wrong."}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex h-screen bg-black">
            <Sidebar/>
            <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 w-full">
                <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold text-center mb-4">Upload Video</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Video
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Caption
                            </label>
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`w-full py-2 px-4 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 ${
                                isUploading
                                    ? "bg-red-400 cursor-not-allowed"
                                    : "bg-red-500 hover:bg-red-600 focus:ring-black-400 focus:ring-opacity-75 text-white"
                            }`}
                        >
                            {isUploading ? "Uploading..." : "Upload"}
                        </button>
                    </form>
                    {message && (
                        <p
                            className={`text-center mt-4 ${
                                message.includes("Error") ? "text-red-500" : "text-green-500"
                            }`}
                        >
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}