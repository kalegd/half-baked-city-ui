import OpponentAvatar from './OpponentAvatar.js';
import OpponentHand from './OpponentHand.js';
import global from '/library/scripts/core/global.js';
import { getNextSequentialId } from '/library/scripts/core/utils.module.js';

import * as THREE from '/library/scripts/three/build/three.module.js';

export default class ChessXRController {
    constructor() {
        this.id = getNextSequentialId();
        this._frame = 0;
        this._lastPeerFrame = 0;
        this._shortStream = Array(54).fill(0);
        this._longStream = Array(502).fill(0);
        this._chessPieces = [];
        this._peerConnected = false;
        this._opponentAvatar = new OpponentAvatar();
        this._vec3 = new THREE.Vector3();
        this._vec3_2 = new THREE.Vector3();
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
        this.isStrict = false;
        this.strictGame = new Chess();
        this.moves = {};
        this._lastMove = "";
        this._gameNumber = 0;
        this._moveNumber = 0;
        this._mouseClicked = false;
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

    registerChessBoard(board) {
        this._chessBoard = board;
    }

    registerChessPiece(piece) {
        this._chessPieces.push(piece);
    }

    registerRTC(rtc) {
        this._rtc = rtc;
    }

    registerUI(ui) {
        this._ui = ui;
    }

    toggleStrict(isStrict) {
        if(this.isStrict != isStrict) {
            for(let i = 0; i < this._chessPieces.length; i++) {
                this._chessPieces[i].setIsStrict(isStrict);
            }
            this.isStrict = isStrict;
        }
    }

    playRandomOpponent() {
        this._rtc.playRandomOpponent(() => {
            this._ui.setScreen('WAIT_FOR_RANDOM');
        }, () => {
            if(this.isStrict) {
                this._gameNumber = 0;
                this.startStrictGame();
            } else {
                this._ui.setScreen('PLAYING_PHYSICS');
                this._leftPeerHand.addToScene(global.scene);
                this._rightPeerHand.addToScene(global.scene);
                this.resetPieces();
            }
            this._opponentAvatar.addToScene(global.scene);
            this._peerConnected = true;
        });
    }

    setOpponentNameAndAvatar(nameAndAvatar) {
        let name = nameAndAvatar.substr(0, nameAndAvatar.indexOf(":"));
        let avatarURL = nameAndAvatar.substr(nameAndAvatar.indexOf(":") + 1);
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
        this.toggleStrict(false);
    }

    opponentLeft() {
        this.opponentName = null;
        this._leftPeerHand.removeFromScene();
        this._rightPeerHand.removeFromScene();
        this._opponentAvatar.removeFromScene();
        this._peerConnected = false;
        this._ui.setScreen('OPPONENT_LEFT');
        if(global.deviceType != "XR") {
            this._ui.addToScene(global.scene);
        }
    }

    offerDraw() {
        this._strictFlags.add("OD");
        if(this._strictFlags.has("OOD")) {
            this._ui.strictGameOver("DRAW");
            this._ui.setScreen("GAME_OVER");
            if(global.deviceType != "XR") {
                this._ui.addToScene(global.scene);
            }
        }
    }

    claimDraw() {
        this._strictFlags.add("CD");
        this._ui.strictGameOver("DRAW");
        this._ui.setScreen("GAME_OVER");
        if(global.deviceType != "XR") {
            this._ui.addToScene(global.scene);
        }
    }

    forfeit() {
        this._strictFlags.add("F");
        this._ui.strictGameOver("MY_FORFEIT");
        this._ui.setScreen("GAME_OVER");
        if(global.deviceType != "XR") {
            this._ui.addToScene(global.scene);
        }
    }

    requestToPlayAgain() {
        this._strictFlags.add("PA");
        if(this._strictFlags.has("OPA")) {
            //Give it 2 seconds for us to propagate that we also want to play
            //again. Should probably do this in a more confirmation fashion, but
            //lazy...
            this.polite = !this.polite;
            setTimeout(() => {
                this.startStrictGame();
            }, 1000);
        }
    }

    _receiveDrawOffer() {
        if(!this._strictFlags.has("OOD")) {
            this._strictFlags.add("OOD");
            if(this._strictFlags.has("OD")) {
                this._ui.strictGameOver("DRAW");
                this._ui.setScreen("GAME_OVER");
            } else {
                this._ui.setScreen("DRAW_OFFERED");
            }
            if(global.deviceType != "XR") {
                this._ui.addToScene(global.scene);
            }
        }
    }

    _receiveDrawClaim() {
        if(!this._strictFlags.has("OCD")) {
            this._strictFlags.add("OCD");
            this._ui.strictGameOver("DRAW");
            this._ui.setScreen("GAME_OVER");
            if(global.deviceType != "XR") {
                this._ui.addToScene(global.scene);
            }
        }
    }

    _receiveForfeit() {
        if(!this._strictFlags.has("OF")) {
            this._strictFlags.add("OF");
            this._ui.strictGameOver("PEER_FORFEIT");
            this._ui.setScreen("GAME_OVER");
            if(global.deviceType != "XR") {
                this._ui.addToScene(global.scene);
            }
        }
    }

    _receivePlayAgainRequest() {
        if(!this._strictFlags.has("OPA")) {
            this._strictFlags.add("OPA");
            if(this._strictFlags.has("PA")) {
                this.polite = !this.polite;
                setTimeout(() => {
                    this.startStrictGame();
                }, 1000);
            }
        }
    }

    //The following flags exist
    //PA - User wants to play again
    //OPA - Opponant wants to play again
    //OD - User offers draw
    //OOD - Opponents offers draw
    startStrictGame() {
        this._ui.setScreen('PLAYING_STRICT');
        if(this.polite) {
            this.color = "b";
            if(global.deviceType != "XR") {
                this._ui.removeFromScene();
                if(this._ui._pivotPoint.rotation.y > 0) {
                    global.camera.position.fromArray([-0.95,1.7,-0.6]);
                    this._ui.flipDisplay();
                }
            }
        } else {
            this.color = "w";
            if(global.deviceType != "XR") {
                this._ui.removeFromScene();
                if(this._ui._pivotPoint.rotation.y < 0) {
                    global.camera.position.fromArray([0.95,1.7,-0.6]);
                    this._ui.flipDisplay();
                }
            }
        }
        this.strictGame.reset();
        this.resetPieces();
        this._updateChessMoves();
        this._lastMove = "";
        this._gameNumber++;
        this._moveNumber = 0;
        this._canClaimDraw = false;
        this._drawOffered = false;
        this._opponentDrawOffered = false;
        this._playAgain = false;
        this._opponentPlayAgain = false;
        this._strictFlags = new Set();
        this._ui.toggleDrawButton(false);
    }

    _makeMove(san) {
        let move;
        let moves = this.strictGame.moves({ verbose: true });
        for(let i = 0; i < moves.length; i++) {
            if(moves[i].san == san) {
                move = moves[i];
            }
        }
        let movePiece;
        let killPiece;
        let killPosition = (move.flags.includes("e"))
            ? move.to.charAt(0) + move.from.charAt(1)
            : move.to;
        for(let i = 0; i < this._chessPieces.length; i++) {
            if(this._chessPieces[i].isAlive && this._chessPieces[i].chessPosition == move.from) {
                movePiece = this._chessPieces[i];
            }
            if(this._chessPieces[i].isAlive && this._chessPieces[i].chessPosition == killPosition) {
                killPiece = this._chessPieces[i];
            }
        }
        if(killPiece) {
            //TODO: Move this to after the piece finishes jumping
            killPiece.reset(true);
        }
        let square = this._chessBoard.positions[move.to];
        if(move.flags.includes("p")) {
            if(this.color == this.turn) {
                if(global.deviceType == "XR") {
                    movePiece.slideTo(square, (piece) => {
                        this._promotePiece(piece, move.from, move.to);
                    });
                } else {
                    movePiece.jumpTo(square, (piece) => {
                        this._promotePiece(piece, move.from, move.to);
                    });
                }
            } else {
                movePiece.jumpTo(square);
                this._lastMove = san;
                this._moveNumber++;
                movePiece.promoteTo(move.promotion);
                this.strictGame.move(san);
                this._updateChessMoves();
            }
        } else {
            if(global.deviceType == "XR" && this.color == this.turn) {
                movePiece.slideTo(square);
            } else {
                movePiece.jumpTo(square);
            }
            this._lastMove = san;
            this._moveNumber++;
            this.strictGame.move(san);
            this._updateChessMoves();
        }
        if(move.flags.includes("k")) {
            if(move.from == "e1") {
                this._handleCastling("h1", "f1");
            } else { //we can assume move.from == e8
                this._handleCastling("h8", "f8");
            }
        } else if(move.flags.includes("q")) {
            if(move.from == "e1") {
                this._handleCastling("a1", "d1");
            } else { //we can assume move.from == e8
                this._handleCastling("a8", "d8");
            }
        }
    }

    _handleCastling(from, to) {
        let castle;
        for(let i = 0; i < this._chessPieces.length; i++) {
            if(this._chessPieces[i].isAlive && this._chessPieces[i].chessPosition == from) {
                castle = this._chessPieces[i];
                break;
            }
        }
        let square = this._chessBoard.positions[to];
        if(global.deviceType == "XR") {
            castle.jumpTo(square);
        } else {
            castle.slideTo(square);
        }
    }

    _promotePiece(chessPiece, from, to) {
        //TODO: display UI for user to select promotion, and upon completion promote piece
        //These next 2 lines should be in the callback of the UI selection
        this._ui.offerPromotion((promotion) => {
            let san = this._getPromotionSan(from, to, promotion);
            this._lastMove = san;
            this._moveNumber++;
            chessPiece.promoteTo(promotion);
            this.strictGame.move(san);
            this._updateChessMoves();
        });
        this._ui.addToScene(global.scene);
    }

    _getPromotionSan(from, to, promotion) {
        let moves = this.strictGame.moves({ verbose: true });
        for(let i = 0; i < moves.length; i++) {
            if(moves[i].from == from && moves[i].to == to && moves[i].promotion == promotion) {
                return moves[i].san;
            }
        }
    }

    _updateChessMoves() {
        this.turn = this.strictGame.turn();
        let moves = this.strictGame.moves({ verbose: true });
        this.moves = {};
        for(let i = 0; i < moves.length; i++) {
            let move = moves[i];
            if(move.from in this.moves) {
                this.moves[move.from][move.to] = move.san;
            } else {
                this.moves[move.from] = {};
                this.moves[move.from][move.to] = move.san;
            }
        }
        if(this.strictGame.in_checkmate()) {
            this._ui.strictGameOver("CHECKMATE", this.turn != this.color);
            this._ui.setScreen("GAME_OVER");
            if(global.deviceType != "XR") {
                this._ui.addToScene(global.scene);
            }
        } else if(this.strictGame.in_stalemate()) {
            this._ui.strictGameOver("STALEMATE");
            this._ui.setScreen("GAME_OVER");
            if(global.deviceType != "XR") {
                this._ui.addToScene(global.scene);
            }
        } else if(this.strictGame.in_draw() && !this._canClaimDraw) {
            this._canClaimDraw = true;
            this._ui.toggleDrawButton(true);
        }
    }

    _setArrayFromCameraData(array, offset) {
        global.camera.matrixWorld.decompose(this._vec3,this._quaternion,this._vec3_2);
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

    // Resets all the chess pieces and then signal RTC Handler to send message
    // if possible
    reset() {
        this.resetPieces();
        this._rtc.sendResetSignal();
    }

    resetPieces() {
        for(let i = 0; i < 32; i++) {
            this._chessPieces[i].reset();
        }
    }

    //Indices for primary stream data goes as follows
    // 0     : frame
    // 1     : user scale
    // 2     : left hand squeeze pressed
    // 3-18  : left hand matrix4
    // 3-5   : left hand position
    // 6-8   : left hand rotation
    // 9     : right hand squeeze pressed
    // 10-12 : right hand position
    // 13-15 : right hand rotation
    // 16-18 : camera position
    // 19-21 : camera rotation
    _fillPrimaryStreamData(dataStream) {
        let leftGamepad = global.inputHandler.getXRGamepad("LEFT");
        let rightGamepad = global.inputHandler.getXRGamepad("RIGHT");

        dataStream[0] = this._frame;
        dataStream[1] = global.user.scale.x;
        dataStream[2] = (leftGamepad)
            ? leftGamepad.buttons[1].pressed
            : 0;
        if(this._leftHand._pivotPoint.parent) {
            this._leftHand.setArrayFromWorldData(dataStream, 3);
        } else {
            dataStream[3] = -1;
        }
        dataStream[9] = (rightGamepad)
            ? rightGamepad.buttons[1].pressed
            : 0;
        if(this._rightHand._pivotPoint.parent) {
            this._rightHand.setArrayFromWorldData(dataStream, 10);
        } else {
            dataStream[10] = -1;
        }

        this._setArrayFromCameraData(dataStream, 16);
    }

    // Held Chess Piece Data
    // 22-37 : left hand held chess piece
    // 38-53 : right hand held chess piece
    _fillSecondaryShortStreamData(dataStream) {
        this._leftHand.setArrayFromGraspData(dataStream, 22);
        this._rightHand.setArrayFromGraspData(dataStream, 38);
    }

    // All chess piece data
    _fillSecondaryLongStreamData(dataStream) {
        let offset = 22;
        for(let i = 0; i < 32; i++) {
            this._chessPieces[i].setArrayFromPhysicsData(dataStream, offset);
            offset += 15;
        }
    }

    _fillSecondaryStrictStreamData(dataStream) {
        let i = 0;
        dataStream[22] = this._gameNumber;
        dataStream[23] = this._moveNumber;
        while(i < this._lastMove.length) {
            dataStream[24 + i] = this._lastMove.charCodeAt(i);
            i++;
        }
        dataStream[24 + i] = -1;
        i++;
        if(this._strictFlags.has("OD")) {
            dataStream[24 + i] = "O".charCodeAt(0);
            i++;
        }
        if(this._strictFlags.has("CD")) {
            dataStream[24 + i] = "C".charCodeAt(0);
            i++;
        }
        if(this._strictFlags.has("PA")) {
            dataStream[24 + i] = "P".charCodeAt(0);
            i++;
        }
        if(this._strictFlags.has("F")) {
            dataStream[24 + i] = "F".charCodeAt(0);
            i++;
        }
        dataStream[24 + i] = -1;
    }

    _updateHoveredPiece() {
        let position = global.inputHandler.getPointerPosition();
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(position, global.camera);
        let object = null;
        let minimumDistance = 1000;
        for(let i = 0; i < this._chessPieces.length; i++) {
            if(!this._chessPieces[i].isAlive) {
                continue;
            }
            let v = this._chessPieces[i].getDistanceTo(global.camera, raycaster);
            if(v.acquirable && v.distance < minimumDistance) {
                object = this._chessPieces[i];
                minimumDistance = v.distance;
            }
        }
        if(this._hoveredPiece != object) {
            if(this._hoveredPiece) {
                this._hoveredPiece.removeHoveredBy(this.id);
            }
            if(object) {
                object.addHoveredBy(this.id);
            }
        }
        this._hoveredPiece = object;
    }

    _updateHoveredSquare() {
        let position = global.inputHandler.getPointerPosition();
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(position, global.camera);
        let chessSquare = this._chessBoard.getSquare(raycaster, this.moves[this._selectedPiece.chessPosition]);
        if(this._hoveredSquare != chessSquare) {
            if(this._hoveredSquare) {
                this._hoveredSquare.material.opacity = 0;
            }
            if(chessSquare) {
                chessSquare.material.opacity = 0.5;
            }
        }
        this._hoveredSquare = chessSquare;
    }

    _updateHoveredSquareFromPiece(piece, oldSquare) {
        let newSquare = this._chessBoard.getSquareFromPiece(piece);
        if(newSquare != oldSquare) {
            if(oldSquare) {
                oldSquare.material.opacity = 0;
            }
            if(newSquare) {
                newSquare.material.opacity = 0.5;
            }
        }
        return newSquare;
    }

    pieceAcquiredDuringStrict(piece, hand) {
        if(hand == "RIGHT") {
            this._rightSelectedPiece = piece;
        } else if(hand == "LEFT") {
            this._leftSelectedPiece = piece;
        }

    }

    pieceLetGoDuringStrict(piece, hand) {
        if(hand == "LEFT") {
            if(this._leftSelectedPiece == piece) {
                this._leftSelectedPiece = null;
                if(piece != this._rightSelectedPiece) {
                    if(this._leftHoveredSquare) {
                        //piece.slideTo(this._leftHoveredSquare);
                        this._makeMove(this.moves[piece.chessPosition][this._leftHoveredSquare.chessPosition]);
                        this._leftHoveredSquare.material.opacity = 0;
                        let rightObject = this._rightHand.letGoOfObject();
                        if(rightObject) {
                            rightObject.slideTo(this._chessBoard.positions[rightObject.chessPosition]);
                            this._rightSelectedPiece = null;
                        }
                    } else {
                        piece.slideTo(this._chessBoard.positions[piece.chessPosition]);
                    }
                }
            }
        } else if(hand == "RIGHT") {
            if(this._rightSelectedPiece == piece) {
                this._rightSelectedPiece = null;
                if(piece != this._leftSelectedPiece) {
                    if(this._rightHoveredSquare) {
                        //piece.slideTo(this._rightHoveredSquare);
                        this._makeMove(this.moves[piece.chessPosition][this._rightHoveredSquare.chessPosition]);
                        this._rightHoveredSquare.material.opacity = 0;
                        let leftObject = this._leftHand.letGoOfObject();
                        if(leftObject) {
                            leftObject.slideTo(this._chessBoard.positions[leftObject.chessPosition]);
                            this._leftSelectedPiece = null;
                        }
                    } else {
                        piece.slideTo(this._chessBoard.positions[piece.chessPosition]);
                    }
                }
            }
        }
    }

    _updateStrict(timeDelta) {
        //TODO: Fix touch events so you only have to tap once
        //TODO: Maybe add drag controls?
        //Handle mouse events
        if(this.color != this.turn) {
            if(this._hoveredPiece) {
                this._hoveredPiece.removeHoveredBy(this.id);
                this._hoveredPiece = null;
                this._mouseClicked = false;
                this._clickedPiece = null;
                this._selectedPiece = null;
            }
            if(this._leftHoveredSquare) {
                this._leftHoveredSquare.material.opacity = 0;
            }
            if(this._rightHoveredSquare) {
                this._rightHoveredSquare.material.opacity = 0;
            }
        } else if(global.deviceType != "XR") {
            if(!this._selectedPiece) {
                if(global.inputHandler.isPointerPressed() || global.inputHandler.isScreenTouched()) {
                    this._updateHoveredPiece();
                    if(!this._mouseClicked) {
                        this._mouseClicked = true;
                        this._clickedPiece = this._hoveredPiece;
                    }
                } else if(!global.inputHandler.isPointerPressed() && !global.inputHandler.isScreenTouched()) {
                    if(this._mouseClicked) {
                        if(this._clickedPiece == this._hoveredPiece) {
                            this._selectedPiece = this._hoveredPiece;
                        }
                        this._clickedPiece = null;
                        this._mouseClicked = false;
                    } else {
                        this._updateHoveredPiece();
                    }
                }
            } else {
                if(global.inputHandler.isPointerPressed() || global.inputHandler.isScreenTouched()) {
                    this._updateHoveredSquare();
                    if(!this._mouseClicked) {
                        this._mouseClicked = true;
                        this._clickedSquare = this._hoveredSquare;
                    }
                } else if(!global.inputHandler.isPointerPressed() && !global.inputHandler.isScreenTouched()) {
                    if(this._mouseClicked) {
                        if(this._clickedSquare == this._hoveredSquare) {
                            if(this._hoveredSquare) {
                                //this._makeMove(this._selectedPiece.chessPosition, this._hoveredSquare.chessPosition);
                                this._makeMove(this.moves[this._selectedPiece.chessPosition][this._hoveredSquare.chessPosition]);
                                this._hoveredSquare.material.opacity = 0;
                                this._hoveredSquare = null;
                                this._clickedSquare = null;
                            }
                            this._hoveredPiece.removeHoveredBy(this.id);
                            this._hoveredPiece = null;
                            this._selectedPiece = null;
                        }
                        this._clickedSquare = null;
                        this._mouseClicked = false;
                    } else {
                        this._updateHoveredSquare();
                    }
                }
            }
        } else {//Device type is XR
            this._leftHoveredSquare = this._updateHoveredSquareFromPiece(
                this._leftSelectedPiece, this._leftHoveredSquare);
            this._rightHoveredSquare = this._updateHoveredSquareFromPiece(
                this._rightSelectedPiece, this._rightHoveredSquare);
        }

        this._frame += 1;
        if(this._frame % 2) {
            let dataStream = this._shortStream;
            this._fillPrimaryStreamData(dataStream);
            this._fillSecondaryStrictStreamData(dataStream);
            this._rtc.sendPlayerData(Float32Array.from(dataStream));
        }
    }

    _updateNonStrict(timeDelta) {
        this._frame += 1;
        this._leftPeerHand.update(timeDelta);
        this._rightPeerHand.update(timeDelta);

        let dataStream;
        if(this._frame % 2 == 0) {
            if(this._frame % 6 == 0) {
                dataStream = this._longStream;
                this._fillPrimaryStreamData(dataStream);
                this._fillSecondaryLongStreamData(dataStream);
            } else {
                dataStream = this._shortStream;
                this._fillPrimaryStreamData(dataStream);
                this._fillSecondaryShortStreamData(dataStream);
            }
            this._rtc.sendPlayerData(Float32Array.from(dataStream));
        }
    }

    update(timeDelta) {
        if(!this._peerConnected) {
            return;
        } else if(this.isStrict) {
            this._updateStrict(timeDelta);
        } else {
            this._updateNonStrict(timeDelta);
        }
    }

    handlePeerData(data) {
        if(!this._peerConnected || data[0] <= this._lastPeerFrame) {
            return;
        }
        this._lastPeerFrame = data[0];

        if(data[3] != -1) {
            //TODO: Uncomment and fix for case where we are computer
            this._leftPeerHand.updateFromDataStream(data, 2);
        }
        if(data[10] != -1) {
            //TODO: Uncomment and fix for case where we are computer
            this._rightPeerHand.updateFromDataStream(data, 9);
        }
        this._opponentAvatar.updateFromDataStream(data, 16);
        if(this.isStrict) {
            this._handleStrictPeerData(data);
        } else if(data.length > 54) {
            let offset = 22;
            for(let i = 0; i < 32; i++) {
                //TODO: Send data to PhysicsChessPiece
                this._chessPieces[i].updateFromDataStream(data, offset);
                offset += 15;
            }
        } else {
            if(data[22] != -1) {
                global.physicsObjects[data[22]].updateFromDataStream(data, 23);
            }
            if(data[38] != -1) {
                global.physicsObjects[data[38]].updateFromDataStream(data, 39);
            }
        }
    }

    _handleStrictPeerData(data) {
        if(data[22] != this._gameNumber || (data[23] != this._moveNumber && data[23] != this._moveNumber + 1)) {
            return; 
        }   
        let offset = 24;
        let move = "";
        while(data[offset] != -1) {
            move += String.fromCharCode(data[offset]);
            offset++;
        }
        offset++;
        while(data[offset] != -1) {
            let flag = String.fromCharCode(data[offset]);
            if(flag == "O") {
                this._receiveDrawOffer();
            } else if(flag == "C") {
                this._receiveDrawClaim();
            } else if(flag == "P") {
                this._receivePlayAgainRequest();
            } else if(flag == "F") {
                this._receiveForfeit();
            }
            offset++;
        }
        if(data[23] == this._moveNumber + 1) {
            this._makeMove(move);
        }
    }
}
