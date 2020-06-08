import PopGameController from './PopGameController.js';
import BalloonLevel from './BalloonLevel.js';
import PopGameMenu from './PopGameMenu.js';
import DartGun from './DartGun.js';
import TexturePlane from '/library/scripts/components/TexturePlane.js';
import PointLight from '/library/scripts/components/PointLight.js';
import AmbientLight from '/library/scripts/components/AmbientLight.js';
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
            "Path": "/library/skyboxes/blue_sky_1_compressed/",
            "File Extension": ".jpg"
        });
        skybox.addToScene(this._scene);

        let ambientLight = new AmbientLight({ "Intensity": 0.3 });
        ambientLight.addToScene(this._scene);

        let pointLight = new PointLight({"Position": [0,10,100]});
        pointLight.addToScene(this._scene);

        let texturePlane = new TexturePlane({
            "Texture": "/library/images/grass.jpg",
            "Width": 100,
            "Height": 100,
            "Tile Width": 5,
            "Tile Height": 5,
            "Rotation": [-Math.PI/2,0,0]
        });
        texturePlane.addToScene(this._scene);

        if(BasicMovement.isDeviceTypeSupported(global.deviceType)) {
            let basicMovement = new BasicMovement({ 'Movement Speed (m/s)': 3 });
            this._dynamicAssets.push(basicMovement);
        }

        let popGameController = new PopGameController({
            "Background Music": "/library/audios/pop_background_music.mp3",
        });
        this._dynamicAssets.push(popGameController);

        let dartGun = new DartGun({
            "Gun Model": "/library/models/bamboo_gun.glb",
            "Dart Model": "/library/models/dart.glb",
            "Dart Minimum Speed (m/s)": 5,
            "Dart Maximum Speed (m/s)": 30,
            "Dart Oscillation Speed (m/s)": 4,
            "Gravity (m/s^2)": [0,-3,0],
        });
        dartGun.addToScene(this._scene);
        this._dynamicAssets.push(dartGun);

        let popGameMenu = new PopGameMenu({ "Position": [0,2,-4] });
        popGameMenu.addToScene(this._scene);
        this._dynamicAssets.push(popGameMenu);

        let balloonLevel = new BalloonLevel({
            "Pop Image": "/library/images/pop.png",
            "Pop Audio": "/library/audios/pop.mp3",
        });
        balloonLevel.addToScene(this._scene);
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
        } else {
            $(this._loadingMessage).html("<h2>Loading "
                + global.loadingAssets.size + " more asset(s)</h2>");
        }
    }

    _update() {
        let timeDelta = this._clock.getDelta();
        for(let i = 0; i < this._dynamicAssets.length; i++) {
            this._dynamicAssets[i].update(timeDelta);
        }
        this._renderer.render(this._scene, this._camera);
    }
}
