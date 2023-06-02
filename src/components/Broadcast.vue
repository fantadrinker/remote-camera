<script setup lang="ts">
import { Ref, ref, onBeforeUnmount, reactive } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { openStream, recordAndUpload } from '../helpers'
import { computed } from '@vue/reactivity'
import { BroadcastChannel } from '../SignalChannel'
import Loading from './Loading.vue'

// some integer properties

const recordingOptions = reactive({
  repeatTimes: 5,
  repeatInterval: 5000,
  recordingLength: 5000,
})

const camVideo = reactive({
  isCamOpen: false,
  isCamOpening: false,
  aspectRatio: 0,
})

const expandableState = reactive({
  recording: false,
  broadcast: false,
})

const expandedBottomBar = ref(true)

const cam: Ref<HTMLVideoElement | null> = ref(null)

const logs: Ref<Array<string>> = ref([])

const error: Ref<string> = ref('')

const hasError = computed(() => error.value !== '')

const intervalId = ref(-1)

const isRecording = computed(() => intervalId.value !== -1)

const broadcastID = ref('')

const isBroadcasting = ref(false)

const vidPoster = computed(() => {
  if (camVideo.isCamOpen) {
    return ''
  }
  return 'https://as1.ftcdn.net/v2/jpg/02/95/94/94/1000_F_295949484_8BrlWkTrPXTYzgMn3UebDl1O13PcVNMU.jpg'
})

const { getAccessTokenSilently, user } = useAuth0()

onBeforeUnmount(() => {
  if (camVideo.isCamOpen) {
    closeCam()
  }
  if (isRecording.value) {
    window.clearInterval(intervalId.value)
  }
})

let chan: BroadcastChannel | null = null

const closeCam = async () => {
  const camElement = cam.value as unknown as HTMLVideoElement
  const stream = camElement.srcObject as MediaStream
  const tracks = stream.getTracks()
  tracks.map(function (track) {
    track.stop()
  })
  camElement.srcObject = null
  camVideo.isCamOpen = false
  window.clearInterval(intervalId.value)
}

const recordAndSave = () => {
  const { repeatTimes, repeatInterval, recordingLength } = recordingOptions

  if (repeatTimes == 0) {
    log('reached max recording limit, quitting')

    closeCam()
    return
  }
  const camElement = cam.value
  if (!camElement) {
    log('cam or recording element not found, quitting')
    closeCam()
    return
  }
  let remaining = repeatTimes
  const stream = camElement.srcObject as MediaStream
  intervalId.value = window.setInterval(async () => {
    if (remaining === 0) {
      log('reached max recording limit, quitting')
      window.clearInterval(intervalId.value)
      intervalId.value = -1
      return
    }
    console.log(`recording ${remaining} more times`)
    remaining--
    try {
      const token = await getAccessTokenSilently()
      await recordAndUpload(
        stream,
        recordingLength,
        token,
        user.value.sub || 'default'
      )
    } catch (e) {
      error.value = e.message
      console.error(e)
    }
  }, repeatInterval)
}

const stopRecording = () => {
  window.clearInterval(intervalId.value)
  intervalId.value = -1
}

const log = (msg: string) => {
  logs.value.push(msg)
}

const openCam = async () => {
    console.log(import.meta.env.TEST_ENV || 'no test env found :(')
  camVideo.isCamOpening = true
  try {
    await openStream(cam.value as HTMLMediaElement, () => {
      camVideo.isCamOpen = true
      camVideo.isCamOpening = false
      if (cam.value) {
        camVideo.aspectRatio = cam.value?.videoHeight / cam.value?.videoWidth
      }
    })
  } catch (e) {
    error.value = e.message
    console.error(e)
  }
}

const startBroadcasting = () => {
  log(`starting broadcasting with id ${broadcastID.value}`)
  isBroadcasting.value = true
  chan = new BroadcastChannel(
    broadcastID.value,
    (cam.value as HTMLMediaElement).srcObject as MediaStream
  )
  chan.connect()
  // once backend server is setup, send the rdp offer to the server and store it there
  // RTCSessionDescription
  return
}

const stopBroadcasting = () => {
  isBroadcasting.value = false
  chan?.close()
}

const toggleRecordingOptions = () => {
  expandableState.recording = !expandableState.recording
}

