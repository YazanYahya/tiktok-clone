'use client'

import Sidebar from "@/components/Sidebar";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
    const {data: userProfile, error, isLoading} = useSWR(`/api/profiles`, fetcher);

    if (isLoading) {
        return (
            <div className="flex h-screen bg-black text-white items-center justify-center">
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen bg-black text-white items-center justify-center">
                <p>Error loading profile: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-white">
            <Sidebar/>
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center space-x-6 mb-6">
                        <img
                            src={userProfile?.profilePic}
                            alt={userProfile?.username || "User"}
                            width={150}
                            height={150}
                            className="rounded-full"
                        />
                        <div>
                            <h1 className="text-2xl font-bold">{userProfile.username}</h1>
                        </div>
                    </div>
                    <div className="mb-6">
                        <p>{userProfile.bio}</p>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-xl font-bold mb-4">Videos</h2>
                        <p className="text-gray-400">No videos uploaded yet.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
