import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@react-pdf/renderer',
      'pdfjs-dist',
      'pdf-parse',
      'mammoth',
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // Prevent webpack from trying to bundle pdfjs worker files
    config.resolve.alias['pdfjs-dist/build/pdf.worker.mjs'] = false;
    config.resolve.alias['pdfjs-dist/legacy/build/pdf.worker.js'] = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
