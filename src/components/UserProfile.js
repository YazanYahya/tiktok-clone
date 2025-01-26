"use client";

import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function UserProfile({userId}) {
    const {data: userProfile, error, isLoading} = useSWR(`/api/profiles/${userId}`, fetcher);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2">
                <div className="rounded-full bg-gray-700 w-10 h-10 animate-pulse"/>
                <div className="flex flex-col space-y-1">
                    <div className="bg-gray-600 h-3 w-16 rounded-md animate-pulse"/>
                    <div className="bg-gray-600 h-3 w-16 rounded-md animate-pulse"/>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Failed to load profile</div>;
    }

    return (
        <div className="flex items-center space-x-2">
            <img
                src={userProfile?.profilePic}
                alt={userProfile?.username || "User"}
                width={40}
                height={40}
                className="rounded-full"
            />
            <span className="font-semibold">{userProfile?.username || "Unknown User"}</span>
        </div>
    );
}