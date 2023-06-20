/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['i.postimg.cc', 'thumbs2.imgbox.com', 'localhost', 'res.cloudinary.com'],
        formats: ["image/avif"],
    },
}

module.exports = nextConfig
