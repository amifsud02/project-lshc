/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['i.postimg.cc', 'thumbs2.imgbox.com', 'localhost', 'res.cloudinary.com', 'cdn.sanity.io'],
        formats: ["image/avif"],
    },

    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ["@svgr/webpack"],
        });

        return config;
    },
}

module.exports = nextConfig
