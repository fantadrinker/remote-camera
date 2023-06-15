<script setup lang="ts">
import { ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'

const props = defineProps({
  showUserName: {
    type: Boolean,
    required: false,
  },
})

const expandUserProfile = ref(false)
const { user, logout } = useAuth0()
const toggleExpand = () => {
  expandUserProfile.value = !expandUserProfile.value
}
const logoutApp = () => {
  logout()
}
const closePopup = () => {
  expandUserProfile.value = false
}
</script>

<template>
  <div
    class="flex flex-row justify-end items-center relative w-40 hover:cursor-pointer hover:drop-shadow"
  >
    <div 
      class="h-7 w-7 rounded-full overflow-hidden mr-3"
      @click="toggleExpand"
    >
      <img :src="user.picture" :alt="user.name" width="30" height="30" />
    </div>
    <span v-if="props.showUserName">
      {{ user.name }}
    </span>
    <div
      v-if="expandUserProfile"
      popover
      id="user-profile"
      class="flex flex-col justify-end items-center absolute top-28 overflow-hidden right-0 bg-gray-700 rounded p-3 shadow-sm z-10 w-36"
    >
      <button class="w-full m-1" @click="logoutApp">LogOut</button>
      <button class="w-full m-1" @click="closePopup">Close</button>
    </div>
  </div>
</template>
