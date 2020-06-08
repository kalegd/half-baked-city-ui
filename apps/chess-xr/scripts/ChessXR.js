import OpponentAvatar from './OpponentAvatar.js';
import OpponentHand from './OpponentHand.js';
import global from '/library/scripts/core/global.js';

import * as THREE from '/library/scripts/three/build/three.module.js';

export default class ChessXRController {
    constructor() {
        this._frame = 0;
        this._lastPeerFrame = 0;
        this._shortStream = Array(22).fill(0);
        this._longStream = Array(502).fill(0);
        this._chessPieces = [];
        this._peerConnected = false;
        this._opponentAvatar = new OpponentAvatar();
        this._vec3 = new THREE.Vector3();
        this._quaternion = new THREE.Quaternion();
        this._euler = new THREE.Euler();
        let user = localStorage.getItem('user');
        if(user == null) {
            this.displayName = "Guest";
            this.avatarURL = "/images/potato-logo.png";
        } else {
            let userObj = JSON.parse(user);
            this.displayName = userObj.username;
            this.avatarURL = userObj.avatarURL;
        }
        this.opponentName;
        this.polite = true;
    }

    registerHand(hand, side) {
        if(side == "LEFT") {
            this._leftHand = hand;
            this._leftPeerHand = new OpponentHand(hand);
        } else if(side == "RIGHT") {
            this._rightHand = hand;
            this._rightPeerHand = new OpponentHand(hand);
        }
    }

    registerChessPiece(piece) {
        this._chessPieces.push(piece);
        //this._chessPieces[piece.id] = piece;
    }

    registerRTC(rtc) {
        this._rtc = rtc;
    }

    registerUI(ui) {
        this._ui = ui;
    }

    playRandomOpponent() {
        this._rtc.playRandomOpponent(() => {
            this._ui.setScreen('WAIT_FOR_RANDOM');
        }, () => {
            this._ui.setScreen('PLAYING_RANDOM');
            this._leftPeerHand.addToScene(global.scene);
            this._rightPeerHand.addToScene(global.scene);
            this._opponentAvatar.addToScene(global.scene);
            this._peerConnected = true;
        });
    }

    setOpponentNameAndAvatar(nameAndAvatar) {
        let name = nameAndAvatar.substr(0, nameAndAvatar.indexOf(":"));
        let avatarURL = nameAndAvatar.substr(0, nameAndAvatar.indexOf(":"));
        //this._opponentAvatar.updateURL('https://s3.amazonaws.com/readyplayerbaker/avatars_baked/953199c4-d244-4529-8feb-b2ed67a81099.glb');
        this._opponentAvatar.updateURL(avatarURL);
        this.opponentName = name;
        this._ui.updateOpponentName();
    }

    cancelSearch() {
        this._rtc.cancel();
    }

    quitGame() {
        this._rtc.quit();
        this._opponentName = null;
        this._leftPeerHand.removeFromScene();
        this._rightPeerHand.removeFromScene();
        this._opponentAvatar.removeFromScene();
        this._peerConnected = false;
    }

    opponentLeft() {
        this._ui.setScreen('OPPONENT_LEFT');
        this.opponentName = null;
        this._leftPeerHand.removeFromScene();
        this._rightPeerHand.removeFromScene();
        this._opponentAvatar.removeFromScene();
        this._peerConnected = false;
    }

    _setArrayFromCameraData(array, offset) {
        //The first two lines give us problems after resizing
        this._vec3.setFromMatrixPosition(global.camera.matrixWorld);
        this._quaternion.setFromRotationMatrix(global.camera.matrixWorld);
        this._quaternion.normalize();
        //These next two lines don't work for VR
        //global.camera.getWorldPosition(this._vec3);
        //global.camera.getWorldQuaternion(this._quaternion);
        this._euler.setFromQuaternion(this._quaternion);

        this._vec3.toArray(array, offset);
        array[offset+3] = this._euler.x;
        array[offset+4] = this._euler.y;
        array[offset+5] = this._euler.z;
    }

