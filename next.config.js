/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
        PLAID_ENVIRONMENT: process.env.PLAID_ENVIRONMENT,
        PLAID_COUNTRY_CODES: process.env.PLAID_COUNTRY_CODES,
        PLAID_PRODUCTS: process.env.PLAID_PRODUCTS,
    },
    reactStrictMode: true,
    transpilePackages: ['@radix-ui/themes', '@radix-ui/react-icons', 'next/themes'],
}

module.exports = nextConfig;