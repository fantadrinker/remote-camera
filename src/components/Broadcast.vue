<script setup lang="ts">
import { Ref, ref, onMounted } from "vue";
import { getAPIAuthToken } from "../api";
import { openStream, recordAndUpload } from '../helpers'

// some integer properties
const repeatTimes = ref(5);

const repeatInterval = ref(5000);

const recordingLength = ref(5000);

const cam: Ref<HTMLMediaElement | null> = ref(null);
const isCamOpen = ref(false);
const logs: Ref<Array<string>> = ref([]);

const intervalId = ref(-1);

const apiAuth = ref("");

const apiAuthValidUntil = ref(0); // timestamp

const broadcastID = ref("");

const isBroadcasting = ref(false);

const broadcastMessage = ref("");

let conn: WebSocket;

onMounted(async () => {
    const { access_token, expires_in } = await getAPIAuthToken();
    apiAuth.value = access_token;
    apiAuthValidUntil.value = Date.now() + expires_in * 1000;
});

const closeCam = () => {
    const camElement = cam.value as unknown as HTMLVideoElement;
    const stream = camElement.srcObject as MediaStream;
    const tracks = stream.getTracks();
    tracks.forEach(function (track) {
        track.stop();
    });
    camElement.srcObject = null;
    isCamOpen.value = false;
    clearInterval(intervalId.value);
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
    intervalId.value = setInterval(async () => {
        if (remaining === 0) {
            log("reached max recording limit, quitting");
            closeCam();
            return;
        }
        console.log(`recording ${remaining} more times`);
        remaining--;
        
        const isAuthValid = apiAuthValidUntil.value > Date.now();
        if (!isAuthValid) {
            log("api auth token expired, refreshing");
            getAPIAuthToken().then(({ access_token, expires_in }) => {
                apiAuth.value = access_token;
                apiAuthValidUntil.value = Date.now() + expires_in * 1000;
            });
        }

        recordAndUpload(stream, recordingLength.value, apiAuth.value);
    }, repeatInterval.value);
};

const log = (msg: string) => {
    logs.value.push(msg);
};

const openCam = async () => {
    await openStream(cam.value as HTMLMediaElement)
    isCamOpen.value = true;
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
    <div>
        <h3>Broadcasting</h3>
    </div>
    <div style="display: flex; flex-direction: column; justify-content: space-evenly;">
        <div>
            <button v-if="isCamOpen" type="button" @click="closeCam">
                Close Camera
            </button>
            <button v-else type="button" @click="openCam">
                Open Camera
            </button>
        </div>
        <div v-if="isCamOpen" style="display: flex; flex-direction: column;">
            <h3>Recording params:</h3>
            <div style="display: flex; flex-direction: row" >
                <label>Repeat times: </label>
                <input v-model="repeatTimes" />
            </div>
            <div style="display: flex; flex-direction: row" >
                <label>Repeat intervals (in ms): </label>
                <input v-model="repeatInterval" />
            </div>
            <div style="display: flex; flex-direction: row" >
                <label>Recording length: </label>
                <input v-model="recordingLength" />
            </div>
            <button @click="recordAndSave">Start Recording</button>
        </div>

        <div v-if="isCamOpen">
            <div v-if="!isBroadcasting">
                <input v-if="!isBroadcasting" type="text" v-model="broadcastID" />
                <button v-if="!isBroadcasting" @click="startBroadcasting">
                    Start Broadcasting
                </button>
            </div>
            <div v-else>
                <input type="text" v-model="broadcastMessage" />
                <button @click="sendMessage">
                    Broadcast Message
                </button>
                <button @click="stopBroadcasting">
                    Stop Broadcasting
                </button>
            </div>
            
        </div>
    </div>

    <div>
        <video id="cam" ref="cam" width="400"></video>
    </div>

    <div id="log">
        <h2>Logs</h2>
        <ul>
            <li v-for="log in logs">{{ log }}</li>
        </ul>
    </div>
</template>

<style scoped>
.read-the-docs {
    color: #888;
}
</style>
