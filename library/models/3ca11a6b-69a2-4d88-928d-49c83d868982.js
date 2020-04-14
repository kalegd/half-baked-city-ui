import global from '/scripts/core/global.js';
import {
    getRadians,
    insertWrappedTextToCanvas
} from '/scripts/core/utils.module.js';
import * as THREE from '/scripts/three/build/three.module.js';

export default class PopGameMenu {
    constructor(instance) {
        this._instance = instance;
        this._pivotPoint = new THREE.Object3D();
        this._pointerPoint = new THREE.Object3D();
        if(global.deviceType == "XR") {
            global.inputHandler.getXRController("RIGHT", "pointer")
                .add(this._pointerPoint);
        } else {
            this._pointerPoint.position.setX(0.2);
            global.camera.add(this._pointerPoint);
        }
        this._lineMesh;
        this._canvas = document.createElement("canvas");
        this._texture;
        this._menuMesh;
        this._mode = 'NORMAL';
        this._oldMode = 'NORMAL';
        this._levelSelected = 0;
        this._page = 0;
        this._settingsPage = 0;
        this._dartsUsed = 0;
        this._gameState = "SETTINGS";

        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);

        this._pivotPoint.rotation.set(getRadians(instance['Initial X Rotation']), getRadians(instance['Initial Y Rotation']), getRadians(instance['Initial Z Rotation']));

