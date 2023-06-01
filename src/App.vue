<script setup lang="ts">
// import b-tabs from vue-bootstrap
import { ref } from "vue";
import { computed } from "@vue/reactivity";
import { useAuth0 } from '@auth0/auth0-vue';
import Broadcast from "./components/Broadcast.vue";
import Viewer from "./components/Viewer.vue";
import Profile from "./components/Profile.vue";

enum ViewType {
  Broadcast = "broadcast",
  Viewer = "viewer"
}

const viewType = ref(ViewType.Broadcast);

const isBroadcast = computed(() => (viewType.value === ViewType.Broadcast));
const { isAuthenticated, loginWithRedirect } = useAuth0();

function loginApp() {
    loginWithRedirect();
}

const openBroadcast = () => {
  if (viewType.value === ViewType.Broadcast) {
    return;
  }
  viewType.value = ViewType.Broadcast;
}

const openViewer = () => {
  if (viewType.value === ViewType.Viewer) {
    return;
  }
  viewType.value = ViewType.Viewer;
}

</script>

<template>
    <template v-if="isAuthenticated">
        <div class="flex justify-between relative h-16">
            <div class="flex items-center">
                <button :class="viewType === ViewType.Broadcast? 'bg-green-900 mr-2': 'mr-2'" @click="openBroadcast">
                    {{ ViewType.Broadcast }}
                </button>
                <button :class="viewType === ViewType.Viewer? 'bg-green-900 mr-2': 'mr-2'" @click="openViewer">
                    {{ ViewType.Viewer }}
                </button>
            </div>
            
            <Profile :show-user-name="false" />
        </div>
        <div class="flex flex-col justify-center mt-9 items-center relative">

            <Broadcast v-if="isBroadcast" />
            
            <Viewer v-else />
        </div>
    </template>
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
