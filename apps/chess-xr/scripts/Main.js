import ChessGameUI from './ChessGameUI.js';
import ChessRTC from './ChessRTC.js';
import ChessXR from './ChessXR.js';
import PhysicsHand from './PhysicsHand.js';
import PhysicsChessSet from './PhysicsChessSet.js';

import PointLight from '/library/scripts/components/PointLight.js';
import BasicMovement from '/library/scripts/components/BasicMovement.js';
import Skybox from '/library/scripts/components/Skybox.js';
import AddImmersion from '/library/scripts/components/AddImmersion.js';

import AudioHandler from '/library/scripts/core/AudioHandler.js';
import InputHandler from '/library/scripts/core/InputHandler.js';
import SessionHandler from '/library/scripts/core/SessionHandler.js';
import global from '/library/scripts/core/global.js';
import * as THREE from '/library/scripts/three/build/three.module.js';

export default class Main {
    constructor() {
        this._renderer;
        this._scene;
        this._camera;
        this._shapes;
        this._clock = new THREE.Clock();
        this._container = document.getElementById('container');
        this._loadingMessage = document.querySelector('#loading');
        this._dynamicAssets = [];
        global.loadingAssets = new Set();

        this._createRenderer();
        this._createScene();
        this._createUser();
        this._createHandlers();
        this._createAssets();
        this._addEventListeners();

        this._renderer.setAnimationLoop(() => { this._loading() });
    }

