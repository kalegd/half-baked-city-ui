import global from '/scripts/core/global.js';
import {
    colorHexToHex,
    createLoadingLock,
    fullDispose
} from '/scripts/core/utils.module.js';

import * as THREE from '/scripts/three/build/three.module.js';

export default class Balloon {
    constructor(instance) {
        this._balloonMesh;
        this._popImage;
        this._instance = instance;
        this._pivotPoint = new THREE.Object3D();
        this._update = this.update;
        this.update = function () { return; }

        if(instance == null) {
            return;
        }

        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);
        this._audioId = instance['Pop Audio'];

        this._createMeshes(instance);
    }

    _createMeshes(instance) {
        let sphereRadius = instance['Radius'];
        let sphereWidthSegments = 16;
        let sphereHeightSegments = 16;

        let sphereGeometry = new THREE.SphereBufferGeometry(
                sphereRadius,
                sphereWidthSegments,
                sphereHeightSegments);
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: colorHexToHex(instance['Color']),
            transparent: true,
            opacity: instance['Balloon Opacity'],
            shininess: instance['Shininess'],
        });
        this._balloonMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        this._pivotPoint.add(this._balloonMesh);

        let url;
        if(instance['Pop Image']) {
            url = global.dataStore.images[instance['Pop Image']].filename;
        } else {
            url = "library/defaults/default.png";
        }
        let scope = this;
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            url,
            function(texture) {
                let geometry = new THREE.PlaneBufferGeometry(instance['Radius'] * 2, instance['Radius'] * 2);
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                });
                scope._popImage = new THREE.Mesh( geometry, material );
                scope._popImage.visible = false;
                scope._pivotPoint.add(scope._popImage);
                if("popGameController" in global) {
                    global.popGameController._balloonAssets.push(scope);
                }
                scope.update = scope._update;
                global.loadingAssets.delete(lock);
            }
        );
    }

    fromTexture(texture, instance) {
        this._audioId = instance['Pop Audio'];
        let sphereRadius = instance['Radius'];
        let sphereWidthSegments = 16;
        let sphereHeightSegments = 16;

        let sphereGeometry = new THREE.SphereBufferGeometry(
                sphereRadius,
                sphereWidthSegments,
                sphereHeightSegments);
        //TODO: Check if we should use basic material instead
        //let sphereMaterial = new THREE.MeshBasicMaterial({
        //    color: colorHexToHex(instance['Color']),
        //});
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: colorHexToHex(instance['Color']),
            transparent: true,
            opacity: instance['Balloon Opacity'],
            shininess: instance['Shininess'],
        });
        this._balloonMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        this._pivotPoint.add(this._balloonMesh);
        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);

        let geometry = new THREE.PlaneBufferGeometry(instance['Radius'] * 2, instance['Radius'] * 2);
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
        });
        this._popImage = new THREE.Mesh( geometry, material );
        this._popImage.visible = false;
        this._pivotPoint.add(this._popImage);
        if("popGameController" in global) {
            global.popGameController._balloonAssets.push(this);
        }
        this.update = this._update;
        if(this._audioId != "") {
            this._sound = new THREE.PositionalAudio(global.audioListener);
            this._pivotPoint.add(this._sound);
            let filename = global.dataStore.audios[this._audioId].filename;
            let audioLoader = new THREE.AudioLoader();
            let scope = this;
            audioLoader.load(filename,
                function( buffer ) {
                    scope._sound.setBuffer(buffer);
                    scope._sound.setRefDistance( 20 );
                    //scope._sound.autoplay = true;
                    //scope._sound.setLoop(true);
                    scope._sound.setRolloffFactor(2);
                    scope._sound.setVolume(0.5);
                    //scope._sound.play();
                }
            );
        }
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    pop() {
        if(this._sound != null) {
            this._sound.play();
        }
        this._balloonMesh.visible = false;
        this._popImage.visible = true;
        this._pivotPoint.lookAt(global.user.position);
        fullDispose(this._balloonMesh);
        let image = this._popImage;
        setTimeout(function() {
            image.visible = false;
        }, 1500);
    }

    update(timeDelta) {
        return;
    }

    canUpdate() {
        return false;
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
                "name": "Radius",
                "type": "float",
                "default": 0.5
            },
            {
                "name": "Color",
                "type": "color",
                "default": "#FF0000"
            },
            {
                "name": "Balloon Opacity",
                "type": "float",
                "default": 0.7
            },
            {
                "name": "Shininess",
                "type": "float",
                "default": 100
            },
            {
                "name": "Pop Image",
                "type": "image",
                "default": ""
            },
            {
                "name": "Pop Audio",
                "type": "audio",
                "default": ""
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
        ];
    }

}
