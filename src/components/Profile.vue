<script setup lang="ts">
    import { ref } from "vue";
    import { useAuth0 } from '@auth0/auth0-vue';

    const expandUserProfile = ref(false);
    const { user, isAuthenticated } = useAuth0();
    const toggleExpand = () => {
        expandUserProfile.value = !expandUserProfile.value;
    }
</script>

<template>
    <button popovertarget="user-profile" @click="toggleExpand">{{ user.name }}</button>
    <div v-if="expandUserProfile" popover id="user-profile">
      <h2>User Profile</h2>
      <pre v-if="isAuthenticated">
          <code>{{ user }}</code>
        </pre>
    </div>
</template>