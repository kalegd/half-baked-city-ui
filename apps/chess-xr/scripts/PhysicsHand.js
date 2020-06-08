import global from '/library/scripts/core/global.js';
import { getNextSequentialId } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';

global.acquirableObjects = [];

export default class PhysicsHand {
    constructor(params) {
        this.id = getNextSequentialId();
        this.type = "PHYSICS_HAND";
        this._filename = params['Filename'];
        this._hand = params['Hand'];
        this._boxes = params['Boxes'];
        this._position = (global.deviceType == "XR")
            ? [0,0,0]
            : [(this._hand) == "RIGHT" ? 0.2 : -0.2, -0.1, -0.3];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];
        this._scale = (params['Scale']) ? params['Scale'] : 1;
        this._scaleDiff = global.physicsScale / this._scale;

        this._animationMixer;
        this._animationClips;
        this._animationActions = {};
        this._heldObject = null;
        this._closestObjectToHold = null;
        this._worldPosition = new THREE.Vector3();
        this._worldQuaternion = new THREE.Quaternion();
        this._worldEuler = new THREE.Euler();
        this._shapes = [];

        this._grasp = new THREE.Object3D();
        this._pivotPoint = new THREE.Object3D();
        this._pivotPoint.add(this._grasp);
        this._physicsModelMesh = new THREE.Object3D();
        if(global.physicsDebug) {
            this._pivotPoint.add(this._physicsModelMesh);
        }
        this._pivotPoint.scale.x = this._scale;
        this._pivotPoint.scale.y = this._scale;
        this._pivotPoint.scale.z = this._scale;

        this._update = this.update;
        this.update = () => {};
        this._createMesh();
        this._createPhysicsModelMesh();
        this._createPhysicsModel();

