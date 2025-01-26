import {useEffect, useState} from "react";
import {Heart} from "lucide-react";
import {useUser} from "@clerk/nextjs";
import {mutate} from "swr/_internal";
import {INTERACTION_TYPES} from "@/constants/interactions";

export default function VideoControls({initialLikes, video}) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(video.isLiked);
    const {user} = useUser();

    useEffect(() => {
        setLikes(initialLikes);
        setIsLiked(video.isLiked);
    }, [video.id]);

    const handleLike = async () => {
        const userId = user.id;
        const newLikeStatus = !isLiked;
        const newLikes = newLikeStatus ? likes + 1 : likes - 1;

        setIsLiked(newLikeStatus);
        setLikes(newLikes);

        try {
            await mutate(`/api/interactions`,
                async () => {
                    const response = await fetch("/api/interactions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userId,
                            videoId: video.id,
                            interaction: newLikeStatus ? INTERACTION_TYPES.LIKE : INTERACTION_TYPES.REMOVE_LIKE,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to update interaction");
                    }

                    return await response.json();
                },
                false
            );
        } catch (error) {
            console.error("Error updating interaction:", error);
            setIsLiked(!newLikeStatus);
            setLikes(newLikeStatus ? likes - 1 : likes + 1);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <button
                onClick={handleLike}
                className="p-2 rounded-full transition-colors bg-gray-800 hover:bg-gray-700"
            >
                <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500" : ""}`}/>
            </button>
            <span className="text-sm">{likes}</span>
        </div>
    );
}