import global from '/library/scripts/core/global.js';
import { getNextSequentialId } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';
import { GLTFLoader } from '/library/scripts/three/examples/jsm/loaders/GLTFLoader.js';

export default class PhysicsChessPiece {
    constructor(params) {
        this.id = getNextSequentialId();
        this.type = "PHYSICS_CHESS_PIECE";
        this._color = (params['Color']) ? params['Color'] : 0x222222;
        this._radii = params['Radii'];
        this._heights = params['Heights'];
        this._totalHeight = this._heights.reduce((a, b) => a + b, 0);
        this._radialSegments = params['Radial Segments'] 
            ? params['Radial Segments'] : 16;
        this._position = (params['Position'])
            ? Array.from(params['Position'])
            : [0,0,0];
        this._deadPosition = (params['Dead Position'])
            ? Array.from(params['Dead Position'])
            : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];
        this._mass = (params['Mass']) ? params['Mass'] : 1;
        this._scale = (params['Scale']) ? params['Scale'] : 1;
        this._centerOfMassHeightScale = (params['Center Of Mass Height Scale'])
            ? params['Center Of Mass Height Scale'] : 0.5;
        this._verticalOffset = this._totalHeight * this._centerOfMassHeightScale;
        this._scaleDiff = global.physicsScale / this._scale;
        this._hoveredBy = new Set();
        this.ownership = 0;
        this.authority = 1;

        this._worldPosition = new THREE.Vector3();
        this._worldQuaternion = new THREE.Quaternion();

        this._pivotPoint = new THREE.Object3D();
        this._physicsModelMesh = new THREE.Object3D();
        if(global.physicsDebug) {
            this._pivotPoint.add(this._physicsModelMesh);
        }
        this._pivotPoint.scale.x = this._scale;
        this._pivotPoint.scale.y = this._scale;
        this._pivotPoint.scale.z = this._scale;

        this._createMesh(params['Filename']);
        this._createPhysicsModelMesh();
        this._createPhysicsModel();

