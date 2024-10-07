<template>
  <v-app>
    <v-main>
      <v-container class="d-flex flex-column align-center justify-center fill-height text-center">
        <v-card class="mx-auto" outlined style="border-radius: 30px; padding: 20px 0px" width="700">
          <v-card-title class="text-h5">ยินดีต้อนรับเข้าสู่เกม Tic Tac Toe</v-card-title>

          <v-card-text>
            <v-avatar class="mx-auto mb-3" size="100">
              <v-img alt="User Avatar" :src="user?.picture" />
            </v-avatar>

            <h3 class="mb-2" style="font-size: 25px;">{{ user?.name }}</h3>

            <v-card
              v-if="user"
              class="mx-auto mb-4"
              max-width="300px"
              outlined
              style="border-radius: 30px;"
            >
              <v-card-title class="text-h5">คะแนนสะสม</v-card-title>
              <v-card-subtitle style="font-size: 20px;">{{ score }} คะแนน</v-card-subtitle>
            </v-card>

            <v-btn v-if="!user" style="font-size: 20px;" @click="login">เข้าสู่ระบบ</v-btn>
            <v-btn
              v-else
              class="v-btn--large"
              color="primary"
              style="font-size: 20px;"
              to="/ox-game"
            >
              เริ่มต้นเกม
            </v-btn>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { useAuth0 } from '@auth0/auth0-vue'
  import axios from 'axios'

  const auth0 = useAuth0()
  const score = ref('-')

  const fetchProfile = async (userId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/${userId}`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_APP_API_TOKEN}`,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const login = async () => {
    await auth0.loginWithRedirect()
  }

  const user = computed(() => {
    return auth0.user.value
  })

  watch(user, async (data, oldVal) => {
    if (data) {
      const userId = data.sub
      const profile = await fetchProfile(userId!)
      score.value = profile.user_metadata.score
    }
  })

  onMounted(async () => {
    // const profile = await fetchProfile()
    // console.log(profile)
  })
</script>
