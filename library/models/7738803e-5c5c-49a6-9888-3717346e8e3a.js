class GalacticLightsVisualization {
    constructor(instance) {
        this._pivotPoint = new THREE.Object3D();
        this._instance = instance;
        this._materials = [];
        this._hues = [];
        this._hueDeltasPerSecond;
        this._transitionTimeElapsed = 0;
        this._lightnesses = [];
        this._audioAnalysis;

        this._pivotPoint.translateZ(-50);
        this._pivotPoint.translateY(10);

        this._createMeshes();
        if("musicVisualizerController" in global) {
            global.musicVisualizerController.registerVisualization(this, "Galactic Lights");
        }
    }

    _createMeshes() {
        let geometry = new THREE.BufferGeometry();
        let vertices = [];
        for (let i = 0; i < 10000; i++) {
            let x = Math.random() * 200 - 100;
            let y = Math.random() * 200 - 100;
            let z = Math.random() * 200 - 100;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        let url;
        if(this._instance['Sprite']) {
            url = dataStore.images[this._instance['Sprite']].filename;
        } else {
            url = "library/defaults/default.png";
        }
        let scope = this;
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            url,
            function(texture) {
                for(let i = 0; i < scope._instance['Groups']; i++) {
                    scope._materials[i] = new THREE.PointsMaterial({
                        size: scope._instance['Sprite Size'],
                        map: texture,
                        blending: THREE.AdditiveBlending,
                        depthTest: false,
                        transparent: true
                    });
                    scope._hues[i] = Math.random();
                    scope._lightnesses[i] = 0.5;
                    scope._materials[i].color.setHSL(
                        scope._hues[i], 1, scope._lightnesses[i]);
                    let lights = new THREE.Points(geometry, scope._materials[i]);
                    lights.rotation.x = Math.random() * 6;
					lights.rotation.y = Math.random() * 6;
					lights.rotation.z = Math.random() * 6;
                    scope._pivotPoint.add(lights);
                }
                global.loadingAssets.delete(lock);
            }
        );
    }

    addToScene(scene, fromController) {
        if(fromController) {
            scene.add(this._pivotPoint);
        }
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    _updateFromAudioAnalysis() {
        if(this._audioAnalysis != global.musicVisualizerController.audioAnalysis) {
            this._audioAnalysis = global.musicVisualizerController.audioAnalysis;
            this._currentSegmentIndex = 0;
            this._currentPitches = null;

            if(this._audioAnalysis != null) {
                this._transitionTimeElapsed = 0;
                this._hueDeltasPerSecond = [];
                for(let i = 0; i < this._pivotPoint.children.length; i++) {
                    //Note: We won't actually get to the new hue, just near it as we use it to compute a delta per second
                    let newHue = Math.random();
                    this._hueDeltasPerSecond[i] = (newHue - this._hues[i]) / 5;
                }
            }
        }
        if(this._audioAnalysis != null) {
            let audioPosition = global.musicVisualizerController.getAudioPosition();
            let response = this._audioAnalysis.getCurrentPitches(audioPosition, this._currentSegmentIndex);
            if(response != null) {
                this._currentPitches = response.currentPitches;
                this._currentSegmentIndex = response.index;
            }
        }
    }

    update(timeDelta) {
        this._updateFromAudioAnalysis();
        this._transitionTimeElapsed += timeDelta;
        for(let i = 0; i < this._pivotPoint.children.length; i++) {
            let lights = this._pivotPoint.children[i];
            lights.rotateY(timeDelta * (i + 1) / 30);
            if(this._currentPitches != null) {
                lights.material.size = 1 + this._currentPitches[i] * 2;
            } else {
                lights.material.size = 1;
            }
            if(this._hueDeltasPerSecond != null) {
                this._hues[i] = this._hues[i] + this._hueDeltasPerSecond[i] * timeDelta;
                this._materials[i].color.setHSL(
                    this._hues[i], 1, this._lightnesses[i]);
                if(this._transitionTimeElapsed >= 5) {
                    this._hueDeltasPerSecond = null;
                }
            }
        }
    }

    canUpdate() {
        return false;//Well, actually this can be updated, but we won't have it updated by the main class
    }

    isTerrain() {
        return true;
    }

    getObject() {
        return this._pivotPoint;
    }

    static getFields() {
        return [
            {
                "name": "Sprite",
                "type": "image",
                "default": null
            },
            {
                "name": "Sprite Size",
                "type": "float",
                "default": 1
            },
            {
                "name": "Groups",
                "type": "integer",
                "default": 5
            },
        ];
    }
}
