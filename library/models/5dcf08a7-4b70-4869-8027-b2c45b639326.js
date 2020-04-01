class TexturePlane {
    constructor(instance) {
        this._mesh;
        this._pivotPoint = new THREE.Object3D();
        this._instance = instance;
        this._numberOfHorizontalTiles = this._instance['Width'] / this._instance['Tile Width'];
        this._numberOfVerticalTiles = this._instance['Height'] / this._instance['Tile Height'];

        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);

        this._pivotPoint.rotation.set(getRadians(instance['Initial X Rotation']), getRadians(instance['Initial Y Rotation']), getRadians(instance['Initial Z Rotation']));

        this._createMeshes();
    }

    _createMeshes() {
        let geometry = new THREE.PlaneBufferGeometry(this._instance['Width'], this._instance['Height']);
        let url;
        if(this._instance['Texture']) {
            url = dataStore.images[this._instance['Texture']].filename;
        } else {
            url = "library/defaults/default.png";
        }
        let scope = this;
        let lock = createLoadingLock();
        new THREE.TextureLoader().load(
            url,
            function(texture) {
                let side = THREE.FrontSide;
                if(scope._instance['Double Sided']) {
                    side = THREE.DoubleSide;
                }
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.setX(scope._numberOfHorizontalTiles);
                texture.repeat.setY(scope._numberOfVerticalTiles);
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: side
                });
                scope._mesh = new THREE.Mesh( geometry, material );
                scope._pivotPoint.add(scope._mesh);
                global.loadingAssets.delete(lock);
            }
        );

    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    update(timeDelta) {
        return;
    }

    canUpdate() {
        return false;
    }

    isTerrain() {
        return this._instance['Is Terrain'];
    }

    getObject() {
        return this._pivotPoint;
    }

    static getFields() {
        return [
            {
                "name": "Texture",
                "type": "image",
                "default": null
            },
            {
                "name": "Width",
                "type": "float",
                "default": 100
            },
            {
                "name": "Height",
                "type": "float",
                "default": 100
            },
            {
                "name": "Tile Width",
                "type": "float",
                "default": 3
            },
            {
                "name": "Tile Height",
                "type": "float",
                "default": 3
            },
            {
                "name": "Double Sided",
                "type": "boolean",
                "default": false
            },
            {
                "name": "Is Terrain",
                "type": "boolean",
                "default": false
            },
            {
                "name": "Initial X Position",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Y Position",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Z Position",
                "type": "float",
                "default": 0
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
