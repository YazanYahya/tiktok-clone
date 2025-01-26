"use client";

import {useEffect, useRef, useState} from "react";

export default function VideoPlayer({video, onWatchUpdate}) {
    const videoRef = useRef(null);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        const videoElement = videoRef.current;

        const handlePlay = () => {
            setStartTime(Date.now());
        };

        const handlePauseOrEnd = () => {
            if (startTime) {
                const watchDuration = Math.round((Date.now() - startTime) / 1000);
                if (watchDuration > 0) {
                    onWatchUpdate(watchDuration);
                }
                setStartTime(null);
            }
        };

        videoElement.addEventListener("play", handlePlay);
        videoElement.addEventListener("pause", handlePauseOrEnd);
        videoElement.addEventListener("ended", handlePauseOrEnd);

        return () => {
            videoElement.removeEventListener("play", handlePlay);
            videoElement.removeEventListener("pause", handlePauseOrEnd);
            videoElement.removeEventListener("ended", handlePauseOrEnd);
        };
    }, [startTime, onWatchUpdate, video.id]);

    return (
        <div
            className="bg-gray-800 rounded-lg max-h-full max-w-full overflow-hidden flex items-center justify-center mb-8">
            <video
                ref={videoRef}
                src={video.url}
                loop
                autoPlay
                controls
            />
        </div>
    );
}