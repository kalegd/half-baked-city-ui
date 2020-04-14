import * as THREE from '/scripts/three/build/three.module.js';
import { colorHexToHex } from '/scripts/core/utils.module.js';

export default class AmbientLight {
    constructor(instance) {
        this._light;
        this._pivotPoint = new THREE.Object3D();

        this._createMeshes(instance);
    }

    _createMeshes(instance) {
        this._light = new THREE.AmbientLight(
            colorHexToHex(instance['Color']),
            instance['Intensity']
        );
        this._pivotPoint.add(this._light);

    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    canUpdate() {
        return false;
    }

    static getScriptType() {
        return ScriptType.ASSET;
    }

    static getFields() {
        return [
            {
                "name": "Color",
                "type": "color",
                "default": "#ffffff"
            },
            {
                "name": "Intensity",
                "type": "float",
                "default": 1
            },
        ];
    }
}
