import global from '/library/scripts/core/global.js';
import { getNextSequentialId } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';

global.acquirableObjects = [];

export default class OpponentHand {
    constructor(physicsHand) {
        this.id = getNextSequentialId();
        this.type = "OPPONENT_HAND";
        this._filename = physicsHand._filename;
        this._hand = physicsHand._hand;
        this._boxes = physicsHand._boxes
        this._position = physicsHand._position
        this._rotation = physicsHand._rotation
        this._scale = physicsHand._scale
        this._boxes = physicsHand._boxes

        this._animationMixer;
        this._animationClips;
        this._animationActions = {};
        this._heldObject = null;
        this._worldPosition = new THREE.Vector3();
        this._worldQuaternion = new THREE.Quaternion();
        this._worldEuler = new THREE.Euler();
        this._shapes = [];

        this._grasp = new THREE.Object3D();
        this._pivotPoint = new THREE.Object3D();
        //this._pivotPoint.matrixAutoUpdate = false;
        this._pivotPoint.add(this._grasp);
        this._physicsModelMesh = new THREE.Object3D();
        if(global.physicsDebug) {
            this._pivotPoint.add(this._physicsModelMesh);
        }
        this._pivotPoint.scale.x = this._scale;
        this._pivotPoint.scale.y = this._scale;
        this._pivotPoint.scale.z = this._scale;
        this._opponentScale = 1;

        this._update = this.update;
        this.update = () => {};
        this._createMesh();
        this._createPhysicsModelMesh();
        this._createPhysicsModel();

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
                x: this._scale * global.physicsScale * this._opponentScale,
                y: this._scale * global.physicsScale * this._opponentScale,
                z: this._scale * global.physicsScale * this._opponentScale,
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

    _setOpponentScale(scale) {
        if(this._opponentScale != scale) {
            this._opponentScale = scale;
            this._updatePhysicsModelScale();
        }
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
        global.physicsScene.addActor(this._physicsModel, null);
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        global.physicsScene.removeActor(this._physicsModel, null);
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

    update(timeDelta) {
        this._animationMixer.update(timeDelta);
    }

    updateFromDataStream(data, offset) {
        let scale = data[1];
        let squeezePressed = data[offset];
        if(this._opponentScale != scale) {
            this._opponentScale = scale;
            this._updatePhysicsModelScale();
            let newScale = scale * this._scale;
            this._pivotPoint.scale.fromArray([newScale, newScale, newScale]);
        }
        if(squeezePressed != this._animationActions["Hold"].isActive) {
            this._updateAnimation('Hold', squeezePressed);
            this._animationActions["Hold"].isActive = squeezePressed;
        }
        this._pivotPoint.position.fromArray(data, offset + 1);
        this._worldEuler.fromArray([
            data[offset+4],
            data[offset+5],
            data[offset+6],
        ]);
        this._pivotPoint.setRotationFromEuler(this._worldEuler);

        //Only need to update the physics model when we update the mesh since
        //it's kinematic
        this._updatePhysicsModelFromMesh(this._pivotPoint, this._physicsModel);
    }
}
