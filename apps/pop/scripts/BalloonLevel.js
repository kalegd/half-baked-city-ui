import BalloonController from './BalloonController.js';
import global from '/library/scripts/core/global.js';
import {
    colorHexToHex,
    getRandomColor,
    createLoadingLock
} from '/library/scripts/core/utils.module.js';

import * as THREE from '/library/scripts/three/build/three.module.js';

export default class BalloonLevel {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._radius = (params['Radius']) ? params['Radius'] : 0.5;
        this._opacity = (params['Balloon Opacity'])
            ? params['Balloon Opacity']
            : 0.7;
        this._shininess = (params['Shininess']) ? params['Shininess'] : 100;
        this._image = (params['Pop Image'])
            ? params['Pop Image']
            : '/library/defaults/default.png';
        this._audio = params['Pop Audio'];

        this._scene;
        this._popTexture;
        this._balloons = [];
        this._update = this.update;
        this.update = this.preUpdate;

        this._BalloonController;
        if("popGameController" in global) {
            global.popGameController.registerBalloonLevelController(this);
        }
        this._createMeshes();
    }

    _createMeshes() {
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            this._image,
            (texture) => {
                this._popTexture = texture;
                global.loadingAssets.delete(lock);
            }
        );
    }

    _addNewAsset(params) {
        let instance = {
            "Radius": this._radius,
            "Color": colorHexToHex(getRandomColor()),
            "Balloon Opacity": this._opacity,
            "Shininess": this._shininess,
            "Pop Image": this._image,
            "Pop Audio": this._audio,
            "Position": [params['x'], params['y'], params['z']],
        };
        let balloon = new BalloonController();
        balloon.fromTexture(this._popTexture, instance);
        balloon.addToScene(this._scene);
        this._balloons.push(balloon);
    }

    addToScene(scene) {
        this._scene = scene;
    }

    removeFromScene() {
        for(let i = 0; i < this._balloons.length; i++) {
            this._balloons[i].removeFromScene();
        }
        this._popTexture.dispose();
    }

    startLevel(level) {
        for(let i = 0; i < this._balloons.length; i++) {
            this._balloons[i].removeFromScene();
        }
        this._balloons = [];
        for(let i = 0; i < level.coordinates.length; i++) {
            this._addNewAsset(level.coordinates[i]);
        }

    }

    preUpdate() {
        if(this._popTexture != null && this._scene != null) {
            this.update = this._update;
        }
    }

    update(timeDelta) {
        //TODO: Stuffs... Maybe...? Maybe Not?
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
        ];
    }

}
