import global from '/library/scripts/core/global.js';
import * as THREE from '/library/scripts/three/build/three.module.js';

export default class TruckCashCollisions {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._audio = params['Game Over Audio'];

        this._truckAssets = [];
        this._cashObjects = [];
        this._sound = null;
        this.trucksHit = 0;
        this.bulletsUsed = 0;
        this.gameState = "INTRO";
        document.addEventListener('bulletFired', event =>
                { this._bulletFired(event) }, false );
        document.addEventListener('bulletRemoved', event =>
                { this._bulletRemoved(event) }, false );
        if(this._audio) {
            this._sound = new THREE.Audio(global.audioListener);
            let audioLoader = new THREE.AudioLoader();
            audioLoader.load(this._audio, (buffer) => {
                this._sound.setBuffer(buffer);
            });
        }
        global.truckCashCollisions = this;
    }

    _bulletFired(event) {
        if (this.gameState == "INTRO") {
            this.gameState = "PREMISE";
        } else if (this.gameState == "PREMISE") {
            this.gameState = "RULES";
        } else if(this.gameState == "RULES") {
            this.trucksHit = 0;
            this.bulletsUsed = 0;
            this.gameState = "PLAYING";
        } else if(this.gameState == "PLAYING") {
            this._cashObjects.push(event.detail.bullet);
            this.bulletsUsed++;
        } else if (this.gameState == "FAILED" && !this._sound.isPlaying) {
            this.gameState = "RULES";
        }
    }

    _bulletRemoved(event) {
        if(this.gameState == "PLAYING") {
            this._cashObjects.shift();
        }
    }

    endGame() {
        if(this._sound != null) {
            this._sound.play();
        }
        this.gameState = "FAILED";
        this._truckAssets = [];
        this._cashObjects = [];
    }

    update(timeDelta) {
        if(this.gameState == "PLAYING") {
            for(let i = 0; i < this._truckAssets.length; i++) {
                let truck = this._truckAssets[i];
                let truckPosition = new THREE.Vector3();
                truck._goalWindow.getWorldPosition(truckPosition);
                for(let j = 0; j < this._cashObjects.length; j++) {
                    let cash = this._cashObjects[j]['mesh'];
                    //cash local position is world position so no need to
                    //calculate world position
                    if(truckPosition.distanceTo(cash.position) < 1) {
                        let direction = this._cashObjects[j]['direction'].clone();
                        direction.negate();
                        let raycaster = new THREE.Raycaster(cash.position, direction, 0, this._cashObjects[j]['distanceLastTravelled']);
                        let intersections = raycaster.intersectObject(truck._goalWindow);
                        if(intersections.length > 0) {
                            truck.goalHit();
                            this._truckAssets.splice(i,1);
                            i--;
                            this.trucksHit++;
                            break;
                        }
                    }
                }
            }
        }
    }

    canUpdate() {
        return true;
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
                "name": "Game Over Audio",
                "type": "audio",
                "default": null
            },
        ];
    }
}
