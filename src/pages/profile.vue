<template>
  <v-app v-if="!isLoading && isAuthenticated">
    <v-main>
      <v-container class="d-flex flex-column align-center justify-center fill-height text-center">
        <v-card class="mx-auto" outlined style="border-radius: 30px; padding: 20px 0px" width="700">
          <v-card-title class="text-h5">ยินดีต้อนรับเข้าสู่เกม Tic Tac Toe</v-card-title>

          <v-card-text>
            <v-avatar class="mx-auto mb-3" size="100">
              <v-img alt="User Avatar" :src="pic" />
            </v-avatar>

            <h3 class="mb-2" style="font-size: 25px;">{{ username }}</h3>

            <v-card class="mx-auto mb-4" max-width="300px" outlined style="border-radius: 30px;">
              <v-card-title class="text-h5">คะแนนสะสม</v-card-title>
              <v-card-subtitle style="font-size: 20px;">{{ score }} คะแนน</v-card-subtitle>
            </v-card>

            <v-btn class="v-btn--large" color="primary" style="font-size: 20px;" to="/ox-game">
              เริ่มต้นเกม
            </v-btn>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import router from '@/router'
  import { useAuth0 } from '@auth0/auth0-vue'
  const auth0 = useAuth0()
  const score = ref(500)
  const username = auth0.user.value?.name
  const isLoading = auth0.isLoading
  const isAuthenticated = auth0.isAuthenticated
  const pic = auth0.user.value?.picture

  onMounted(() => {
    console.log(auth0.user.value)
    if (!isAuthenticated.value) {
      router.push('/')
    }
  })

</script>
