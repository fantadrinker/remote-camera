<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { ref, Ref, onMounted } from 'vue';
import { getRecordings, getS3DownloadUrl } from '../api';
import Loading from './Loading.vue';
import {ViewerChannel} from '../SignalChannel'


interface RecordingObject {
    Key: string;
    LastModified: Date;
    Size: number;
}

const recordings: Ref<Array<RecordingObject>> = ref([]);

const loading = ref(false);

const broadcastID = ref("");

let chan: ViewerChannel | null = null;

const { getAccessTokenSilently, user } = useAuth0();

const cam: Ref<HTMLVideoElement | null> = ref(null);

onMounted(async () => {
    loading.value = true
    recordings.value = await getRecordings(
        await getAccessTokenSilently(),
        user.value.sub || "default"
    );
    loading.value = false
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
    chan = new ViewerChannel(`ws://localhost:8000`, broadcastID.value, cam.value ?? document.getElementById("cam") as HTMLVideoElement);
    chan.connect();
};

</script>

<template>
    <div>
        <h3 class="text-l font-bold" >Viewing</h3>
        <div class="flex flex-col items-center">
            <loading v-if="loading" />
            <div v-else>
                <div>
                    <h4>Connect to a live broadcast</h4>
                    <input v-model="broadcastID" />
                    <button @click="connectToBroadcast">Connect</button>
                    <button @click="() => chan?.close()">Disconnect</button>
                </div>
                <div>
                    <video 
                        id="cam" 
                        ref="cam" 
                        width="400" 
                        playsinline
                        autoplay
                        poster="https://as1.ftcdn.net/v2/jpg/02/95/94/94/1000_F_295949484_8BrlWkTrPXTYzgMn3UebDl1O13PcVNMU.jpg"></video>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody v-for="recording in recordings" :key="recording.Key">
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
            
        </div>
    </div>
</template>
