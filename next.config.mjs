import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Lets Next spot a browser still running the previous deploy and reload it instead of
    // calling server actions that no longer exist. Railway sets this at build and run time.
    deploymentId: process.env.RAILWAY_GIT_COMMIT_SHA,
    compiler: {
        styledComponents: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'i.postimg.cc' },
            { protocol: 'https', hostname: 'thumbs2.imgbox.com' },
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'i.ytimg.com' },
        ],
        // WebP is much cheaper to generate than AVIF, which matters for first-request latency.
        formats: ["image/webp"],
    },
    turbopack: {
        root: import.meta.dirname,
    },
}

export default withPayload(nextConfig)
