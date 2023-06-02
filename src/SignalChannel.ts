const SIGNAL_SERVER_URL =
  import.meta.env.MODE === 'development'
    ? 'ws://localhost:8000'
    : import.meta.env.VITE_SIGNAL_SERVER
function defaultOnOpen() {
  console.log('connection opened')
}
interface EventData {
  message_type: string
  payload: any
}

const broadcastOfferOptions: RTCOfferOptions = {
  offerToReceiveAudio: false,
  offerToReceiveVideo: true,
}

const getRTCConfig = async () => {
  const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
  if (import.meta.env.MODE === 'development') {
    return { iceServers }
  }
  try {
    const response = await fetch(
      `https://remotecamrtc.metered.live/api/v1/turn/credentials?apiKey=${
        import.meta.env.VITE_ICE_SERVER_API_KEY
      }`
    )
    // Saving the response in the iceServers array
    const turnServers: RTCIceServer[] = await response.json()

    return {
      iceServers: [...iceServers, ...turnServers],
    }
  } catch (error) {
    console.log('failed fetching turn server info', error)
    return { iceServers }
  }
}

export class SignalChannel extends EventTarget {
  conn: WebSocket | null = null
  broadcastID: string
  isBroadcaster: boolean
  isOpen: boolean = false
  onOpen: () => void = defaultOnOpen
  eventListeners: Record<string | number, (data: any) => void> = {}

  constructor(
    isBroadcaster: boolean,
    id: string,
    onOpen: () => void = defaultOnOpen
  ) {
    super()
    this.broadcastID = id
    this.isBroadcaster = isBroadcaster
    this.onOpen = onOpen
  }

  connect(onClose: () => void) {
    this.conn = new WebSocket(
      SIGNAL_SERVER_URL,
      this.isBroadcaster ? 'broadcast-protocol' : 'viewer-protocol'
    )
    this.conn.onmessage = msg => {
      if (msg.data === 'ping') {
        this.conn?.send('pong')
        return
      }
      const data: EventData = JSON.parse(msg.data)
      Object.keys(this.eventListeners).forEach(key => {
        const callback = this.eventListeners[key]
        if (key === data.message_type.toString()) {
          callback(data.payload)
        }
      })
    }
    this.conn.onopen = () => {
      this.isOpen = true
      this.onOpen()
    }
    this.conn.onclose = () => {
      onClose()
    }
  }

  on(event: string | number, callback: (data: any) => void) {
    this.eventListeners[event] = callback
  }

  emit(payload: any) {
    this.conn?.send(
      JSON.stringify({
        broadcast_id: this.broadcastID,
        payload,
      })
    )
  }

  close() {
    this.conn?.close()
    this.isOpen = false
  }
}

export class BroadcastChannel extends SignalChannel {
  pcs: Record<string, RTCPeerConnection> = {}
  stream: MediaStream
  iceCandidatePool: Record<string, RTCIceCandidate[]> = {}
  constructor(id: string, stream: MediaStream) {
    super(true, id, () => {
      this.conn?.send(
        JSON.stringify({
          message_type: 0, // BROADCAST_OFFER
          broadcast_id: id,
        })
      )
    })
    this.stream = stream
    this.eventListeners = {
      // VIEWER_MESSAGE
      3: async (data: any) => {
        if (data.type === 'offer') {
          const { session_id, offer } = data
          const rtcConfig = await getRTCConfig()
          this.pcs[session_id] = new RTCPeerConnection(rtcConfig)
          stream.getTracks().forEach(track => {
            this.pcs[session_id].addTrack(track, stream)
          })
          this.pcs[session_id].addEventListener('icecandidate', event => {
            if (event.candidate) {
              this.conn?.send(
                JSON.stringify({
                  message_type: 1, // BROADCAST_MESSAGE
                  session_id: session_id,
                  payload: {
                    type: 'icecandidate',
                    icecandidate: event.candidate,
                  },
                })
              )
            }
          })
          this.pcs[session_id].addEventListener(
            'connectionstatechange',
            event => {
              console.log(
                'connection state change',
                event,
                this.pcs[session_id].connectionState
              )
            }
          )
          this.pcs[session_id].setRemoteDescription(offer)
          this.pcs[session_id].createAnswer().then(answer => {
            this.pcs[session_id].setLocalDescription(answer).then(() => {
              while (this.iceCandidatePool[session_id]?.length > 0) {
                const icecandidate = this.iceCandidatePool[session_id].pop()
                if (icecandidate) {
                  this.pcs[session_id].addIceCandidate(icecandidate)
                }
              }
              this.conn?.send(
                JSON.stringify({
                  message_type: 1, // BROADCAST_MESSAGE
                  session_id: session_id,
                  payload: {
                    type: 'answer',
                    answer: answer,
                  },
                })
              )
            })
          })
        } else if (data.type === 'icecandidate') {
          const { session_id, icecandidate } = data
          if (!this.pcs[session_id]) {
            if (this.iceCandidatePool[session_id]) {
              this.iceCandidatePool[session_id].push(icecandidate)
            } else {
              this.iceCandidatePool[session_id] = [icecandidate]
            }
          } else {
            this.pcs[session_id].addIceCandidate(icecandidate)
          }
        }
      },
      error: (data: any) => {
        console.error(data)
      },
    }
  }

