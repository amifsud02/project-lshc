/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['i.postimg.cc', 'thumbs2.imgbox.com', 'localhost', 'res.cloudinary.com', 'cdn.sanity.io'],
        formats: ["image/avif"],
    },
    output: 'standalone'
}

module.exports = nextConfig