        this._createMeshes(instance);
    }

    _createMeshes(instance) {
        let width = 600;
        let height = 400;
        this._canvas.width = width;
        this._canvas.height = height;
        let context = this._canvas.getContext('2d');
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#000000";
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        this._writeSettingsMenu(context);

        let geometry = new THREE.PlaneBufferGeometry(3 * this._instance['Scale'], 2 * this._instance['Scale']);
        this._texture = new THREE.Texture(this._canvas);
        let material = new THREE.MeshBasicMaterial({
            map: this._texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this._instance['Opacity'],
        });
        this._menuMesh = new THREE.Mesh( geometry, material );
        this._pivotPoint.add(this._menuMesh);
        this._menuMesh.material.map.needsUpdate = true;
        let lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        let lineGeometry = new THREE.BufferGeometry();
        let vertices = new Float32Array( [
            0.0, 0.0, 0.0,
            0.0, 0.0, -2.0
        ]);
        lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        lineGeometry.setDrawRange(0, 2);
        this._lineMesh = new THREE.Line( lineGeometry, lineMaterial );
        this._pointerPoint.add(this._lineMesh);
    }

    _writeSettingsMenu(context) {
        if(this._settingsPage == 0) {
            this._writeSettingsMenu1(context);
        } else {
            this._writeSettingsMenu2(context);
        }
    }

    _writeSettingsMenu1(context) {
        context.strokeStyle = "#FFFFFF";
        context.strokeRect(this._canvas.width * 0.87, this._canvas.height * 0.04, this._canvas.width * 0.08, this._canvas.height * 0.12);
        context.strokeRect(this._canvas.width * 0.325, this._canvas.height * 0.75, this._canvas.width * 0.35, this._canvas.height * 0.1);
        context.fillStyle = "#FFFFFF";
        if(this._mode == "NORMAL") {
            context.fillRect(this._canvas.width * 0.15, this._canvas.height * 0.325, this._canvas.width * 0.3, this._canvas.height * 0.3);
        } else if(this._mode == "HARD") {
            context.fillRect(this._canvas.width * 0.55, this._canvas.height * 0.325, this._canvas.width * 0.3, this._canvas.height * 0.3);
        }
        context.fillStyle = "#00FF00";
        context.font = '20px Arial';
        context.fillText(">", this._canvas.width * 0.91, this._canvas.height * 0.1);
        context.fillText("Settings", this._canvas.width / 2, this._canvas.height * 0.1);
        context.fillText("Select Difficulty", this._canvas.width / 2, this._canvas.height * 0.2);
        context.fillText("Normal", 0.3 * this._canvas.width, this._canvas.height * 0.4);
        context.fillText("Hard", 0.7 * this._canvas.width, this._canvas.height * 0.4);
        context.fillText("(Given Line of Fire)", 0.3 * this._canvas.width, this._canvas.height * 0.55);
        context.fillText("(Better be in VR)", 0.7 * this._canvas.width, this._canvas.height * 0.55);
        context.fillText("Go To Level Select", this._canvas.width / 2, this._canvas.height * 0.8);
    }

    _writeSettingsMenu2(context) {
        context.fillStyle = "#FFFFFF";
        context.strokeStyle = "#FFFFFF";
        context.strokeRect(this._canvas.width * 0.05, this._canvas.height * 0.04, this._canvas.width * 0.08, this._canvas.height * 0.12);
        if(global.popGameController.shootingHand == "LEFT") {
            context.fillRect(this._canvas.width * 0.075, this._canvas.height * 0.35, this._canvas.width * 0.4, this._canvas.height * 0.1);
            context.strokeRect(this._canvas.width * 0.525, this._canvas.height * 0.35, this._canvas.width * 0.4, this._canvas.height * 0.1);
        } else {
            context.strokeRect(this._canvas.width * 0.075, this._canvas.height * 0.35, this._canvas.width * 0.4, this._canvas.height * 0.1);
            context.fillRect(this._canvas.width * 0.525, this._canvas.height * 0.35, this._canvas.width * 0.4, this._canvas.height * 0.1);
        }
        if(global.popGameController.movementJoystickHand == "LEFT") {
            context.fillRect(this._canvas.width * 0.075, this._canvas.height * 0.5, this._canvas.width * 0.4, this._canvas.height * 0.1);
            context.strokeRect(this._canvas.width * 0.525, this._canvas.height * 0.5, this._canvas.width * 0.4, this._canvas.height * 0.1);
        } else {
            context.strokeRect(this._canvas.width * 0.075, this._canvas.height * 0.5, this._canvas.width * 0.4, this._canvas.height * 0.1);
            context.fillRect(this._canvas.width * 0.525, this._canvas.height * 0.5, this._canvas.width * 0.4, this._canvas.height * 0.1);
        }
        context.strokeRect(this._canvas.width * 0.425, this._canvas.height * 0.175, this._canvas.width * 0.15, this._canvas.height * 0.1);
        context.strokeRect(this._canvas.width * 0.325, this._canvas.height * 0.75, this._canvas.width * 0.35, this._canvas.height * 0.1);
        let audioSetting;
        if(global.popGameController.musicPlaying) {
            audioSetting = "Mute";
        } else {
            audioSetting = "Unmute";
        }
        context.fillStyle = "#00FF00";
        context.font = '20px Arial';
        context.fillText("<", this._canvas.width * 0.09, this._canvas.height * 0.1);
        context.fillText("Settings", this._canvas.width / 2, this._canvas.height * 0.1);
        context.fillText("Background Music:", this._canvas.width / 4, this._canvas.height * 0.225);
        context.fillText(audioSetting, this._canvas.width / 2, this._canvas.height * 0.225);
        context.fillText("Shoot With Left Hand", 0.275 * this._canvas.width, this._canvas.height * 0.4);
        context.fillText("Shoot With Right Hand", 0.725 * this._canvas.width, this._canvas.height * 0.4);
        context.fillText("Move With Left Joystick", 0.275 * this._canvas.width, this._canvas.height * 0.55);
        context.fillText("Move With Right Joystick", 0.725 * this._canvas.width, this._canvas.height * 0.55);
        context.fillText("Go To Level Select", this._canvas.width / 2, this._canvas.height * 0.8);
    }

    _writeLevelSelectMenu(context) {
        context.strokeStyle = "#FFFFFF";
        for(let i = 0; i < 5; i++) {
            context.strokeRect(this._canvas.width * 0.05, this._canvas.height * (0.2 + i * 0.15), this._canvas.width * 0.9, this._canvas.height * 0.15);
        }
        if(this._page != 0) {
            context.strokeRect(this._canvas.width * 0.05, this._canvas.height * 0.04, this._canvas.width * 0.08, this._canvas.height * 0.12);
        } else {
            context.strokeRect(this._canvas.width * 0.05, this._canvas.height * 0.04, this._canvas.width * 0.15, this._canvas.height * 0.12);
        }
        if(this._page != Math.floor(global.popGameController.levelData.length / 5) - 1) {
            context.strokeRect(this._canvas.width * 0.87, this._canvas.height * 0.04, this._canvas.width * 0.08, this._canvas.height * 0.12);
        }
        context.fillStyle = "#00FF00";
        context.font = '20px Arial';
        insertWrappedTextToCanvas(context, "Level Select", this._canvas.width / 2, this._canvas.height * 0.1, 580, 20);
        if(this._page != 0) {
            insertWrappedTextToCanvas(context, "<", this._canvas.width * 0.095, this._canvas.height * 0.1, 280, 20);
        } else {
            context.fillText("Settings", this._canvas.width * 0.125, this._canvas.height * 0.1);
        }
        if(this._page != Math.floor(global.popGameController.levelData.length / 5) - 1) {
            insertWrappedTextToCanvas(context, ">", this._canvas.width * 0.915, this._canvas.height * 0.1, 280, 20);
        }
        for(let i = 0; i < 5; i++) {
            let levelData = global.popGameController.levelData[this._page * 5 + i];
            if(levelData.medal == "NONE") {
                context.fillStyle = "#00FF00";
            } else if(levelData.medal == "BRONZE") {
                context.fillStyle = "#CD7F32";
            } else if(levelData.medal == "SILVER") {
                context.fillStyle = "#C0C0C0";
            } else if(levelData.medal == "GOLD") {
                context.fillStyle = "#FFD700";
            }
            insertWrappedTextToCanvas(context, levelData.name, this._canvas.width / 2, this._canvas.height * (0.275 + (i * 0.15)), this._canvas.width, 20);
        }
    }

    _writeActiveLevelMenu(context) {
        let levelData = global.popGameController.levelData[this._levelSelected];
        context.strokeStyle = "#FFFFFF";
        context.strokeRect(this._canvas.width * 0.1, this._canvas.height * 0.2, this._canvas.width * 0.3, this._canvas.height * 0.15);
        context.strokeRect(this._canvas.width * 0.6, this._canvas.height * 0.2, this._canvas.width * 0.3, this._canvas.height * 0.15);
        context.fillStyle = "#00FF00";
        context.font = '20px Arial';
        context.fillText(levelData.name, this._canvas.width / 2, this._canvas.height * 0.1);
        context.fillText("Restart", this._canvas.width * 0.25, this._canvas.height * 0.275);
        context.fillText("Select Level", this._canvas.width * 0.75, this._canvas.height * 0.275);
        context.fillText("Darts Fired: " + this._dartsUsed, this._canvas.width * 0.5, this._canvas.height * 0.475);
        context.fillStyle = "#FFD700";
        context.fillText("Gold: Max " + levelData.gold + " Dart", this._canvas.width * 0.5, this._canvas.height * 0.675);
        context.fillStyle = "#C0C0C0";
        context.fillText("Silver: Max " + levelData.silver + " Dart", this._canvas.width * 0.5, this._canvas.height * 0.775);
        context.fillStyle = "#CD7F32";
        context.fillText("Bronze: Max " + levelData.bronze + " Dart", this._canvas.width * 0.5, this._canvas.height * 0.875);
    }


    _updateTexture() {
        let context = this._canvas.getContext('2d');
        context.fillStyle = "#000000";
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        if(this._gameState == "SETTINGS") {
            this._writeSettingsMenu(context);
        } else if(this._gameState == "LEVEL_SELECT") {
            this._writeLevelSelectMenu(context);
            this._pivotPoint.position.y = this._instance['Initial Y Position'];
            this._pivotPoint.position.z = this._instance['Initial Z Position'];
            this._pivotPoint.rotation.x = 0;
        } else if(this._gameState == "PLAYING") {
            this._pivotPoint.position.y = 0.01;
            this._pivotPoint.position.z = -2;
            this._pivotPoint.rotation.x = Math.PI / -2;
            this._writeActiveLevelMenu(context);
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

    _pressTrigger(intersection) {
        this._triggerPressed = true;
        if(intersection == null) {
            intersection = this._getIntersection();
        }
        if(intersection != null) {
            let point = intersection.point.clone();
            this._pivotPoint.worldToLocal(point);
            let width = 3 * this._instance['Scale'];
            let height = 2 * this._instance['Scale'];
            if(this._gameState == "SETTINGS") {
                if(height * -0.35 < point.y && point.y < height * -0.25
                    && width * -0.175 < point.x && point.x < width * 0.175) {
                    global.popGameController.gameState = "LEVEL_SELECT";
                } else if(this._settingsPage == 0) {
                    if(height * -0.125 < point.y && point.y < height * 0.175) {
                        if(width * -0.35 < point.x && point.x < width * 0.35) {
                            if(point.x < width * -0.05) {
                                this._mode = "NORMAL";
                                global.popGameController.mode = "NORMAL";
                            } else if(point.x > width * 0.05) {
                                this._mode = "HARD";
                                global.popGameController.mode = "HARD";
                            }
                        }
                    } else if(height * 0.34 < point.y && point.y < height * 0.46
                        && width * 0.37 < point.x && point.x < width * 0.45) {
                        this._settingsPage++;
                        this._updateTexture();
                    }
                } else if(this._settingsPage == 1) {
                    if(height * 0.225 < point.y && point.y < height * 0.325
                        && width * -0.075 < point.x && point.x < width * 0.075) {
                        global.popGameController.toggleMusic();
                        this._updateTexture();
                    } else if(height * 0.05 < point.y && point.y < height * 0.15) {
                        if(width * -0.425 < point.x && point.x < width * 0.425) {
                            if(point.x < width * -0.025) {
                                global.popGameController.changeShootingHand("LEFT");
                                this._changeHands("LEFT");
                                this._updateTexture();
                            } else if(point.x > width * 0.025) {
                                global.popGameController.changeShootingHand("RIGHT");
                                this._changeHands("RIGHT");
                                this._updateTexture();
                            }
                        }
                    } else if(height * -0.1 < point.y && point.y < 0) {
                        if(width * -0.425 < point.x && point.x < width * 0.425) {
                            if(point.x < width * -0.025) {
                                global.popGameController.changeMovementHand("LEFT");
                                this._updateTexture();
                            } else if(point.x > width * 0.025) {
                                global.popGameController.changeMovementHand("RIGHT");
                                this._updateTexture();
                            }
                        }
                    } else if(height * 0.34 < point.y && point.y < height * 0.46
                        && width * -0.45 < point.x && point.x < width * -0.37) {
                        this._settingsPage--;
                        this._updateTexture();
                    }
                }
            } else if(this._gameState == "LEVEL_SELECT") {
                if(height * -0.45 < point.y && point.y < height * 0.3
                    && width * -0.45 < point.x && point.x < width * 0.45) {
                    if(point.y > height * 0.15) {
                        this._levelSelected = 5 * this._page + 0;
                        global.popGameController.selectLevel(this._levelSelected);
                    } else if(point.y > height * 0) {
                        this._levelSelected = 5 * this._page + 1;
                        global.popGameController.selectLevel(this._levelSelected);
                    } else if(point.y > height * -0.15) {
                        this._levelSelected = 5 * this._page + 2;
                        global.popGameController.selectLevel(this._levelSelected);
                    } else if(point.y > height * -0.3) {
                        this._levelSelected = 5 * this._page + 3;
                        global.popGameController.selectLevel(this._levelSelected);
                    } else if(point.y > height * -0.45) {
                        this._levelSelected = 5 * this._page + 4;
                        global.popGameController.selectLevel(this._levelSelected);
                    }
                } else if(this._page != 0
                    && height * 0.34 < point.y && point.y < height * 0.46
                    && width * -0.45 < point.x && point.x < width * -0.37) {
                    this._page--;
                    this._updateTexture();
                } else if(this._page != Math.floor(global.popGameController.levelData.length / 5) - 1
                    && height * 0.34 < point.y && point.y < height * 0.46
                    && width * 0.37 < point.x && point.x < width * 0.45) {
                    this._page++;
                    this._updateTexture();
                } else if(this._page == 0
                    && height * 0.34 < point.y && point.y < height * 0.46
                    && width * -0.45 < point.x && point.x < width * -0.3) {
                    global.popGameController.gameState = "SETTINGS";
                }
             } else if(this._gameState == "PLAYING") {
                if(height * 0.15 < point.y && point.y < height * 0.3) {
                    if(width * -0.4 < point.x && point.x < width * -0.1) {
                        global.popGameController.selectLevel(this._levelSelected);
                    } else if(width * 0.1 < point.x && point.x < width * 0.4) {
                        global.popGameController.gameState = "LEVEL_SELECT";
                    }
                }
            }
        }
    }

    _releaseTrigger() {
        this._triggerPressed = false;
    }

    _getIntersection() {
        let position = new THREE.Vector3();
        let direction = new THREE.Vector3();
        this._pointerPoint.getWorldPosition(position);
        this._pointerPoint.getWorldDirection(direction);
        direction.negate();
        let raycaster = new THREE.Raycaster(position, direction, 0.01, 5);
        let intersections = raycaster.intersectObject(this._menuMesh);
        //TODO: Return intersection point or null for faster checking when trigger pressed to figure out if a menu item has been selected
        if(intersections.length > 0) {
            return intersections[0];
        } else {
            return null;
        }
    }

    _updateLine(intersection) {
        let localIntersection = intersection.point.clone();
        this._pointerPoint.worldToLocal(localIntersection);
        let positions = this._lineMesh.geometry.attributes.position.array;
        positions[3] = localIntersection.x;
        positions[4] = localIntersection.y;
        positions[5] = localIntersection.z;
        this._lineMesh.geometry.attributes.position.needsUpdate = true;
    }

    _changeHands(newHand) {
        if(global.deviceType == "XR") {
            if(newHand == "RIGHT") {
                global.inputHandler.getXRController("RIGHT", "pointer")
                    .add(this._pointerPoint);
            } else if(newHand == "LEFT") {
                global.inputHandler.getXRController("LEFT", "pointer")
                    .add(this._pointerPoint);
            }
        } else {
            if(newHand == "RIGHT") {
                this._pointerPoint.position.setX(0.2);
            } else if(newHand == "LEFT") {
                this._pointerPoint.position.setX(-0.2);
            }
        }
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
        //scene.add(this._lineMesh);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    _isTriggerInputPressed() {
        if(global.deviceType == "XR") {
            let controller = global.inputHandler.getXRInputSource(global.popGameController.shootingHand);
            return controller != null && controller.gamepad.buttons[0].pressed;
        } else if(global.deviceType == "POINTER") {
            return global.inputHandler.isKeyPressed("Space");
        } else if(global.deviceType == "MOBILE") {
            return global.inputHandler.isScreenTouched();
        }
    }

    update(timeDelta) {
        if(this._gameState != global.popGameController.gameState) {
            this._gameState = global.popGameController.gameState;
            this._updateTexture();
        } else if(this._mode != this._oldMode) {
            this._updateTexture();
            this._oldMode = this._mode;
            global.popGameController.mode = this._mode;
        } else if(this._levelSelected != global.popGameController.levelSelected) {
            this._levelSelected = global.popGameController.levelSelected;
            this._page = Math.floor(this._levelSelected / 5);
            this._updateTexture();
        } else if(this._dartsUsed != global.popGameController.dartsUsed) {
            this._dartsUsed = global.popGameController.dartsUsed;
            this._updateTexture();
        }

        if(global.sessionActive) {
            let intersection = this._getIntersection();
            if(intersection != null) {
                this._updateLine(intersection);
                if(!global.popGameController.dartsDisabled) {
                    global.popGameController.dartsDisabled = true;
                    this._lineMesh.visible = true;
                }
                let triggerInputPressed = this._isTriggerInputPressed();
                if(!this._triggerPressed) {
                    if(triggerInputPressed) {
                        this._pressTrigger();
                    }
                } else if(!triggerInputPressed) {
                    this._releaseTrigger();
                }
            } else if(global.popGameController.dartsDisabled) {
                global.popGameController.dartsDisabled = false;
                this._lineMesh.visible = false;
            }
        }
    }

    canUpdate() {
        return "popGameController" in global;
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
                "default": 2
            },
            {
                "name": "Initial Z Position",
                "type": "float",
                "default": -4
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