  connect() {
    super.connect(() => {
      Object.keys(this.pcs).forEach(key => {
        this.pcs[key].close()
      })
    })
  }

  emit(data: any) {
    this.conn?.send(
      JSON.stringify({
        broadcast_id: this.broadcastID,
        data: data,
      })
    )
  }
}

export class ViewerChannel extends SignalChannel {
  sessionID: string = ''
  pc: RTCPeerConnection | null = null
  video: HTMLVideoElement
  iceCandidatePool: RTCIceCandidate[] = []
  constructor(
    id: string,
    video: HTMLVideoElement,
    localStream: MediaStream | null
  ) {
    // try to get stream, viewer should not provide video stream
    // but it apparently doesn't work on iphone
    super(false, id, () => {
      this.conn?.send(
        JSON.stringify({
          message_type: 2, // VIEWER_JOIN
          broadcast_id: id,
        })
      )
    })
    this.video = video
    this.pc = null
    getRTCConfig().then(rtcConfig => {
      this.pc = new RTCPeerConnection(rtcConfig)
      if (localStream) {
        localStream.getTracks().forEach(track => {
          this.pc?.addTrack(track, localStream)
        })
      } else {
        console.warn(
          'starting viewer channel without local stream, this might cause connection issue on iphone'
        )
      }
      /* use trickle ice to send ice candidates as they are generated
                Once a RTCPeerConnection object is created, the underlying framework uses the provided ICE servers to gather candidates for connectivity establishment (ICE candidates). The event icegatheringstatechange on RTCPeerConnection signals in what state the ICE gathering is (new, gathering or complete).
                */
      this.pc.addEventListener('icecandidate', event => {
        if (event.candidate) {
          this.conn?.send(
            JSON.stringify({
              message_type: 3, // VIEWER_MESSAGE
              session_id: this.sessionID,
              payload: {
                type: 'icecandidate',
                icecandidate: event.candidate,
              },
            })
          )
        }
      })
      this.pc.addEventListener('track', async event => {
        console.log('track received', event, this.video)
        const [remoteStream] = event.streams
        this.video.srcObject = remoteStream
        this.dispatchEvent(new CustomEvent('track', { detail: remoteStream }))
      })
      this.pc.addEventListener('connectionstatechange', () => {
        if (this.pc?.connectionState === 'connected') {
          console.log('connected')
        }
      })
      this.dispatchEvent(new CustomEvent('initialized'))
    })

    this.eventListeners = {
      session_created: (data: string) => {
        this.sessionID = data
        this.pc?.createOffer(broadcastOfferOptions).then(offer => {
          this.pc?.setLocalDescription(offer).then(() => {
            this.conn?.send(
              JSON.stringify({
                message_type: 3, // VIEWER_MESSAGE
                session_id: data,
                payload: {
                  session_id: data,
                  type: 'offer',
                  offer: offer,
                },
              })
            )
          })
        })
      },
      // viewer_message
      1: (data: any) => {
        if (data.type === 'answer') {
          this.pc?.setRemoteDescription(data.answer).then(() => {
            while (this.iceCandidatePool.length > 0) {
              const icecandidate = this.iceCandidatePool.pop()
              if (icecandidate) {
                this.pc?.addIceCandidate(icecandidate)
              }
            }
          })
        } else if (data.type === 'icecandidate') {
          if (this.pc?.remoteDescription) {
            this.pc?.addIceCandidate(data.icecandidate).catch(err => {
              console.log('icecandidate error')
              console.error(err)
            })
          } else {
            this.iceCandidatePool.push(data.icecandidate)
          }
        }
      },
    }
  }

  connect() {
    super.connect(() => {
      this.pc?.close()
    })
  }

  close() {
    super.close()
    this.pc?.close()
  }
}
