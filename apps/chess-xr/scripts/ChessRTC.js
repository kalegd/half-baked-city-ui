export default class ChessRTC {
    constructor() {
        this._userSessionId = Date.now() + ":"
            + Math.floor(Math.random() * 1000000000);
        this._makingOffer = false;
        this._ignorOffer = false;
        this._state = "LOCAL";
        this._connectingTimeoutFlag = false;
        this._peerConnectionId;
        this._peerSessionId;
        this._blacklist = [];
        this._sendDataChannel;
        this._receiveDataChannel;
        this._mediaConstraints = { video: false, audio: true };

        this._setupHTMLElements();
        this._setupRTCHandling();
        this._setupUserMedia();
        global.chessXR.registerRTC(this);
    }

    _setupHTMLElements() {
        this._myAudio = document.createElement("audio");
        this._myAudio.autoplay = true;
        this._myAudio.defaultMuted = true;
        this._myAudio.muted = true;
        this._peerAudio = document.createElement("audio");
        this._peerAudio.autoplay = true;
        document.body.appendChild(this._myAudio);
        document.body.appendChild(this._peerAudio);
    }

    _setupWebSocket() {
        this._webSocket = new WebSocket(WEBSOCKET_URL);
        this._webSocket.onopen = () => {
            console.log("We opened a connection!");
            if(this._socketConnectedCallback) {
                this._socketConnectedCallback();
                this._socketConnectedCallback = null;
            }
            this._blacklist = [];
            this._webSocket.send(JSON.stringify({
                route: "chess_xr",
                type: "requestRandomMatch",
                userSessionId: this._userSessionId,
                blacklist: this._blacklist,
            }));
            this._state = "SEARCHING";
        }
        this._webSocket.onclose = () => {
            //Nothing for now it seems...
        }
        this._webSocket.onmessage = async (event) => {
            let message = JSON.parse(event.data);
            if(message == null) {
                return;
            }
            let type = message.type;
            try {
                if (type == "initiate" && this._state == "SEARCHING") {
                    this._peerConnectionId = message.peerConnectionId;
                    this._peerSessionId = message.peerSessionId;
                    this._handleInitiateMessage(message.polite);
                } else if(type == "description"){
                    this._handleDescriptionMessage(message.description);
                } else if(type == "candidate"){
                    this._handleCandidateMessage(message.candidate);
                }
            } catch (err) {
                console.error(err);
            }
        };
    }

    _setupRTCHandling() {
        let configuration = {
            iceServers: [{urls: 'stun:stun2.l.google.com:19302'}]
        };
        this._peerConnection = new RTCPeerConnection(configuration);
        //This gets called after setting the local description
        this._peerConnection.onicecandidate = (event) => {
            this._webSocket.send(JSON.stringify({
                route: "forward_message",
                peerConnectionId: this._peerConnectionId,
                type: "candidate",
                candidate: event.candidate
            }));
        };
        //This gets called after adding a track
        let negotiating = false;
        this._peerConnection.onnegotiationneeded = async () => {
            if(this._webSocket.readyState != 1) {
                return;
            }
            try {
                this._makingOffer = true;
                await this._peerConnection.setLocalDescription();
                this._webSocket.send(JSON.stringify({
                    route: "forward_message",
                    peerConnectionId: this._peerConnectionId,
                    type: "description",
                    description: this._peerConnection.localDescription}));
            } catch (err) {
                console.error(err);
            } finally {
                this._makingOffer = false;
            }
        };
        this._peerConnection.onconnectionstatechange = (event) => {
            console.log(this._peerConnection.connectionState);
            if(this._peerConnection.connectionState == "connected") {
                this._state = "PLAYING";
                this._webSocket.close();
                this._connectingTimeoutFlag = false;
                if(this._rtcConnectedCallback) {
                    this._rtcConnectedCallback();
                    this._rtcConnectedCallback = null;
                }
            } else if(this._peerConnection.connectionState == "failed") {
                global.chessXR.opponentLeft();
                this._state = "LOCAL";
                this._resetRTCAndPeerData();
            }
        };

        this._peerConnection.ontrack = (event) => {
            event.track.onunmute = () => {
                if(this._peerAudio.srcObject) return;
                this._peerAudio.srcObject = event.streams[0];
            };
        };
    }

    _setupDataChannel() {
        this._sendDataChannel = this._peerConnection.createDataChannel("sendChannel");
        this._sendDataChannel.onopen = (event) => {
            console.log(event);
            this._sendDataChannel.send(global.chessXR.displayName + ":" + global.chessXR.avatarURL);
        };
        this._sendDataChannel.onclose = (event) => {
            console.log(event);
        };
        this._peerConnection.ondatachannel = (event) => {
            console.log(event);
            this._receiveDataChannel = event.channel;
            this._receiveDataChannel.onmessage = (event) => {
                let data = event.data;
                if(typeof data == "string") {
                    if(data == "Q") { //User quit
                        global.chessXR.opponentLeft();
                        this._state = "LOCAL";
                        this._resetRTCAndPeerData();
                    } else if(data == "R") {
                        global.chessXR.resetPieces();
                    } else {
                        global.chessXR.setOpponentNameAndAvatar(data);
                    }
                } else {
                    global.chessXR.handlePeerData(new Float32Array(data));
                }
                //console.log(event);
            };
        };
    }

    _resetRTCAndPeerData() {
        this._peerConnection.close();
        this._peerConnection = null;
        this._setupRTCHandling();
        this._peerAudio.srcObject = null;
    }

    _setupUserMedia() {
        navigator.mediaDevices.getUserMedia(this._mediaConstraints)
            .then((stream) => {
                this._myAudio.srcObject = stream;
            })
            .catch((err) => {
                console.error(err);
            }
        );
    }

    _handleInitiateMessage(polite) {
        this._state = "CONNECTING";
        this._connectingTimeoutFlag = true;
        setTimeout(() => {
            if(this._connectingTimeoutFlag) {
                console.log("Connection timeout");
                this._state = "SEARCHING";
                this._resetRTCAndPeerData();
                this._blacklist.push(this._peerSessionId);
                this._webSocket.send(JSON.stringify({
                    route: "chess_xr",
                    type: "requestRandomMatch",
                    userSessionId: this._userSessionId,
                    blacklist: this._blacklist,
                }));
            }
        }, 10000);
        global.chessXR.polite = polite;
        this._myAudio.srcObject.getTracks().forEach((track) => {
            this._peerConnection.addTrack(track, this._myAudio.srcObject);
        });
        this._setupDataChannel();
    }

    async _handleDescriptionMessage(description) {
        let offerCollision = description.type == "offer" &&
            (this._makingOffer || this._peerConnection.signalingState != "stable");
        this._ignoreOffer = !global.chessXR.polite && offerCollision;
        if(this._ignoreOffer) {
            return;
        }
        await this._peerConnection.setRemoteDescription(description);
        if (description.type === 'offer') {
            await this._peerConnection.setLocalDescription();
            this._webSocket.send(JSON.stringify({
                route: "forward_message",
                peerConnectionId: this._peerConnectionId,
                type: "description",
                description: this._peerConnection.localDescription}));
        }
    }

    async _handleCandidateMessage(candidate) {
        //console.log(candidate);
        try {
            await this._peerConnection.addIceCandidate(candidate);
        } catch(err) {
            if(!this._ignoreOffer) throw err;
        }
    }

    isPeerConnected() {
        return this._peerConnection.connectionState == "connected";
    }

    playRandomOpponent(socketConnectedCallback, rtcConnectedCallback) {
        this._setupWebSocket();
        this._socketConnectedCallback = socketConnectedCallback;
        this._rtcConnectedCallback = rtcConnectedCallback;
    }

    sendPlayerData(playerData) {
        try {
            this._sendDataChannel.send(playerData);
        } catch(err) {
            //Do nothing...
        }
    }

    sendResetSignal() {
        if(this._state != "PLAYING") {
            return;
        }
        try {
            this._sendDataChannel.send("R");
        } catch(error) {
            //Do nothing... They'll hopefully try again
        }
    }

    cancel() {
        this._state = "LOCAL";
        this._webSocket.close();
        this._resetRTCAndPeerData();
        this._socketConnectedCallback = null;
        this._rtcConnectedCallback = null;
    }

    quit() {
        try {
            this._sendDataChannel.send("Q");
        } catch(error) {
            //Do nothing, error most likely caused by them already disconnecting
        }
        this._state = "LOCAL";
        this._resetRTCAndPeerData();
    }
}
