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
    '@nuxtjs/leaflet'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      gitCommitShort,
      gitRepositoryUrl
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
