import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'i.postimg.cc' },
            { protocol: 'https', hostname: 'thumbs2.imgbox.com' },
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'cdn.sanity.io' },
        ],
        // WebP is much cheaper to generate than AVIF, which matters for first-request latency.
        formats: ["image/webp"],
    },
    turbopack: {
        root: import.meta.dirname,
    },
}

export default withPayload(nextConfig)