        global.chessXR.registerChessPiece(this);
        global.physicsObjects[this.id] = this;
    }


    _createMesh(filename) {
        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(filename, (gltf) => {
            let newMaterial = new THREE.MeshStandardMaterial({color: this._color});
            gltf.scene.translateY(-this._verticalOffset);
            gltf.scene.traverse((child) => {
                if(child.isMesh) {
                    child.material = newMaterial;
                }
            });
            this._pivotPoint.add(gltf.scene);
            //global.acquirableObjects.push(gltf.scene);
            global.acquirableObjects.push(this);
        });
    }

    _createPhysicsModelMesh() {
        let material = new THREE.MeshStandardMaterial({
            color: '#65C7F1',
            wireframe: true,
        });
        let height = 0;
        for(let i = 0; i < this._heights.length; i++) {
            let geometry = this._createCylinderGeometry(
                this._radii[i], this._radii[i+1], this._heights[i]);
            geometry.translate(0, height, 0);
            height += this._heights[i];
            let mesh = new THREE.Mesh(geometry, material);
            //mesh.castShadow = true;
            //mesh.receiveShadow = true;
            this._physicsModelMesh.add(mesh);
        }
    }

    _createCylinderGeometry(bottomRadius, topRadius, height) {
        let geometry = new THREE.CylinderBufferGeometry(
            topRadius, // Top Radius
            bottomRadius, // Bottom Radius
            height, // Total Height
            this._radialSegments // Radial Segments
        );
        geometry.translate(0, (height / 2) - this._verticalOffset, 0);
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
        this._physicsModel.setMassAndUpdateInertia(this._mass);
        this._physicsModel.setId(this.id);

        let material = global.physics.createMaterial(0.2, 0.2, 0.2)
        let flags = new global.PhysX.PxShapeFlags(
            global.PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            global.PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        for(let i = 0; i < this._physicsModelMesh.children.length; i++) {
            let mesh = this._physicsModelMesh.children[i];
            let geometry = this._createPhysicsCylinder(mesh);
            let shape = global.physics.createShape(geometry, material, false, flags);
            this._physicsModel.attachShape(shape);
        }
    }

    _createPhysicsCylinder(mesh) {
        let vertices = this._getVertices(mesh);
        let convexMesh = global.cooking.createConvexMesh(vertices, global.physics);
        let convexMeshScale = new global.PhysX.PxMeshScale({
                x: this._scale * global.physicsScale,
                y: this._scale * global.physicsScale,
                z: this._scale * global.physicsScale,
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

    addToScene(scene) {
        scene.add(this._pivotPoint);
        global.physicsScene.addActor(this._physicsModel, null);
    }

    wakeUp() {
        this._physicsModel.wakeUp();
    }

    //Returns the distance of the object and if it's acquirable
    getDistanceTo(object) {
        //TODO: Replace radius distance with checking for within Cylindrical Bounds
        let position;
        let position2 = new THREE.Vector3();
        if(this._isHeld) {
            position = new THREE.Vector3();
            this._pivotPoint.getWorldPosition(position);
        } else {
            position = this._pivotPoint.position;
        }
        object.getWorldPosition(position2);
        let distance = position.distanceTo(position2);
        return {
            "distance": distance,
            "acquirable": distance < 0.25 && (this.authority != 0 || this.ownership == global.chessXR.polite),
        };
    }

    beAcquiredBy(object) {
        if(this.authority != 0 || this.ownership == global.chessXR.polite) {
            object.attach(this._pivotPoint);
            this._isHeld = true;
            this.authority = 0;
            this.ownership = (global.chessXR.polite) ? 1 : 0;
            //TODO: Set KINEMATIC flag
            this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, true);
        }
    }

    beLetGoBy(object) {
        //TODO: Check if pivot point's parent is not the object and not the scene, and if so then release it from the parent
        //if(this._pivotPoint.parent == object) {
        //    //The below line sets the position to world position
        //    this._pivotPoint.getWorldPosition(this._pivotPoint.position);
        //    object.remove(this._pivotPoint);
        //    this._isHeld = false;
        //}
        if(this._pivotPoint.parent == object) {
            this._isHeld = false;
            global.scene.attach(this._pivotPoint);
            this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, false);
            this.authority = 1;
        }
    }

    addHoveredBy(id) {
        this._hoveredBy.add(id);
        if(this._hoveredBy.size == 1) {
            this._pivotPoint.children[0].traverse((child) => {
                if(child.isMesh) {
                    child.material.color.set(0xffd700);
                }
            });
        }
    }

    removeHoveredBy(id) {
        this._hoveredBy.delete(id);
        if(this._hoveredBy.size == 0) {
            this._pivotPoint.children[0].traverse((child) => {
                if(child.isMesh) {
                    child.material.color.set(this._color);
                }
            });
        }
    }

    processCollisionWithChessPiece(otherChessPiece) {
        //TODO: Find lowest auth and process based off of that
        if(this.authority < otherChessPiece.authority) {
            otherChessPiece.authority = this.authority + 1;
            if(this.authority != 0) {
                this.authority += 1;
            }
            otherChessPiece.ownership = this.ownership;
        } else if(this.authority > otherChessPiece.authority) {
            this.authority = otherChessPiece.authority + 1;
            if(otherChessPiece.authority != 0) {
                otherChessPiece.authority += 1;
            }
            this.ownership = otherChessPiece.ownership;
        } else if(this.authority != 0) {//We know their authorities are equal
            this.authority += 1;
            otherChessPiece.authority += 1;
            if(this.ownership != otherChessPiece.ownership) {
                this.ownership = 0;
                otherChessPiece.ownership = 0;
            }
        }
    }

    processCollisionWithHand(hand) {
        if(this.authority == 0) {
            return;
        }
        if(hand.type == "PHYSICS_HAND") {
            this.authority = 1;
            this.ownership = (global.chessXR.polite) ? 1 : 0;
        } else if(hand.type == "OPPONENT_HAND") {
            this.authority = 1;
            //Assume other player is impolite
            this.ownership = (global.chessXR.polite) ? 0 : 1;
        }
    }

    // Puts the models position, rotation, linear velocity, and angular velocity
    // into the array at the specified offset
    setArrayFromPhysicsData(array, offset) {
        if(this._physicsModel.isSleeping() && !this._isHeld) {
            array[offset] = -1;
            return;
        }
        let transform = this._physicsModel.getGlobalPose();
        let linearVelocity = this._physicsModel.getLinearVelocity();
        let angularVelocity = this._physicsModel.getAngularVelocity();
        array[offset] = this.authority;
        array[offset+1] = this.ownership;
        array[offset+2] = transform.translation.x;
        array[offset+3] = transform.translation.y;
        array[offset+4] = transform.translation.z;
        array[offset+5] = transform.rotation.w;
        array[offset+6] = transform.rotation.x;
        array[offset+7] = transform.rotation.y;
        array[offset+8] = transform.rotation.z;
        array[offset+9] = linearVelocity.x;
        array[offset+10] = linearVelocity.y;
        array[offset+11] = linearVelocity.z;
        array[offset+12] = angularVelocity.x;
        array[offset+13] = angularVelocity.y;
        array[offset+14] = angularVelocity.z;
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

    reset(useDeadPosition) {
        this.beLetGoBy(this._pivotPoint.parent);
        this.ownership = 0;
        this.authority = 1;
        if(useDeadPosition) {
            this._pivotPoint.position.fromArray(this._deadPosition);
        } else {
            this._pivotPoint.position.fromArray(this._position);
        }
        this._pivotPoint.rotation.fromArray(this._rotation);
        //this._updatePhysicsModelFromMesh(this._pivotPoint, this._physicsModel);
        this._pivotPoint.getWorldPosition(this._worldPosition);
        this._pivotPoint.getWorldQuaternion(this._worldQuaternion);
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
        this._physicsModel.setGlobalPose(transform, false);
        this._physicsModel.setLinearVelocity({ x: 0, y: 0, z: 0 }, false);
        this._physicsModel.setAngularVelocity({ x: 0, y: 0, z: 0 }, false);
    }

    update(timeDelta) {
        if(this._isHeld) {
            this._updatePhysicsModelFromMesh(this._pivotPoint, this._physicsModel);
        } else {
            if(this._pivotPoint.position.y < -100) {
                this.reset(true);
            } else {
                this._updateMeshFromPhysicsModel(this._pivotPoint, this._physicsModel);
            }
        }
    }

    //This is where I'm going to need to experiment a bit :(
    updateFromDataStream(data, offset) {
        let authority = data[offset];
        let ownership = data[offset+1];
        if(authority == -1) {//Their piece is sleeping
            if(this._isHeldByOpponent) {//Sometimes kinematic actors sleep
                this._isHeldByOpponent = false;
                this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, false);
            }
            return;
        } else if(authority == 0 && ownership == global.chessXR.polite) {
            return;//Don't listen to them telling us we own it
        }

        if(ownership != this.ownership) {
            if((authority < this.authority)
                || (authority == this.authority && authority != 0
                    && global.chessXR.polite))
            {
                this.ownership = ownership;
                this.authority = authority;
                //This if block is experimental. Not sure if it's needed as should the opponent notify us that we in fact have ownership?
                if(ownership == global.chessXR.polite) {
                    if(this._isHeldByOpponent) {
                        this._isHeldByOpponent = false;
                        this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, false);
                    }
                    return;
                }
            } else {
                if(this._isHeldByOpponent) {
                    this._isHeldByOpponent = false;
                    this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, false);
                }
                return; //Else we ignore because we believe we're correct
            }
        } else if(ownership == global.chessXR.polite) {
            if(this._isHeldByOpponent) {
                this._isHeldByOpponent = false;
                this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, false);
            }
            return;//Do nothing, we own it
        } else {
            this.ownership = ownership;
            this.authority = authority;
        }

        if(authority == 0) {
            if(!this._isHeldByOpponent) {
                this._isHeldByOpponent = true;
                this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, true);
            }
        } else if(this._isHeldByOpponent) {
            this._isHeldByOpponent = false;
            this._physicsModel.setRigidBodyFlag(global.PhysX.PxRigidBodyFlag.eKINEMATIC, false);
        }

        let transform = {
            translation: {
                x: data[offset+2],
                y: data[offset+3],
                z: data[offset+4],
            },
            rotation: {
                w: data[offset+5],
                x: data[offset+6],
                y: data[offset+7],
                z: data[offset+8],
            },
        };
        let linearVelocity = {
            x: data[offset+9],
            y: data[offset+10],
            z: data[offset+11],
        };
        let angularVelocity = {
            x: data[offset+12],
            y: data[offset+13],
            z: data[offset+14],
        };
        this._physicsModel.setGlobalPose(transform, false);
        this._physicsModel.setLinearVelocity(linearVelocity, false);
        //TODO: Try setting the below line to false?
        this._physicsModel.setAngularVelocity(angularVelocity, false);
    }
}
