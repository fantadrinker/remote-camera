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
  Welcome = '/',
  Broadcast = '/broadcast',
  Viewer = '/camera',
}

const { isAuthenticated, loginWithRedirect } = useAuth0()

function loginApp() {
  loginWithRedirect()
}
</script>

<template>
  <template v-if="isAuthenticated">
    <div class="flex flex-col sm:justify-center items-center sm:relative sm:mt-9">
      <RouterView />
    </div>
  </template>
  <div v-else>
    <button @click="loginApp">Log in</button>
  </div>
</template>
