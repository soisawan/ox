<template>
  <v-app>
    <v-app-bar
      app
      class="custom-app-bar"
      color="transparent"
      dark
      flat
      height="1px"
    >
      <v-btn class="ml-2" variant="outlined" @click="resetGame">
        NEW GAME
      </v-btn>
      <v-spacer />
      <div class="half-circle">
        <div class="score-container">
          <span class="score player">{{ playerScore }}</span>
          <span class="divider">:</span>
          <span class="score bot">{{ botScore }}</span>
        </div>
      </div>
      <v-spacer />
      <div class="d-flex align-center" style="margin-right: 10px;">
        <v-avatar v-if="username" class="mr-2" size="35">
          <v-img alt="User Avatar" :src="pic" />
        </v-avatar>
        <span v-if="username" class="white--text">{{ username }}</span>
      </div>

      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>
              <v-icon color="red" left>mdi-logout</v-icon> ออกจากเกม
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main style="background-color: #a3e1fe;">
      <div class="tic-tac-toe">
        <div v-for="(cell, index) in board" :key="index" class="cell" @click="makeMove(index)">
          {{ cell }}
        </div>
      </div>
      <div class="high-score-container">
        <h3>High Score: {{ highScore }}</h3>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import Notiflix from 'notiflix'
  import { useAuth0 } from '@auth0/auth0-vue'
  import router from '@/router'
  import axios from 'axios'

  const auth0 = useAuth0()
  const username = ref(auth0.user.value?.name || 'Guest')
  const pic = auth0.user.value?.picture
  const isAuthenticated = auth0.isAuthenticated
  const userId = auth0.user.value?.sub // Auth0 user ID
  // เก็บข้อมูลของตาราง Tic-Tac-Toe
  const board = ref(['', '', '', '', '', '', '', '', ''])

  // ตัวแปรเพื่อบอกว่าเป็นตาของใคร (X หรือ O)
  const currentPlayer = ref('X')

  // Score
  const playerScore = ref(0) // คะแนนผู้เล่น
  const botScore = ref(0) // คะแนนบอท

  const highScore = ref(100)
  // ฟังก์ชันตรวจสอบการชนะ
  const checkWinner = (board: string[]) => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // แถว
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // คอลัมน์
      [0, 4, 8], [2, 4, 6], // เส้นทแยงมุม
    ]

    for (const combo of winningCombinations) {
      const [a, b, c] = combo
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  // ฟังก์ชัน Minimax สำหรับ AI Bot
  const minimax = (board: string[], depth: number, isMaximizing: boolean) => {
    const winner = checkWinner(board)
    if (winner === 'O') return 10 - depth // ให้คะแนนสูงสุดกับบอท
    if (winner === 'X') return depth - 10 // ให้คะแนนต่ำสุดกับผู้เล่น
    if (!board.includes('')) return 0 // เสมอ

    if (isMaximizing) {
      let bestScore = -Infinity
      for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
          board[i] = 'O'
          const score = minimax(board, depth + 1, false)
          board[i] = ''
          bestScore = Math.max(score, bestScore)
        }
      }
      return bestScore
    } else {
      let bestScore = Infinity
      for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
          board[i] = 'X'
          const score = minimax(board, depth + 1, true)
          board[i] = ''
          bestScore = Math.min(score, bestScore)
        }
      }
      return bestScore
    }
  }

  // ฟังก์ชันให้ AI บอทเคลื่อนไหว
  const makeBotMove = () => {
    let bestScore = -Infinity
    let move = -1
    for (let i = 0; i < board.value.length; i++) {
      if (board.value[i] === '') {
        board.value[i] = 'O'
        const score = minimax(board.value, 0, false)
        board.value[i] = ''
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    if (move !== -1) {
      board.value[move] = 'O'
      currentPlayer.value = 'X'
    }
  }

  // ฟังก์ชันการคลิกแต่ละช่อง
  const makeMove = (index: number) => {
    if (!board.value[index] && currentPlayer.value === 'X') {
      board.value[index] = 'X'
      currentPlayer.value = 'O'

      const winner = checkWinner(board.value)
      if (!winner) {
        setTimeout(() => {
          makeBotMove() // ให้บอทเดินหลังจากผู้เล่น
          const winnerAfterBot = checkWinner(board.value)
          if (winnerAfterBot) {
            Notiflix.Notify.success(`${winnerAfterBot} ชนะ!`)
          } else if (checkDraw()) {
            Notiflix.Notify.info('เกมเสมอ!')
            updateUserScoreInAuth0(10)
          }
        }, 300) // หน่วงเวลาให้บอทเดิน 1 วินาที
      } else {
        Notiflix.Notify.success(`${winner} ชนะ!`)
      }
    }
  }

  const updateUserScoreInAuth0 = async (newScore: number) => {
    try {
      // เรียกใช้ Management API เพื่ออัปเดตข้อมูล user_metadata
      // const tokenResponse = await axios.post(`https://dev-4q1tggqlrj05l3o1.us.auth0.com/oauth/token`, {
      //   client_id: 'OErPGNhyIhoU1xJSfdf1zCsorjn9JNB5',
      //   client_secret: 'kFc3M7LK3gfyt93ZJqK0wultYk1AAVAC4eK1cLjLfKcqwr1wKEef6dFdwX_FiDpV',
      //   audience: 'https://dev-4q1tggqlrj05l3o1.us.auth0.com/api/v2/',
      //   grant_type: 'client_credentials',
      // })

      const tokenResponse = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im11bXZwV0FUSklKcG5OdHNiOWlzYyJ9.eyJpc3MiOiJodHRwczovL2Rldi00cTF0Z2dxbHJqMDVsM28xLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJPRXJQR05oeUlob1UxeEpTZmRmMXpDc29yam45Sk5CNUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9kZXYtNHExdGdncWxyajA1bDNvMS51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTcyODI2MzAzMCwiZXhwIjoxNzI4MzQ5NDMwLCJzY29wZSI6InJlYWQ6Y2xpZW50X2dyYW50cyBjcmVhdGU6Y2xpZW50X2dyYW50cyBkZWxldGU6Y2xpZW50X2dyYW50cyB1cGRhdGU6Y2xpZW50X2dyYW50cyByZWFkOnVzZXJzIHVwZGF0ZTp1c2VycyBkZWxldGU6dXNlcnMgY3JlYXRlOnVzZXJzIHJlYWQ6dXNlcnNfYXBwX21ldGFkYXRhIHVwZGF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgZGVsZXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBjcmVhdGU6dXNlcnNfYXBwX21ldGFkYXRhIHJlYWQ6dXNlcl9jdXN0b21fYmxvY2tzIGNyZWF0ZTp1c2VyX2N1c3RvbV9ibG9ja3MgZGVsZXRlOnVzZXJfY3VzdG9tX2Jsb2NrcyBjcmVhdGU6dXNlcl90aWNrZXRzIHJlYWQ6Y2xpZW50cyB1cGRhdGU6Y2xpZW50cyBkZWxldGU6Y2xpZW50cyBjcmVhdGU6Y2xpZW50cyByZWFkOmNsaWVudF9rZXlzIHVwZGF0ZTpjbGllbnRfa2V5cyBkZWxldGU6Y2xpZW50X2tleXMgY3JlYXRlOmNsaWVudF9rZXlzIHJlYWQ6Y29ubmVjdGlvbnMgdXBkYXRlOmNvbm5lY3Rpb25zIGRlbGV0ZTpjb25uZWN0aW9ucyBjcmVhdGU6Y29ubmVjdGlvbnMgcmVhZDpyZXNvdXJjZV9zZXJ2ZXJzIHVwZGF0ZTpyZXNvdXJjZV9zZXJ2ZXJzIGRlbGV0ZTpyZXNvdXJjZV9zZXJ2ZXJzIGNyZWF0ZTpyZXNvdXJjZV9zZXJ2ZXJzIHJlYWQ6ZGV2aWNlX2NyZWRlbnRpYWxzIHVwZGF0ZTpkZXZpY2VfY3JlZGVudGlhbHMgZGVsZXRlOmRldmljZV9jcmVkZW50aWFscyBjcmVhdGU6ZGV2aWNlX2NyZWRlbnRpYWxzIHJlYWQ6cnVsZXMgdXBkYXRlOnJ1bGVzIGRlbGV0ZTpydWxlcyBjcmVhdGU6cnVsZXMgcmVhZDpydWxlc19jb25maWdzIHVwZGF0ZTpydWxlc19jb25maWdzIGRlbGV0ZTpydWxlc19jb25maWdzIHJlYWQ6aG9va3MgdXBkYXRlOmhvb2tzIGRlbGV0ZTpob29rcyBjcmVhdGU6aG9va3MgcmVhZDphY3Rpb25zIHVwZGF0ZTphY3Rpb25zIGRlbGV0ZTphY3Rpb25zIGNyZWF0ZTphY3Rpb25zIHJlYWQ6ZW1haWxfcHJvdmlkZXIgdXBkYXRlOmVtYWlsX3Byb3ZpZGVyIGRlbGV0ZTplbWFpbF9wcm92aWRlciBjcmVhdGU6ZW1haWxfcHJvdmlkZXIgYmxhY2tsaXN0OnRva2VucyByZWFkOnN0YXRzIHJlYWQ6aW5zaWdodHMgcmVhZDp0ZW5hbnRfc2V0dGluZ3MgdXBkYXRlOnRlbmFudF9zZXR0aW5ncyByZWFkOmxvZ3MgcmVhZDpsb2dzX3VzZXJzIHJlYWQ6c2hpZWxkcyBjcmVhdGU6c2hpZWxkcyB1cGRhdGU6c2hpZWxkcyBkZWxldGU6c2hpZWxkcyByZWFkOmFub21hbHlfYmxvY2tzIGRlbGV0ZTphbm9tYWx5X2Jsb2NrcyB1cGRhdGU6dHJpZ2dlcnMgcmVhZDp0cmlnZ2VycyByZWFkOmdyYW50cyBkZWxldGU6Z3JhbnRzIHJlYWQ6Z3VhcmRpYW5fZmFjdG9ycyB1cGRhdGU6Z3VhcmRpYW5fZmFjdG9ycyByZWFkOmd1YXJkaWFuX2Vucm9sbG1lbnRzIGRlbGV0ZTpndWFyZGlhbl9lbnJvbGxtZW50cyBjcmVhdGU6Z3VhcmRpYW5fZW5yb2xsbWVudF90aWNrZXRzIHJlYWQ6dXNlcl9pZHBfdG9rZW5zIGNyZWF0ZTpwYXNzd29yZHNfY2hlY2tpbmdfam9iIGRlbGV0ZTpwYXNzd29yZHNfY2hlY2tpbmdfam9iIHJlYWQ6Y3VzdG9tX2RvbWFpbnMgZGVsZXRlOmN1c3RvbV9kb21haW5zIGNyZWF0ZTpjdXN0b21fZG9tYWlucyB1cGRhdGU6Y3VzdG9tX2RvbWFpbnMgcmVhZDplbWFpbF90ZW1wbGF0ZXMgY3JlYXRlOmVtYWlsX3RlbXBsYXRlcyB1cGRhdGU6ZW1haWxfdGVtcGxhdGVzIHJlYWQ6bWZhX3BvbGljaWVzIHVwZGF0ZTptZmFfcG9saWNpZXMgcmVhZDpyb2xlcyBjcmVhdGU6cm9sZXMgZGVsZXRlOnJvbGVzIHVwZGF0ZTpyb2xlcyByZWFkOnByb21wdHMgdXBkYXRlOnByb21wdHMgcmVhZDpicmFuZGluZyB1cGRhdGU6YnJhbmRpbmcgZGVsZXRlOmJyYW5kaW5nIHJlYWQ6bG9nX3N0cmVhbXMgY3JlYXRlOmxvZ19zdHJlYW1zIGRlbGV0ZTpsb2dfc3RyZWFtcyB1cGRhdGU6bG9nX3N0cmVhbXMgY3JlYXRlOnNpZ25pbmdfa2V5cyByZWFkOnNpZ25pbmdfa2V5cyB1cGRhdGU6c2lnbmluZ19rZXlzIHJlYWQ6bGltaXRzIHVwZGF0ZTpsaW1pdHMgY3JlYXRlOnJvbGVfbWVtYmVycyByZWFkOnJvbGVfbWVtYmVycyBkZWxldGU6cm9sZV9tZW1iZXJzIHJlYWQ6ZW50aXRsZW1lbnRzIHJlYWQ6YXR0YWNrX3Byb3RlY3Rpb24gdXBkYXRlOmF0dGFja19wcm90ZWN0aW9uIHJlYWQ6b3JnYW5pemF0aW9uc19zdW1tYXJ5IGNyZWF0ZTphdXRoZW50aWNhdGlvbl9tZXRob2RzIHJlYWQ6YXV0aGVudGljYXRpb25fbWV0aG9kcyB1cGRhdGU6YXV0aGVudGljYXRpb25fbWV0aG9kcyBkZWxldGU6YXV0aGVudGljYXRpb25fbWV0aG9kcyByZWFkOm9yZ2FuaXphdGlvbnMgdXBkYXRlOm9yZ2FuaXphdGlvbnMgY3JlYXRlOm9yZ2FuaXphdGlvbnMgZGVsZXRlOm9yZ2FuaXphdGlvbnMgY3JlYXRlOm9yZ2FuaXphdGlvbl9tZW1iZXJzIHJlYWQ6b3JnYW5pemF0aW9uX21lbWJlcnMgZGVsZXRlOm9yZ2FuaXphdGlvbl9tZW1iZXJzIGNyZWF0ZTpvcmdhbml6YXRpb25fY29ubmVjdGlvbnMgcmVhZDpvcmdhbml6YXRpb25fY29ubmVjdGlvbnMgdXBkYXRlOm9yZ2FuaXphdGlvbl9jb25uZWN0aW9ucyBkZWxldGU6b3JnYW5pemF0aW9uX2Nvbm5lY3Rpb25zIGNyZWF0ZTpvcmdhbml6YXRpb25fbWVtYmVyX3JvbGVzIHJlYWQ6b3JnYW5pemF0aW9uX21lbWJlcl9yb2xlcyBkZWxldGU6b3JnYW5pemF0aW9uX21lbWJlcl9yb2xlcyBjcmVhdGU6b3JnYW5pemF0aW9uX2ludml0YXRpb25zIHJlYWQ6b3JnYW5pemF0aW9uX2ludml0YXRpb25zIGRlbGV0ZTpvcmdhbml6YXRpb25faW52aXRhdGlvbnMgcmVhZDpzY2ltX2NvbmZpZyBjcmVhdGU6c2NpbV9jb25maWcgdXBkYXRlOnNjaW1fY29uZmlnIGRlbGV0ZTpzY2ltX2NvbmZpZyBjcmVhdGU6c2NpbV90b2tlbiByZWFkOnNjaW1fdG9rZW4gZGVsZXRlOnNjaW1fdG9rZW4gZGVsZXRlOnBob25lX3Byb3ZpZGVycyBjcmVhdGU6cGhvbmVfcHJvdmlkZXJzIHJlYWQ6cGhvbmVfcHJvdmlkZXJzIHVwZGF0ZTpwaG9uZV9wcm92aWRlcnMgZGVsZXRlOnBob25lX3RlbXBsYXRlcyBjcmVhdGU6cGhvbmVfdGVtcGxhdGVzIHJlYWQ6cGhvbmVfdGVtcGxhdGVzIHVwZGF0ZTpwaG9uZV90ZW1wbGF0ZXMgY3JlYXRlOmVuY3J5cHRpb25fa2V5cyByZWFkOmVuY3J5cHRpb25fa2V5cyB1cGRhdGU6ZW5jcnlwdGlvbl9rZXlzIGRlbGV0ZTplbmNyeXB0aW9uX2tleXMgcmVhZDpzZXNzaW9ucyBkZWxldGU6c2Vzc2lvbnMgcmVhZDpyZWZyZXNoX3Rva2VucyBkZWxldGU6cmVmcmVzaF90b2tlbnMgY3JlYXRlOnNlbGZfc2VydmljZV9wcm9maWxlcyByZWFkOnNlbGZfc2VydmljZV9wcm9maWxlcyB1cGRhdGU6c2VsZl9zZXJ2aWNlX3Byb2ZpbGVzIGRlbGV0ZTpzZWxmX3NlcnZpY2VfcHJvZmlsZXMgY3JlYXRlOnNzb19hY2Nlc3NfdGlja2V0cyByZWFkOmZvcm1zIHVwZGF0ZTpmb3JtcyBkZWxldGU6Zm9ybXMgY3JlYXRlOmZvcm1zIHJlYWQ6Zmxvd3MgdXBkYXRlOmZsb3dzIGRlbGV0ZTpmbG93cyBjcmVhdGU6Zmxvd3MgcmVhZDpmbG93c192YXVsdCByZWFkOmZsb3dzX3ZhdWx0X2Nvbm5lY3Rpb25zIHVwZGF0ZTpmbG93c192YXVsdF9jb25uZWN0aW9ucyBkZWxldGU6Zmxvd3NfdmF1bHRfY29ubmVjdGlvbnMgY3JlYXRlOmZsb3dzX3ZhdWx0X2Nvbm5lY3Rpb25zIHJlYWQ6Zmxvd3NfZXhlY3V0aW9ucyBkZWxldGU6Zmxvd3NfZXhlY3V0aW9ucyByZWFkOmNvbm5lY3Rpb25zX29wdGlvbnMgdXBkYXRlOmNvbm5lY3Rpb25zX29wdGlvbnMgcmVhZDpjbGllbnRfY3JlZGVudGlhbHMgY3JlYXRlOmNsaWVudF9jcmVkZW50aWFscyB1cGRhdGU6Y2xpZW50X2NyZWRlbnRpYWxzIGRlbGV0ZTpjbGllbnRfY3JlZGVudGlhbHMiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJhenAiOiJPRXJQR05oeUlob1UxeEpTZmRmMXpDc29yam45Sk5CNSJ9.DDEUBB1XHrffXR7lThny8XKBzlfT974P4C8yiw_4lKGUUEm8GlBjnJDt0AeMhFFDpaZ7z96KXcwtqXiOYnCfH25BIFHxnnVIPy5EeUvNHRdTD0YpywC01iy6ufAUtvSy986hwJ18nx-UCs1ZlISyNVofYcplKNwBVRAuVvt8pswaAVvicXGL2akb0HbvOsqIZQjjgOytzwWej3zqjT8257dEW1FW8kQU9SjbT49630vDDIYjlo0pVdeFIG9PchbnxJ_1Gudl5v3Jj7kBvLHPUrOaetTcFV44XlUAIftsRXz3O7wgDmG52_CQz7hIHq350tDQWqagZYDm4MmIj38MpA'

      const accessToken = tokenResponse
      // const accessToken = tokenResponse.data.access_token

      // ทำการ PATCH อัปเดต score ใน user_metadata ของผู้ใช้
      await axios.patch(
        `https://dev-4q1tggqlrj05l3o1.us.auth0.com/api/v2/users/${userId}`,
        {
          user_metadata: {
            score: newScore,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      Notiflix.Notify.success('คะแนนถูกบันทึกแล้ว')
    } catch (error) {
      console.error('Error updating score:', error)
      Notiflix.Notify.failure('ไม่สามารถบันทึกคะแนนได้')
    }
  }

  // ฟังก์ชันตรวจสอบว่าเสมอหรือไม่
  const checkDraw = () => {
    return board.value.every(cell => cell !== '') && !checkWinner(board.value)
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
    if (auth0.isAuthenticated.value) {
      username.value = auth0.user.value?.name || 'Guest'
    } else {
      auth0.loginWithRedirect()
    }
  })
</script>

<style scoped>
.custom-app-bar {
  min-height: 110px;
}
.tic-tac-toe {
  display: grid;
  grid-template-columns: repeat(3, 150px);
  grid-template-rows: repeat(3, 150px);
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.cell {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
  width: 150px;
  height: 150px;
}

/* Flexbox เพื่อให้ตารางอยู่ตรงกลางหน้าจอ */
.v-main {
  display: flex;
  justify-content: center;
  align-items: center;
  /* height: 100vh; */
  flex-direction: column;
}

.half-circle {
  width: 200px;
  height: 100px;
  background-color: white;
  border-bottom-left-radius: 90px;
  border-bottom-right-radius: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  /* margin-right: 10px; */
}

.score-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 50%;
}

.score {
  font-size: 2rem;
  font-weight: bold;
}

.player {
  color: #4CAF50; /* สีของคะแนนผู้เล่น */
}

.bot {
  color: #FF5733; /* สีของคะแนนบอท */
}

.divider {
  font-size: 1.5rem;
  color: black;
}

.high-score-container {
  margin-top: 20px;
  font-size: 1.5rem;
  color: #333;
  text-align: center; /* จัดข้อความให้อยู่ตรงกลาง */
}
</style>
