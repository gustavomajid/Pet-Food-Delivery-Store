<script setup lang="ts">
defineProps<{
  tipo: 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'
  tamanho?: number
}>()
</script>

<template>
  <svg
    v-if="tipo === 'whatsapp'"
    class="icone-rede-social"
    :width="tamanho ?? 19"
    :height="tamanho ?? 19"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" fill="#25d366" />
    <path
      d="M7.3 17.4l.7-2.4a6 6 0 1 1 2.2 1.8l-2.9.6z"
      fill="none"
      stroke="#fff"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.8"
    />
    <path
      d="M9.7 8.8c.2-.4.5-.4.8-.2l.7 1.1c.2.3.1.6-.1.8l-.3.3c.5 1 1.3 1.8 2.4 2.3l.4-.4c.2-.2.5-.3.8-.1l1 .5c.3.2.4.5.3.8-.2.6-.7 1-1.3 1-2.7-.1-5.4-2.6-5.6-5.2 0-.4.4-.8.9-.9z"
      fill="#fff"
    />
  </svg>

  <svg
    v-else-if="tipo === 'instagram'"
    class="icone-rede-social"
    :width="tamanho ?? 19"
    :height="tamanho ?? 19"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="instagram-gradiente" x1="4" x2="20" y1="20" y2="4" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#feda75" />
        <stop offset=".35" stop-color="#fa7e1e" />
        <stop offset=".65" stop-color="#d62976" />
        <stop offset="1" stop-color="#4f5bd5" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="16" height="16" rx="5" fill="url(#instagram-gradiente)" />
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="#fff" stroke-width="1.8" />
    <circle cx="16.9" cy="7.2" r="1.1" fill="#fff" />
  </svg>

  <svg
    v-else-if="tipo === 'facebook'"
    class="icone-rede-social"
    :width="tamanho ?? 19"
    :height="tamanho ?? 19"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" fill="#1877f2" />
    <path
      d="M13.4 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.3c-.7-.1-1.4-.2-2.2-.2-2.2 0-3.8 1.4-3.8 3.8V11H7.8v2.8h2.5V21h3.1z"
      fill="#fff"
    />
  </svg>

  <svg
    v-else-if="tipo === 'tiktok'"
    class="icone-rede-social"
    :width="tamanho ?? 19"
    :height="tamanho ?? 19"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" fill="#111" />
    <path d="M14 7.2c.7 1.5 1.8 2.4 3.5 2.6v2.5c-1.3 0-2.4-.4-3.5-1.1v4.1a4.2 4.2 0 1 1-4.2-4.2h.7v2.7a1.5 1.5 0 1 0 1 1.4V6.3H14z" fill="#25f4ee" opacity=".9" />
    <path d="M15 7.2c.7 1.5 1.8 2.4 3.5 2.6v2.5c-1.3 0-2.4-.4-3.5-1.1v4.1a4.2 4.2 0 1 1-4.2-4.2h.7v2.7a1.5 1.5 0 1 0 1 1.4V6.3H15z" fill="#fe2c55" opacity=".9" />
    <path d="M14.5 6.3c.7 1.5 1.8 2.4 3.5 2.6v2.3c-1.3 0-2.4-.4-3.5-1v4.9a4.2 4.2 0 1 1-4.2-4.2h.7v2.4a1.7 1.7 0 1 0 1.4 1.7V6.3h2.1z" fill="#fff" />
  </svg>

</template>

<style scoped>
.icone-rede-social {
  display: block;
  flex: 0 0 auto;
}
</style>