    processCollision(actor1Id, actor2Id) {
        let actor1 = global.physicsObjects[actor1Id];
        let actor2 = global.physicsObjects[actor2Id];
        if(actor1.type == "PHYSICS_CHESS_PIECE") {
            if(actor2.type == "PHYSICS_CHESS_PIECE") {
                actor1.processCollisionWithChessPiece(actor2);
            } else {
                actor1.processCollisionWithHand(actor2);
            }
        } else if(actor2.type == "PHYSICS_CHESS_PIECE") {
            actor2.processCollisionWithHand(actor1);
        }

    }

    //Indices for primary stream data goes as follows
    // 0     : frame
    // 1     : user scale
    // 2     : left hand squeeze pressed
    // 3-18  : left hand matrix4
    // 3-5  : left hand position
    // 6-8  : left hand rotation
    // 9    : right hand squeeze pressed
    // 10-12  : right hand position
    // 13-15  : right hand rotation
    // 16-18  : camera position
    // 19-21  : camera rotation
    _fillPrimaryStreamData(dataStream) {
        let leftGamepad = global.inputHandler.getXRGamepad("LEFT");
        let rightGamepad = global.inputHandler.getXRGamepad("RIGHT");

        dataStream[0] = this._frame;
        dataStream[1] = global.user.scale.x;
        dataStream[2] = (leftGamepad)
            ? leftGamepad.buttons[1].pressed
            : 0;
        this._leftHand.setArrayFromWorldData(dataStream, 3);
        dataStream[9] = (rightGamepad)
            ? rightGamepad.buttons[1].pressed
            : 0;
        this._rightHand.setArrayFromWorldData(dataStream, 10);

        this._setArrayFromCameraData(dataStream, 16);
    }

    _fillSecondaryStreamData(dataStream) {
        let offset = 22;
        for(let i = 0; i < 32; i++) {
            this._chessPieces[i].setArrayFromPhysicsData(dataStream, offset);
            offset += 15;
        }
    }

    _fillDataStream() {
        let dataStream;
        if(this._frame % 3 == 0) {
            dataStream = this._longStream;
            this._fillSecondaryStreamData(dataStream);
        } else {
            dataStream = this._shortStream;
        }
        this._fillPrimaryStreamData(dataStream);
    }

    //Indices for data goes as follows
    // 0     : frame
    // 1     : user scale
    // 2     : left hand squeeze pressed
    // 3-5  : left hand position
    // 6-8  : left hand rotation
    // 9    : right hand squeeze pressed
    // 10-12  : right hand position
    // 13-15  : right hand rotation
    // 16-18  : camera position
    // 19-21  : camera rotation
    update(timeDelta) {
        if(!this._peerConnected) {
            return;
        }
        this._frame += 1;
        this._leftPeerHand.update(timeDelta);
        this._rightPeerHand.update(timeDelta);

        let dataStream;
        if(this._frame % 6 == 0) {
            dataStream = this._longStream;
            this._fillSecondaryStreamData(dataStream);
        } else {
            dataStream = this._shortStream;
        }
        if(this._frame % 2 == 0) {
            this._fillPrimaryStreamData(dataStream);
            this._rtc.sendPlayerData(Float32Array.from(dataStream));
        }
    }

    handlePeerData(data) {
        if(!this._peerConnected || data[0] <= this._lastPeerFrame) {
            return;
        }
        this._lastPeerFrame = data[0];

        this._leftPeerHand.updateFromDataStream(data, 2);
        this._rightPeerHand.updateFromDataStream(data, 9);
        this._opponentAvatar.updateFromDataStream(data, 16);
        if(data.length > 22) {
            let offset = 22;
            for(let i = 0; i < 32; i++) {
                //TODO: Send data to PhysicsChessPiece
                this._chessPieces[i].updateFromDataStream(data, offset);
                offset += 15;
            }
        }
    }
}
