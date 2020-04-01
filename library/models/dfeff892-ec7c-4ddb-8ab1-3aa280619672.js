class BalloonLevel {
    constructor(instance) {
        this._scene;
        this._popTexture;
        this._instance = instance;
        this._balloons = [];
        this._update = this.update;
        this.update = this.preUpdate;

        this._BalloonController;
        if(instance['Balloon Controller'] != "") {
            if("popGameController" in global) {
                global.popGameController.registerBalloonLevelController(this);
            }
            let scope = this;
            try {
                this._BalloonController = eval(dataStore.assets[instance['Balloon Controller']]['class']);
                this._createMeshes();
            } catch (e) {
                let dependencies = [dataStore.assets[instance['Balloon Controller']].filename];
                let lock = createLoadingLock();
                loadScripts(dependencies, function() {
                    scope._BalloonController = eval(dataStore.assets[instance['Balloon Controller']]['class']);
                    scope._createMeshes();
                    global.loadingAssets.delete(lock);
                });
            }
        }
    }

    _createMeshes() {
        let url;
        if(this._instance['Pop Image']) {
            url = dataStore.images[this._instance['Pop Image']].filename;
        } else {
            url = "library/defaults/default.png";
        }
        let scope = this;
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            url,
            function(texture) {
                scope._popTexture = texture;
                global.loadingAssets.delete(lock);
            }
        );
    }

    _addNewAsset(params) {
        let instance = {
            "Radius": this._instance['Radius'],
            "Color": getRandomColor(),
            "Balloon Opacity": this._instance['Balloon Opacity'],
            "Shininess": this._instance['Shininess'],
            "Pop Image": this._instance['Pop Image'],
            "Pop Audio": this._instance['Pop Audio'],
            "Initial X Position": params['x'],
            "Initial Y Position": params['y'],
            "Initial Z Position": params['z']
        }
        let balloon = new this._BalloonController();
        balloon.fromTexture(this._popTexture, instance);
        balloon.addToScene(this._scene);
        this._balloons.push(balloon);
    }

    _reset() {
        for(let i = 0; i < this._balloons.length; i++) {
            this._balloons[i].removeFromScene();
        }
        this._balloons = [];
        this._timeSinceLastSpawn = 0;
        this._totalTime = 0;
        this._timeToSpawn = this._instance['Max Time To Spawn'];
        this._addNewAsset(0);
    }

    addToScene(scene) {
        this._scene = scene;
    }

    removeFromScene() {
        for(let i = 0; i < this._balloons.length; i++) {
            this._balloons[i].removeFromScene();
        }
        this._popTexture.dispose();
    }

    startLevel(level) {
        for(let i = 0; i < this._balloons.length; i++) {
            this._balloons[i].removeFromScene();
        }
        this._balloons = [];
        for(let i = 0; i < level.coordinates.length; i++) {
            this._addNewAsset(level.coordinates[i]);
        }

    }

    preUpdate() {
        if(this._popTexture != null && this._scene != null) {
            this.update = this._update;
        }
    }

    update(timeDelta) {
        //TODO: Stuffs... Maybe...? Maybe Not?
    }

    canUpdate() {
        return this._instance['Balloon Controller'] != "";
    }

    static getScriptType() {
        return ScriptType.ASSET;
    }

    static getFields() {
        return [
            {
                "name": "Balloon Controller",
                "type": "js",
                "default": ""
            },
            {
                "name": "Radius",
                "type": "float",
                "default": 0.5
            },
            {
                "name": "Balloon Opacity",
                "type": "float",
                "default": 0.7
            },
            {
                "name": "Shininess",
                "type": "float",
                "default": 100
            },
            {
                "name": "Pop Image",
                "type": "image",
                "default": ""
            },
            {
                "name": "Pop Audio",
                "type": "audio",
                "default": ""
            },
        ];
    }

}
