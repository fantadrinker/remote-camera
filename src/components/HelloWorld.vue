<script setup lang="ts">
import { Ref, ref, onMounted } from "vue";
import { getAPIAuthToken, uploadFileToS3 } from "../api";

defineProps<{ msg: string }>();

// some integer properties

const repeatTimes = ref(5);

const repeatInterval = ref(5000);

const recordingLength = ref(5000);

// some html elements
const cam: Ref<HTMLMediaElement | null> = ref(null);

const rec: Ref<HTMLMediaElement | null> = ref(null);

const logs: Ref<Array<string>> = ref([]);

const downloadedButton: Ref<HTMLAnchorElement | null> = ref(null);

const isCamOpen = ref(false);

const isRecordingReady = ref(false);

const intervalId = ref(-1);

const apiAuth = ref("");

const apiAuthValidUntil = ref(0); // timestamp

const localDownload = ref(false);

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
    window.clearInterval(intervalId.value);
};

const recordAndSave = (
    repeat: number,
    lengthInMs: number,
    intervalInMs: number
) => {
    if (repeat == 0) {
        log("reached max recording limit, quitting");
        closeCam();
        return;
    }
    const camElement = cam.value;
    const recording = rec.value;
    if (!camElement || !recording) {
        log("cam or recording element not found, quitting");
        closeCam();
        return;
    }
    let remaining = repeat;
    const stream = camElement.srcObject as MediaStream;
    intervalId.value = window.setInterval(async () => {
        if (remaining === 0) {
            log("reached max recording limit, quitting");
            closeCam();
            return;
        }
        console.log(`recording ${remaining} more times`);
        remaining--;
        const recordedChunks = await startRecording(stream, lengthInMs);
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });

        if (!localDownload.value) {
            // try upload to s3
            const isAuthValid = apiAuthValidUntil.value > Date.now();
            if (!isAuthValid) {
                log("api auth token expired, refreshing");
                getAPIAuthToken().then(({ access_token, expires_in }) => {
                    apiAuth.value = access_token;
                    apiAuthValidUntil.value = Date.now() + expires_in * 1000;
                });
            }
            log("uploading to s3");
            const result = await uploadFileToS3(recordedBlob, apiAuth.value);
            log("uploading to s3 done" + result);
        }
        if (downloadedButton.value && localDownload.value) {
            recording.src = URL.createObjectURL(recordedBlob);
            isRecordingReady.value = true;
            let download = downloadedButton.value as HTMLAnchorElement;
            download.href = recording.src;
            const dt = new Date();
            download.download = `${dt.toLocaleString()}.webm`;
            console.log("automatically saving the file");
            download.click();
            log(
                `Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`
            );
        }
    }, intervalInMs);
};

const openCam = () => {
    const camElement = cam.value as HTMLMediaElement;

    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream) => {
            camElement.srcObject = stream;
            camElement.onloadedmetadata = () => {
                camElement.play();
            };
            isCamOpen.value = true;
        })
        .catch((err) => {
            log(`Error: ${err}`);
        });
};

function log(message: string) {
    logs.value.push(message);
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

function startRecording2() {
    console.log(
        `recording ${repeatTimes.value} ${recordingLength.value}ms-long videos, with ${repeatInterval.value} ms intervals between each recording`
    );
    recordAndSave(
        repeatTimes.value,
        recordingLength.value,
        repeatInterval.value
    );
}
</script>

<template>
    <h1>{{ msg }}</h1>
    <div>
        <button type="button" @click="openCam">Open Camera</button>
        <div v-if="isCamOpen">
            <h3>Recording params:</h3>
            <div>
                <label>Repeat times: </label>
                <input v-model="repeatTimes" />
            </div>
            <div>
                <label>Repeat intervals (in ms): </label>
                <input v-model="repeatInterval" />
            </div>
            <div>
                <label>Recording length: </label>
                <input v-model="recordingLength" />
            </div>
            <button @click="startRecording2">Start Recording</button>
        </div>

        <button v-if="isCamOpen" type="button" @click="closeCam">
            Close Camera
        </button>
        <a
            v-show="isRecordingReady"
            type="button"
            id="downloadButton"
            ref="downloadedButton"
            >Download Recordings</a
        >
    </div>

    <div>
        <video id="cam" ref="cam" width="400"></video>

        <video
            v-show="isRecordingReady"
            id="recording"
            ref="rec"
            width="400"
            controls
        ></video>
    </div>

    <div id="log">
        <h2>Logs</h2>
        <ul>
            <li v-for="log in logs">{{ log }}</li>
        </ul>
    </div>

    <p>
        Check out
        <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
            >create-vue</a
        >, the official Vue + Vite starter
    </p>
    <p>
        Install
        <a href="https://github.com/vuejs/language-tools" target="_blank"
            >Volar</a
        >
        in your IDE for a better DX
    </p>
    <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
    color: #888;
}
</style>
