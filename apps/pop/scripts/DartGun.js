import global from '/library/scripts/core/global.js';
import { createLoadingLock } from '/library/scripts/core/utils.module.js';

import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from '/library/scripts/three/examples/jsm/utils/SkeletonUtils.js';

export default class DartGun {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._gunModel = (params['Gun Model'])
            ? params['Gun Model']
            : "/library/defaults/default.glb";
        this._gunScale = (params['Gun Scale'])
            ? params['Gun Scale']
            : 1;
        this._dartModel = (params['Dart Model'])
            ? params['Dart Model']
            : "/library/defaults/default.glb";
        this._dartScale = (params['Dart Scale'])
            ? params['Dart Scale']
            : 1;
        this._dartMinimumSpeed = (params['Dart Minimum Speed (m/s)'])
            ? params['Dart Minimum Speed (m/s)']
            : 5;
        this._dartMaximumSpeed = (params['Dart Maximum Speed (m/s)'])
            ? params['Dart Maximum Speed (m/s)']
            : 10;
        this._dartOscillationSpeed = (params['Dart Oscillation Speed (m/s)'])
            ? params['Dart Oscillation Speed (m/s)']
            : 2;
        this._dartLifeSpan = (params['Dart Life Span (seconds)'])
            ? params['Dart Life Span (seconds)']
            : 5;
        this._gravity = (params['Gravity (m/s^2)'])
            ? params['Gravity (m/s^2)']
            : [0,-9.8,0];
        this._gravityV3 = new THREE.Vector3().fromArray(this._gravity);
        this._pivotPoint = new THREE.Object3D();
        this._darts = [];
        this._triggerPressed = false;
        this._scene;
        this._gunScene;
        this._dartScene;
        this._curveLine;
        this._gettingFaster = true;
        this._nextDartDisabled = false;
        this._nextDartSpeed = this._dartMinimumSpeed;
        this._shootingHand = "RIGHT";
        this._update = this.update;
        this.update = this._preUpdate;

        if(global.deviceType == "XR") {
            global.inputHandler.getXRController("RIGHT", "targetRay")
                .add(this._pivotPoint);
        } else {
            global.camera.add(this._pivotPoint);
        }

