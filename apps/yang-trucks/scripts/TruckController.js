import global from '/library/scripts/core/global.js';
import { getRadians } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from '/library/scripts/three/examples/jsm/utils/SkeletonUtils.js';

export default class TruckController {
    constructor(instance) {
        this._gltfScene;
        this._goalWindow;
        this._pivotPoint = new THREE.Object3D();
        this._boundingBox = new THREE.Box3;
        this._assetId;
        this._audioId;
        this._sound;
        this.distanceTravelled = 0;
        this.hasBeenHit = false;
        this._update = this.update;
        this.update = function () { return; }

        if(instance == null) {
            return;
        }

        this._assetId = instance['Truck Model'];
        this._audioId = instance['Audio'];
        this._scale = instance['Scale'];
        this._speed = instance['Speed (m/s)'];

        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);
        this._pivotPoint.rotateY(getRadians(instance['Initial Y Rotation']));
        this._pivotPoint.scale.set(this._scale, this._scale, this._scale);

        this._createMeshes();
    }

    _createMeshes() {
        let filename = "library/defaults/default.glb";
        if(this._assetId != "") {
            filename = global.dataStore.assets[this._assetId].filename;
        }
        let scope = this;
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(filename,
            function (gltf) {
                scope._gltfScene = gltf.scene;
                scope._pivotPoint.add(scope._gltfScene);
                let geometry = new THREE.PlaneBufferGeometry( 1.25, 1.3 );
                let material = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    side: THREE.DoubleSide,
                    opacity: 0.3,
                    transparent: true,
                });
                scope._goalWindow = new THREE.Mesh( geometry, material );
                scope._goalWindow.position.setX(1.55);
                scope._goalWindow.position.setY(2.8);
                scope._goalWindow.position.setZ(.4);
                scope._goalWindow.rotateY(Math.PI / 2.1);
                scope._goalWindow.rotateX(-0.1);
                scope._pivotPoint.add(scope._goalWindow);
                if("truckCashCollisions" in global) {
                    global.truckCashCollisions._truckAssets.push(scope);
                }
                scope.update = scope._update;
                if(scope._audioId != "") {
                    scope._sound = new THREE.PositionalAudio(global.audioListener);
                    scope._pivotPoint.add(scope._sound);
                    filename = global.dataStore.audios[scope._audioId].filename;
                    let audioLoader = new THREE.AudioLoader();
                    audioLoader.load(filename,
                        function( buffer ) {
                            scope._sound.setBuffer(buffer);
                            scope._sound.setRefDistance( 20 );
                            scope._sound.autoplay = true;
                            scope._sound.setLoop(true);
                            scope._sound.setRolloffFactor(2);
                            scope._sound.setVolume(0.5);
                            scope._sound.play();
                        }
                    );
                }
            }
        );
    }

    fromModel(model, instance) {
        this._assetId = instance['Truck Model'];
        this._audio = instance['Audio'];
        this._scale = instance['Scale'];
        this._speed = instance['Speed (m/s)'];
        this._pivotPoint.position.fromArray(instance['Position']);
        this._pivotPoint.rotation.fromArray(instance['Rotation']);
        this._pivotPoint.scale.set(this._scale, this._scale, this._scale);
        this._pivotPoint.add(SkeletonUtils.clone(model));
        let geometry = new THREE.PlaneBufferGeometry( 1.25, 1.3 );
        let material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            opacity: 0.3,
            transparent: true,
        });
        this._goalWindow = new THREE.Mesh( geometry, material );
        this._goalWindow.position.setX(1.55);
        this._goalWindow.position.setY(2.8);
        this._goalWindow.position.setZ(.4);
        this._goalWindow.rotateY(Math.PI / 2.1);
        this._goalWindow.rotateX(-0.1);
        this._pivotPoint.add(this._goalWindow);
        if("truckCashCollisions" in global) {
            global.truckCashCollisions._truckAssets.push(this);
        }
        this.update = this._update;
        if(this._audio) {
            this._sound = new THREE.PositionalAudio(global.audioListener);
            this._pivotPoint.add(this._sound);
            let audioLoader = new THREE.AudioLoader();
            let scope = this;
            audioLoader.load(this._audio,
                function( buffer ) {
                    scope._sound.setBuffer(buffer);
                    scope._sound.setRefDistance( 20 );
                    scope._sound.autoplay = true;
                    scope._sound.setLoop(true);
                    scope._sound.setRolloffFactor(2);
                    scope._sound.setVolume(0.5);
                    scope._sound.play();
                }
            );
        }
    }

    addToScene(scene) {
        this._scene = scene;
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        this._sound.stop();
    }

    goalHit() {
        this._goalWindow.material.color.setHex(0x00ff00);
        this.hasBeenHit = true;
    }

    update(timeDelta) {
        let distance = timeDelta * this._speed;
        this._pivotPoint.translateZ(distance);
        this.distanceTravelled += distance;
    }

    canUpdate() {
        return this._speed != 0;
    }

    static isDeviceTypeSupported(deviceType) {
        return true;
    }

    static getScriptType() {
        return 'ASSET';
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
                "name": "Speed (m/s)",
                "type": "float",
                "default": 5
            },
            {
                "name": "Scale",
                "type": "float",
                "default": 1
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