        this._addEventListeners();
        global.chessXR.registerHand(this, this._hand);
        global.physicsObjects[this.id] = this;
    }

    _createMesh() {
        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(this._filename, (gltf) => {
            this._pivotPoint.add(gltf.scene);
            this._animationMixer = new THREE.AnimationMixer(gltf.scene);
            this._animationClips = gltf.animations;
            //console.log(this._animationClips);
            for(let i = 0; i < gltf.animations.length; i++) {
                let clip = gltf.animations[i];
                let action = this._animationMixer.clipAction(clip);
                action.clampWhenFinished = true;
                action.loop = THREE.LoopOnce;
                action.isActive = false;
                this._animationActions[clip.name] = action;
            }
            this._animationMixer.addEventListener("finished", (e) => {
                if(e.direction == -1) {
                    e.action.stop();
                }
            });
            this.update = this._update;
        });
    }

    _createPhysicsModelMesh() {
        let material = new THREE.MeshStandardMaterial({
            color: '#65C7F1',
            wireframe: true,
        });
        for(let i = 0; i < this._boxes.length; i++) {
            let geometry = this._createBoxGeometry(this._boxes[i]);
            let mesh = new THREE.Mesh(geometry, material);
            //mesh.castShadow = true;
            //mesh.receiveShadow = true;
            this._physicsModelMesh.add(mesh);
        }
    }

    _createBoxGeometry(params) {
        let geometry = new THREE.BoxBufferGeometry(
            params['Width'],
            params['Height'],
            params['Depth'],
        );
        if(params['Rotation']) {
            geometry.rotateX(params['Rotation'][0]);
            geometry.rotateY(params['Rotation'][1]);
            geometry.rotateZ(params['Rotation'][2]);
        }
        geometry.translate(
            params['Center'][0],
            params['Center'][1],
            params['Center'][2]
        );
        return geometry;
    }

    _getVertices(mesh) {
        let positions = mesh.geometry.attributes.position.array;
        //let vertices = [];
        let vertices = new global.PhysX.PxVec3Vector();
        for(let i = 0; i < positions.length; i += 3) {
            //vertices.push([positions[i],positions[i+1],positions[i+2]]);
            vertices.push_back({ 'x': positions[i], 'y': positions[i+1], 'z': positions[i+2]});
        }
        //global.vertices = vertices;
        return vertices;
    }

    _createPhysicsModel() {
        let transform = {
            translation: {
                x: this._position[0] * global.physicsScale,
                y: this._position[1] * global.physicsScale,
                z: this._position[2] * global.physicsScale,
            },
            rotation: {
                w: this._pivotPoint.quaternion.w,
                x: this._pivotPoint.quaternion.x,
                y: this._pivotPoint.quaternion.y,
                z: this._pivotPoint.quaternion.z,
            },
        };
        this._physicsModel = global.physics.createRigidDynamic(transform);
        this._physicsModel.setMassAndUpdateInertia(1);
        this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, true);
        this._physicsModel.setId(this.id);

        let material = global.physics.createMaterial(0.2, 0.2, 0.2)
        let flags = new global.PhysX.PxShapeFlags(
            global.PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            global.PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        for(let i = 0; i < this._physicsModelMesh.children.length; i++) {
            let mesh = this._physicsModelMesh.children[i];
            let geometry = this._createPhysicsGeometry(mesh);
            let shape = global.physics.createShape(geometry, material, false, flags);
            this._physicsModel.attachShape(shape);
            this._shapes.push(shape);
        }
    }

    _updatePhysicsModelScale() {
        for(let i = 0; i < this._shapes.length; i++) {
            this._physicsModel.detachShape(this._shapes[i], false);
        }
        this._shapes = [];
        let material = global.physics.createMaterial(0.2, 0.2, 0.2)
        let flags = new global.PhysX.PxShapeFlags(
            global.PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            global.PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        for(let i = 0; i < this._physicsModelMesh.children.length; i++) {
            let mesh = this._physicsModelMesh.children[i];
            let geometry = this._createPhysicsGeometry(mesh);
            let shape = global.physics.createShape(geometry, material, false, flags);
            this._physicsModel.attachShape(shape);
            this._shapes.push(shape);
        }
    }

    _createPhysicsGeometry(mesh) {
        let vertices = this._getVertices(mesh);
        let convexMesh = global.cooking.createConvexMesh(vertices, global.physics);
        let convexMeshScale = new global.PhysX.PxMeshScale({
                x: this._scale * global.physicsScale * global.user.scale.x,
                y: this._scale * global.physicsScale * global.user.scale.y,
                z: this._scale * global.physicsScale * global.user.scale.z,
            }, {
                w: 1, // PhysX uses WXYZ quaternions,
                x: 0,
                y: 0,
                z: 0,
            },
        );
        let convexMeshGeometryFlags = new global.PhysX.PxConvexMeshGeometryFlags(0);
        let geometry = new global.PhysX.PxConvexMeshGeometry(convexMesh, convexMeshScale, convexMeshGeometryFlags);
        return geometry;
    }

    _addEventListeners() {
        document.addEventListener('userScaleChange', () => {
            this._updatePhysicsModelScale();
        });
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
        global.physicsScene.addActor(this._physicsModel, null);
    }

    wakeUp() {
        this._physicsModel.wakeUp();
    }

    _getIntersection() {
        let position = new THREE.Vector3();
        let direction = new THREE.Vector3();
        this._pivotPoint.getWorldPosition(position);
        this._pivotPoint.getWorldDirection(direction);
        direction.negate();
        let raycaster = new THREE.Raycaster(position, direction, 0.01, 2);
        let intersections = raycaster.intersectObjects(global.acquirableObjects, true);
        if(intersections.length > 0) {
            return intersections[0];
        } else {
            return null;
        }
    }

    _checkForAcquirableObject() {
        let object = null;
        let minimumDistance = 1000;
        for(let i = 0; i < global.acquirableObjects.length; i++) {
            let acquirableObject = global.acquirableObjects[i];
            let v = acquirableObject.getDistanceTo(this._grasp);
            if(v.acquirable && v.distance < minimumDistance) {
                object = acquirableObject;
                minimumDistance = v.distance;
            }
        }
        return object;
    }

    _updateAnimation(name, forward) {
        let action = this._animationActions[name];
        if(forward) {
            action.timeScale = 1;
            action.play();
        } else {
            action.timeScale = -1;
            action.paused = false;
        }
    }

    _updateHoverablePieces() {
        let object = this._checkForAcquirableObject();
        if(object != this._closestObjectToHold) {
            if(this._closestObjectToHold) {
                this._closestObjectToHold.removeHoveredBy(this.id);
                this._closestObjectToHold = null;
            }
            if(object) {
                object.addHoveredBy(this.id);
                this._closestObjectToHold = object;
            }
        }
    }

    _updateFromGamepad() {
        let gamepad = global.inputHandler.getXRGamepad(this._hand);
        if(gamepad != null) {
            let triggerPressed = gamepad.buttons[0].pressed;
            let squeezePressed = gamepad.buttons[1].pressed;
            if(squeezePressed != this._animationActions["Hold"].isActive) {
                this._updateAnimation('Hold', squeezePressed);
                this._animationActions["Hold"].isActive = squeezePressed;
                if(squeezePressed && this._heldObject == null) {
                    this._heldObject = this._checkForAcquirableObject();
                    if(this._heldObject) {
                        this._heldObject.beAcquiredBy(this._grasp);
                    }
                } else if(!squeezePressed && this._heldObject != null) {
                    this._heldObject.beLetGoBy(this._grasp);
                    this._heldObject = null;
                }
                //} else if(!squeezePressed) {
                //    if(this._heldObject == null) {
                //        this._updateHoverablePieces();
                //    } else {
                //        this._heldObject.beLetGoBy(this._grasp);
                //        this._heldObject = null;
                //    }
                //}
            } else if(!squeezePressed) {
                this._updateHoverablePieces();
            }
        } else {
            //TODO: Delete, this function is only for VR
            this._updateHoverablePieces();
        }
    }

    _updateMeshFromPhysicsModel(mesh, physicsModel) {
        let transform = physicsModel.getGlobalPose();
        let position = [
            transform.translation.x / global.physicsScale,
            transform.translation.y / global.physicsScale,
            transform.translation.z / global.physicsScale
        ];
        let rotation = [transform.rotation.x,transform.rotation.y,transform.rotation.z, transform.rotation.w];
        mesh.position.fromArray(position);
        mesh.quaternion.fromArray(rotation);
    }

    _updatePhysicsModelFromMesh(mesh, physicsModel) {
        mesh.getWorldPosition(this._worldPosition);
        mesh.getWorldQuaternion(this._worldQuaternion);
        let transform = {
            translation: {
                x: this._worldPosition.x,
                y: this._worldPosition.y,
                z: this._worldPosition.z,
            },
            rotation: {
                w: this._worldQuaternion.w, // PhysX uses WXYZ quaternions,
                x: this._worldQuaternion.x,
                y: this._worldQuaternion.y,
                z: this._worldQuaternion.z,
            },
        };
        physicsModel.setKinematicTarget(transform);
    }

    // Puts the world matrix data into the array at the specified offset
    setArrayFromWorldData(array, offset) {
        this._pivotPoint.getWorldPosition(this._worldPosition);
        this._pivotPoint.getWorldQuaternion(this._worldQuaternion);
        this._worldEuler.setFromQuaternion(this._worldQuaternion);

        this._worldPosition.toArray(array, offset);
        array[offset+3] = this._worldEuler.x;
        array[offset+4] = this._worldEuler.y;
        array[offset+5] = this._worldEuler.z;
    }

    update(timeDelta) {
        this._updatePhysicsModelFromMesh(this._pivotPoint, this._physicsModel);
        this._animationMixer.update(timeDelta);
        //if(this._getIntersection() != null) {
        //    this._updateAnimation("Point", true);
        //} else {
        //    this._updateAnimation("Point", false);
        //}
        this._updateFromGamepad();
    }
}
