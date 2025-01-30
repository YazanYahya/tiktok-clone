const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "500mb",
        },
    },
    images: {
        domains: ['placehold.co']
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/feed',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
