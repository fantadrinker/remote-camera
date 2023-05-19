<script setup lang="ts">
    import { ref } from "vue";
    import { useAuth0 } from '@auth0/auth0-vue';

    const expandUserProfile = ref(false);
    const { user, isAuthenticated, logout } = useAuth0();
    const toggleExpand = () => {
        expandUserProfile.value = !expandUserProfile.value;
    }
    const logoutApp = () => {
        logout();
    }
</script>

<template>
    <button popovertarget="user-profile" @click="toggleExpand">{{ user.name }}</button>
    <div v-if="expandUserProfile" popover id="user-profile">
      <h2>User Profile</h2>
      <pre v-if="isAuthenticated">
        <code>{{ user }}</code>
      </pre>
      <button @click="logoutApp">LogOut</button>
    </div>
</template>