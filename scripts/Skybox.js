class Skybox {
    constructor(instance) {
        //this._skybox;
        //this._pivotPoint = new THREE.Object3D();
        this._instance = instance;

        //this._createMeshes(instance);
    }

    //_createMeshes(instance) {
    //    let geometry = new THREE.CubeGeometry( instance['Length'], instance['Length'], instance['Length'] );
    //    let materials;
    //    if(instance['skybox_id']) {
    //        materials = [
    //            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( dataStore.skyboxes[instance['skybox_id']]['right'] ), side: THREE.BackSide }), //right side
    //            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( dataStore.skyboxes[instance['skybox_id']]['left'] ), side: THREE.BackSide }), //left side
    //            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( dataStore.skyboxes[instance['skybox_id']]['top'] ), side: THREE.BackSide }), //top side
    //            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( dataStore.skyboxes[instance['skybox_id']]['bottom'] ), side: THREE.BackSide }), //bottom side
    //            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( dataStore.skyboxes[instance['skybox_id']]['front'] ), side: THREE.BackSide }), //front side
    //            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( dataStore.skyboxes[instance['skybox_id']]['back'] ), side: THREE.BackSide }) //back side
    //        ];
    //    } else {
    //        materials = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('library/defaults/default.png'), side: THREE.BackSide });
    //    }
    //    this._skybox = new THREE.Mesh( geometry, materials );
    //    this._skybox.scale.x = -1;
    //    this._pivotPoint.add(this._skybox);
    //}

    addToScene(scene) {
        //scene.add(this._pivotPoint);
        let lock = createLoadingLock();
        new THREE.CubeTextureLoader()
            .load( [
                dataStore.skyboxes[this._instance['skybox_id']]['right'],
                dataStore.skyboxes[this._instance['skybox_id']]['left'],
                dataStore.skyboxes[this._instance['skybox_id']]['top'],
                dataStore.skyboxes[this._instance['skybox_id']]['bottom'],
                dataStore.skyboxes[this._instance['skybox_id']]['front'],
                dataStore.skyboxes[this._instance['skybox_id']]['back'],
            ], function(texture) {
                scene.background = texture;
                global.loadingAssets.delete(lock);
            });
    }

    removeFromScene() {
        //Maybe keep a reference to scene and then set the background to null?
    }

}
