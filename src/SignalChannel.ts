function defaultOnMessage(msg: any) {
    console.log("message received");
    console.log(msg);
}

function defaultOnOpen() {
    console.log("connection opened");
}

function defaultOnClose() {
    console.log("connection closed");
}

function defaultOnError(err: any) {
    console.error(err);
}

enum ChannelState {
    CLOSED, // not connected
    BROADCAST_OPENED, // connected to broadcast server, waiting for viewer to connect with offer
    VIEWER_OPENED, // connected to viewer server, waiting for offer from broadcaster
}

interface ChannelEventListener {
    type: number|string;
    callback: (data: any) => void;
}

interface EventData {
    message_type: string;
    payload: any;
}

const rtcConfig: RTCConfiguration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};

const broadcastOfferOptions: RTCOfferOptions = {
    offerToReceiveAudio: false,
    offerToReceiveVideo: true,
};

export class SignalChannel {
    conn: WebSocket|null = null;
    url: string;
    broadcastID: string;
    isBroadcaster: boolean;
    isOpen: boolean = false;
    onOpen: () => void = defaultOnOpen;
    eventListeners: Record<string|number, (data: any) => void> = {};

    constructor(
        url: string, 
        isBroadcaster: boolean,     
        id: string, 
        onOpen: () => void = defaultOnOpen,
    ) {
        this.url = url;
        this.broadcastID = id;
        this.isBroadcaster = isBroadcaster;
        this.onOpen = onOpen;
    }

    connect() {
        this.conn = new WebSocket(this.url, this.isBroadcaster? "broadcast-protocol": "viewer-protocol");
        this.conn.onmessage = (msg) => {
            const data: EventData = JSON.parse(msg.data);
            Object.keys(this.eventListeners).forEach((key) => {
                const callback = this.eventListeners[key];
                if (key === data.message_type.toString()) {
                    callback(data.payload);
                }
            });
        }
        this.conn.onopen = () => {
            this.isOpen = true;
            this.onOpen();
        }
    }

    on(event: string | number, callback: (data: any) => void) {
        this.eventListeners[event] = callback;
    }

    emit(payload: any) {
        this.conn?.send(JSON.stringify({
            broadcast_id: this.broadcastID,
            payload,
        }));
    }

    close() {
        this.conn?.close();
        this.isOpen = false;
    }
}

export class BroadcastChannel extends SignalChannel {
    pcs: Record<string, RTCPeerConnection> = {};
    stream: MediaStream;
    iceCandidatePool: RTCIceCandidate[] = [];
    constructor(
        url: string, 
        id: string,
        stream: MediaStream,
    ) {
        super(url, true, id, () => {
            this.conn?.send(JSON.stringify({
                message_type: 0, // BROADCAST_OFFER
                broadcast_id: id
            }));
        });
        this.stream = stream;
        this.eventListeners = {
            // VIEWER_MESSAGE
            3: (data: any) => {
                if (data.type === "offer") {
                    const { session_id, offer } = data;
                    this.pcs[session_id] = new RTCPeerConnection(rtcConfig);
                    stream.getTracks().forEach((track) => {
                        this.pcs[session_id].addTrack(track, stream);
                    });
                    this.pcs[session_id].addEventListener("icecandidate", (event) => {
                        console.log(111, event);
                        if (event.candidate) {
                            this.conn?.send(JSON.stringify({
                                message_type: 1, // BROADCAST_MESSAGE
                                session_id: session_id,
                                payload: {
                                    type: "icecandidate",
                                    icecandidate: event.candidate,
                                }
                            }));
                        }
                    });
                    this.pcs[session_id].addEventListener("connectionstatechange", (event) => {
                        console.log("connection state change", event, this.pcs[session_id].connectionState);
                    });
                    this.pcs[session_id].setRemoteDescription(offer);
                    this.pcs[session_id].createAnswer().then((answer) => {
                        this.pcs[session_id].setLocalDescription(answer).then(() => {
                            while (this.iceCandidatePool.length > 0) {
                                const icecandidate = this.iceCandidatePool.pop();
                                if (icecandidate) {
                                    this.pcs[session_id].addIceCandidate(icecandidate);
                                }
                            }
                            this.conn?.send(JSON.stringify({
                                message_type: 1, // BROADCAST_MESSAGE
                                session_id: session_id,
                                payload: {
                                    type: "answer",
                                    answer: answer,
                                }
                            }));
                        });
                        console.log(333, this.pcs[session_id]);
                    });
                } else if (data.type === "icecandidate") {
                    console.log("icecandidate received", data);
                    const { session_id, icecandidate } = data;
                    if (!this.pcs[session_id]) {
                        this.iceCandidatePool.push(icecandidate);
                    } else {
                        this.pcs[session_id].addIceCandidate(icecandidate);
                    }
                }
            }
        }
    }

    emit(data: any) {
        this.conn?.send(JSON.stringify({
            broadcast_id: this.broadcastID,
            data: data,
        }));
    }
}

export class ViewerChannel extends SignalChannel {
    sessionID: string = "";
    pc: RTCPeerConnection;
    constructor(
        url: string, 
        id: string, 
    ) {
        super(url, false, id, () => {
            this.conn?.send(JSON.stringify({
                message_type: 2, // VIEWER_JOIN
                broadcast_id: id
            }));
        });
        this.pc = new RTCPeerConnection(rtcConfig);
        /* use trickle ice to send ice candidates as they are generated
        Once a RTCPeerConnection object is created, the underlying framework uses the provided ICE servers to gather candidates for connectivity establishment (ICE candidates). The event icegatheringstatechange on RTCPeerConnection signals in what state the ICE gathering is (new, gathering or complete).
        */
        this.pc.addEventListener("icecandidate", (event) => {
            console.log(111, event);
            if (event.candidate) {
                this.conn?.send(JSON.stringify({
                    message_type: 3, // VIEWER_MESSAGE
                    session_id: this.sessionID,
                    payload: {
                        type: "icecandidate",
                        icecandidate: event.candidate,
                    }
                }));
            }
        });
        this.pc.addEventListener("connectionstatechange", (event) => {
            console.log("connection state change", event, this.pc?.connectionState);
        });

        this.pc.addEventListener("track", (event) => {
            console.log("track received", event);
            //const video = document.getElementById("video") as HTMLVideoElement;
            //video.srcObject = event.streams[0];
        });
        this.eventListeners = {
            "session_created": (data: string) => {
                this.sessionID = data;
                this.pc.createOffer(broadcastOfferOptions).then((offer) => {
                    this.pc.setLocalDescription(offer).then(() => {
                        this.conn?.send(JSON.stringify({
                            message_type: 3, // VIEWER_MESSAGE
                            session_id: data,
                            payload: {
                                session_id: data,
                                type: "offer",
                                offer: offer,
                            }
                        }));
                    });
                });
            },
            // viewer_message
            1: (data: any) => {
                if (data.type === "answer") {
                    console.log("answer received", data);
                    this.pc.setRemoteDescription(data.answer);
                    console.log(222, this.pc.connectionState)
                } else if (data.type === "icecandidate") {
                    console.log("icecandidate received", data);
                    this.pc.addIceCandidate(data.icecandidate).catch((err) => {
                        console.log("icecandidate error");
                        console.error(err);
                    });
                }
            }
        }
    }
}
