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
        this._isDisabled = true;
        this._screen = 'MAIN';
        this._lastScreen = 'MAIN';
        this._screenContainers = {};
        this._interactables = {
            'GET_AN_AVATAR': [],
            'MAIN': [],
            'GAME_TYPE': [],
            'AI_DIFFICULTY': [],
            'WAIT_FOR_RANDOM': [],
            'WAIT_FOR_RESPONSE': [],
            'PLAYING_PHYSICS': [],
            'PLAYING_STRICT': [],
            'PLAYING_AI': [],
            'DRAW_OFFERED': [],
            'GAME_OVER': [],
            'HOST_OR_JOIN': [],
            'OPPONENT_LEFT': [],
            'SETTINGS': [],
            'PLEASE_WAIT': [],
            'VR_ONLY': [],
            'PAWN_PROMOTION': [],
        };

        this._pivotPoint.scale.set(this._scale, this._scale, this._scale);
        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);

        this._configureMenuToggle();
        this._createMaterials();
        this._createUIs();
        global.chessXR.registerUI(this);
    }

    _configureMenuToggle() {
        if(global.deviceType == "XR") {
            return;
        }
        let div = document.createElement('div');
        let button = document.createElement('button');
        button.innerText = "TOGGLE MENU";
        div.appendChild(button);
        div.style.position = 'absolute';
        div.style.bottom = '20px';
        div.style.width = '100%';
        div.style.textAlign = 'center';
        button.style.padding = '12px';
        button.style.border = '1px solid #fff';
        button.style.borderRadius = '4px';
        button.style.background = 'rgba(0,0,0,0.1)';
        button.style.color = '#fff';
        button.style.font = 'normal 13px sans-serif';
        button.style.opacity = '0.5';
        button.style.outline = 'none';
        button.onmouseenter = () => { button.style.opacity = '1.0'; };
        button.onmouseleave = () => { button.style.opacity = '0.5'; };
        button.addEventListener('click', () => {
            if(this._pivotPoint.parent) {
                this.removeFromScene();
            } else {
                this.addToScene(global.scene);
            }
        });
        document.body.appendChild(div);
    }

    _createMaterials() {
        this._backgroundColor = new THREE.Color(0x000000);
        this._backgroundOpacity = 0.9;
    }

    _createUIs() {
        if(global.deviceType == 'XR') {
            this._pointers = ThreeMeshUIHelper.createXRPointers();
        } else if(global.deviceType == 'POINTER') {
            //this._pointer = ThreeMeshUIHelper.createPointer();
        }
        this._screenContainers['GET_AN_AVATAR'] = this._createGetAnAvatarUI();
        this._screenContainers['MAIN'] = this._createMainUI();
        this._screenContainers['GAME_TYPE'] = this._createGameTypeUI();
        this._screenContainers['AI_DIFFICULTY'] = this._createAIDifficultyUI();
        this._screenContainers['WAIT_FOR_RANDOM'] = this._createWaitForRandomUI();
        this._screenContainers['WAIT_FOR_RESPONSE'] = this._createWaitForResponseUI();
        this._screenContainers['PLAYING_PHYSICS'] = this._createPlayingPhysicsUI();
        this._screenContainers['PLAYING_STRICT'] = this._createPlayingStrictUI();
        this._screenContainers['PLAYING_AI'] = this._createPlayingAIUI();
        this._screenContainers['DRAW_OFFERED'] = this._createDrawOfferedUI();
        this._screenContainers['GAME_OVER'] = this._createGameOverUI();
        this._screenContainers['HOST_OR_JOIN'] = this._createHostOrJoinUI();
        this._screenContainers['OPPONENT_LEFT'] = this._createOpponentLeftUI();
        this._screenContainers['SETTINGS'] = this._createSettingsUI();
        this._screenContainers['PLEASE_WAIT'] = this._createPleaseWaitUI();
        this._screenContainers['VR_ONLY'] = this._createVROnlyUI();
        this._screenContainers['PAWN_PROMOTION'] = this._createPawnPromotionUI();
        if(global.chessXR.avatarURL == '/images/potato-logo.png') {
            this._screen = 'GET_AN_AVATAR';
            this._lastScreen = 'GET_AN_AVATAR';
            this._pivotPoint.add(this._screenContainers['GET_AN_AVATAR']);
        } else {
            this._pivotPoint.add(this._screenContainers['MAIN']);
        }
    }

    _createGetAnAvatarUI() {
        global.temp = ThreeMeshUI;
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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
            'width': 1.25,
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
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let textBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let randomMatchButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Play Random User',
            'ontrigger': () => {
                this.setScreen('GAME_TYPE');
            },
        });
        let aiMatchButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Play Computer',
            'ontrigger': () => {
                this.setScreen('AI_DIFFICULTY');
            },
        });
        //let roomButton = ThreeMeshUIHelper.createButtonBlock({
        //    'text': 'Host/Join Game',
        //    'ontrigger': () => {
        //        this.setScreen('HOST_OR_JOIN');
        //    },
        //});
        let settingsButton;
        if(global.deviceType == 'XR') {
            settingsButton = ThreeMeshUIHelper.createButtonBlock({
                'text': 'Settings',
                'ontrigger': () => {
                    this.setScreen('SETTINGS');
                },
            });
        }
        container.add(textBlock);
        container.add(randomMatchButton);
        container.add(aiMatchButton);
        //container.add(roomButton);
        if(global.deviceType == 'XR') {
            container.add(settingsButton);
            this._interactables['MAIN'].push(settingsButton);
        }
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['MAIN'].push(container);
        this._interactables['MAIN'].push(randomMatchButton);
        this._interactables['MAIN'].push(aiMatchButton);
        //this._interactables['MAIN'].push(roomButton);
        return container;
    }

    _createGameTypeUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let textBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let physicsMatchButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Free For All Physics',
            'ontrigger': () => {
                if(global.deviceType == "XR") {
                    this.setScreen('PLEASE_WAIT');
                    global.chessXR.playRandomOpponent();
                } else {
                    this.setScreen('VR_ONLY');
                }
            },
        });
        let backButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Back',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
            },
        });
        let strictMatchButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Strict Game\n(Rules Enforced)',
            'ontrigger': () => {
                global.chessXR.toggleStrict(true);
                this.setScreen('PLEASE_WAIT');
                global.chessXR.playRandomOpponent();
            },
        });
        container.add(textBlock);
        container.add(physicsMatchButton);
        container.add(strictMatchButton);
        container.add(backButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['GAME_TYPE'].push(container);
        this._interactables['GAME_TYPE'].push(physicsMatchButton);
        this._interactables['GAME_TYPE'].push(strictMatchButton);
        this._interactables['GAME_TYPE'].push(backButton);
        return container;
    }

    _createAIDifficultyUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let rowBlock = new ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'margin': 0.02,
        });
        let easyButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Easy',
            'width': 0.3,
            'ontrigger': () => {
                global.chessXR.playAI('EASY');
                global.chessXR.toggleStrict(true);
            },
        });
        let mediumButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Medium',
            'width': 0.3,
            'ontrigger': () => {
                global.chessXR.playAI('MEDIUM');
                global.chessXR.toggleStrict(true);
            },
        });
        let hardButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Hard',
            'width': 0.3,
            'ontrigger': () => {
                global.chessXR.playAI('HARD');
                global.chessXR.toggleStrict(true);
            },
        });
        let backButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Back',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
            },
        });
        rowBlock.add(easyButton);
        rowBlock.add(mediumButton);
        rowBlock.add(hardButton);
        container.add(titleBlock);
        container.add(rowBlock);
        container.add(backButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['AI_DIFFICULTY'].push(container);
        this._interactables['AI_DIFFICULTY'].push(easyButton);
        this._interactables['AI_DIFFICULTY'].push(mediumButton);
        this._interactables['AI_DIFFICULTY'].push(hardButton);
        this._interactables['AI_DIFFICULTY'].push(backButton);
        return container;
    }

    _createWaitForRandomUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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

    _createPlayingPhysicsUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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
        this._interactables['PLAYING_PHYSICS'].push(container);
        this._interactables['PLAYING_PHYSICS'].push(settingsButton);
        this._interactables['PLAYING_PHYSICS'].push(quitButton);
        return container;
    }

    _createPlayingStrictUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let opponentName = (global.chessXR.opponentName) ? global.chessXR.opponentName : "...";
        this._opponentNameBlockStrict = ThreeMeshUIHelper.createTextBlock({
            'text': 'You are playing ' + opponentName,
            'height': 0.15,
            'width': 1.2,
        });
        let rowBlock = new ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'margin': 0.02,
        });
        let forfeitButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Forfeit',
            'width': 0.33,
            'ontrigger': () => {
                global.chessXR.forfeit();
            },
        });
        this._drawButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Offer Draw',
            'width': 0.33,
            'ontrigger': () => {
                global.chessXR.offerDraw();
            },
        });
        let settingsButton
        if(global.deviceType == "XR") {
            settingsButton = ThreeMeshUIHelper.createButtonBlock({
                'text': 'Settings',
                'ontrigger': () => {
                    this.setScreen('SETTINGS');
                },
            });
        }
        let quitButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Quit',
            'ontrigger': () => {
                this.setScreen('MAIN');
                global.chessXR.quitGame();
            },
        });
        rowBlock.add(forfeitButton);
        rowBlock.add(this._drawButton);
        container.add(titleBlock);
        container.add(this._opponentNameBlockStrict);
        container.add(rowBlock);
        if(global.deviceType == "XR") {
            container.add(settingsButton);
            this._interactables['PLAYING_STRICT'].push(settingsButton);
        }
        container.add(quitButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['PLAYING_STRICT'].push(container);
        this._interactables['PLAYING_STRICT'].push(forfeitButton);
        this._interactables['PLAYING_STRICT'].push(this._drawButton);
        this._interactables['PLAYING_STRICT'].push(quitButton);
        return container;
    }

    _createPlayingAIUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let opponentNameBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'You are playing the Computer',
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
        container.add(opponentNameBlock);
        container.add(settingsButton);
        container.add(quitButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['PLAYING_AI'].push(container);
        this._interactables['PLAYING_AI'].push(settingsButton);
        this._interactables['PLAYING_AI'].push(quitButton);
        return container;
    }

    _createDrawOfferedUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let drawOfferedBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Draw Offered',
            'height': 0.15,
            'width': 1.2,
        });
        let acceptButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Accept',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
                global.chessXR.offerDraw();
            },
        });
        let ignoreButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Ignore',
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
            },
        });
        container.add(titleBlock);
        container.add(drawOfferedBlock);
        container.add(acceptButton);
        container.add(ignoreButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['DRAW_OFFERED'].push(container);
        this._interactables['DRAW_OFFERED'].push(acceptButton);
        this._interactables['DRAW_OFFERED'].push(ignoreButton);
        return container;
    }

    _createGameOverUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let opponentName = (global.chessXR.opponentName) ? global.chessXR.opponentName : "...";
        this._gameOverDescription = ThreeMeshUIHelper.createTextBlock({
            'text': 'Game ended with ' + opponentName,
            'height': 0.15,
            'width': 1.2,
        });
        let playAgainButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Play Again',
            'ontrigger': () => {
                if(global.chessXR.isPlayingAI) {
                    global.chessXR.startAIGame();
                } else {
                    this.setScreen('WAIT_FOR_RESPONSE');
                    global.chessXR.requestToPlayAgain();
                }
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
        container.add(this._gameOverDescription);
        container.add(playAgainButton);
        container.add(quitButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['GAME_OVER'].push(container);
        this._interactables['GAME_OVER'].push(playAgainButton);
        this._interactables['GAME_OVER'].push(quitButton);
        return container;
    }

    _createWaitForResponseUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let pleaseWaitBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Please wait for a response',
            'height': 0.15,
            'width': 1.2,
        });
        let quitButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Quit',
            'ontrigger': () => {
                this.setScreen('MAIN');
                global.chessXR.quitGame();
            },
        });
        container.add(titleBlock);
        container.add(pleaseWaitBlock);
        container.add(quitButton);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['WAIT_FOR_RESPONSE'].push(container);
        this._interactables['WAIT_FOR_RESPONSE'].push(quitButton);
        return container;
    }

    _createHostOrJoinUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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
                global.chessXR.toggleStrict(false);
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
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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
        let heightBlock = new ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
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
        let sizeBlock = new ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
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
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
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
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let comingSoonBlock = ThreeMeshUIHelper.createTextBlock({
            'text': "Sorry, VR users only for this mode",
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

    _createPawnPromotionUI() {
        let container = new ThreeMeshUI.Block({
            height: 1,
            width: 1.5,
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Chess XR',
            'fontSize': 0.08,
            'height': 0.2,
            'width': 0.5,
        });
        let comingSoonBlock = ThreeMeshUIHelper.createTextBlock({
            'text': "Select Promotion",
            'height': 0.15,
            'width': 1.4,
        });
        let row1Block = new ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'margin': 0.02,
        });
        let row2Block = new ThreeMeshUI.Block({
            'height': 0.15,
            'width': 0.7,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'margin': 0.02,
        });
        let queenButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Queen',
            'width': 0.3,
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
                this._promotionCallback('q');
                this.removeFromScene();
            },
        });
        let knightButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Knight',
            'width': 0.3,
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
                this._promotionCallback('n');
                this.removeFromScene();
            },
        });
        let rookButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Rook',
            'width': 0.3,
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
                this._promotionCallback('r');
                this.removeFromScene();
            },
        });
        let bishopButton = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Bishop',
            'width': 0.3,
            'ontrigger': () => {
                this.setScreen(this._lastScreen);
                this._promotionCallback('b');
                this.removeFromScene();
            },
        });
        row1Block.add(queenButton);
        row1Block.add(knightButton);
        row2Block.add(rookButton);
        row2Block.add(bishopButton);
        container.add(titleBlock);
        container.add(comingSoonBlock);
        container.add(row1Block);
        container.add(row2Block);
        container.set({ fontFamily: this._fontFamily, fontTexture: this._fontTexture });
        this._interactables['PAWN_PROMOTION'].push(container);
        this._interactables['PAWN_PROMOTION'].push(queenButton);
        this._interactables['PAWN_PROMOTION'].push(knightButton);
        this._interactables['PAWN_PROMOTION'].push(rookButton);
        this._interactables['PAWN_PROMOTION'].push(bishopButton);
        return container;
    }

    updateOpponentName() {
        let opponentName = (global.chessXR.opponentName) ? global.chessXR.opponentName : "...";
        let textComponent = this._opponentNameBlock.children[1];
        textComponent.set({
            content: 'You are playing ' + opponentName,
        });
        textComponent = this._opponentNameBlockStrict.children[1];
        textComponent.set({
            content: 'You are playing ' + opponentName,
        });
        textComponent = this._opponentLeftBlock.children[1];
        textComponent.set({
            content: opponentName + ' has quit or lost connection',
        });
    }

    offerPromotion(promotionCallback) {
        this._promotionCallback = promotionCallback;
        this.setScreen("PAWN_PROMOTION");
    }

    strictGameOver(type, isWin) {
        let textComponent = this._gameOverDescription.children[1];
        if(type == 'CHECKMATE') {
            let opponentName = (global.chessXR.isPlayingAI)
                ? "Computer"
                : (global.chessXR.opponentName)
                    ? global.chessXR.opponentName
                    : "...";
            if(isWin) {
                textComponent.set({content: 'You checkmated ' + opponentName});
            } else {
                textComponent.set({
                    content: 'You were checkmated by ' + opponentName
                });
            }
        } else if (type == 'STALEMATE') {
            textComponent.set({content: 'Stalemate'});
        } else if (type == "DRAW") {
            textComponent.set({content: 'Match Ended in a Draw'});
        } else if (type == "MY_FORFEIT") {
            textComponent.set({content: 'You have forfeited the match'});
        } else if (type == "PEER_FORFEIT") {
            let opponentName = (global.chessXR.opponentName)
                ? global.chessXR.opponentName
                : "...";
            textComponent.set({content: opponentName + ' has forfeited'});
        }
    }

    toggleDrawButton(canClaim) {
        let textComponent = this._drawButton.children[1];
        if(canClaim) {
            textComponent.set({content: 'Claim Draw'});
            this._drawButton.ontrigger = () => {
                global.chessXR.claimDraw();
            };
        } else {
            textComponent.set({content: 'Offer Draw'});
            this._drawButton.ontrigger = () => {
                global.chessXR.offerDraw();
            };
        }
        
    }

    flipDisplay() {
        this._pivotPoint.rotation.y *= -1;
        this._pivotPoint.rotation.z *= -1;
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
        this._isDisabled = false;
    }

    removeFromScene() {
        if(this._pointers) {
            if(this._pointers['LEFT'].parent) {
                this._pointers['LEFT'].parent.remove(this._pointers['LEFT']);
                this._pointers['RIGHT'].parent.remove(this._pointers['RIGHT']);
            }
        } else if(this._pointer) {
            if(this._pointer.parent) {
                this._pointer.parent.remove(this._pointer);
            }
        }
        if(this._pivotPoint.parent) {
            this._pivotPoint.parent.remove(this._pivotPoint);
        }
        this._isDisabled = true;
    }

    update(timeDelta) {
        if(this._isDisabled) {
            return;
        }
        ThreeMeshUI.update();
        if(global.deviceType == "XR") {
            ThreeMeshUIHelper.handleXRIntersections(this._interactables[this._screen], this._pointers['LEFT'], this._pointers['RIGHT']);
        } else if(global.deviceType == "POINTER") {
            //ThreeMeshUIHelper.handlePointerIntersections(this._interactables[this._screen], this._pointer);
            ThreeMeshUIHelper.handlePointerIntersections(this._interactables[this._screen]);
        } else if (global.deviceType == "MOBILE") {
            ThreeMeshUIHelper.handleMobileIntersections(this._interactables[this._screen]);
        }
    }
}
