class BasicControls {
    constructor(instance) {
        if(BasicControls.instance == null) {
            BasicControls.instance = this;
            this._velocity = new THREE.Vector3();
            this._moveForward = false;
            this._moveBackward = false;
            this._moveLeft = false;
            this._moveRight = false;
            this._movementJoystickHand = "LEFT";
            this._update = this.update;
            this.update = function () { return; }
            //this._rotationSpeed = 0;
            document.addEventListener('pointerlockchange', event =>
                { this._pointerLockChanged() }, false );
            document.addEventListener('mozpointerlockchange', event =>
                { this._pointerLockChanged() }, false );
            document.addEventListener('webkitpointerlockchange', event =>
                { this._pointerLockChanged() }, false );
            document.addEventListener('keydown', event =>
                { this._onKeyDown(event) }, false );
            document.addEventListener('keyup', event =>
                { this._onKeyUp(event) }, false );
            document.getElementById("mobile-start-button").addEventListener('touchend', _ =>
                { this._startMobileSession() }, false );
        }
        if(instance != null) {
            BasicControls.instance._instance = instance;
            if(global.deviceType != "MOBILE") {
                BasicControls.instance._movementSpeed = instance['Movement Speed'];
                BasicControls.instance._invertedPitch = instance['Invert Camera Y Axis Controls'];
                BasicControls.instance._controls = new THREE.PointerLockControls(
                    global.user,
                    global.camera,
                    BasicControls.instance._invertedPitch
                );
                BasicControls.instance.update = BasicControls.instance._update;
            }
        }
        return BasicControls.instance;
    }

    _startMobileSession() {
        this._controls = new THREE.DeviceOrientationControls(global.camera);
        this.update = this._update;
    }

    _pointerLockChanged() {
        if (document.pointerLockElement === document.body ||
                document.mozPointerLockElement === document.body ||
                document.webkitPointerLockElement === document.body) {
            this._controls.enabled = true;
        } else {
            this._controls.enabled = false;
            this._moveForward = false;
            this._moveBackward = false;
            this._moveLeft = false;
            this._moveRight = false;
        }
    }

    _onKeyDown(event){
        event = event || window.event;
        var keycode = event.keyCode;
        if(keycode == 37 || keycode == 65) { //left arrow
            this._moveLeft = true;
        } else if(keycode == 38 || keycode == 87) { //up arrow
            this._moveForward = true;
        } else if(keycode == 39 || keycode == 68) { //right arrow
            this._moveRight = true;
        } else if(keycode == 40 || keycode == 83) { //down arrow
            this._moveBackward = true;
        }
    }
    _onKeyUp(event){
        event = event || window.event;
        var keycode = event.keyCode;
        if(keycode == 37 || keycode == 65) { //left arrow
            this._moveLeft = false;
        } else if(keycode == 38 || keycode == 87) { //up arrow
            this._moveForward = false;
        } else if(keycode == 39 || keycode == 68) { //right arrow
            this._moveRight = false;
        } else if(keycode == 40 || keycode == 83) { //down arrow
            this._moveBackward = false;
        }
    }

    update(timeDelta) {
        if(global.deviceType == "XR") {
            this._updatePositionVR(timeDelta);
        } else if(this._controls != null && this._controls.enabled) {
            if(global.deviceType == "NORMAL") {
                this._updatePosition(timeDelta);
            } else {//MOBILE
                this._controls.update();
            }
        }
    }

    _updatePosition(timeDelta) {
        // Decrease the velocity.
        this._velocity.x -= this._velocity.x * 10.0 * timeDelta;
        this._velocity.z -= this._velocity.z * 10.0 * timeDelta;

        let movingDistance = 10.0 * this._movementSpeed * timeDelta;
        if (this._moveForward) {
            this._velocity.z += movingDistance;
        }
        if (this._moveBackward) {
            this._velocity.z -= movingDistance;
        }
        if (this._moveLeft) {
            this._velocity.x -= movingDistance;
        }
        if (this._moveRight) {
            this._velocity.x += movingDistance;
        }

        if(this._velocity.length() > this._movementSpeed) {
            this._velocity.normalize().multiplyScalar(this._movementSpeed);
        }
        this._controls.moveRight(this._velocity.x * timeDelta);
        this._controls.moveForward(this._velocity.z * timeDelta);

        //// Check bounds so we don't walk through the boundary
        //if (this._user.position.z > this._playAreaLength / 2)
        //  this._user.position.z = this._playAreaLength / 2;
        //if (this._user.position.z < -1 * this._playAreaLength / 2)
        //  this._user.position.z = -1 * this._playAreaLength / 2;

        //if (this._user.position.x > this._playAreaWidth / 2)
        //  this._user.position.x = this._playAreaWidth / 2;
        //if (this._user.position.x < -1 * this._playAreaWidth / 2)
        //  this._user.position.x = -1 * this._playAreaWidth / 2;

        //Move this into a separate POST SCRIPT
        //let intersection = getTerrainIntersection(this._user, global.terrainAssets);
        //if(intersection != null) {
        //    this._user.position.y = intersection.point.y;
        //}
    }

    _updatePositionVR(timeDelta) {
        this._velocity.x -= this._velocity.x * 10.0 * timeDelta;
        this._velocity.z -= this._velocity.z * 10.0 * timeDelta;
        //this._rotationSpeed -= this._rotationSpeed * 10 * timeDelta;
        let inputSource = global.leftInputSource;
        if(this.movementJoystickHand == "RIGHT") {
            inputSource = global.rightInputSource;
        }
        if(inputSource != null) {
            let axes = inputSource.gamepad.axes;
            let movingDistance = 10.0 * this._movementSpeed * timeDelta;
            this._velocity.z -= movingDistance * axes[3];//Forward/Backward
            this._velocity.x += movingDistance * axes[2];//Left/Right
            if(this._velocity.length() > this._movementSpeed) {
                this._velocity.normalize().multiplyScalar(this._movementSpeed);
            }
        }
        this._controls.moveRight(this._velocity.x * timeDelta);
        this._controls.moveForward(this._velocity.z * timeDelta);
        //this._controls.rotateOnY(this._rotationSpeed);
    }

    canUpdate() {
        return true;
    }

    static getScriptType() {
        return ScriptType.PRE_SCRIPT;
    }

    static getFields() {
        return [
            {
                "name": "Movement Speed",
                "type": "float",
                "default": 2.5
            },
            {
                "name": "Invert Camera Y Axis Controls",
                "type": "boolean",
                "default": true
            },
        ];
    }
}

global.basicControls = new BasicControls();
