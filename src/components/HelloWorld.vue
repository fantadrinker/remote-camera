<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)

const isCamOpen = ref(false);

const isRecordingReady = ref(false);

const openCam = () => {
  const camElement = document.querySelector('#cam') as HTMLMediaElement;
  const recording = document.querySelector('#recording') as HTMLMediaElement;
  navigator.mediaDevices.getUserMedia({ 
    video: true, 
    audio: false 
  }).then(stream => {
    camElement.srcObject = stream
    camElement.onloadedmetadata = () => {
      camElement.play()
    }
    isCamOpen.value = true;
    return stream;
  }).then((stream) => {
    return startRecording(stream, 5000);
  }).then((recordedChunks) => {
    let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    recording.src = URL.createObjectURL(recordedBlob);
    isRecordingReady.value = true;
    let downloadButton = document.querySelector("a#") as HTMLAnchorElement;
    downloadButton.href = recording.src;
    downloadButton.download = "RecordedVideo.webm";

    log(
      `Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`
    );
  })
};
const closeCam = () => {
  const camElement = document.querySelector('#cam') as HTMLVideoElement;
  const stream = camElement.srcObject as MediaStream;
  const tracks = stream.getTracks();
  tracks.forEach(function(track) {
    track.stop();
  });
  camElement.srcObject = null;
  isCamOpen.value = false;
};

function log(message: string) {
  const logElement = document.querySelector('#log') as HTMLDivElement;
  logElement.innerHTML += `${message}<br>`;
}

function wait(delayInMS: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

function startRecording(stream: MediaStream, lengthInMS: number) {
  let recorder = new MediaRecorder(stream);
  let data: Array<Blob> = [];

  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.start();
  log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event);
  });

  let recorded = wait(lengthInMS).then(() => {
    if (recorder.state === "recording") {
      recorder.stop();
    }
  });

  return Promise.all([stopped, recorded]).then(() => data);
}

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

    <video id="recording" controls></video>
  </div>
  <div>
    <button type="button" @click="openCam">Open Camera</button>
    <button v-if="isCamOpen" type="button" @click="closeCam">Close Camera</button>
    <a v-if="isRecordingReady" type="button" id="downloadButton">Download Recordings</a>
  </div>

  <div id="log">
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
