import global from '../core/global.js';
import * as THREE from '../three/build/three.module.js';
import ThreeMeshUI from '../three-mesh-ui/three-mesh-ui.js';

export default class ThreeMeshUIHelper {
    static createTextBlock(params) {
        let text = (params['text']) ? params['text'] : "";
        let fontSize = (params['fontSize']) ? params['fontSize'] : 0.06;
        let fontColor = (params['fontColor']) ? params['fontColor'] : 0xffffff;
        let height = (params['height']) ? params['height'] : 0.15;
        let width = (params['width']) ? params['width'] : 0.7;
        let backgroundMaterial = (params['backgroundMaterial'])
            ? params['backgroundMaterial']
            : new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                color: 0x43464b,
                transparent: true,
                opacity: 0,
            });
        let textBlock = ThreeMeshUI.Block({
            height: height,
            width: width,
            offset: 0.02,
            justifyContent: "center",
            backgroundMaterial: backgroundMaterial,
        });
        let textComponent = new ThreeMeshUI.Text({
            content: text,
            fontMaterial: new THREE.MeshBasicMaterial({ color: fontColor }),
            fontSize: fontSize,
        });
        textBlock.add(textComponent);
        textBlock.customField = "TEXT_BLOCK";
        return textBlock;
    }

    static createButtonBlock(params) {
        let text = (params['text']) ? params['text'] : "";
        let fontSize = (params['fontSize']) ? params['fontSize'] : 0.06;
        let fontColor = (params['fontColor']) ? params['fontColor'] : 0xffffff;
        let height = (params['height']) ? params['height'] : 0.15;
        let width = (params['width']) ? params['width'] : 0.7;
        let margin = (params['margin']) ? params['margin'] : 0.02;
        let ontrigger = (params['ontrigger']) ? params['ontrigger'] : () => {};
        let idleMaterial = (params['idleMaterial'])
            ? params['idleMaterial']
            : new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
            });
        let hoveredMaterial = (params['hoveredMaterial'])
            ? params['hoveredMaterial']
            : new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                color: 0x43464b,
                transparent: true,
                opacity: 0.8,
            });
        let selectedMaterial = (params['selectedMaterial'])
            ? params['selectedMaterial']
            : new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                color: 0x43464b,
                transparent: true,
                opacity: 0.8,
            });
        let buttonBlock = ThreeMeshUI.Block({
            height: height,
            width: width,
            justifyContent: 'center',
            alignContent: 'center',
            margin: margin,
        });
        let buttonText = new ThreeMeshUI.Text({
            content: text,
            fontMaterial: new THREE.MeshBasicMaterial({ color: fontColor }),
            fontSize: fontSize,
        });
        buttonBlock.add(buttonText);
        buttonBlock.setupState({
            state: "idle",
            attributes: {
                offset: 0.02,
                backgroundMaterial: idleMaterial
            },
            //onSet: ()=> {
            //    console.log("Button now idle!");
            //}
        });
        buttonBlock.setupState({
            state: "hovered",
            attributes: {
                offset: 0.02,
                backgroundMaterial: hoveredMaterial
            },
            //onSet: ()=> {
            //    console.log("Button now hovered over!");
            //}
        });
        buttonBlock.setupState({
            state: "selected",
            attributes: {
                offset: 0.01,
                backgroundMaterial: selectedMaterial
            },
            //onSet: ()=> {
            //    console.log("Selected button!");
            //}
        });
        buttonBlock.setState('idle');
        buttonBlock.customField = "BUTTON";
        buttonBlock.selectedOwners = new Set();
        buttonBlock.ontrigger = ontrigger;
        return buttonBlock;
    }

    static createPointer() {
        let canvas = document.createElement( 'canvas' );
        canvas.width = 64;
        canvas.height = 64;
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(32, 32, 29, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.fill();
        let spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            depthTest: false,
        });
        let pointer = new THREE.Sprite(spriteMaterial);
        pointer.scale.set(0.05,0.05,0.05);
        pointer.visible = false;
        return pointer;
    }

    static createXRPointers() {
        let canvas = document.createElement( 'canvas' );
        canvas.width = 64;
        canvas.height = 64;
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(32, 32, 29, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.fill();
        let spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            depthTest: false,
        });
        let leftPointer = new THREE.Sprite(spriteMaterial);
        let rightPointer = new THREE.Sprite(spriteMaterial);
        leftPointer.scale.set(0.05,0.05,0.05);
        rightPointer.scale.set(0.05,0.05,0.05);
        leftPointer.visible = false;
        rightPointer.visible = false;
        return { 'LEFT': leftPointer, 'RIGHT': rightPointer };
    }

    static raycastUI(controllers, interactables, isMobile) {
        for(let i = 0; i < interactables.length; i++) {
            let interactable = interactables[i];
            let isButton = interactable.customField == "BUTTON";
            let raycasted = false;
            for(let option in controllers) {
                let controller = controllers[option];
                let raycaster = controller['raycaster'];
                let isPressed = controller['isPressed'];
                let intersections;
                if(raycaster == null) {
                    intersections = [];
                } else {
                    intersections = raycaster.intersectObject(interactable, true);
                }
                if(intersections.length != 0) {
                    let distance = intersections[0].distance;
                    if(distance < controller['closestPointDistance']) {
                        controller['closestPointDistance'] = distance;
                        controller['closestPoint'] = intersections[0].point;
                    }
                    raycasted = true;
                    if(isButton) {
                        if(isPressed) {
                            if(interactable.currentState == "hovered" || isMobile) {
                                if(!interactable.selectedOwners.has(option)) {
                                    interactable.selectedOwners.add(option);
                                }
                                interactable.setState("selected");
                            }
                        } else {
                            if(interactable.selectedOwners.has(option)) {
                                interactable.selectedOwners.delete(option);
                                //Trigger button action
                                interactable.ontrigger();
                            }
                            if(interactable.currentState != "hovered"
                                && interactable.selectedOwners.size == 0
                                && !isMobile)
                            {
                                interactable.setState("hovered");
                            }
                        }
                    }
                } else if(isButton && interactable.selectedOwners.has(option)) {
                    if(!isPressed) {
                        interactable.selectedOwners.delete(option);
                    }
                }
            }
            if(isButton && !raycasted && interactable.selectedOwners.size == 0) {
                interactable.setState("idle");
            }
        }
    }

    static handleXRIntersections(interactables, leftPointer, rightPointer) {
        let controllers = {};
        let controllerOptions = ['LEFT', 'RIGHT'];
        for(let i = 0; i < controllerOptions.length; i++) {
            let option = controllerOptions[i];
            controllers[option] = {
                raycaster: ThreeMeshUIHelper.getRaycaster(option),
                isPressed: ThreeMeshUIHelper.isControllerPressed(option),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
            };
        }

        ThreeMeshUIHelper.raycastUI(controllers, interactables);

        if(leftPointer) {
            ThreeMeshUIHelper.updatePointer(leftPointer, controllers['LEFT']);
        }
        if(rightPointer) {
            ThreeMeshUIHelper.updatePointer(rightPointer, controllers['RIGHT']);
        }
    }

    static handlePointerIntersections(interactables, pointer) {
        let raycaster;
        let isPressed = ThreeMeshUIHelper.isControllerPressed("POINTER");
        if(!global.sessionActive) {
            raycaster = ThreeMeshUIHelper.getRaycaster("POINTER");
        }
        let controllers = {
            "POINTER": {
                raycaster: raycaster,
                isPressed: isPressed,
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
            }
        };

        ThreeMeshUIHelper.raycastUI(controllers, interactables);

        if(pointer) {
            ThreeMeshUIHelper.updatePointer(pointer, controllers['POINTER']);
        }
    }

    static handleMobileIntersections(interactables) {
        let raycaster;
        let isPressed = ThreeMeshUIHelper.isControllerPressed("MOBILE");
        //if(isPressed) {
            raycaster = ThreeMeshUIHelper.getRaycaster("MOBILE");
        //}
        let controllers = {
            "MOBILE": {
                raycaster: raycaster,
                isPressed: isPressed,
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
            }
        };

        ThreeMeshUIHelper.raycastUI(controllers, interactables, true);
    }

    static updatePointer(pointer, controller) {
        if(controller['closestPoint'] != null) {
            pointer.position.copy(controller['closestPoint']);
            if(!pointer.visible) {
                pointer.visible = true;
            }
        } else {
            if(pointer.visible) {
                pointer.visible = false;
            }
        }
    };

    static getRaycaster(option) {
        if(option == "LEFT" || option == "RIGHT") {
            let position = new THREE.Vector3();
            let direction = new THREE.Vector3();
            let xrController = global.inputHandler.getXRController(option,
                "targetRay");
            xrController.getWorldPosition(position);
            xrController.getWorldDirection(direction).negate().normalize();
            return new THREE.Raycaster(position, direction, 0.01, 5);
        } else if(option == "POINTER") {
            let position = global.inputHandler.getPointerPosition();
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(position, global.camera);
            return raycaster;
        } else if(option == "MOBILE") {
            let position = global.inputHandler.getPointerPosition();
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(position, global.camera);
            return raycaster;
        }
    }

    //returns whether the controller trigger, mouse, or touch screen is pressed
    static isControllerPressed(option) {
        if(option == "LEFT" || option == "RIGHT") {
            let gamepad = global.inputHandler.getXRGamepad(option);
            return gamepad != null && gamepad.buttons[0].pressed;
        } else if(option == "POINTER") {
            return global.inputHandler.isPointerPressed();
        } else if(option == "MOBILE") {
            return global.inputHandler.isScreenTouched();
        }
    }

}
