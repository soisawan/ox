<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>Tic Tac Toe</v-app-bar-title>
      <v-spacer /> <!-- Spacer สำหรับจัดพื้นที่ให้เล็กลง -->

      <!-- Avatar และ ชื่อผู้ใช้งานพร้อม dropdown -->
      <div class="d-flex align-center" style="margin-right: 10px;">
        <v-avatar class="mr-2" size="35"> <!-- ปรับขนาดของ avatar ให้เล็กลง -->
          <v-img alt="User Avatar" :src="pic" />
        </v-avatar>
        <span class="white--text">{{ username }}</span>
      </div>

      <!-- Dropdown เมนูออกจากระบบ -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>
              <v-icon color="red" left>mdi-logout</v-icon> ออกจากระบบ
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <div class="tic-tac-toe">
        <div v-for="(cell, index) in board" :key="index" class="cell" @click="makeMove(index)">
          {{ cell }}
        </div>
      </div>

      <v-btn color="primary" @click="resetGame">เริ่มเกมใหม่</v-btn>
    </v-main>
  </v-app>
</template>

  <script lang="ts" setup>
  import { ref } from 'vue'
  import Notiflix from 'notiflix'
  import { useAuth0 } from '@auth0/auth0-vue'
  import router from '@/router'
  const auth0 = useAuth0()
  const username = auth0.user.value?.name
  const pic = auth0.user.value?.picture
  const isAuthenticated = auth0.isAuthenticated

  // เก็บข้อมูลของตาราง Tic-Tac-Toe
  const board = ref(['', '', '', '', '', '', '', '', ''])

  // ตัวแปรเพื่อบอกว่าเป็นตาของใคร (X หรือ O)
  const currentPlayer = ref('X')

  // ฟังก์ชันการคลิกแต่ละช่อง
  const makeMove = (index: number) => {
    if (!board.value[index]) {
      board.value[index] = currentPlayer.value
      currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X'
    }
  }

  // ฟังก์ชันเริ่มเกมใหม่
  const resetGame = () => {
    board.value = ['', '', '', '', '', '', '', '', '']
    currentPlayer.value = 'X'
    Notiflix.Notify.success('เริ่มเกมใหม่เรียบร้อย')
  }

  const logout = () => {
    auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
    Notiflix.Notify.success('ออกจากระบบเรียบร้อยแล้ว')
    window.location.href = '/'
  }

  onMounted(() => {
    if (!isAuthenticated.value) {
      router.push('/')
    }
  })
  </script>

  <style scoped>
  .tic-tac-toe {
    display: grid;
    grid-template-columns: repeat(3, 100px);
    grid-template-rows: repeat(3, 100px);
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
  }

  .cell {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    cursor: pointer;
    width: 100px;
    height: 100px;
  }

  .v-avatar {
    display: inline-block;
  }
  </style>
