import global from '/scripts/core/global.js';
import { createLoadingLock } from '/scripts/core/utils.module.js';
import * as THREE from '/scripts/three/build/three.module.js';

export default class PopGameController {
    constructor(instance) {
        this._balloonAssets = [];
        this._dartObjects = [];
        this._balloonHitRadius = null;
        this._balloonLevelController = null;
        this.dartsDisabled = false;
        this.levelSelected = 0;
        this.balloonsPopped = 0;
        this.dartsUsed = 0;
        this.goal = 0;
        this._sound = null;
        this.gameState = "SETTINGS";
        this.mode = "NORMAL";
        this.movementJoystickHand = "LEFT";
        this.shootingHand = "RIGHT";
        this.musicPlaying = true;
        document.addEventListener('dartFired', event =>
                { this._dartFired(event) }, false );
        document.addEventListener('dartRemoved', event =>
                { this._dartRemoved(event) }, false );
        this._initializeLevelData();
        this._balloonHitRadius = instance['Balloon Hit Radius'];
        this._soundVolume = instance['Default Volume'];
        if(instance['Background Music'] != "") {
            this._sound = new THREE.Audio(global.audioListener);
            let filename = global.dataStore.audios[instance['Background Music']].filename;
            let audioLoader = new THREE.AudioLoader();
            let lock = createLoadingLock();
            audioLoader.load(filename, (buffer) => {
                this._sound.setBuffer(buffer);
                this._sound.autoplay = true;
                this._sound.setLoop(true);
                this._sound.setVolume(this._soundVolume);
                this._sound.play();
                global.loadingAssets.delete(lock);
            });
        }
        global.popGameController = this;
    }

    _dartFired(event) {
        if (this.gameState == "SETTINGS") {
        } else if (this.gameState == "LEVEL_SELECT") {
            //this.gameState = "PREMISE";
        //} else if (this.gameState == "PREMISE") {
        //    this.gameState = "RULES";
        //} else if(this.gameState == "RULES") {
        //    this.balloonsHit = 0;
        //    this.dartsUsed = 0;
        //    this.gameState = "PLAYING";
        } else if(this.gameState == "PLAYING") {
            this._dartObjects.push(event.detail.dart);
            this.dartsUsed++;
        //} else if (this.gameState == "FAILED" && !this._sound.isPlaying) {
        //    this.gameState = "RULES";
        }
    }

    _dartRemoved(event) {
        //if(this.gameState == "PLAYING") {
        if(this._dartObjects.length > 0 && this._dartObjects[0] == event.detail.dart) {
            this._dartObjects.shift();
        }
        //}
    }

    _updateMedal() {
        let level = this.levelData[this.levelSelected];
        let medals = {"NONE": 0, "BRONZE": 1, "SILVER": 2, "GOLD": 3};
        let lastMedal = level.medal;
        let thisMedal = "NONE";
        if(this.dartsUsed <= level.gold) {
            thisMedal = "GOLD";
        } else if(this.dartsUsed <= level.silver) {
            thisMedal = "SILVER";
        } else if(this.dartsUsed <= level.bronze) {
            thisMedal = "BRONZE";
        }
        
        if(medals[lastMedal] <= medals[thisMedal]) {
            level.medal = thisMedal;
        }
    }

    selectLevel(index) {
        this.balloonsPopped = 0;
        this.dartsUsed = 0;
        this.goal = this.levelData[index].coordinates.length;
        this._balloonAssets = [];
        this._dartObjects = [];
        this.levelSelected = index;
        this.gameState = "PLAYING";
        if(this._balloonLevelController != null) {
            this._balloonLevelController.startLevel(this.levelData[index]);
        }
    }

    registerBalloonLevelController(controller) {
        this._balloonLevelController = controller;
    }

    changeMovementHand(newHand) {
        global.basicMovement.setMovementHand(newHand);
        this.movementJoystickHand = newHand;
    }

    changeShootingHand(newHand) {
        this.shootingHand = newHand;
    }

    toggleMusic() {
        if(this.musicPlaying) {
            this._sound.pause();
            this.musicPlaying = false;
        } else {
            this._sound.play();
            this.musicPlaying = true;
        }
    }

