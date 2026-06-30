const bancoLocal = 'postgresql://postgres:postgres@localhost:5434/fazendinha'

export default defineNuxtConfig({
  compatibilityDate: '2026-05-27',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || (process.env.NODE_ENV === 'production' ? '' : bancoLocal),
    adminSenha: process.env.ADMIN_SENHA || 'admin123',
    wmsApiToken: process.env.WMS_API_TOKEN || '',
    public: {
      storeName: process.env.NUXT_PUBLIC_STORE_NAME || 'AgroPet Fazendinha',
      socialLinks: {
        whatsapp: process.env.NUXT_PUBLIC_WHATSAPP_URL || '#',
        instagram: process.env.NUXT_PUBLIC_INSTAGRAM_URL || '#',
        facebook: process.env.NUXT_PUBLIC_FACEBOOK_URL || '#',
        tiktok: process.env.NUXT_PUBLIC_TIKTOK_URL || '#'
      }
    }
  },
  typescript: {
    strict: true
  }
})
