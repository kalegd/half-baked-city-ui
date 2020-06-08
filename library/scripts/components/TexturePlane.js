import global from '/library/scripts/core/global.js';
import { getRadians, createLoadingLock } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';

export default class TexturePlane {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._texture = (params['Texture'])
            ? params['Texture']
            : "/library/defaults/default.png";
        this._width = (params['Width']) ? params['Width'] : 100;
        this._height = (params['Height']) ? params['Height'] : 100;
        this._tileWidth = (params['Tile Width']) ? params['Tile Width'] : 3;
        this._tileHeight = (params['Tile Height']) ? params['Tile Height'] : 3;
        this._isDoubleSided = (params['Double Sided'])
            ? params['Double Sided']
            : false;
        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];

        this._mesh;
        this._pivotPoint = new THREE.Object3D();
        this._numberOfHorizontalTiles = this._width / this._tileWidth;
        this._numberOfVerticalTiles = this._height / this._tileHeight;

        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);

        this._createMeshes();
    }

    _createMeshes() {
        let geometry = new THREE.PlaneBufferGeometry(this._width, this._height);
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            this._texture,
            (texture) => {
                let side = THREE.FrontSide;
                if(this._isDoubleSided) {
                    side = THREE.DoubleSide;
                }
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.setX(this._numberOfHorizontalTiles);
                texture.repeat.setY(this._numberOfVerticalTiles);
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: side
                });
                this._mesh = new THREE.Mesh( geometry, material );
                this._pivotPoint.add(this._mesh);
                global.loadingAssets.delete(lock);
            }
        );

    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    update(timeDelta) {
        return;
    }

    canUpdate() {
        return false;
    }

    getObject() {
        return this._pivotPoint;
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
                "name": "Texture",
                "type": "image",
                "default": "/library/defaults/default.png"
            },
            {
                "name": "Width",
                "type": "float",
                "default": 100
            },
            {
                "name": "Height",
                "type": "float",
                "default": 100
            },
            {
                "name": "Tile Width",
                "type": "float",
                "default": 3
            },
            {
                "name": "Tile Height",
                "type": "float",
                "default": 3
            },
            {
                "name": "Double Sided",
                "type": "boolean",
                "default": false
            },
            {
                "name": "Position",
                "type": "list3",
                "default": [0,0,0]
            },
            {
                "name": "Rotation",
                "type": "list3",
                "default": [0,0,0]
            },
        ];
    }
}
