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
    <div class="user-banner"  @click="toggleExpand">
        <div class="profile-pic">
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

.user-banner:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
    cursor: pointer;
}

#user-profile {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    position: absolute;
    top: 0;
    right: 0;
    background-color: #fff;
    border-radius: 5px;
    padding: 10px;
    box-shadow: 0 0 2em #646cffaa;
    z-index: 1;
}
</style>
