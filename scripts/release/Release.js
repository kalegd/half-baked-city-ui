class Release {
    constructor() {
        this._width;
        this._height;
        this._renderer;
        this._scene;
        this._user;
        this._camera;
        this._audioListener;
        this._assets = [];
        this._dynamicAssets = [];
        this._preScripts = [];
        this._postScripts = [];

        this._container = document.querySelector('#container');;
        this._startMessage = document.querySelector('#start');
        this._loadingMessage = document.querySelector('#loading');

        //Camera Variables
        this._aspect;
        this._fieldOfViewAngle = 45;
        this._near = 0.1;
        this._far = 10000;

        //Rendering Variables
        this._clock = new THREE.Clock();
        this._activeStandard = false;

        //VR variables
        this._vrButton;
        this._rotationSpeed = 0;
        global.leftInputSource;
        global.rightInputSource;

        //Loading Variable
        global.loadingAssets = new Set();

        this._clearContainer();
        this._createRenderer();

        this._onResize = this._onResize.bind(this);
        this._onXRSessionStart = this._onXRSessionStart.bind(this);
        this._onXREntered = this._onXREntered.bind(this);
        this._onXREnded = this._onXREnded.bind(this);
        this._loading = this._loading.bind(this);
        this._update = this._update.bind(this);
        this._onResize();

        this.createScene();
        this.createUser();
        this.createAssets();

        this._setUserSettings();
        this.addAssetsToScene();
        this.addEventListeners();
        this._enableKeyboardMouse();

        //Stats
        this._stats = new Stats();
        this._stats.showPanel(0);
        document.body.appendChild(this._stats.dom);

        this._renderer.setAnimationLoop(this._loading);
    }

    _setUserSettings() {
        let userSettings = dataStore.getUserSettings();
        this._camera.position.y = userSettings['Camera Height'];
        this._user.position.x = userSettings['Initial X Position'];
        this._user.position.y = userSettings['Initial Y Position'];
        this._user.position.z = userSettings['Initial Z Position'];
        this._movementSpeed = userSettings['Movement Speed'];
        this._invertedPitch = userSettings['Invert Camera Y Axis Controls'];
    }

    _clearContainer() {
        this._container.innerHTML = '';
    }

    _createRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias : true });
        this._container.appendChild(this._renderer.domElement);
        if(global.isVR) {
            this._renderer.xr.enabled = true;
            this._vrButton = THREE.VRButton.createButton(this._renderer);
            global.vrButton = this._vrButton;
        }
        global.renderer = this._renderer;
    }

    createScene() {
        this._scene = new THREE.Scene();
    }

    createUser() {
        this._user = new THREE.Object3D();
        this._camera = new THREE.PerspectiveCamera(
            this._fieldOfViewAngle,
            this._aspect,
            this._near,
            this._far
        );
        this._audioListener = new THREE.AudioListener();
        this._camera.add(this._audioListener);
        this._user.add(this._camera);
        global.user = this._user;
        global.camera = this._camera;
        global.audioListener = this._audioListener;
        this._scene.add(this._user);
    }

    createAssets() {
        global.terrainAssets = [];
        let skybox = dataStore.getSkybox();
        if(skybox['Skybox Enabled']) {
            let asset = new Skybox(skybox);
            this._assets.push(asset);
        }
        let pageScripts = dataStore.getPageScripts();
        for(let scriptId in pageScripts) {
            let C = eval(dataStore.scripts[scriptId]['class']);
            let script = new C(pageScripts[scriptId].instance);
            let scriptType = C.getScriptType();
            if(scriptType == ScriptType.PRE_SCRIPT) {
                this._preScripts.push(script);
            } else if(scriptType == ScriptType.POST_SCRIPT) {
                this._postScripts.push(script);
            }
        }
        let pageAssets = dataStore.getPageAssets();
        for(let assetId in pageAssets) {
            let type = dataStore.assets[assetId].type;
            let filename = dataStore.assets[assetId].filename;
            let instances = pageAssets[assetId].instances;
            for(let i = 0; i < instances.length; i++) {
                if(type == "GLB") {
                    let asset = new GLTFAsset(filename, instances[i]);
                    this._assets.push(asset);
                    if(asset.isTerrain()) {
                        global.terrainAssets.push(asset.getObject());
                    }
                } else if(type == "JS") {
                    let C = eval(dataStore.assets[assetId]['class']);
                    let asset = new C(instances[i]);
                    this._assets.push(asset);
                    if(asset.canUpdate()) {
                        this._dynamicAssets.push(asset);
                    }
                }
            }
        }
    }

    addAssetsToScene() {
        for(let i = 0; i < this._assets.length; i++) {
            this._assets[i].addToScene(this._scene);
        }
    }

    addEventListeners() {
        window.addEventListener('resize', this._onResize);
        window.addEventListener('wheel', function(event) {
            event.preventDefault();
        }, {passive: false, capture: true});
        this._renderer.xr.addEventListener("sessionstart", this._onXRSessionStart);
        window.addEventListener("sessionstart", this._onXRSessionStart);
        window.addEventListener("enteredXR", this._onXREntered);
        window.addEventListener("endedXR", this._onXREnded);
    }

    _onResize () {
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._aspect = this._width / this._height;

        this._renderer.setSize(this._width, this._height);

        if (!this._camera) {
          return;
        }

        this._camera.aspect = this._aspect;
        this._camera.updateProjectionMatrix();
    }

    _onXREntered(e) {
        this._audioListener.context.resume();
    }

    _onXREnded(e) {
        this._audioListener.context.suspend();
    }

    _onXRSessionStart(e) {
        let session = this._renderer.xr.getSession();
        session.oninputsourceschange = this._onXRInputSourceChange;
        let inputSources = session.inputSources;
        for(let i = 0; i < inputSources.length; i++) {
            if(inputSources[i].handedness == "right") {
                global.rightInputSource = inputSources[i];
            } else if(inputSources[i].handedness == "left") {
                global.leftInputSource = inputSources[i];
            }
        }
    }

    _onXRInputSourceChange(e) {
        for(let i = 0; i < e.removed.length; i++) {
            if(e.removed[i] == global.rightInputSource) {
                global.rightInputSource = null;
            } else if(e.removed[i] == global.leftInputSource) {
                global.leftInputSource = null;
            }
        }
        for(let i = 0; i < e.added.length; i++) {
            if(e.added[i].handedness == "right") {
                global.rightInputSource = e.added[i];
            } else if(e.added[i].handedness == "left") {
                global.leftInputSource = e.added[i];
            }
        }
    }

    _enableKeyboardMouse() {
        if (!this._hasPointerLock() || global.isVR) {
            return;
        }
        document.addEventListener('pointerlockchange', _ =>
            { this._pointerLockChanged() }, false );
        document.addEventListener('mozpointerlockchange', _ =>
            { this._pointerLockChanged() }, false );
        document.addEventListener('webkitpointerlockchange', _ =>
            { this._pointerLockChanged() }, false );

        document.body.addEventListener( 'click', _ => {
            // Ask the browser to lock the pointer
            document.body.requestPointerLock = document.body.requestPointerLock ||
                document.body.mozRequestPointerLock ||
                document.body.webkitRequestPointerLock;
            document.body.requestPointerLock();
        }, false);
    }

    _hasPointerLock() {
        let havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        return havePointerLock;
    }

    _pointerLockChanged() {
        if (document.pointerLockElement === document.body ||
                document.mozPointerLockElement === document.body ||
                document.webkitPointerLockElement === document.body) {
            $(this._startMessage).addClass("removed");
            this._activeStandard = true;
            this._audioListener.context.resume();
        } else {
            $(this._startMessage).removeClass("removed");
            this._activeStandard = false;
            this._audioListener.context.suspend();
        }
    }

    _loading() {
        this._stats.begin();
        var timeDelta = this._clock.getDelta();
        if(global.loadingAssets.size == 0) {
            $(this._loadingMessage).removeClass("loading");
            $(this._startMessage).removeClass("loading");
            if(global.isVR) {
                this._container.appendChild(this._vrButton);
            }
            this._renderer.setAnimationLoop(this._update);
        }
        this._stats.end();
    }

    _update () {
        this._stats.begin();
        var timeDelta = this._clock.getDelta();

        if (this._activeStandard || this._renderer.xr.isPresenting) {
            if(global.isChrome) {
                navigator.getGamepads();
            }

            //Pre Scripts
            for(let i = 0; i < this._preScripts.length; i++) {
                this._preScripts[i].update(timeDelta);
            }

            //Assets
            for(let i = 0; i < this._dynamicAssets.length; i++) {
                this._dynamicAssets[i].update(timeDelta);
            }

            //Post Scripts
            for(let i = 0; i < this._postScripts.length; i++) {
                this._postScripts[i].update(timeDelta);
            }
        }

        this._renderer.render(this._scene, this._camera);
        this._stats.end();
    }

}

var release;
