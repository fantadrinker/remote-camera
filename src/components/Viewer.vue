<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { ref, Ref, onMounted, reactive } from 'vue';
import { getRecordings, getS3DownloadUrl } from '../api';
import Loading from './Loading.vue';
import {ViewerChannel} from '../SignalChannel'


interface RecordingObject {
    Key: string;
    LastModified: Date;
    Size: number;
}

const recordingsState = reactive({
    isFetching: false,
    recordings: [] as Array<RecordingObject>
})

const broadcastID = ref("");

const videoConnection = reactive({
    isConnecting: false,
    isConnected: false
})

let chan: ViewerChannel | null = null;

const { getAccessTokenSilently, user } = useAuth0();

const cam: Ref<HTMLVideoElement | null> = ref(null);

const dummyCanvas: Ref<HTMLCanvasElement | null> = ref(null);

onMounted(async () => {
    recordingsState.isFetching = true
    recordingsState.recordings = await getRecordings(
        await getAccessTokenSilently(),
        user.value.sub || "default"
    );
    recordingsState.isFetching = false
});

const openRecording = async (key: string) => {
    const viewUrl = await getS3DownloadUrl(
        await getAccessTokenSilently(),
        user.value.sub || "default",
        key.split("/").pop() || ""
    );
    window.open(viewUrl, "_blank");
};

const connectToBroadcast = () => {
    // create a empty hidden canvas and use it as media stream
    if (broadcastID.value === "") {
        return;
    }
    videoConnection.isConnecting = true;
    const stream = dummyCanvas.value?.captureStream(15) || null
    chan = new ViewerChannel(
        broadcastID.value, 
        cam.value ?? document.getElementById("cam") as HTMLVideoElement,
        stream);
    chan.connect();
    chan.addEventListener("track", () => {
        videoConnection.isConnected = true;
        videoConnection.isConnecting = false;
    })
};

const disconnectBroadcast = () => {
    chan?.close();
    videoConnection.isConnected = false;
    videoConnection.isConnecting = false;
};

</script>

<template>
    <div class="flex flex-col items-center">
        <div v-if="!videoConnection.isConnected" class="pb-5">
            <h4>Connect to a live broadcast</h4>
            <div class="flex flex-row justify-around items-center">
                <label>Broadcast ID: </label>
                <input v-model="broadcastID" class="mx-3"/>
            </div>
            <button @click="connectToBroadcast">Connect</button>
        </div>
        <div v-if="videoConnection.isConnected || videoConnection.isConnecting" class="flex flex-row justify-between">
            <h4>{{videoConnection.isConnected? "Connected": "Connecting"}} to broadcast {{ broadcastID }}</h4>
            <button class="ml-5" @click="disconnectBroadcast">Disconnect</button>
        </div>
        <div v-show="videoConnection.isConnected || videoConnection.isConnecting" class="relative">
            <div v-if="videoConnection.isConnecting" class="absolute w-full h-full bg-opacity-75 bg-white">
                <Loading />
            </div>
            <canvas id="dummyCanvas" ref="dummyCanvas" width="1" height="1"></canvas>
            <video 
                id="cam" 
                ref="cam" 
                width="400" 
                playsinline
                autoplay
                poster="https://as1.ftcdn.net/v2/jpg/02/95/94/94/1000_F_295949484_8BrlWkTrPXTYzgMn3UebDl1O13PcVNMU.jpg"></video>
        </div>
        <h4 class="pb-5">Or view past recordings</h4>
        <Loading v-if="recordingsState.isFetching"/>
        <table v-else>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody v-for="recording in recordingsState.recordings" :key="recording.Key">
                <tr>
                    <td>{{ recording.LastModified.toLocaleDateString() }}</td>
                    <td>
                        <button class="ml-2"
                            @click="() => openRecording(recording.Key)">
                            View
                        </button>
                        <button class="ml-2">
                            Delete
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
