import { uploadFileToS3 } from "./api";


const wait = (delayInMS: number) => {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
};

export const recordStream = (
    stream: MediaStream, 
    lengthInMS: number, 
    log: (msg: string) => void = console.log
) => {
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

export const openStream = async (vid: HTMLMediaElement) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });

        vid.srcObject = stream;
        vid.onloadedmetadata = () => {
            vid.play();
        };
    } catch (error) {
        console.log("error opening camera: " + error);
        return;
    }
};

export const recordAndUpload = async (
    stream: MediaStream,
    lengthInMs: number,
    auth: string,
    sub: string,
) => {
    try{
        const recordedChunks = await recordStream(stream, lengthInMs);
        const recordedBlob = new Blob(recordedChunks, { 
            type: "video/webm" 
        });
        const result = await uploadFileToS3(recordedBlob, auth, sub);
        console.log("uploading to s3 done" + result);
    } catch (error) {
        console.log("error recording and uploading: " + error);
    }
}