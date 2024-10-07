/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import { createAuth0 } from '@auth0/auth0-vue'
import authConfig from '../auth_config.json'

const app = createApp(App)

registerPlugins(app)

app.use(
  createAuth0({
    domain: authConfig.domain,
    clientId: authConfig.clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
  })
)

app.mount('#app')
