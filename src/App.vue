<script setup lang="ts">
// import b-tabs from vue-bootstrap
import HelloWorld from "./components/HelloWorld.vue";
import Broadcast from "./components/Broadcast.vue";
import Viewer from "./components/Viewer.vue";
import { ref } from "vue";

const isBroadcast = ref(false);
</script>

<template>
    <div>
        <h3>Select broadcasting or viewing</h3>
        <input type="checkbox" v-model="isBroadcast" />
        <label>Broadcast</label>
    </div>
    <div v-if="isBroadcast">
        <Broadcast />
    </div>
    <div v-else>
        <Viewer />
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
