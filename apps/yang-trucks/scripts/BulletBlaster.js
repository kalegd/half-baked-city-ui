import global from '/library/scripts/core/global.js';
import { createLoadingLock } from '/library/scripts/core/utils.module.js';

import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from '/library/scripts/three/examples/jsm/utils/SkeletonUtils.js';

export default class BulletBlaster {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._blasterModel = (params['Blaster Model'])
            ? params['Blaster Model']
            : "/library/defaults/default.glb";
        this._blasterScale = (params['Blaster Scale'])
            ? params['Blaster Scale']
            : 1;
        this._bulletModel = (params['Bullet Model'])
            ? params['Bullet Model']
            : "/library/defaults/default.glb";
        this._bulletScale = (params['Bullet Scale'])
            ? params['Bullet Scale']
            : 1;
        this._bulletSpeed = (params['Bullet Speed (m/s)'])
            ? params['Bullet Speed (m/s)']
            : 0.5;
        this._bulletLifeSpan = (params['Bullet Life Span (seconds)'])
            ? params['Bullet Life Span (seconds)']
            : 5;
        this._autoFireEnabled = (params['Auto Fire'])
            ? params['Auto Fire']
            : false;
        this._autoFireRate = (params['Auto Fire Rate (bullets/second)'])
            ? params['Auto Fire Rate (bullets/second)']
            : 2;

        this._pivotPoint = new THREE.Object3D();
        this._bullets = [];
        this._triggerPressed = false;
        this._timeSinceLastBullet = 0;
        this._scene;
        this._blasterScene;
        this._bulletScene;
        this._update = this.update;
        this.update = this._preUpdate;

        if(global.deviceType == "XR") {
            global.inputHandler.getXRController("RIGHT", "pointer")
                .add(this._pivotPoint);
        } else {
            global.camera.add(this._pivotPoint);
        }

        this._createMeshes();
    }

    _createMeshes() {
        const gltfLoader = new GLTFLoader();
        let lock1 = createLoadingLock();
        let lock2 = createLoadingLock();
        gltfLoader.load(this._blasterModel, (gltf) => {
            this._animations = gltf.animations;
            this._blasterScene = gltf.scene;
            this._blasterScene.scale.set(this._blasterScale, this._blasterScale, this._blasterScale);
            this._pivotPoint.add(this._blasterScene);
            if(global.deviceType != "XR") {
                this._blasterScene.position.setX(0.2);
            }
            global.loadingAssets.delete(lock1);
        });
        gltfLoader.load(this._bulletModel, (gltf) => {
            this._animations = gltf.animations;
            this._bulletScene = gltf.scene;
            this._bulletScene.scale.set(this._bulletScale, this._bulletScale, this._bulletScale);
            global.loadingAssets.delete(lock2);
        });
    }

    _createBullet() {
        let bullet = SkeletonUtils.clone(this._bulletScene);
        let direction = new THREE.Vector3();

        this._blasterScene.getWorldDirection(direction);
        direction.normalize();
        direction.negate();
        let worldPosition = new THREE.Vector3();
        this._blasterScene.getWorldPosition(worldPosition);
        bullet.position.copy(worldPosition);

        let quaternion = new THREE.Quaternion();
        this._blasterScene.getWorldQuaternion(quaternion);
        bullet.setRotationFromQuaternion(quaternion);

        this._scene.add(bullet);
        let bulletWrapper = { "direction": direction, "mesh": bullet, "timeExisted": 0, "distanceLastTravelled": 0 };
        this._bullets.push(bulletWrapper);
        this._bulletFiredEvent = new CustomEvent(
            "bulletFired",
            {
                "detail": {
                    "message": "A Bullet has been added to the scene",
                    "bullet": bulletWrapper,
                },
                "bubbles": false,
                "cancelable": true,
            });
        document.dispatchEvent(this._bulletFiredEvent);
    }

    _pressTrigger() {
        this._triggerPressed = true;
        this._createBullet();
        this._timeSinceLastBullet = 0;
    }

    _releaseTrigger() {
        this._triggerPressed = false;
    }

    addToScene(scene) {
        this._scene = scene;
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        for(let bullet in this._bullets) {
            bullet['mesh'].parent.remove(bullet);
            fullDispose(bullet['mesh']);
        }
        fullDispose(this._pivotPoint);
        fullDispose(this._blasterScene);
        fullDispose(this._bulletScene);
    }

    _removeFirstBulletFromScene() {
        let bullet = this._bullets[0];
        bullet['mesh'].parent.remove(bullet['mesh']);
        this._bullets.shift();
        let bulletRemovedEvent = new CustomEvent(
            "bulletRemoved",
            {
                "detail": {
                    "message": "A Bullet has been removed from the scene",
                    "bullet": bullet,
                },
                "bubbles": false,
                "cancelable": true,
            });
        document.dispatchEvent(bulletRemovedEvent)
    }

    _isTriggerInputPressed() {
        if(global.deviceType == "XR") {
            let gamepad = global.inputHandler.getXRGamepad("RIGHT");
            return gamepad != null && gamepad.buttons[0].pressed;
        } else if(global.deviceType == "POINTER") {
            return global.inputHandler.isKeyPressed("Space");
        } else if(global.deviceType == "MOBILE") {
            return global.inputHandler.isScreenTouched();
        }
    }

    _preUpdate(timeDelta) {
        if(this._blasterScene != null && this._bulletScene != null) {
            this.update = this._update;
        }
    }

    update(timeDelta) {
        this._timeSinceLastBullet += timeDelta;
        if(global.sessionActive) {
            let triggerInputPressed = this._isTriggerInputPressed();
            if(!this._triggerPressed) {
                if(triggerInputPressed) {
                    this._pressTrigger();
                }
            } else if(!triggerInputPressed) {
                this._releaseTrigger();
            }
            if(this._autoFireEnabled && this._triggerPressed) {
                if(this._timeSinceLastBullet > (1 / this._autoFireRate)) {
                    this._pressTrigger();
                }
            }
        }
        let distance = this._bulletSpeed * timeDelta;
        for(let i in this._bullets) {
            let bullet = this._bullets[i];
            bullet['mesh'].position.addScaledVector(bullet['direction'], distance);
            bullet['timeExisted'] = bullet['timeExisted'] + timeDelta;
            bullet['distanceLastTravelled'] = distance;
        }
        if(this._bullets.length > 0 && this._bullets[0]['timeExisted'] > this._bulletLifeSpan) {
            this._removeFirstBulletFromScene();
        }
    }

    canUpdate() {
        return true;
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
                "name": "Blaster Model",
                "type": "glb",
                "default": "/library/defaults/default.glb",
            },
            {
                "name": "Blaster Scale",
                "type": "float",
                "default": 1
            },
            {
                "name": "Bullet Model",
                "type": "glb",
                "default": "/library/defaults/default.glb",
            },
            {
                "name": "Bullet Scale",
                "type": "float",
                "default": 1
            },
            {
                "name": "Bullet Speed (m/s)",
                "type": "float",
                "default": 0.5
            },
            {
                "name": "Bullet Life Span (seconds)",
                "type": "float",
                "default": 5
            },
            {
                "name": "Auto Fire",
                "type": "boolean",
                "default": false
            },
            {
                "name": "Auto Fire Rate (bullets/second)",
                "type": "float",
                "default": 2
            },
        ];
    }

}
