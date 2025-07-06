import { withPayload } from '@payloadcms/next/withPayload';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        esmExternals: 'loose',
    },
    images: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    transpilePackages: ['@payloadcms/richtext-lexical'],
    webpack: (config, { isServer }) => {
        const resolveAlias = config.resolve.alias || {};
        config.resolve.alias = {
            ...resolveAlias,
            '@/components': path.resolve(__dirname, './components'),
            '@/lib': path.resolve(__dirname, './lib'),
            '@/types': path.resolve(__dirname, './types'),
            '@/app': path.resolve(__dirname, './app'),
            '@/constants': path.resolve(__dirname, './constants'),
            '@/auth': path.resolve(__dirname, './auth.ts'),
            '@/prisma': path.resolve(__dirname, './prisma'),
            '@/styles': path.resolve(__dirname, './styles'),
            '@/payload-config': path.resolve(__dirname, './payload.config.mjs'),
            '@/payload.config.mjs': path.resolve(__dirname, './payload.config.mjs'),
            // Add a fallback for root files
            '@': path.resolve(__dirname, './')
        };

        // Add support for .mjs files
        config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];
        
        // Handle .mjs files in node_modules
        config.module.rules.push({
            test: /\.m?js$/,
            resolve: {
                fullySpecified: false // Disable fullySpecified to allow .mjs imports
            }
        });

        return config;
    },
};

export default withPayload(nextConfig, {
    configPath: path.resolve(__dirname, './payload.config.mjs'),
    // Enable debug logging
    debug: process.env.NODE_ENV !== 'production',
});
