<script setup lang="ts">
defineProps(['route'])
import Profile from './Profile.vue'
</script>


<template>
  <div class="flex justify-around absolute sm:relative z-10 top-0 sm:mt-4 h-16 w-full">
    <div class="flex items-center">
      <button :class="route === '/' ? 'bg-green-900 mr-2' : 'mr-2'">
        <RouterLink to="/">Home</RouterLink>
      </button>
      <button :class="route === '/broadcast' ? 'bg-green-900 mr-2' : 'mr-2'">
        <RouterLink to="/broadcast">Broadcast</RouterLink>
      </button>
      <button :class="route === '/camera' ? 'bg-green-900 mr-2' : 'mr-2'">
        <RouterLink to="/camera">Viewer</RouterLink>
      </button>
    </div>

    <Profile :show-user-name="false" />
  </div>
</template>
