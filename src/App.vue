<script setup lang="ts">
// import b-tabs from vue-bootstrap
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { computed } from '@vue/reactivity'
import { useAuth0 } from '@auth0/auth0-vue'
import Broadcast from './components/Broadcast.vue'
import Viewer from './components/Viewer.vue'
import Profile from './components/Profile.vue'
import Welcome from './components/Welcome.vue'

enum ViewType {
  Welcome = 'welcome',
  Broadcast = 'broadcast',
  Viewer = 'viewer',
}

const viewType = ref(ViewType.Welcome)

const isBroadcast = computed(() => viewType.value === ViewType.Broadcast)

const isWelcome = computed(() => viewType.value === ViewType.Welcome)

const { isAuthenticated, loginWithRedirect } = useAuth0()

function loginApp() {
  loginWithRedirect()
}

const openBroadcast = () => {
  if (viewType.value === ViewType.Broadcast) {
    return
  }
  viewType.value = ViewType.Broadcast
}

const openViewer = () => {
  if (viewType.value === ViewType.Viewer) {
    return
  }
  viewType.value = ViewType.Viewer
}
</script>

<template>
  <template v-if="isAuthenticated">
    <div class="flex justify-around absolute sm:relative z-10 top-0 sm:mt-4 h-16 w-full">
      <div class="flex items-center">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/broadcast">Broadcast</RouterLink>
        <RouterLink to="/camera">Viewer</RouterLink>
      </div>

      <Profile :show-user-name="false" />
    </div>
    <div class="flex flex-col sm:justify-center items-center sm:relative sm:mt-9">
      <RouterView />
    </div>
  </template>
  <div v-else>
    <button @click="loginApp">Log in</button>
  </div>
</template>
