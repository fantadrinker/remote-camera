<script setup lang="ts">
import { Ref, ref, onBeforeUnmount } from "vue";
import { useAuth0 } from '@auth0/auth0-vue';
import { openStream, recordAndUpload } from '../helpers'
import { computed } from "@vue/reactivity";

// some integer properties

const repeatTimes = ref(5);

const repeatInterval = ref(5000);

const recordingLength = ref(5000);

const cam: Ref<HTMLVideoElement | null> = ref(null);

// todo: implement logic around this
const controlPanelDrawer = ref(false);

const isCamOpen = ref(false);

const isCamOpening = ref(false);

const logs: Ref<Array<string>> = ref([]);

const error: Ref<string> = ref("");

const hasError = computed(() => error.value !== "");

const intervalId = ref(-1);

const isRecording = computed(() => intervalId.value !== -1);

const broadcastID = ref("");

const isBroadcasting = ref(false);

const broadcastMessage = ref("");

const isDrawerOpen = ref(false);

const controlPanelClasses = computed(() => {
    return {
        "control-panel": true,
        "drawer": controlPanelDrawer.value,
        "drawer-open": controlPanelDrawer.value && isDrawerOpen.value,
        "drawer-close": controlPanelDrawer.value && !isDrawerOpen.value
    }
});

const { getAccessTokenSilently, user } = useAuth0();

onBeforeUnmount(() => {
    if(isCamOpen.value) {
        closeCam();
    }
    if (isRecording.value) {
        window.clearInterval(intervalId.value);
    }
})

let conn: WebSocket;

const closeCam = async () => {
    const camElement = cam.value as unknown as HTMLVideoElement;
    const stream = camElement.srcObject as MediaStream;
    const tracks = stream.getTracks();
    tracks.map(function (track) {
        track.stop();
    });
    camElement.srcObject = null;
    isCamOpen.value = false;
    window.clearInterval(intervalId.value);
};

const recordAndSave = () => {
    if (repeatTimes.value == 0) {
        log("reached max recording limit, quitting");

        closeCam();
        return;
    }
    const camElement = cam.value;
    if (!camElement) {
        log("cam or recording element not found, quitting");
        closeCam();
        return;
    }
    let remaining = repeatTimes.value;
    const stream = camElement.srcObject as MediaStream;
    intervalId.value = window.setInterval(async () => {
        if (remaining === 0) {
            log("reached max recording limit, quitting");
            window.clearInterval(intervalId.value);
            intervalId.value = -1;
            return;
        }
        console.log(`recording ${remaining} more times`);
        remaining--;
        try {
            const token = await getAccessTokenSilently();
            await recordAndUpload(stream, recordingLength.value, token, user.value.sub || "default");
        } catch (e) {
            error.value = e.message;
            console.error(e);
        }
    }, repeatInterval.value);
};

const stopRecording = () => {
    window.clearInterval(intervalId.value);
    intervalId.value = -1;
};

const log = (msg: string) => {
    logs.value.push(msg);
};

const openCam = async () => {
    isCamOpening.value = true;
    try {
        await openStream(cam.value as HTMLMediaElement)
    } catch (e) {
        error.value = e.message;
        console.error(e);
    }
    isCamOpen.value = true;
    isCamOpening.value = false;
};

const startBroadcasting = () => {
    log(`starting broadcasting with id ${broadcastID.value}`)
    isBroadcasting.value = true;
    // test websocket api at localhost:8000

    conn = new WebSocket(`ws://localhost:8000`, "broadcast-protocol")
    conn.onopen = () => {
        conn.send(JSON.stringify({
            message_type: 0, // BROADCAST_INIT
            broadcast_id: broadcastID.value
        }))
    }
    conn.onmessage = (msg) => {
        //const data = JSON.parse(msg.data)
        console.log(msg.data)
    }
    conn.onclose = () => {
        console.log("connection closed")
    }
    conn.onerror = (err) => {
        error.value = err.message;
        console.error(err);
    }
    // once backend server is setup, send the rdp offer to the server and store it there
    // RTCSessionDescription
    return;
};
const stopBroadcasting = () => {
    isBroadcasting.value = false;
    conn.close();
}

const sendMessage = () => {
    conn.send(JSON.stringify({
        message_type: 1, // BROADCAST_MESSAGE
        broadcast_id: broadcastID.value,
        message: broadcastMessage.value
    }))
}
</script>

<template>
    <div v-if="hasError" class="errors">
        {{ error }}
    </div>
    <div class="user-cam">
        <video 
            id="cam" 
            ref="cam" 
            width="400" 
            playsinline
            autoplay
            poster="https://as1.ftcdn.net/v2/jpg/02/95/94/94/1000_F_295949484_8BrlWkTrPXTYzgMn3UebDl1O13PcVNMU.jpg"></video>
    </div>
    <div :class="controlPanelClasses">
        <button 
            v-if="isCamOpen" 
            type="button" 
            @click="closeCam">
            Close Camera
        </button>
        <button 
            v-else 
            type="button" 
            @click="openCam" 
            :disabled="isCamOpening">
            Open Camera
        </button>

        <div class="recording-options" v-if="isCamOpen" >
            <h4>Recording params:</h4>
            <div>
                <label>Repeat times: </label>
                <input 
                    type="range" 
                    :disabled="isRecording" 
                    v-model="repeatTimes" 
                    :min="1" 
                    :max="10" 
                />
                <input 
                    :disabled="isRecording" 
                    v-model="repeatTimes" 
                />
            </div>
            <div>
                <label>Repeat interval: </label>
                <input :disabled="isRecording" v-model="repeatInterval" />
            </div>
            <div>
                <label>Recording length: </label>
                <input :disabled="isRecording" v-model="recordingLength" />
            </div>
            <button v-if="isRecording" @click="stopRecording">Stop Recording</button>
            <button v-else @click="recordAndSave">Start Recording</button>
        </div>

        <div class="broadcasting-options" v-if="isCamOpen">
            <template v-if="!isBroadcasting">
                <div class="input-group">
                    <label>Broadcast ID: </label>
                    <input type="text" v-model="broadcastID" />
                </div>
                <button 
                    @click="startBroadcasting"
                >
                    Start Broadcasting
                </button>
            </template>
            <template v-else>
                <input type="text" v-model="broadcastMessage" />
                <button @click="sendMessage">
                    Broadcast Message
                </button>
                <button @click="stopBroadcasting">
                    Stop Broadcasting
                </button>
            </template>
        </div>

        <div id="log">
            <h2>Logs</h2>
            <ul>
                <li v-for="log in logs">{{ log }}</li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.control-panel {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    margin-top: 10px;
}

.control-panel  button {
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

.user-cam video {
    border-radius: 5px;
}

.broadcasting-options {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
}
</style>
