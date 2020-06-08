import TruckController from './TruckController.js';

import global from '/library/scripts/core/global.js';
import { getRandomFloat } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';

export default class TruckSpawner {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._model = (params['Truck Model'])
            ? params['Truck Model']
            : "/library/defaults/default.glb";
        this._audio = params['Audio'];
        this._maxSpawnTime = (params['Max Time To Spawn'])
            ? params['Max Time To Spawn']
            : 5;
        this._minSpawnTime = (params['Min Time To Spawn'])
            ? params['Min Time To Spawn']
            : 2.5;
        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];

        this._scene;
        this._gltfScene;
        this._trucks = [];
        this._timeSinceLastSpawn = 0;
        this._totalTime = 0;
        this._timeToSpawn = this._maxSpawnTime;
        this._update = this.update;
        this.update = this.preUpdate;

        this._createMeshes();
    }

    _createMeshes() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(this._model, (gltf) => {this._gltfScene = gltf.scene;});
    }

    _addNewAsset(lane) {
        let position = [
            this._position[0],
            this._position[1],
            this._position[2] + (lane * 6)
        ];
        let instance = {
            "Audio": this._audio,
            "Speed (m/s)": 5 + (lane * 3),
            "Scale": 1,
            "Position": position,
            "Rotation": this._rotation,
        };
        let truck = new TruckController();
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
        this._timeToSpawn = this._maxSpawnTime;
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
                if(this._timeToSpawn > this._minSpawnTime) {
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
        return true;
    }

    static isDeviceTypeSupported(deviceType) {
        return true;
    }

    static getScriptType() {
        return ScriptType.ASSET;
    }

    static getFields() {
        return [
            {
                "name": "Truck Model",
                "type": "glb",
                "default": "/library/defaults/default.glb"
            },
            {
                "name": "Audio",
                "type": "audio",
                "default": null
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
                "name": "Position",
                "type": "vector3",
                "default": [0,0,0]
            },
            {
                "name": "Rotation",
                "type": "vector3",
                "default": [0,0,0]
            },
        ];
    }

}
