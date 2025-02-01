import {RefreshCcw} from "lucide-react";

export default function Loading() {
    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
                <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin"/>
                <p className="text-lg text-white">Loading, please wait...</p>
            </div>
        </div>
    );
}