import { execSync } from 'node:child_process'

const gitCommitShort = process.env.NUXT_PUBLIC_GIT_COMMIT_SHORT
  || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  || process.env.COMMIT_SHA?.slice(0, 7)
  || (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return ''
    }
  })()

const gitRepositoryUrl = process.env.NUXT_PUBLIC_GIT_REPOSITORY_URL
  || (() => {
    try {
      return execSync('git remote get-url origin', { encoding: 'utf8' }).trim()
    } catch {
      return ''
    }
  })()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/leaflet',
    'nuxt-jsonld',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/image',
    '@nuxt/fonts',
    'nuxt-umami'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://solidaires-etudiant-e-s.org',
      gitCommitShort,
      gitRepositoryUrl
    }
  },

  routeRules: {
    '/articles': {
      isr: 600,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      }
    },
    '/articles/**': {
      isr: 600,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      }
    },
    '/guides': {
      isr: 600,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      }
    },
    '/guides/**': {
      isr: 600,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      }
    },
    '/': {
      isr: 150,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      }
    }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    compressPublicAssets: true
  },

  vite: {
    optimizeDeps: {
      include: [
        'tiptap-extension-resize-image'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  image: {
    format: ['webp']
  },

  robots: {
    blockNonSeoBots: true
  },

  sitemap: {
    sources: [
      '/api/__sitemap__/articles',
      '/api/__sitemap__/guides'
    ]
  },

  umami: {
    id: process.env.UMANI,
    host: 'https://umami.solidaires-etudiant-e-s.org',
    autoTrack: true,
    ignoreLocalhost: true
  }
})
