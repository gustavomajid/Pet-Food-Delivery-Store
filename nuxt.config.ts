export default defineNuxtConfig({
  compatibilityDate: '2026-05-27',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    adminSenha: process.env.ADMIN_SENHA || 'admin123',
    public: {
      storeName: process.env.NUXT_PUBLIC_STORE_NAME || 'AgroPet Fazendinha'
    }
  },
  typescript: {
    strict: true
  }
})
