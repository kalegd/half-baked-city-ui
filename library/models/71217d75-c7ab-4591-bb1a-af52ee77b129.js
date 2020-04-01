class TruckSpawner {
    constructor(instance) {
        this._scene;
        this._gltfScene;
        this._instance = instance;
        this._trucks = [];
        this._timeSinceLastSpawn = 0;
        this._totalTime = 0;
        this._timeToSpawn = this._instance['Max Time To Spawn'];
        this._update = this.update;
        this.update = this.preUpdate;

        this._TruckController;
        if(instance['Truck Controller'] != "") {
            let scope = this;
            try {
                this._TruckController = eval(dataStore.assets[instance['Truck Controller']]['class']);
                this._createMeshes();
            } catch (e) {
                let dependencies = [dataStore.assets[instance['Truck Controller']].filename];
                loadScripts(dependencies, function() {
                    scope._TruckController = eval(dataStore.assets[instance['Truck Controller']]['class']);
                    scope._createMeshes();
                });
            }
        }
    }

    _createMeshes() {
        let filename = "library/defaults/default.glb";
        if(this._instance['Truck Model'] != "") {
            filename = dataStore.assets[this._instance['Truck Model']].filename;
        }
        let scope = this;
        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load(filename,
            function (gltf) {
                scope._gltfScene = gltf.scene;
            }
        );
    }

    _addNewAsset(lane) {
        let instance = {
            "Audio": this._instance['Audio'],
            "Speed (m/s)": 5 + (lane * 3),
            "Scale": 1,
            "Initial X Position": this._instance['Initial X Position'],
            "Initial Y Position": this._instance['Initial Y Position'],
            "Initial Z Position": this._instance['Initial Z Position'] + (lane * 6),
            "Initial Y Rotation": this._instance['Initial Y Rotation'],
        }
        let truck = new this._TruckController();
        truck.fromModel(this._gltfScene, instance);
        truck.addToScene(this._scene);
        this._trucks.push(truck);
    }

    _reset() {
        for(let i = 0; i < this._trucks.length; i++) {
            this._trucks[i].removeFromScene();
        }
        this._trucks = [];
        this._timeSinceLastSpawn = 0;
        this._totalTime = 0;
        this._timeToSpawn = this._instance['Max Time To Spawn'];
        this._addNewAsset(0);
    }

    addToScene(scene) {
        this._scene = scene;
    }

    removeFromScene() {
        for(let i = 0; i < this._trucks.length; i++) {
            this._trucks[i].removeFromScene();
        }
        fullDispose(this._gltfScene);
    }

    preUpdate() {
        if(this._gltfScene != null && this._scene != null) {
            this._addNewAsset(0);
            this.update = this._update;
        }
    }

    update(timeDelta) {
        if(!("truckCashCollisions" in global) || global.truckCashCollisions.gameState == "PLAYING") {
            this._timeSinceLastSpawn += timeDelta;
            this._totalTime += timeDelta;
            if(this._timeSinceLastSpawn > this._timeToSpawn) {
                if(this._timeToSpawn > this._instance['Min Time To Spawn']) {
                    this._timeToSpawn = 5 - (this._totalTime / 15);
                }
                let lane = getRandomFloat(0, 1);
                if(lane < 0.5) {
                    this._addNewAsset(0);
                } else if(lane < 0.8) {
                    this._addNewAsset(1);
                } else {
                    this._addNewAsset(2);
                }
                this._timeSinceLastSpawn = 0;
            }
            for(let i = 0; i < this._trucks.length; i++) {
                this._trucks[i].update(timeDelta);
                if(this._trucks[i].distanceTravelled > 200) {
                    if(!this._trucks[i].hasBeenHit && "truckCashCollisions" in global) {
                        global.truckCashCollisions.endGame();
                        this._reset();
                        break;
                    }
                    this._trucks[i].removeFromScene();
                    this._trucks.splice(i,1);
                    i++;
                }
            }
        }
    }

    canUpdate() {
        return this._instance['Truck Controller'] != "";
    }

    static getScriptType() {
        return ScriptType.ASSET;
    }

    static getFields() {
        return [
            {
                "name": "Truck Model",
                "type": "glb",
                "default": "" //Uses default asset
            },
            {
                "name": "Truck Controller",
                "type": "js",
                "default": ""
            },
            {
                "name": "Audio",
                "type": "audio",
                "default": "" //Uses default asset
            },
            {
                "name": "Max Time To Spawn",
                "type": "float",
                "default": 5
            },
            {
                "name": "Min Time To Spawn",
                "type": "float",
                "default": 2.5
            },
            {
                "name": "Initial X Position",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Y Position",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Z Position",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Y Rotation",
                "type": "float",
                "default": 0
            },
        ];
    }

}
