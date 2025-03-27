/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "",
    compiler: {
        styledComponents: true,
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
    webpack: (config) => {
        // Configure CSS loaders to properly handle Tailwind directives
        config.module.rules.push({
            test: /\.css$/,
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
        return config;
    },
}

module.exports = nextConfig;