    _createRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias : true });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._container.appendChild(this._renderer.domElement);
        if(global.deviceType == "XR") {
            this._renderer.xr.enabled = true;
        }
        global.renderer = this._renderer;
    }

    _createScene() {
        this._scene = new THREE.Scene();
        global.scene = this._scene;
    }

    _createUser() {
        this._user = new THREE.Object3D();
        this._camera = new THREE.PerspectiveCamera(
            45, //Field of View Angle
            window.innerWidth / window.innerHeight, //Aspect Ratio
            0.001, //Clipping for things closer than this amount
            1000 //Clipping for things farther than this amount
        );
        this._camera.position.setY(1.7); //Height of your eyes
        this._user.add(this._camera);
        this._scene.add(this._user);
        global.user = this._user;
        global.camera = this._camera;
    }

    _createHandlers() {
        this._sessionHandler = new SessionHandler(this._renderer, this._camera);
        this._inputHandler = new InputHandler(this._renderer, this._user);
        this._audioHandler = new AudioHandler();
        global.inputHandler = this._inputHandler;
    }

    _createAssets() {
        let skybox = new Skybox({
            "Path": "/library/skyboxes/space_compressed/",
            "File Extension": ".jpg"
        });
        skybox.addToScene(this._scene);

        let pointLight = new PointLight({"Position": [0,2,0]});
        let pointLight2 = new PointLight({"Position": [0,2,-5]});
        pointLight.addToScene(this._scene);
        pointLight2.addToScene(this._scene);

        if(BasicMovement.isDeviceTypeSupported(global.deviceType)) {
            let basicMovement = new BasicMovement({'Movement Speed (m/s)': 2});
            this._dynamicAssets.push(basicMovement);
        }

        global.chessXR = new ChessXR();
        this._dynamicAssets.push(global.chessXR);

        let chessSet = new PhysicsChessSet({
            "Board Length": 1,
            "Position": [0,0.74,-0.6],
            "Rotation": [0,-Math.PI/2,0],
        });
        chessSet.addToScene(this._scene);
        this._dynamicAssets.push(chessSet);

        let chessRTC = new ChessRTC();

        let rightHandParams = {
            "Filename": "/library/models/right_hand_low_poly.glb",
            "Hand": "RIGHT",
            "Boxes": [{ //Hand
                "Width": 0.08,
                "Height": 0.07,
                "Depth": 0.12,
                "Center": [-0.007,0,0.045],
            },{ //Pinky Finger
                "Width": 0.02,
                "Height": 0.03,
                "Depth": 0.06,
                "Center": [0.034,-0.007,-0.045],
            },{ //Ring Finger
                "Width": 0.02,
                "Height": 0.03,
                "Depth": 0.08,
                "Center": [0.013,0,-0.055],
            },{ //Middle Finger
                "Width": 0.023,
                "Height": 0.033,
                "Depth": 0.09,
                "Center": [-0.012,0.003,-0.06],
            },{ //Index Finger
                "Width": 0.022,
                "Height": 0.03,
                "Depth": 0.08,
                "Center": [-0.038,0.01,-0.055],
            },{ //Thumb Finger
                "Width": 0.02,
                "Height": 0.03,
                "Depth": 0.1,
                "Center": [-0.06,-0.017,0.03],
                "Rotation": [-Math.PI/8,Math.PI/6,0],
            }],
            "Rotation": [(global.deviceType == "XR") ? -Math.PI/4 : 0,0,(global.deviceType == "XR") ? -Math.PI/2 : 0],
            "Mass": 40,
            "Scale": 1,
        };
        let leftHandParams = {
            "Filename": "/library/models/left_hand_low_poly.glb",
            "Hand": "LEFT",
            "Boxes": [],
            "Rotation": [(global.deviceType == "XR") ? -Math.PI/4 : 0,0,(global.deviceType == "XR") ? Math.PI/2 : 0],
            "Mass": rightHandParams['Mass'],
            "Scale": rightHandParams['Scale'],
        };
        for(let i = 0; i < rightHandParams['Boxes'].length; i++) {
            let rightBoxParams = rightHandParams['Boxes'][i];
            let leftBoxParams = {
                "Width": rightBoxParams['Width'],
                "Height": rightBoxParams['Height'],
                "Depth": rightBoxParams['Depth'],
                "Center": [
                    -1 * rightBoxParams['Center'][0],
                    rightBoxParams['Center'][1],
                    rightBoxParams['Center'][2]
                ],
            };
            if("Rotation" in rightBoxParams) {
                leftBoxParams['Rotation'] = [
                    1 * rightBoxParams['Rotation'][0],
                    -1 * rightBoxParams['Rotation'][1],
                    rightBoxParams['Rotation'][2]
                ];
            }
            leftHandParams['Boxes'].push(leftBoxParams);
        }

        let rightHand = new PhysicsHand(rightHandParams);
        let leftHand = new PhysicsHand(leftHandParams);

        if(global.deviceType == "XR") {
            rightHand.addToScene(global.inputHandler.getXRController("RIGHT", "grip"));
            leftHand.addToScene(global.inputHandler.getXRController("LEFT", "grip"));
        } else {
            rightHand.addToScene(this._camera);
            leftHand.addToScene(this._camera);
        }
        this._dynamicAssets.push(rightHand);
        this._dynamicAssets.push(leftHand);

        let ui = new ChessGameUI({
            "Position": [0,1.5,-2],
            "Rotation": [0 * Math.PI/8,0,0],
            "Font Family": "/library/fonts/Roboto-msdf.json",
            "Font Texture": "/library/fonts/Roboto-msdf.png",
        });
        ui.addToScene(this._scene);
        this._dynamicAssets.push(ui);
    }

    _addEventListeners() {
        window.addEventListener('resize', () => { this._onResize() });
        window.addEventListener('wheel', function(event) {
                    event.preventDefault();
        }, {passive: false, capture: true});
        
    }

    _onResize () {
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
    }

    _loading() {
        if(global.loadingAssets.size == 0) {
            new AddImmersion();
            $(this._loadingMessage).removeClass("loading");
            this._sessionHandler.displayButton();
            if(global.deviceType == "XR") {
                this._renderer.setAnimationLoop((time, frame) => {
                    this._inputHandler.update(frame);
                    this._update();
                });
            } else if (global.deviceType == "POINTER") {
                this._renderer.setAnimationLoop(() => { this._update(); });
            } else if (global.deviceType == "MOBILE") {
                this._renderer.setAnimationLoop(() => {
                    this._sessionHandler.update();
                    this._update();
                });
            }
            setTimeout(() => {
                global.physicsScene.setGravity({x:0,y:-9.8,z:0});
                for(let i = 0; i < this._dynamicAssets.length; i++) {
                    if("wakeUp" in this._dynamicAssets[i]) {
                        this._dynamicAssets[i].wakeUp();
                    }
                }
            }, 2000);
        } else {
            $(this._loadingMessage).html("<h2>Loading "
                + global.loadingAssets.size + " more asset(s)</h2>");
        }
    }

    _update() {
        let timeDelta = this._clock.getDelta();
        global.physicsScene.simulate(timeDelta, true);
        global.physicsScene.fetchResults(true);
        for(let i = 0; i < this._dynamicAssets.length; i++) {
            this._dynamicAssets[i].update(timeDelta);
        }
        this._renderer.render(this._scene, this._camera);
    }
}
