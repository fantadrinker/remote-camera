<script setup lang="ts">
// import b-tabs from vue-bootstrap
import { ref } from "vue";
import { useAuth0 } from '@auth0/auth0-vue';
import Broadcast from "./components/Broadcast.vue";
import Viewer from "./components/Viewer.vue";
import Profile from "./components/Profile.vue";

const isBroadcast = ref(false);
const { isAuthenticated, loginWithRedirect } = useAuth0();

function loginApp() {
    loginWithRedirect();
}

</script>

<template>
    <div v-if="isAuthenticated">
        <Profile />
        <div class="pt-10">
            <h3 class="text-xl font-bold">Select broadcasting or viewing</h3>
            <div class="m-2">
                <input type="checkbox" v-model="isBroadcast" />
                <label class="mx-2">Broadcast</label>    
            </div>
        </div>

        <Broadcast v-if="isBroadcast" />
        
        <Viewer v-else />
    </div>
    <div v-else>
        <button @click="loginApp">Log in</button>
    </div>
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}
.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
