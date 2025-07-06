const { withPayload } = require('@payloadcms/next/withPayload')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "",
    compiler: {
        styledComponents: true,
    },
    sassOptions: {
        includePaths: ['./node_modules'],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
        PLAID_ENVIRONMENT: process.env.PLAID_ENVIRONMENT,
        PLAID_COUNTRY_CODES: process.env.PLAID_COUNTRY_CODES,
        PLAID_PRODUCTS: process.env.PLAID_PRODUCTS,
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
                ],
            },
        ]
    },
    webpack: (config, { isServer, dev }) => {
        // Ignore CSS files from Payload packages to avoid build errors
        config.module.rules.push({
            test: /\.css$|\.scss$/,
            include: [/node_modules\/@payloadcms/],
            use: [
                'ignore-loader',
            ],
            // This ensures this rule takes precedence for Payload CSS files
            enforce: 'pre',
        });

        // Configure CSS loaders for project files
        config.module.rules.push({
            test: /\.css$/,
            exclude: [/node_modules\/@payloadcms/],
            use: [
                'style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [
                                'tailwindcss',
                                'autoprefixer',
                            ],
                        },
                    },
                },
            ],
        });

        // Handle SCSS files in the project
        config.module.rules.push({
            test: /\.scss$/,
            exclude: [/node_modules\/@payloadcms/],
            use: [
                'style-loader',
                'css-loader',
                'sass-loader'
            ],
        });
        if (!isServer) {
            // Replace all Node.js only modules with empty objects in client-side bundles
            config.resolve.alias = {
                ...config.resolve.alias,
                'node:async_hooks': false,
                'node:child_process': false,
                'node:fs': false,
                'node:fs/promises': false,
                'node:events': false,
                'node:path': false,
                'node:process': false,
                'node:stream': false,
                'node:url': false,
                'node:util': false,
                'node:buffer': false,
            }

            // Completely exclude these modules 
            config.externals = [...(config.externals || []),
                'prisma',
                '@prisma/client'
            ]
        }
        return config;
    },
}

module.exports = withPayload(nextConfig);