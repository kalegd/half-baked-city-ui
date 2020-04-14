import global from '/scripts/core/global.js';
import {
    getRadians,
    insertWrappedTextToCanvas
} from '/scripts/core/utils.module.js';
import * as THREE from '/scripts/three/build/three.module.js';

export default class TruckGameScore {
    constructor(instance) {
        this._instance = instance;
        this._pivotPoint = new THREE.Object3D();
        this._canvas = document.createElement("canvas");
        this._texture;
        this._scoreMesh;
        this._trucksHit = 0;
        this._bulletsUsed = 0;
        this._gameState = "INTRO";

        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);

        this._pivotPoint.rotation.set(getRadians(instance['Initial X Rotation']), getRadians(instance['Initial Y Rotation']), getRadians(instance['Initial Z Rotation']));

        this._createMeshes(instance);
    }

    _createMeshes(instance) {
        let width = 300;
        let height = 200;
        this._canvas.width = width;
        this._canvas.height = height;
        let context = this._canvas.getContext('2d');
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = this._instance['Background Color'];
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        context.fillStyle = this._instance['Text Color'];
        context.font = '20px Arial';
        insertWrappedTextToCanvas(context, "Shoot to continue", this._canvas.width / 2, this._canvas.height * 0.5, 280, 20);
        //context.fillText("Fire Money into the red windows as the trucks pass by", this._canvas.width / 2, this._canvas.height * 0.15);

        let geometry = new THREE.PlaneBufferGeometry(3 * this._instance['Scale'], 2 * this._instance['Scale']);
        this._texture = new THREE.Texture(this._canvas);
        let material = new THREE.MeshBasicMaterial({
            map: this._texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this._instance['Opacity'],
        });
        this._scoreMesh = new THREE.Mesh( geometry, material );
        this._pivotPoint.add(this._scoreMesh);
        this._scoreMesh.material.map.needsUpdate = true;
    }

    _updateTexture() {
        let context = this._canvas.getContext('2d');
        context.fillStyle = this._instance['Background Color'];
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        if(this._gameState == "PREMISE") {
            context.fillStyle = this._instance['Text Color'];
            context.font = '20px Arial';
            insertWrappedTextToCanvas(context, "Help Andrew Yang stop angry truckers from getting to D.C. and wrecking havoc after losing their jobs to automation. Show them their country looks out for them by getting some UBI through their window to put their minds at ease!", this._canvas.width / 2, this._canvas.height * 0.15, 280, 20);
        } else if(this._gameState == "RULES") {
            context.fillStyle = this._instance['Text Color'];
            context.font = '20px Arial';
            insertWrappedTextToCanvas(context, "Fire Money into the red windows of the moving trucks!", this._canvas.width / 2, this._canvas.height * 0.15, 280, 20);
            insertWrappedTextToCanvas(context, "Windows turn green when hit", this._canvas.width / 2, this._canvas.height * 0.5, 280, 20);
            insertWrappedTextToCanvas(context, "Game over when a Red Windowed Truck gets to the end of the field", this._canvas.width / 2, this._canvas.height * 0.7, 280, 20);
        } else if(this._gameState == "PLAYING") {
            context.fillStyle = this._instance['Text Color'];
            context.font = '13px Arial';
            context.fillText("(Trucks Coming From The Right)", this._canvas.width / 2, this._canvas.height * 0.15);
            context.font = '30px Arial';
            context.fillText("Score: " + (this._trucksHit * 100), this._canvas.width / 2, this._canvas.height * 0.4);
            context.font = '20px Arial';
            context.fillText("Money Spent: $" + (this._bulletsUsed * 1000), this._canvas.width / 2, this._canvas.height * 0.7);
        } else if(this._gameState == "FAILED") {
            context.fillStyle = this._instance['Text Color'];
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
                "name": "Initial X Rotation",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Y Rotation",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Z Rotation",
                "type": "float",
                "default": 0
            },
        ];
    }

}
