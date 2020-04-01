class TruckCashCollisions {
    constructor(instance) {
        if(TruckCashCollisions.instance == null) {
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
            TruckCashCollisions.instance = this;
        }
        if(instance != null && instance['Game Over Audio'] != "") {
            TruckCashCollisions.instance._sound = new THREE.Audio(global.audioListener);
            let filename = dataStore.audios[instance['Game Over Audio']].filename;
            let audioLoader = new THREE.AudioLoader();
            audioLoader.load(filename,
                function( buffer ) {
                    TruckCashCollisions.instance._sound.setBuffer(buffer);
                }
            );
        }
        return TruckCashCollisions.instance;
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

    static getScriptType() {
        return ScriptType.POST_SCRIPT;
    }

    static getFields() {
        return [
            {
                "name": "Game Over Audio",
                "type": "audio",
                "default": ""
            },
        ];
    }
}

global.truckCashCollisions = new TruckCashCollisions();
