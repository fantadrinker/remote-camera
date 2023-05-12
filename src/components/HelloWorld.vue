<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)

const openCam = () => {
  console.log(this);
  const camElement = document.querySelector('#cam') as HTMLVideoElement;
  navigator.mediaDevices.getUserMedia({ 
    video: true, 
    audio: false 
  }).then(stream => {
    const video = camElement;
    video.srcObject = stream
    video.onloadedmetadata = () => {
      video.play()
    }
  });
};
const closeCam = () => {
  const camElement = document.querySelector('#cam') as HTMLVideoElement;
  const stream = camElement.srcObject as MediaStream;
  const tracks = stream.getTracks();
  tracks.forEach(function(track) {
    track.stop();
  });
  camElement.srcObject = null;
};
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
  
  <div>
    <video id="cam"></video>
  </div>
  <div>
    <button type="button" @click="closeCam">Close Camera</button>
    <button type="button" @click="openCam">Open Camera</button>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