        this._createMeshes();
    }

    _createMeshes() {
        let scope = this;
        const gltfLoader = new GLTFLoader();
        let lock1 = createLoadingLock();
        let lock2 = createLoadingLock();
        gltfLoader.load(this._gunModel,
            function (gltf) {
                scope._animations = gltf.animations;
                scope._gunScene = gltf.scene;
                scope._gunScene.scale.set(scope._gunScale, scope._gunScale,
                    scope._gunScale);
                scope._pivotPoint.add(scope._gunScene);
                if(global.deviceType != "XR") {
                    scope._gunScene.position.setX(0.2);
                    scope._gunScene.position.setZ(-0.1);
                }
                global.loadingAssets.delete(lock1);
            }
        );
        gltfLoader.load(this._dartModel,
            function (gltf) {
                scope._animations = gltf.animations;
                scope._dartScene = gltf.scene;
                scope._dartScene.scale.set(scope._dartScale, scope._dartScale,
                    scope._dartScale);
                global.loadingAssets.delete(lock2);
            }
        );
        let curve = new THREE.SplineCurve( [
            new THREE.Vector2( 0, 0 ),
            new THREE.Vector2( 0.625, 0.47 ),
            new THREE.Vector2( 1.25, 0.63 ),
            new THREE.Vector2( 1.875, 0.49 ),
            new THREE.Vector2( 2.5, 0 )
        ] );
        let points = curve.getPoints( 200 );
        let curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
        let curveMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        this._curveLine = new THREE.Line( curveGeometry, curveMaterial );
        this._curveLine.frustumCulled = false;
        this._curveLine.visible = false;
    }

    _createDart() {
        let dart = SkeletonUtils.clone(this._dartScene);
        let direction = new THREE.Vector3();

        this._gunScene.getWorldDirection(direction);
        direction.normalize();
        direction.negate();
        let worldPosition = new THREE.Vector3();
        this._gunScene.getWorldPosition(worldPosition);
        dart.position.copy(worldPosition);

        this._scene.add(dart);
        let dartWrapper = { "direction": direction, "velocity": direction.clone().multiplyScalar(this._nextDartSpeed), "mesh": dart, "timeExisted": 0, "distanceLastTravelled": 0 };
        this._darts.push(dartWrapper);
        this._dartFiredEvent = new CustomEvent(
            "dartFired",
            {
                "detail": {
                    "message": "A Dart has been added to the scene",
                    "dart": dartWrapper,
                },
                "bubbles": false,
                "cancelable": true,
            });
        document.dispatchEvent(this._dartFiredEvent)
    }

    _pressTrigger() {
        this._triggerPressed = true;
        if("popGameController" in global) {
            if(global.popGameController.dartsDisabled) {
                this._nextDartDisabled = true;
            } else {
                this._curveLine.visible = true;
            }
        }
    }

    _releaseTrigger() {
        if(this._nextDartDisabled) {
            this._nextDartDisabled = false;
        } else {
            this._createDart();
        }
        this._triggerPressed = false;
        this._nextDartSpeed = this._dartMinimumSpeed;
        this._curveLine.visible = false;
    }

    addToScene(scene) {
        this._scene = scene;
        this._scene.add(this._curveLine);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        for(let dart in this._darts) {
            dart['mesh'].parent.remove(dart);
            fullDispose(dart['mesh']);
        }
        fullDispose(this._pivotPoint);
        fullDispose(this._gunScene);
        fullDispose(this._dartScene);
    }

    _removeFirstDartFromScene() {
        let dart = this._darts[0];
        dart['mesh'].parent.remove(dart['mesh']);
        this._darts.shift();
        let dartRemovedEvent = new CustomEvent(
            "dartRemoved",
            {
                "detail": {
                    "message": "A Dart has been removed from the scene",
                    "dart": dart,
                },
                "bubbles": false,
                "cancelable": true,
            });
        document.dispatchEvent(dartRemovedEvent)
    }

    _isTriggerInputPressed() {
        if(global.deviceType == "XR") {
            let gamepad = global.inputHandler.getXRGamepad(this._shootingHand);
            return gamepad != null && gamepad.buttons[0].pressed;
        } else if(global.deviceType == "POINTER") {
            return global.inputHandler.isKeyPressed("Space");
        } else if(global.deviceType == "MOBILE") {
            return global.inputHandler.isScreenTouched();
        }
    }

    _updateCurve() {
        let startingPoint = new THREE.Vector3();
        let forward = new THREE.Vector3(0,0,-1);
        this._gunScene.getWorldPosition(startingPoint);
        this._gunScene.localToWorld(forward);
        //Get angle of gun relative to horizontal
        forward.sub(startingPoint);
        let angle = 0;
        if(forward.x == 0 && forward.z == 0) {
            angle = Math.PI/2;
        } else {
            let horizontal = new THREE.Vector3(forward.x, 0, forward.z);
            angle = horizontal.angleTo(forward);
            let temp = new THREE.Vector3(1, 0, 0);
            let curveRotationAngle = temp.angleTo(horizontal);
            if(horizontal.z > 0) {
                curveRotationAngle = -curveRotationAngle;
            }
            this._curveLine.rotation.set(0, curveRotationAngle, 0);
        }
        if(forward.y < 0) {
            angle = -angle;
        }
        //Figure out curve based on that angle
        let initialSpeedX = Math.cos(angle) * this._nextDartSpeed;
        let initialSpeedY = Math.sin(angle) * this._nextDartSpeed;
        let localPoints = [new THREE.Vector2(0, 0)];
        let lifeSpan = 0.5;
        if(global.popGameController.mode == "NORMAL") {
            lifeSpan = this._dartLifeSpan;
        }
        for(let i = 1; i <= 10; i++) {
            let time = lifeSpan * i / 10;
            localPoints.push(new THREE.Vector2(time * initialSpeedX, time * initialSpeedY + (0.5 * this._gravity[1] * time * time)));
        }
        let curve = new THREE.SplineCurve(localPoints);
        let points = curve.getPoints(200);
        this._curveLine.geometry.setFromPoints(points);
        this._curveLine.position.copy(startingPoint);
    }

    _changeHands(newHand) {
        if(global.deviceType == "XR") {
            if(newHand == "RIGHT") {
                global.inputHandler.getXRController("RIGHT", "targetRay")
                    .add(this._pivotPoint);
            } else if(newHand == "LEFT") {
                global.inputHandler.getXRController("LEFT", "targetRay")
                    .add(this._pivotPoint);
            }
        } else {
            if(newHand == "RIGHT") {
                this._gunScene.position.setX(0.2);
            } else if(newHand == "LEFT") {
                this._gunScene.position.setX(-0.2);
            }
        }
        this._shootingHand = newHand;
    }

    _preUpdate(timeDelta) {
        if(this._gunScene != null && this._dartScene != null) {
            this.update = this._update;
        }
    }

    update(timeDelta) {
        if(global.sessionActive) {
            if(global.popGameController.shootingHand != this._shootingHand) {
                this._changeHands(global.popGameController.shootingHand);
            }
            let triggerInputPressed = this._isTriggerInputPressed();
            if(!this._triggerPressed) {
                if(triggerInputPressed) {
                    this._pressTrigger();
                }
            } else if(!triggerInputPressed) {
                this._releaseTrigger();
            }
            if(this._triggerPressed) {
                if(this._gettingFaster) {
                    this._nextDartSpeed = this._nextDartSpeed + (timeDelta * this._dartOscillationSpeed);
                    if(this._nextDartSpeed > this._dartMaximumSpeed) {
                        this._nextDartSpeed = this._dartMaximumSpeed;
                        this._gettingFaster = false;
                    }
                } else {
                    this._nextDartSpeed = this._nextDartSpeed - (timeDelta * this._dartOscillationSpeed);
                    if(this._nextDartSpeed < this._dartMinimumSpeed) {
                        this._nextDartSpeed = this._dartMinimumSpeed;
                        this._gettingFaster = true;
                    }
                }
                if(!this._nextDartDisabled) {
                    this._updateCurve();
                }
            }
        }
        for(let i in this._darts) {
            let dart = this._darts[i];
            dart['velocity'].addScaledVector(this._gravityV3, timeDelta);
            let distance = dart['velocity'].length * timeDelta;
            dart['mesh'].position.addScaledVector(dart['velocity'], timeDelta);
            dart['mesh'].lookAt(dart['mesh'].position.clone().add(dart['velocity']));
            dart['timeExisted'] = dart['timeExisted'] + timeDelta;
            dart['distanceLastTravelled'] = distance;
        }
        if(this._darts.length > 0 && this._darts[0]['timeExisted'] > this._dartLifeSpan) {
            this._removeFirstDartFromScene();
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
                "name": "Gun Model",
                "type": "glb",
                "default": "/library/defaults/default.glb"
            },
            {
                "name": "Gun Scale",
                "type": "float",
                "default": 1
            },
            {
                "name": "Dart Model",
                "type": "glb",
                "default": "/library/defaults/default.glb"
            },
            {
                "name": "Dart Scale",
                "type": "float",
                "default": 1
            },
            {
                "name": "Dart Minimum Speed (m/s)",
                "type": "float",
                "default": 5
            },
            {
                "name": "Dart Maximum Speed (m/s)",
                "type": "float",
                "default": 10
            },
            {
                "name": "Dart Oscillation Speed (m/s)",
                "type": "float",
                "default": 2
            },
            {
                "name": "Dart Life Span (seconds)",
                "type": "float",
                "default": 5
            },
            {
                "name": "Gravity (m/s^2)",
                "type": "list3",
                "default": [0,-9.8,0]
            },
        ];
    }

}
