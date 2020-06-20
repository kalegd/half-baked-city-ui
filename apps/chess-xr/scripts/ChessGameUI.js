import global from '/library/scripts/core/global.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import ThreeMeshUI from '/library/scripts/three-mesh-ui/three-mesh-ui.js';
import ThreeMeshUIHelper from '/library/scripts/components/ThreeMeshUIHelper.js';

export default class ChessGameUI {
    constructor(params) {
        this._gltfScene;
        this._pivotPoint = new THREE.Object3D();
        this._scale = (params['Scale']) ? params['Scale'] : 1;
        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];
        this._fontFamily = params['Font Family'];
        this._fontTexture = params['Font Texture'];
        this._screen = 'MAIN';
        this._lastScreen = 'MAIN';
        this._screenContainers = {};
        this._interactables = {
            'GET_AN_AVATAR': [],
            'MAIN': [],
            'WAIT_FOR_RANDOM': [],
            'PLAYING_RANDOM': [],
            'HOST_OR_JOIN': [],
            'OPPONENT_LEFT': [],
            'SETTINGS': [],
            'PLEASE_WAIT': [],
            'VR_ONLY': [],
        };

        this._pivotPoint.scale.set(this._scale, this._scale, this._scale);
        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);

        this._createUIs();
        global.chessXR.registerUI(this);
    }

    _createUIs() {
        if(global.deviceType == 'XR') {
            this._pointers = ThreeMeshUIHelper.createXRPointers();
        } else if(global.deviceType == 'POINTER') {
            this._pointer = ThreeMeshUIHelper.createPointer();
        }
        this._screenContainers['GET_AN_AVATAR'] = this._createGetAnAvatarUI();
        this._screenContainers['MAIN'] = this._createMainUI();
        this._screenContainers['WAIT_FOR_RANDOM'] = this._createWaitForRandomUI();
        this._screenContainers['PLAYING_RANDOM'] = this._createPlayingRandomUI();
        this._screenContainers['HOST_OR_JOIN'] = this._createHostOrJoinUI();
        this._screenContainers['OPPONENT_LEFT'] = this._createOpponentLeftUI();
        this._screenContainers['SETTINGS'] = this._createSettingsUI();
        this._screenContainers['PLEASE_WAIT'] = this._createPleaseWaitUI();
        this._screenContainers['VR_ONLY'] = this._createVROnlyUI();
        if(global.chessXR.avatarURL == '/images/potato-logo.png') {
            this._screen = 'GET_AN_AVATAR';
            this._lastScreen = 'GET_AN_AVATAR';
            this._pivotPoint.add(this._screenContainers['GET_AN_AVATAR']);
        } else {
            this._pivotPoint.add(this._screenContainers['MAIN']);
        }
    }

    _createGetAnAvatarUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let infoBlock = ThreeMeshUIHelper.createTextBlock({
            'text': "Did you know you can create an Avatar on https://readyplayer.me and then add it to your Half Baked City Account?",
            'height': 0.25,
            'width': 1.4,
        });
        let continueButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Continue',
            'ontrigger': () => {
                this.setScreen('MAIN');
            },
        });
        container.add(titleBlock);
        container.add(infoBlock);
        container.add(continueButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['GET_AN_AVATAR'].push(container);
        this._interactables['GET_AN_AVATAR'].push(continueButton);
        return container;
    }

    _createMainUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let textBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let randomMatchButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Play Random Opponent',
            'ontrigger': () => {
                if(global.deviceType == "XR") {
                    this.setScreen('PLEASE_WAIT');
                    global.chessXR.playRandomOpponent();
                } else {
                    this.setScreen('VR_ONLY');
                }
            },
        });
        //let roomButton = ThreeMeshUIHelper.createButtonBlock({
        //    'text': 'Host/Join Game',
        //    'ontrigger': () => {
        //        this.setScreen('HOST_OR_JOIN');
        //    },
        //});
        let settingsButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Settings',
            'ontrigger': () => {
                this.setScreen('SETTINGS');
            },
        });
        container.add(textBlock);
        container.add(randomMatchButton);
        //container.add(roomButton);
        container.add(settingsButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['MAIN'].push(container);
        this._interactables['MAIN'].push(randomMatchButton);
        //this._interactables['MAIN'].push(roomButton);
        this._interactables['MAIN'].push(settingsButton);
        return container;
    }

    _createWaitForRandomUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let pleaseWaitBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Please wait while we look for opponents',
            'height': 0.15,
            'width': 1.2,
        });
        let cancelButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Cancel',
            'ontrigger': () => {
                this.setScreen('MAIN');
                global.chessXR.cancelSearch();
            },
        });
        container.add(titleBlock);
        container.add(pleaseWaitBlock);
        container.add(cancelButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['WAIT_FOR_RANDOM'].push(container);
        this._interactables['WAIT_FOR_RANDOM'].push(cancelButton);
        return container;
    }

    _createPlayingRandomUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let opponentName = (global.chessXR.opponentName) ? global.chessXR.opponentName : "...";
        this._opponentNameBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'You are playing ' + opponentName,
            'height': 0.15,
            'width': 1.2,
        });
        let settingsButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Settings',
            'ontrigger': () => {
                this.setScreen('SETTINGS');
            },
        });
        let quitButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Quit',
            'ontrigger': () => {
                this.setScreen('MAIN');
                global.chessXR.quitGame();
            },
        });
        container.add(titleBlock);
        container.add(this._opponentNameBlock);
        container.add(settingsButton);
        container.add(quitButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['PLAYING_RANDOM'].push(container);
        this._interactables['PLAYING_RANDOM'].push(settingsButton);
        this._interactables['PLAYING_RANDOM'].push(quitButton);
        return container;
    }

    _createHostOrJoinUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let comingSoonBlock = ThreeMeshUIHelper.createTextBlock({
            'text': "Feature Maybe Coming Soon If I'm Not Lazy",
            'height': 0.15,
            'width': 1.4,
        });
        let backButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Back',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
            },
        });
        container.add(titleBlock);
        container.add(comingSoonBlock);
        container.add(backButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['HOST_OR_JOIN'].push(container);
        this._interactables['HOST_OR_JOIN'].push(backButton);
        return container;
    }

    _createOpponentLeftUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let opponentName = (global.chessXR.opponentName) ? global.chessXR.opponentName : "...";
        this._opponentLeftBlock = ThreeMeshUIHelper.createTextBlock({
            'text': opponentName + ' has quit or lost connection',
            'height': 0.15,
            'width': 1.2,
        });
        let randomMatchButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Find New Random Opponent',
            'ontrigger': () => {
                this.setScreen('PLEASE_WAIT');
                global.chessXR.playRandomOpponent();
                this.updateOpponentName();
            },
        });
        let menuButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Main Menu',
            'ontrigger': () => {
                this.setScreen('MAIN');
                this.updateOpponentName();
            },
        });
        container.add(titleBlock);
        container.add(this._opponentLeftBlock);
        container.add(randomMatchButton);
        container.add(menuButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['OPPONENT_LEFT'].push(container);
        this._interactables['OPPONENT_LEFT'].push(randomMatchButton);
        this._interactables['OPPONENT_LEFT'].push(menuButton);
        return container;
    }

    _createSettingsUI() {
        let clearMaterial = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0,
        });
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let resetButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Reset',
            'ontrigger': () => {
                global.chessXR.reset();
            },
        });
        let backButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Back',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
            },
        });
        let heightBlock = ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundMaterial': clearMaterial,
            'margin': 0.02,
        });
        let heightTitleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Height',
            'fontSize': 0.06,
            'height': 0.15,
            'width': 0.26,
        });
        let heightUpButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Up',
            'height': 0.15,
            'width': 0.2,
            'ontrigger': () => {
                global.user.translateY(0.05);
            },
        });
        let heightDownButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Down',
            'height': 0.15,
            'width': 0.2,
            'ontrigger': () => {
                global.user.translateY(-0.05);
            },
        });
        let sizeBlock = ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundMaterial': clearMaterial,
            'margin': 0.02,
        });
        let sizeTitleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Size',
            'fontSize': 0.06,
            'height': 0.15,
            'width': 0.26,
        });
        let sizeUpButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Up',
            'height': 0.15,
            'width': 0.2,
            'ontrigger': () => {
                //global.user.translateY(0.05);
                global.user.scale.multiplyScalar(1.1);
                let userScaleChangeEvent = new Event('userScaleChange');
                document.dispatchEvent(userScaleChangeEvent);
            },
        });
        let sizeDownButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Down',
            'height': 0.15,
            'width': 0.2,
            'ontrigger': () => {
                //global.user.translateY(-0.05);
                global.user.scale.multiplyScalar(1/1.1);
                let userScaleChangeEvent = new Event('userScaleChange');
                document.dispatchEvent(userScaleChangeEvent);
            },
        });
        heightBlock.add(heightUpButton);
        heightBlock.add(heightTitleBlock);
        heightBlock.add(heightDownButton);
        sizeBlock.add(sizeUpButton);
        sizeBlock.add(sizeTitleBlock);
        sizeBlock.add(sizeDownButton);
        container.add(titleBlock);
        container.add(backButton);
        container.add(heightBlock);
        container.add(sizeBlock);
        container.add(resetButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['SETTINGS'].push(container);
        this._interactables['SETTINGS'].push(resetButton);
        this._interactables['SETTINGS'].push(backButton);
        this._interactables['SETTINGS'].push(heightUpButton);
        this._interactables['SETTINGS'].push(heightDownButton);
        this._interactables['SETTINGS'].push(sizeUpButton);
        this._interactables['SETTINGS'].push(sizeDownButton);
        return container;
    }

    _createPleaseWaitUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let pleaseWaitBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Please wait while we connect you to the server',
            'height': 0.15,
            'width': 1.3,
        });
        container.add(titleBlock);
        container.add(pleaseWaitBlock);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['PLEASE_WAIT'].push(container);
        return container;
    }

    _createVROnlyUI() {
        let container = ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let comingSoonBlock = ThreeMeshUIHelper.createTextBlock({
            'text': "Sorry, VR users only for now",
            'height': 0.15,
            'width': 1.4,
        });
        let backButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Back',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
            },
        });
        container.add(titleBlock);
        container.add(comingSoonBlock);
        container.add(backButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['VR_ONLY'].push(container);
        this._interactables['VR_ONLY'].push(backButton);
        return container;
    }

    updateOpponentName() {
        let opponentName = (global.chessXR.opponentName) ? global.chessXR.opponentName : "...";
        let textComponent = this._opponentNameBlock.children[1];
        textComponent.set({
            content: 'You are playing ' + opponentName,
        });
        textComponent = this._opponentLeftBlock.children[1];
        textComponent.set({
            content: opponentName + ' has quit or lost connection',
        });
    }

    setScreen(newScreen) {
        this._pivotPoint.remove(this._screenContainers[this._screen]);
        this._pivotPoint.add(this._screenContainers[newScreen]);
        this._lastScreen = this._screen;
        this._screen = newScreen;
    }

    addToScene(parent) {
        if(this._pointers) {
            parent.add(this._pointers['LEFT']);
            parent.add(this._pointers['RIGHT']);
        } else if(this._pointer) {
            parent.add(this._pointer);
        }
        parent.add(this._pivotPoint);
    }

    update(timeDelta) {
        ThreeMeshUI.update();
        if(global.deviceType == "XR") {
            ThreeMeshUIHelper.handleXRIntersections(this._interactables[this._screen], this._pointers['LEFT'], this._pointers['RIGHT']);
        } else if(global.deviceType == "POINTER") {
            ThreeMeshUIHelper.handlePointerIntersections(this._interactables[this._screen], this._pointer);
        } else if (global.deviceType == "MOBILE") {
            ThreeMeshUIHelper.handleMobileIntersections(this._interactables[this._screen]);
        }
    }
}
