import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('handleUser', () => {
  const score = ref(0)
  return { score }
})
