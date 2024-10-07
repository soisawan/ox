<template>
  <div>
    <v-btn @click="login">login</v-btn>
  </div>
</template>

<script lang="ts" setup>
  import Notiflix from 'notiflix'
  import { useAuth0 } from '@auth0/auth0-vue'
  const isLogin = false
  const auth0 = useAuth0()
  const isAuthenticated = auth0.isAuthenticated
  const isLoading = auth0.isLoading

  const login = async () => {
    await auth0.loginWithRedirect()
  }

</script>

<style scoped>
.fill-height {
  height: 100vh; /* เต็มความสูงของหน้าจอ */
}

.text-center {
  text-align: center;
}
</style>
