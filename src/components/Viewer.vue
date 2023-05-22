<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { ref, Ref, onMounted } from 'vue';
import { getRecordings } from '../api';
interface RecordingObject {
    Key: string;
    LastModified: Date;
    Size: number;
}

const recordings: Ref<Array<RecordingObject>> = ref([]);

const { getAccessTokenSilently, user } = useAuth0();

onMounted(async () => {
    recordings.value = await getRecordings(
        await getAccessTokenSilently(),
        user.value.sub || "default"
    );
});


</script>

<template>
    <div>
        <h3>Viewing</h3>
        <div class="recordings">
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
                            <button>View</button>
                            <button>Download</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
