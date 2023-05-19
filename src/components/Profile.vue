<script setup lang="ts">
    import { ref } from "vue";
    import { useAuth0 } from '@auth0/auth0-vue';

    const expandUserProfile = ref(false);
    const { user, logout } = useAuth0();
    const toggleExpand = () => {
        expandUserProfile.value = !expandUserProfile.value;
    }
    const logoutApp = () => {
        logout();
    }
</script>

<template>
    <div class="user-banner">
        <div class="profile-pic" @click="toggleExpand">
            <img :src="user.picture" :alt="user.name" width="30" height="30" />
        </div>
        <span>
            {{ user.name }}
        </span>
    </div>
    <div v-if="expandUserProfile" popover id="user-profile">
      <h2>User Profile</h2>
      <pre>
        <code>{{ user }}</code>
      </pre>
      <button @click="logoutApp">LogOut</button>
    </div>
</template>
<style scoped>
.user-banner {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
}
.profile-pic {
    height: 30px;
    width: 30px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 10px;
}

.profile-pic:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
    cursor: pointer;
}
</style>
