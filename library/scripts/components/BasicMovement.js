import global from '/library/scripts/core/global.js';
import * as THREE from '/library/scripts/three/build/three.module.js';

export default class BasicMovement {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._vector = new THREE.Vector3();//For any vector calculations
        this._velocity = new THREE.Vector3();
        this._movementHand = "LEFT";
        this._movementSpeed = (params['Movement Speed (m/s)'])
            ? params['Movement Speed (m/s)']
            : 4;
        global.basicMovement = this;
    }

    setMovementHand(hand) {
        this._movementHand = hand;
    }
    _moveForward(distance) {
        // move forward parallel to the xz-plane
        // assumes camera.up is y-up
        this._vector.setFromMatrixColumn(global.camera.matrixWorld, 0);
        this._vector.crossVectors(global.user.up, this._vector);
        global.user.position.addScaledVector(this._vector, distance);
    };

    _moveRight(distance) {
        this._vector.setFromMatrixColumn(global.camera.matrixWorld, 0);
        this._vector.y = 0;
        global.user.position.addScaledVector(this._vector, distance);
    };

    update(timeDelta) {
        if(global.deviceType == "XR") {
            this._updatePositionVR(timeDelta);
        } else if(global.deviceType == "POINTER") {
            this._updatePosition(timeDelta);
        }
    }

    _updatePosition(timeDelta) {
        // Decrease the velocity.
        this._velocity.x -= this._velocity.x * 10.0 * timeDelta;
        this._velocity.z -= this._velocity.z * 10.0 * timeDelta;

        if(global.sessionActive) {
            let movingDistance = 10.0 * this._movementSpeed * timeDelta;
            if (global.inputHandler.isKeyPressed("ArrowUp") || global.inputHandler.isKeyPressed("KeyW")) {
                this._velocity.z += movingDistance;
            }
            if (global.inputHandler.isKeyPressed("ArrowDown") || global.inputHandler.isKeyPressed("KeyS")) {
                this._velocity.z -= movingDistance;
            }
            if (global.inputHandler.isKeyPressed("ArrowLeft") || global.inputHandler.isKeyPressed("KeyA")) {
                this._velocity.x -= movingDistance;
            }
            if (global.inputHandler.isKeyPressed("ArrowRight") || global.inputHandler.isKeyPressed("KeyD")) {
                this._velocity.x += movingDistance;
            }
        }

        if(this._velocity.length() > this._movementSpeed) {
            this._velocity.normalize().multiplyScalar(this._movementSpeed);
        }
        this._moveRight(this._velocity.x * timeDelta);
        this._moveForward(this._velocity.z * timeDelta);
    }

    _updatePositionVR(timeDelta) {
        //These two lines below add decceleration to the mix
        //this._velocity.x -= this._velocity.x * 10.0 * timeDelta;
        //this._velocity.z -= this._velocity.z * 10.0 * timeDelta;
        this._velocity.x = 0;
        this._velocity.z = 0;
        let gamepad = global.inputHandler.getXRGamepad(this._movementHand);
        if(gamepad != null) {
            let axes = gamepad.axes;
            let movingDistance = 10.0 * this._movementSpeed * timeDelta;
            this._velocity.z = -1 * movingDistance * axes[3];//Forward/Backward
            this._velocity.x = movingDistance * axes[2];//Left/Right
            this._velocity.normalize().multiplyScalar(this._movementSpeed);
        }
        this._moveRight(this._velocity.x * timeDelta);
        this._moveForward(this._velocity.z * timeDelta);
    }

    canUpdate() {
        return true;
    }

    static isDeviceTypeSupported(deviceType) {
        return (deviceType == "XR" || deviceType == "POINTER");
    }

    static getScriptType() {
        return 'PRE_SCRIPT';
    }

    static getFields() {
        return [
            {
                "name": "Movement Speed (m/s)",
                "type": "float",
                "default": 4
            },
        ];
    }
}