const toggleBroadcastingOptions = () => {
  expandableState.broadcast = !expandableState.broadcast
}

const toggleBottomBar = () => {
  expandedBottomBar.value = !expandedBottomBar.value
}
</script>

<template>
  <div v-if="hasError" class="errors">
    {{ error }}
  </div>
  <div
    v-if="camVideo.isCamOpening"
    class="absolute w-full h-full bg-opacity-50 bg-slate-500 z-10"
  >
    <Loading />
  </div>
  <video
    id="cam"
    ref="cam"
    width="400"
    class="rounded-md absolute sm:static top-0 bottom-0 m-auto"
    playsinline
    autoplay
    :poster="vidPoster"
  ></video>
  <div
    class="flex flex-col justify-evenly pt-3 sm:mt-3 w-full sm:w-96 absolute sm:relative bottom-0 bg-zinc-800 sm:bg-transparent bg-opacity-90 rounded-ss-2xl rounded-se-2xl"
  >
    <div class="flex flex-row justify-evenly items-center">
      <button v-if="camVideo.isCamOpen" class="mx-4 my-2" @click="closeCam">
        Close Camera
      </button>
      <button
        v-else
        class="mx-4 my-2"
        @click="openCam"
        :disabled="camVideo.isCamOpening"
      >
        Open Camera
      </button>
      <button @click="toggleBottomBar" class="sm:hidden">^</button>
    </div>

    <div
      v-show="expandedBottomBar"
      class="recording-options"
      v-if="camVideo.isCamOpen"
    >
      <div class="flex flex-row justify-between">
        <h4>Recording Options:</h4>
        <button @click="toggleRecordingOptions">
          {{ expandableState.recording ? '-' : '|' }}
        </button>
      </div>

      <template v-if="expandableState.recording">
        <div>
          <label>Repeat times: </label>
          <input
            type="range"
            :disabled="isRecording"
            v-model="recordingOptions.repeatTimes"
            :min="1"
            :max="10"
          />
          <input
            :disabled="isRecording"
            v-model="recordingOptions.repeatTimes"
          />
        </div>
        <div>
          <label>Repeat interval: </label>
          <input
            :disabled="isRecording"
            v-model="recordingOptions.repeatInterval"
          />
        </div>
        <div>
          <label>Recording length: </label>
          <input
            :disabled="isRecording"
            v-model="recordingOptions.recordingLength"
          />
        </div>
        <button class="mx-4 my-2" v-if="isRecording" @click="stopRecording">
          Stop Recording
        </button>
        <button class="mx-4 my-2" v-else @click="recordAndSave">
          Start Recording
        </button>
      </template>
    </div>

    <div
      v-show="expandedBottomBar"
      class="broadcasting-options"
      v-if="camVideo.isCamOpen"
    >
      <div class="flex flex-col justify-between">
        <h4>Broadcasting Options</h4>
        <button @click="toggleBroadcastingOptions">
          {{ expandableState.broadcast ? '-' : '|' }}
        </button>
      </div>
      <template v-if="expandableState.broadcast">
        <template v-if="!isBroadcasting">
          <div class="input-group">
            <label>Broadcast ID: </label>
            <input type="text" v-model="broadcastID" />
          </div>
          <button class="mx-4 my-2" @click="startBroadcasting">
            Start Broadcasting
          </button>
        </template>
        <template v-else>
          <button class="mx-4 my-2" @click="stopBroadcasting">
            Stop Broadcasting
          </button>
        </template>
      </template>
    </div>

    <div v-show="expandedBottomBar" id="log">
      <h2>Logs</h2>
      <ul>
        <li v-for="log in logs">{{ log }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.control-panel button {
  margin: 1em 2em;
}
.recording-options {
  display: flex;
  flex-direction: column;
}

.recording-options > div,
.broadcasting-options > div {
  display: flex;
  flex-direction: row;
  margin-block-end: 1em;
  align-items: baseline;
}

.recording-options > h4 {
  margin-block-start: 1em;
  margin-block-end: 1em;
}

.input-group > label,
.recording-options > div > label {
  flex-grow: 2;
}

.input-group > input,
.recording-options > div > input {
  flex-grow: 1;
}

.broadcasting-options {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}
</style>
