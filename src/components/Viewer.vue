<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { ref, Ref, onMounted } from 'vue';
import { getRecordings } from '../api';
import Loading from './Loading.vue';


interface RecordingObject {
    Key: string;
    LastModified: Date;
    Size: number;
}

const recordings: Ref<Array<RecordingObject>> = ref([]);

const loading = ref(false);

const { getAccessTokenSilently, user } = useAuth0();

onMounted(async () => {
    loading.value = true
    recordings.value = await getRecordings(
        await getAccessTokenSilently(),
        user.value.sub || "default"
    );
    loading.value = false
});

</script>

<template>
    <div>
        <h3>Viewing</h3>
        <div class="recordings">
            <loading v-if="loading" />
            <table v-else>
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
                            <button>View</button>
                            <button>Download</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
    .recordings {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>