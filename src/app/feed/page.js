"use client";

import useSWR from "swr";
import {useState} from "react";
import VideoPlayer from "@/components/VideoPlayer";
import UserProfile from "@/components/UserProfile";
import VideoControls from "@/components/VideoControls";
import Sidebar from "@/components/Sidebar";
import {ChevronDown, ChevronUp} from "lucide-react";
import {INTERACTION_TYPES} from "@/constants/interactions";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function FeedPage() {
    const {data: videos, error, isLoading} = useSWR("/api/feed", fetcher);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const handleScroll = (direction) => {
        if (direction === "up" && currentVideoIndex > 0) {
            setCurrentVideoIndex(currentVideoIndex - 1);
        } else if (direction === "down" && currentVideoIndex < (videos?.length || 0) - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-white">
                <p>Error loading feed. Please try again later.</p>
            </div>
        );
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <p>No videos available.</p>
            </div>
        );
    }

    const currentVideo = videos[currentVideoIndex];

    const handleWatchUpdate = async (watchDuration) => {
        try {
            await fetch("/api/interactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    videoId: currentVideo.id,
                    interaction: INTERACTION_TYPES.WATCH,
                    watchTime: watchDuration,
                }),
            });
        } catch (error) {
            console.error("Error updating watch duration:", error);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white">
            <Sidebar/>
            <main className="flex-1 relative h-full">
                <div className="absolute inset-0 flex items-center justify-center">
                    <VideoPlayer video={currentVideo} onWatchUpdate={handleWatchUpdate}/>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                    <UserProfile userId={currentVideo.userId}/>
                </div>

                <div className="absolute inset-y-0 right-4 flex flex-col items-center justify-center">
                    <button
                        disabled={currentVideoIndex === 0}
                        onClick={() => handleScroll("up")}
                        className={`p-2 mb-2 rounded-full transition-colors ${
                            currentVideoIndex === 0
                                ? "bg-gray-500"
                                : "bg-gray-800 hover:bg-gray-700"
                        }`}
                    >
                        <ChevronUp className="w-6 h-6"/>
                    </button>
                    <button
                        disabled={currentVideoIndex === videos.length - 1}
                        onClick={() => handleScroll("down")}
                        className={`p-2 mt-2 rounded-full transition-colors ${
                            currentVideoIndex === videos.length - 1
                                ? "bg-gray-500"
                                : "bg-gray-800 hover:bg-gray-700"
                        }`}
                    >
                        <ChevronDown className="w-6 h-6"/>
                    </button>
                    <div className="absolute bottom-20">
                        <VideoControls initialLikes={currentVideo.likesCount} video={currentVideo}/>
                    </div>
                </div>
            </main>
        </div>
    );
}