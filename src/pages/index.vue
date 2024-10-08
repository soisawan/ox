<template>
  <v-app class="animated-background">
    <v-main>
      <v-container class="d-flex flex-column align-center justify-center fill-height text-center">
        <v-card class="mx-auto elevation-3" outlined style="border-radius: 30px; padding: 30px;" width="500">
          <v-card-title class="text-h5" style="font-size: 30px; font-weight: bold;"><h2>Welcome To Tic Tac Toe</h2></v-card-title>

          <v-card-text>
            <v-avatar v-if="user" class="mx-auto mb-3" size="120">
              <v-img alt="User Avatar" :src="user?.picture" />
            </v-avatar>

            <h3 v-if="user" class="mb-2" style="font-size: 24px; font-weight: bold;">{{ user?.name }}</h3>

            <!-- Total Score Card -->
            <v-card
              v-if="user"
              class="mx-auto mb-4 elevation-2"
              max-width="300px"
              outlined
              style="border-radius: 20px; background: linear-gradient(10deg, #3B76EF, #ac9cff ); color: white; transition: all 0.3s ease;"
              @mouseleave="hover = false"
              @mouseover="hover = true"
            >
              <v-card-title class="text-h5 mb-n2" style="font-weight: bold; color: white;">
                Total Score
              </v-card-title>
              <v-card-subtitle
                class="font-weight-bold"
                style="font-size: 26px; font-weight: bold; color:white ; text-shadow: 2px 20px 10px rgba(0, 0, 0, 0.5);"
              >
                {{ score }}
              </v-card-subtitle>
            </v-card>

            <!-- Welcome screen with background animation for when user is null -->
            <div v-else class="welcome-card">
              <img
                alt="Welcome to Tic Tac Toe"
                class="welcome-image"
                src="../assets/img/logo.png"
              >
            </div>

            <v-btn
              v-if="!user"
              class="rounded-pill"
              elevation="2"
              style="font-size: 20px; background-color: #3B76EF; color: white; width: 200px; height: 50px;"
              @click="login"
            >
              Login
            </v-btn>

            <v-btn
              v-else
              class="rounded-pill rainbow rainbow-1"
              elevation="3"
              style="font-size: 20px; width: 200px; height: 50px;"
              to="/ox-game"
            >
              Start
            </v-btn>

          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
// Importing the logo image from assets folder
  import { useUserStore } from '@/stores/user'
  import { useAuth0 } from '@auth0/auth0-vue'
  import axios from 'axios'

  const auth0 = useAuth0()
  const userStore = useUserStore()
  const score = ref('กำลังโหลด...')
  const hover = ref(false)

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
      if (profile.user_metadata) {
        score.value = profile.user_metadata.score
        userStore.score = profile.user_metadata.score
      } else {
        score.value = '0'
      }
    }
  })
</script>

<style scoped>
.rainbow{
  background-color: #76b8fa;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  padding: 8px 16px;

}

.rainbow-1:hover{
   background-image: linear-gradient(90deg, #00C0FF 0%, #FFCF00 49%, #FC4F4F 80%, #00C0FF 100%);
   animation:slidebg 5s linear infinite;
}

@keyframes slidebg {
  to {
    background-position:20vw;
  }
}

/* Full-screen background color animation */
.animated-background {
  background: linear-gradient(135deg, #ffcccc, #a3e1fe);
  animation: bgColorFade 15s ease infinite;
}

/* Keyframes for background color animation */
@keyframes bgColorFade {
  0% { background-color: #ffcccc; }
  25% { background-color: #ffd9cc; }
  50% { background-color: #a3e1fe; }
  75% { background-color: #ffe6cc; }
  100% { background-color: #ffcccc; }
}

/* Welcome Card Styling */
.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  border-radius: 20px;
}

/* Image styling */
.welcome-image {
  max-width: 60%;
  border-radius: 50%; /* Make it circular */
  border: white solid 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* Add subtle shadow */
  animation: spin 10s linear infinite; /* Add a slow spin animation */
}

/* Animation for rotating the image */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Text styling */
.welcome-text {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

/* Card Hover Effect */
.v-card:hover {
  transform: scale(1.03);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}
</style>
