const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "500mb",
        },
    },
    images: {
        domains: ['placehold.co']
    },
};

export default nextConfig;
