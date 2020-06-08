import global from '/library/scripts/core/global.js';
import {
    createLoadingLock,
    fullDispose
} from '/library/scripts/core/utils.module.js';

import * as THREE from '/library/scripts/three/build/three.module.js';

export default class Balloon {
    constructor(params) {
        this._balloonMesh;
        this._popImage;
        this._pivotPoint = new THREE.Object3D();
        this._update = this.update;
        this.update = function () { return; }

        if(params == null) {
            return;
        }

        this._radius = (params['Radius']) ? params['Radius'] : 0.5;
        this._color = (params['Color']) ? params['Color'] : 0xFF0000;
        this._opacity = (params['Balloon Opacity'])
            ? params['Balloon Opacity']
            : 0.7;
        this._shininess = (params['Shininess']) ? params['Shininess'] : 100;
        this._image = (params['Pop Image'])
            ? params['Pop Image']
            : '/library/defaults/default.png';
        this._audio = params['Pop Audio'];
        this._position = (params['Position']) ? params['Position'] : [0,0,0];

        this._pivotPoint.position.fromArray(this._position);

        this._createMeshes();
    }

    _createMeshes() {
        let sphereRadius = this._radius;
        let sphereWidthSegments = 16;
        let sphereHeightSegments = 16;

        let sphereGeometry = new THREE.SphereBufferGeometry(
                sphereRadius,
                sphereWidthSegments,
                sphereHeightSegments);
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: colorHexToHex(this._color),
            transparent: true,
            opacity: this._opacity,
            shininess: this._shininess,
        });
        this._balloonMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        this._pivotPoint.add(this._balloonMesh);

        let scope = this;
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            this._image,
            function(texture) {
                let geometry = new THREE.PlaneBufferGeometry(this._radius * 2, this._radius * 2);
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

    fromTexture(texture, params) {
        this._audio = params['Pop Audio'];
        let sphereRadius = params['Radius'];
        let sphereWidthSegments = 16;
        let sphereHeightSegments = 16;

        let sphereGeometry = new THREE.SphereBufferGeometry(
                sphereRadius,
                sphereWidthSegments,
                sphereHeightSegments);
        //TODO: Check if we should use basic material instead
        //let sphereMaterial = new THREE.MeshBasicMaterial({
        //    color: colorHexToHex(params['Color']),
        //});
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: params['Color'],
            transparent: true,
            opacity: params['Balloon Opacity'],
            shininess: params['Shininess'],
        });
        this._balloonMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        this._pivotPoint.add(this._balloonMesh);

        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._pivotPoint.position.fromArray(this._position);

        let geometry = new THREE.PlaneBufferGeometry(this._radius * 2, this._radius * 2);
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
        if(this._audio) {
            this._sound = new THREE.PositionalAudio(global.audioListener);
            this._pivotPoint.add(this._sound);
            let audioLoader = new THREE.AudioLoader();
            audioLoader.load(this._audio,
                (buffer) => {
                    this._sound.setBuffer(buffer);
                    this._sound.setRefDistance( 20 );
                    //this._sound.autoplay = true;
                    //this._sound.setLoop(true);
                    this._sound.setRolloffFactor(2);
                    this._sound.setVolume(0.5);
                    //this._sound.play();
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
                "default": 0xFF0000
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
                "default": "/library/defaults/default.png"
            },
            {
                "name": "Pop Audio",
                "type": "audio",
                "default": null
            },
            {
                "name": "Position",
                "type": "list3",
                "default": [0,0,0]
            },
        ];
    }

}
