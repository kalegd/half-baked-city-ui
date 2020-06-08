import global from '/library/scripts/core/global.js';
import { fullDispose } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';

export default class OpoonentAvatar {
    constructor(params) {
        if(!params) {
            params = {};
        }
        this._defaultURL = (params['Default URL'])
            ? params['Default URL']
            : './images/potato-logo.png';
        this._worldEuler = new THREE.Euler();
        this._vector3 = new THREE.Vector3();

        this._boundingBox = new THREE.Box3();
        this._pivotPoint = new THREE.Object3D();
        //this._pivotPoint.matrixAutoUpdate = false;
        this._opponentScale = 1;
        this._dimensions = 1;
    }

    _createMesh(filename) {
        console.log(filename);
        if(/\.glb$/.test(filename)) {
            let gltfLoader = new GLTFLoader();
            gltfLoader.load(filename, (gltf) => {
                this._boundingBox.setFromObject(gltf.scene);
                this._boundingBox.getCenter(this._vector3);
                gltf.scene.position.sub(this._vector3);
                gltf.scene.rotateY(Math.PI);
                this._pivotPoint.add(gltf.scene);
                this._dimensions = 3;
            }, () => {}, (error) => {
                console.log(error);
                if(filename != this._defaultURL) {
                    this._createMesh(this._defaultURL);
                } else {
                    console.error("Can't display default avatar :(");
                }
            });
        } else if(/\.png$|\.jpg$|\.jpeg$/.test(filename)) {
            new THREE.TextureLoader().load(filename, (texture) => {
                let width = texture.image.width;
                let height = texture.image.height;
                if(width > height) {
                    let factor = 0.3 / width;
                    width = 0.3;
                    height *= factor;
                } else {
                    let factor = 0.3 / height;
                    height = 0.3;
                    width *= factor;
                }
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                });
                let geometry = new THREE.PlaneBufferGeometry(width, height);
                geometry.rotateY(Math.PI);
                let mesh = new THREE.Mesh(geometry, material);
                this._pivotPoint.add(mesh);
                //let sprite = new THREE.Sprite(material);
                //this._pivotPoint.add(sprite);
                this._dimensions = 2;
            }, () => {}, () => {
                if(filename != this._defaultURL) {
                    this._createMesh(this._defaultURL);
                } else {
                    console.error("Can't display default avatar :(");
                }
            });
        } else {
            if(filename != this._defaultURL) {
                this._createMesh(this._defaultURL);
            } else {
                console.error("Default avatar URL is invalid :(");
            }
        }
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        let child = this._pivotPoint.children[0];
        this._pivotPoint.remove(child);
        fullDispose(child);
    }

    //_updateAnimation(name, forward) {
    //    let action = this._animationActions[name];
    //    if(forward) {
    //        action.timeScale = 1;
    //        action.play();
    //    } else {
    //        action.timeScale = -1;
    //        action.paused = false;
    //    }
    //}

    // Maybe implement in the future if we have an avatar with blinking
    // capabilities
    //update(timeDelta) {
    //    this._animationMixer.update(timeDelta);
    //}

    updateURL(url) {
        this._createMesh(url);
    }

    updateFromDataStream(data, offset) {
        let scale = data[1];
        if(this._opponentScale != scale) {
            this._opponentScale = scale;
            this._pivotPoint.scale.fromArray([scale, scale, scale]);
        }
        this._pivotPoint.position.fromArray(data, offset);
        this._worldEuler.fromArray([
            data[offset+3],
            data[offset+4],
            data[offset+5],
        ]);
        this._pivotPoint.setRotationFromEuler(this._worldEuler);
    }
}
