import global from '/library/scripts/core/global.js';
import {
    getRadians,
    insertWrappedTextToCanvas
} from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';

export default class TruckGameScore {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._scale = (params['Scale']) ? params['Scale'] : 1;
        this._backgroundColor = (params['Background Color'])
            ? params['Background Color']
            : '#000000';
        this._textColor = (params['Text Color'])
            ? params['Text Color']
            : '#00FF00';
        this._opacity = (params['Opacity']) ? params['Opacity'] : 1;
        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];

        this._pivotPoint = new THREE.Object3D();
        this._canvas = document.createElement("canvas");
        this._texture;
        this._scoreMesh;
        this._trucksHit = 0;
        this._bulletsUsed = 0;
        this._gameState = "INTRO";

        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);

        this._createMeshes();
    }

    _createMeshes() {
        let width = 300;
        let height = 200;
        this._canvas.width = width;
        this._canvas.height = height;
        let context = this._canvas.getContext('2d');
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = this._backgroundColor;
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        context.fillStyle = this._textColor;
        context.font = '20px Arial';
        insertWrappedTextToCanvas(context, "Shoot to continue", this._canvas.width / 2, this._canvas.height * 0.5, 280, 20);
        //context.fillText("Fire Money into the red windows as the trucks pass by", this._canvas.width / 2, this._canvas.height * 0.15);

        let geometry = new THREE.PlaneBufferGeometry(3 * this._scale, 2 * this._scale);
        this._texture = new THREE.Texture(this._canvas);
        let material = new THREE.MeshBasicMaterial({
            map: this._texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this._opacity,
        });
        this._scoreMesh = new THREE.Mesh( geometry, material );
        this._pivotPoint.add(this._scoreMesh);
        this._scoreMesh.material.map.needsUpdate = true;
    }

    _updateTexture() {
        let context = this._canvas.getContext('2d');
        context.fillStyle = this._backgroundColor;
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        if(this._gameState == "PREMISE") {
            context.fillStyle = this._textColor;
            context.font = '20px Arial';
            insertWrappedTextToCanvas(context, "Help Andrew Yang stop angry truckers from getting to D.C. and wrecking havoc after losing their jobs to automation. Show them their country looks out for them by getting some UBI through their window to put their minds at ease!", this._canvas.width / 2, this._canvas.height * 0.15, 280, 20);
        } else if(this._gameState == "RULES") {
            context.fillStyle = this._textColor;
            context.font = '20px Arial';
            insertWrappedTextToCanvas(context, "Fire Money into the red windows of the moving trucks!", this._canvas.width / 2, this._canvas.height * 0.15, 280, 20);
            insertWrappedTextToCanvas(context, "Windows turn green when hit", this._canvas.width / 2, this._canvas.height * 0.5, 280, 20);
            insertWrappedTextToCanvas(context, "Game over when a Red Windowed Truck gets to the end of the field", this._canvas.width / 2, this._canvas.height * 0.7, 280, 20);
        } else if(this._gameState == "PLAYING") {
            context.fillStyle = this._textColor;
            context.font = '13px Arial';
            context.fillText("(Trucks Coming From The Right)", this._canvas.width / 2, this._canvas.height * 0.15);
            context.font = '30px Arial';
            context.fillText("Score: " + (this._trucksHit * 100), this._canvas.width / 2, this._canvas.height * 0.4);
            context.font = '20px Arial';
            context.fillText("Money Spent: $" + (this._bulletsUsed * 1000), this._canvas.width / 2, this._canvas.height * 0.7);
        } else if(this._gameState == "FAILED") {
            context.fillStyle = this._textColor;
            context.font = '30px Arial';
            context.fillText("Game Over", this._canvas.width / 2, this._canvas.height * 0.25);
            context.font = '20px Arial';
            context.fillText("Score: " + (this._trucksHit * 100), this._canvas.width / 2, this._canvas.height * 0.5);
            context.fillText("Money Spent: $" + (this._bulletsUsed * 1000), this._canvas.width / 2, this._canvas.height * 0.7);
        }
        this._texture.needsUpdate = true;
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    update(timeDelta) {
        if("truckCashCollisions" in global) {
            if(this._gameState != global.truckCashCollisions.gameState) {
                this._gameState = global.truckCashCollisions.gameState;
                this._updateTexture();
            } else if(this._trucksHit != global.truckCashCollisions.trucksHit || this._bulletsUsed != global.truckCashCollisions.bulletsUsed) {
                this._trucksHit = global.truckCashCollisions.trucksHit;
                this._bulletsUsed = global.truckCashCollisions.bulletsUsed;
                this._updateTexture();
            }
        }
    }

    canUpdate() {
        return "truckCashCollisions" in global;
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
                "name": "Scale",
                "type": "float",
                "default": 1
            },
            {
                "name": "Background Color",
                "type": "color",
                "default": "#000000"
            },
            {
                "name": "Text Color",
                "type": "color",
                "default": "#00FF00"
            },
            {
                "name": "Opacity",
                "type": "float",
                "default": 1
            },
            {
                "name": "Position",
                "type": "float",
                "default": [0,0,0]
            },
            {
                "name": "Rotation",
                "type": "float",
                "default": [0,0,0]
            },
        ];
    }

}