    update(timeDelta) {
        if(this.gameState == "PLAYING") {
            for(let i = 0; i < this._balloonAssets.length; i++) {
                let balloon = this._balloonAssets[i];
                let balloonPosition = new THREE.Vector3();
                balloon._pivotPoint.getWorldPosition(balloonPosition);
                for(let j = 0; j < this._dartObjects.length; j++) {
                    let dart = this._dartObjects[j]['mesh'];
                    let dartPosition = new THREE.Vector3();
                    dart.getWorldPosition(dartPosition);
                    if(dartPosition.distanceTo(balloonPosition) < this._balloonHitRadius) {
                        balloon.pop();
                        this.balloonsPopped++;
                        this._balloonAssets.splice(i,1);
                        i--;
                        if(this.balloonsPopped == this.goal) {
                            let scope = this;
                            setTimeout(function() {
                                scope._updateMedal();
                                if(scope.levelSelected == scope.levelData.length-1) {
                                    scope.gameState = "LEVEL_SELECT";
                                } else {
                                    scope.selectLevel(++scope.levelSelected);
                                }
                            }, 1600);
                        }
                        break;
                    }
                }
            }
        }
    }

    canUpdate() {
        return true;
    }

    _initializeLevelData() {
        this.levelData = [
            {//Level 1
                "name": "First Pop",
                "coordinates": [
                    { "x": 0, "y": 1.7, "z": -5 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 2
                "name": "Learning Curve",
                "coordinates": [
                    { "x": 0, "y": 2.5, "z": -7 },
                    { "x": 0, "y": 2.5, "z": -8.1 },
                    { "x": 0, "y": 2.4, "z": -9.2 },
                    { "x": 0, "y": 2.275, "z": -10.3 },
                    { "x": 0, "y": 2, "z": -11.4 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 3
                "name": "Sprinkle",
                "coordinates": [
                    { "x": 0, "y": 2, "z": -5 },
                    { "x": 0, "y": 1.95, "z": -6.1 },
                    { "x": 0, "y": 1.85, "z": -7.2 },
                    { "x": 0, "y": 1.675, "z": -8.3 },
                    { "x": 0, "y": 1.4, "z": -9.4 },
                    { "x": -2, "y": 3, "z": -5 },
                    { "x": -2.5, "y": 2.9, "z": -6.25 },
                    { "x": -3, "y": 2.7, "z": -7.5 },
                    { "x": -3.5, "y": 2.4, "z": -8.75 },
                    { "x": 3, "y": 4, "z": -7.5 },
                    { "x": 3.5, "y": 3.85, "z": -8.75 },
                    { "x": 4, "y": 3.65, "z": -10 },
                    { "x": 4.5, "y": 3.4, "z": -11.25 },
                    { "x": 5, "y": 3.15, "z": -12.5 },
                    { "x": 5.5, "y": 2.8, "z": -13.75 },
                    { "x": 6, "y": 2.4, "z": -15 },
                    { "x": 6.5, "y": 2.1, "z": -16.25 },
                ],
                "gold": 3,
                "silver": 4,
                "bronze": 5,
                "medal": "NONE",
            },
            {//Level 4
                "name": "4^3",
                "coordinates": [
                    { "x": -1.5, "y": 1.7, "z": -5 },
                ],
                "gold": 15,
                "silver": 16,
                "bronze": 20,
                "medal": "NONE",
            },
            {//Level 5
                "name": "Hold It",
                "coordinates": [
                    { "x": 0, "y": 2, "z": -5 },
                    { "x": 0, "y": 2, "z": -7.2 },
                    { "x": 0, "y": 2, "z": -9.4 },
                    { "x": 0, "y": 2, "z": -11.6 },
                    { "x": 0, "y": 2, "z": -13.8 },
                    { "x": 0, "y": 2, "z": -16 },
                    { "x": 0, "y": 2, "z": -18.2 },
                    { "x": 0, "y": 2, "z": -20.4 },
                    { "x": 0, "y": 2, "z": -22.6 },
                    { "x": 0, "y": 2, "z": -24.8 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 6
                "name": "Let's Go Up a Notch",
                "coordinates": [
                    { "x": 0.2, "y": 4, "z": 0 },
                    { "x": 1.2, "y": 10, "z": 0 },
                    { "x": 2.7, "y": 16, "z": 0 },
                    { "x": 4, "y": 12, "z": 0 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 7
                "name": "Higher and higher",
                "coordinates": [
                    { "x": 0, "y": 9, "z": -10 },
                    { "x": -5, "y": 14, "z": -12 },
                    { "x": 5, "y": 20, "z": -12 },
                ],
                "gold": 2,
                "silver": 3,
                "bronze": 4,
                "medal": "NONE",
            },
            {//Level 8
                "name": "Smile",
                "coordinates": [
                    { "x": 0.5, "y": 8.7, "z": -10 },
                    { "x": 1.5, "y": 8.7, "z": -10 },
                    { "x": 2.2, "y": 8.0, "z": -10 },
                    { "x": 2.9, "y": 7.3, "z": -10 },
                    { "x": 2.9, "y": 6.3, "z": -10 },
                    { "x": 2.9, "y": 5.3, "z": -10 },
                    { "x": 2.9, "y": 4.3, "z": -10 },
                    { "x": 2.2, "y": 3.6, "z": -10 },
                    { "x": 1.5, "y": 2.9, "z": -10 },
                    { "x": 0.5, "y": 2.9, "z": -10 },
                    { "x": -0.5, "y": 2.9, "z": -10 },
                    { "x": -1.5, "y": 2.9, "z": -10 },
                    { "x": -2.2, "y": 3.6, "z": -10 },
                    { "x": -2.9, "y": 4.3, "z": -10 },
                    { "x": -2.9, "y": 5.3, "z": -10 },
                    { "x": -2.9, "y": 6.3, "z": -10 },
                    { "x": -2.9, "y": 7.3, "z": -10 },
                    { "x": -2.2, "y": 8.0, "z": -10 },
                    { "x": -1.5, "y": 8.7, "z": -10 },
                    { "x": -0.5, "y": 8.7, "z": -10 },
                    //Eyes
                    { "x": -0.9, "y": 6.7, "z": -10 },
                    { "x": 0.9, "y": 6.7, "z": -10 },
                    //Mouth
                    { "x": -1.5, "y": 5.0, "z": -10 },
                    { "x": -0.5, "y": 4.7, "z": -10 },
                    { "x": 0.5, "y": 4.7, "z": -10 },
                    { "x": 1.5, "y": 5.0, "z": -10 },
                ],
                "gold": 7,
                "silver": 9,
                "bronze": 11,
                "medal": "NONE",
            },
            {//Level 9
                "name": "9^2",
                "coordinates": [
                    { "x": -1, "y": 3.7, "z": -8 },
                    { "x": -1, "y": 5.7, "z": -18 },
                    { "x": -1, "y": 3.7, "z": -28 },
                ],
                "gold": 15,
                "silver": 18,
                "bronze": 27,
                "medal": "NONE",
            },
            {//Level 10
                "name": "Remember to Take a Break Sometimes When Playing",
                "coordinates": [
                    { "x": 0, "y": 2.7, "z": -5 },
                    { "x": 0, "y": 2.7, "z": -30 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 11
                "name": "A Good Long Break",
                "coordinates": [
                    { "x": 0, "y": 4.7, "z": -5 },
                    { "x": 0, "y": 20.7, "z": -45 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 2
                "name": "Tick Tock",
                "coordinates": [
                    //1
                    { "x": 1.25, "y": 8.23, "z": -3.47 },
                    //2
                    { "x": 2.17, "y": 7.58, "z": -4.12 },
                    { "x": 2.17, "y": 8.29, "z": -4.82 },
                    //3
                    { "x": 2.50, "y": 6.70, "z": -5.00 },
                    { "x": 2.50, "y": 7.41, "z": -5.71 },
                    { "x": 2.50, "y": 8.11, "z": -6.41 },
                    //4
                    { "x": 2.17, "y": 5.82, "z": -5.88 },
                    { "x": 2.17, "y": 6.52, "z": -6.59 },
                    { "x": 2.17, "y": 7.23, "z": -7.30 },
                    { "x": 2.17, "y": 7.94, "z": -8.01 },
                    //5
                    { "x": 1.25, "y": 5.17, "z": -6.53 },
                    { "x": 1.25, "y": 5.88, "z": -7.24 },
                    { "x": 1.25, "y": 6.58, "z": -7.95 },
                    { "x": 1.25, "y": 7.29, "z": -8.65 },
                    { "x": 1.25, "y": 8.00, "z": -9.36 },
                    //6
                    { "x": 0, "y": 4.93, "z": -6.77 },
                    { "x": 0, "y": 5.64, "z": -7.47 },
                    { "x": 0, "y": 6.35, "z": -8.18 },
                    { "x": 0, "y": 7.05, "z": -8.89 },
                    { "x": 0, "y": 7.76, "z": -9.60 },
                    { "x": 0, "y": 8.47, "z": -10.30 },
                    //7
                    { "x": -1.25, "y": 5.17, "z": -6.53 },
                    { "x": -1.25, "y": 5.88, "z": -7.24 },
                    { "x": -1.25, "y": 6.58, "z": -7.95 },
                    { "x": -1.25, "y": 7.29, "z": -8.65 },
                    { "x": -1.25, "y": 8.00, "z": -9.36 },
                    { "x": -1.25, "y": 8.70, "z": -10.07 },
                    { "x": -1.25, "y": 9.41, "z": -10.77 },
                    //8
                    { "x": -2.17, "y": 5.82, "z": -5.88 },
                    { "x": -2.17, "y": 6.52, "z": -6.59 },
                    { "x": -2.17, "y": 7.23, "z": -7.30 },
                    { "x": -2.17, "y": 7.94, "z": -8.01 },
                    { "x": -2.17, "y": 8.64, "z": -8.71 },
                    { "x": -2.17, "y": 9.35, "z": -9.42 },
                    { "x": -2.17, "y": 10.06, "z": -10.13 },
                    { "x": -2.17, "y": 10.77, "z": -10.83 },
                    //9
                    { "x": -2.50, "y": 6.70, "z": -5.00 },
                    { "x": -2.50, "y": 7.41, "z": -5.71 },
                    { "x": -2.50, "y": 8.11, "z": -6.41 },
                    { "x": -2.50, "y": 8.82, "z": -7.12 },
                    { "x": -2.50, "y": 9.53, "z": -7.83 },
                    { "x": -2.50, "y": 10.24, "z": -8.54 },
                    { "x": -2.50, "y": 10.94, "z": -9.24 },
                    { "x": -2.50, "y": 11.65, "z": -9.95 },
                    { "x": -2.50, "y": 12.36, "z": -10.66 },
                    //10
                    { "x": -2.17, "y": 7.58, "z": -4.12 },
                    { "x": -2.17, "y": 8.29, "z": -4.82 },
                    { "x": -2.17, "y": 9.00, "z": -5.53 },
                    { "x": -2.17, "y": 9.71, "z": -6.24 },
                    { "x": -2.17, "y": 10.41, "z": -6.94 },
                    { "x": -2.17, "y": 11.12, "z": -7.65 },
                    { "x": -2.17, "y": 11.83, "z": -8.36 },
                    { "x": -2.17, "y": 12.53, "z": -9.07 },
                    { "x": -2.17, "y": 13.24, "z": -9.77 },
                    { "x": -2.17, "y": 13.95, "z": -10.48 },
                    //11
                    { "x": -1.25, "y": 8.23, "z": -3.47 },
                    { "x": -1.25, "y": 8.94, "z": -4.18 },
                    { "x": -1.25, "y": 9.65, "z": -4.88 },
                    { "x": -1.25, "y": 10.35, "z": -5.59 },
                    { "x": -1.25, "y": 11.06, "z": -6.30 },
                    { "x": -1.25, "y": 11.77, "z": -7.00 },
                    { "x": -1.25, "y": 12.47, "z": -7.71 },
                    { "x": -1.25, "y": 13.18, "z": -8.42 },
                    { "x": -1.25, "y": 13.89, "z": -9.13 },
                    { "x": -1.25, "y": 14.59, "z": -9.83 },
                    { "x": -1.25, "y": 15.30, "z": -10.54 },
                    //12
                    { "x": 0, "y": 8.47, "z": -3.23 },
                    { "x": 0, "y": 9.17, "z": -3.94 },
                    { "x": 0, "y": 9.88, "z": -4.65 },
                    { "x": 0, "y": 10.59, "z": -5.35 },
                    { "x": 0, "y": 11.30, "z": -6.06 },
                    { "x": 0, "y": 12.00, "z": -6.77 },
                    { "x": 0, "y": 12.71, "z": -7.47 },
                    { "x": 0, "y": 13.42, "z": -8.18 },
                    { "x": 0, "y": 14.12, "z": -8.89 },
                    { "x": 0, "y": 14.83, "z": -9.60 },
                    { "x": 0, "y": 15.54, "z": -10.30 },
                    { "x": 0, "y": 16.25, "z": -11.01 },
                ],
                "gold": 12,
                "silver": 13,
                "bronze": 14,
                "medal": "NONE",
            },
            {//Level 13
                "name": "Keep it Straight",
                "coordinates": [
                    { "x": 0.4, "y": 2, "z": -5 },
                    { "x": -0.4, "y": 2, "z": -7.2 },
                    { "x": 0.4, "y": 2, "z": -9.4 },
                    { "x": -0.4, "y": 2, "z": -11.6 },
                    { "x": 0.4, "y": 2, "z": -13.8 },
                    { "x": -0.4, "y": 2, "z": -16 },
                    { "x": 0.4, "y": 2, "z": -18.2 },
                    { "x": -0.4, "y": 2, "z": -20.4 },
                    { "x": 0.4, "y": 2, "z": -22.6 },
                    { "x": -0.4, "y": 2, "z": -24.8 },
                    { "x": 0.4, "y": 2, "z": -27 },
                    { "x": -0.4, "y": 2, "z": -29.2 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
            {//Level 14
                "name": "Level 14",
                "coordinates": [
                    { "x": -5, "y": 5, "z": 0 },
                    { "x": -20, "y": 10, "z": 0 },
                    { "x": -4.33, "y": 5, "z": -2.5 },
                    { "x": -17.32, "y": 5, "z": -10 },
                    { "x": -2.5, "y": 5, "z": -4.33 },
                    { "x": -10, "y": 15, "z": -17.32 },
                    { "x": 0, "y": 5, "z": -5 },
                    { "x": 0, "y": 15, "z": -30 },
                    { "x": 2.5, "y": 5, "z": -4.33 },
                    { "x": 10, "y": 15, "z": -17.32 },
                    { "x": 4.33, "y": 5, "z": -2.5 },
                    { "x": 17.32, "y": 5, "z": -10 },
                    { "x": 5, "y": 5, "z": 0 },
                    { "x": 20, "y": 10, "z": 0 },
                ],
                "gold": 7,
                "silver": 9,
                "bronze": 11,
                "medal": "NONE",
            },
            {//Level 15
                "name": "Last Pop",
                "coordinates": [
                    { "x": 0, "y": 1.7, "z": -30 },
                ],
                "gold": 1,
                "silver": 2,
                "bronze": 3,
                "medal": "NONE",
            },
        ];
        let fourthLevelRootCoordinate = this.levelData[3].coordinates[0];
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 4; j++) {
                for(let k = 0; k < 4; k++) {
                    this.levelData[3].coordinates.push({
                        "x": fourthLevelRootCoordinate.x + i,
                        "y": fourthLevelRootCoordinate.y + j,
                        "z": fourthLevelRootCoordinate.z - k
                    });
                }
            }
        }
        for(let l = 0; l < 3; l++) {
            let ninthLevelRootCoordinate = this.levelData[8].coordinates[l];
            for(let i = 0; i < 3; i++) {
                for(let j = 0; j < 3; j++) {
                    for(let k = 0; k < 3; k++) {
                        this.levelData[8].coordinates.push({
                            "x": ninthLevelRootCoordinate.x + i,
                            "y": ninthLevelRootCoordinate.y + j,
                            "z": ninthLevelRootCoordinate.z - k
                        });
                    }
                }
            }
        }
    }

    static isDeviceTypeSupported(deviceType) {
        return true;
    }

    static getScriptType() {
        return 'POST_SCRIPT';
    }

    static getFields() {
        return [
            {
                "name": "Balloon Hit Radius",
                "type": "float",
                "default": 0.51
            },
            {
                "name": "Background Music",
                "type": "audio",
                "default": ""
            },
            {
                "name": "Default Volume",
                "type": "float",
                "default": 0.25
            },
        ];
    }
}
