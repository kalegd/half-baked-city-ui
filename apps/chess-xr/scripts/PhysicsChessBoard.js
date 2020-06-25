import global from '/library/scripts/core/global.js';
import { getNextSequentialId } from '/library/scripts/core/utils.module.js';
import * as THREE from '/library/scripts/three/build/three.module.js';

export default class PhysicsChessBoard {
    constructor(params) {
        this.id = getNextSequentialId();
        this.type = "PHYSICS_CHESS_BOARD";
        this._pivotPoint = new THREE.Object3D();;
        this._mesh;
        this._physicsModel;
        this.positions = {};
        this._length = params['Length'];
        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];
        this._sideTablesEnabled = params['Side Tables Enabled'];
        this._v1 = new THREE.Vector3();
        this._v2 = new THREE.Vector3();
        this._canvas = document.createElement("canvas");
        this._createImages();
        this._createTexture();
        this._createMesh();
        this._createPhysicsModel();

        global.chessXR.registerChessBoard(this);
        global.physicsObjects[this.id] = this;
    }

    _addImage(geometry, material, x, z, rotY) {
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = x;
        mesh.position.y = this._length/40 + 0.001;
        mesh.position.z = z;
        mesh.rotateY(rotY);
        this._pivotPoint.add(mesh);
    }

    _createImages() {
        new THREE.TextureLoader().load('/images/half-baked-city-gold.png', (texture) => {
            let width = texture.image.width;
            let height = texture.image.height;
            if(width / (this._length * 0.8) > height / (this._length * 0.1)) {
                let factor = (this._length * 0.8) / width;
                width = this._lengths * 0.8;
                height *= factor;
            } else {
                let factor = (this._length * 0.1) / height;
                height = this._length * 0.1;
                width *= factor;
            }
            let material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
            });
            let geometry = new THREE.PlaneBufferGeometry(width, height);
            geometry.rotateX(-Math.PI/2);
            let delta = this._length / 10 * 4.5;
            this._addImage(geometry, material, 0, delta, 0);
            //this._addImage(geometry, material, delta, 0, Math.PI/2);
            this._addImage(geometry, material, 0, -delta, Math.PI);
            //this._addImage(geometry, material, -delta, 0, -Math.PI/2);
        }, () => {}, () => {
                console.error("Can't display logo :(");
        });
        new THREE.TextureLoader().load('/images/potato-logo.png', (texture) => {
            let width = texture.image.width;
            let height = texture.image.height;
            if(width > height) {
                let factor = (this._length * 0.1) / width;
                width = this._length * 0.1;
                height *= factor;
            } else {
                let factor = (this._length * 0.1) / height;
                height = this._length * 0.1;
                width *= factor;
            }
            let material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
            });
            let geometry = new THREE.PlaneBufferGeometry(width, height);
            geometry.rotateX(-Math.PI/2);
            let delta = this._length / 10 * 4.5;
            this._addImage(geometry, material, -delta, delta, 0);
            this._addImage(geometry, material, delta, delta, 0);
            this._addImage(geometry, material, delta, -delta, Math.PI);
            this._addImage(geometry, material, -delta, -delta, Math.PI);
        }, () => {}, () => {
                console.error("Can't display logo :(");
        });
    }

    _createTexture() {
        let length = 256;
        this._canvas.width = length;
        this._canvas.height = length;
        let context = this._canvas.getContext('2d');
        context.fillStyle = "#111111";
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        context.fillStyle = "#ffffff";
        let squareLength = length / 10;
        for(let i = 0; i < 8; i++) {
            for(let j = 0; j < 8; j += 2) {
                let displacement = 1;
                if(i % 2 == 0) {
                    displacement = 0;
                }
                context.fillRect(
                    squareLength * (1 + displacement + j),
                    squareLength * (1 + i),
                    squareLength,
                    squareLength
                );
            }
        }
        context.strokeStyle = "#FFD700";
        context.strokeRect(squareLength, squareLength, squareLength * 8, squareLength * 8);
        this._texture = new THREE.Texture(this._canvas);

        //this._texture = new THREE.TextureLoader().load('/images/textures/chessboard.png');
        //this._texture.anisotropy = 0;
        //this._texture.generateMipmaps = false
        //this._texture.magFilter = THREE.LinearFilter;
        //this._texture.minFilter = THREE.LinearFilter;
        this._texture.needsUpdate = true;
    }

    _createMesh() {
        let geometry = new THREE.BoxBufferGeometry(this._length,this._length/20,this._length);
        let material = new THREE.MeshStandardMaterial({ map: this._texture });
        this._mesh = new THREE.Mesh(geometry, material);
        this._mesh.castShadow = true;
        this._mesh.receiveShadow = true;

        if(this._sideTablesEnabled) {
            geometry = new THREE.BoxBufferGeometry(this._length/5,this._length/20,this._length * 0.8);
            material = new THREE.MeshStandardMaterial({
                color: 0x696969,
                transparent: true,
                opacity: 0.7,
            });
            this._leftSideTableMesh = new THREE.Mesh(geometry, material);
            this._rightSideTableMesh = new THREE.Mesh(geometry, material);
            this._leftSideTableMesh.translateX(-this._length * 0.75);
            this._rightSideTableMesh.translateX(this._length * 0.75);
            this._pivotPoint.add(this._leftSideTableMesh);
            this._pivotPoint.add(this._rightSideTableMesh);
        }

        this._pivotPoint.add(this._mesh);
        this._pivotPoint.position.fromArray(this._position);
        this._pivotPoint.rotation.fromArray(this._rotation);
        
        //Build positions to be used for raycasting
        geometry = new THREE.PlaneBufferGeometry(this._length / 10, this._length / 10);
        let squareLength = this._length / 10;
        for(let i = 0; i < 8; i++) {
            for(let j = 0; j < 8; j++) {
                material = new THREE.MeshBasicMaterial({
                    color: 0xffd700,
                    transparent: true,
                    opacity: 0,
                });
                let position = String.fromCharCode(i + 'a'.charCodeAt(0)) + (j + 1);
                let mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = this._length / 40 + 0.001;
                mesh.position.x = squareLength * (3.5 - i);
                mesh.position.z = -squareLength * (3.5 - j);
                mesh.rotateX(-Math.PI/2);
                mesh.chessPosition = position;
                this.positions[position] = mesh;
                this._pivotPoint.add(mesh);
            }
        }
    }

    _createPhysicsModel() {
        let geometry = new global.PhysX.PxBoxGeometry(
            this._length / 2, this._length / 40, this._length / 2
        );
        let material = global.physics.createMaterial(0.2, 0.2, 0.2)
        let flags = new global.PhysX.PxShapeFlags(
            global.PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            global.PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        let shape = global.physics.createShape(geometry, material, false, flags);
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
        this._physicsModel = global.physics.createRigidStatic(transform);
        this._physicsModel.attachShape(shape);
        this._physicsModel.setId(this.id);
        if(this._sideTablesEnabled) {
            this._leftSideTablePhysicsModel
                = this._createSideTablePhysicsModel(this._leftSideTableMesh);
            this._rightSideTablePhysicsModel
                = this._createSideTablePhysicsModel(this._rightSideTableMesh);
        }
    }

    _createSideTablePhysicsModel(mesh) {
        let position = mesh.position.clone();
        position.applyEuler(this._pivotPoint.rotation);
        position.add(this._pivotPoint.position);

        let geometry = new global.PhysX.PxBoxGeometry(
            this._length / 10, this._length / 40, this._length * 0.4
        );
        let material = global.physics.createMaterial(0.2, 0.2, 0.2)
        let flags = new global.PhysX.PxShapeFlags(
            global.PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
            global.PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
        );
        let shape = global.physics.createShape(geometry, material, false, flags);
        let transform = {
            translation: {
                x: position.x * global.physicsScale,
                y: position.y * global.physicsScale,
                z: position.z * global.physicsScale,
            },
            rotation: {
                w: this._pivotPoint.quaternion.w,
                x: this._pivotPoint.quaternion.x,
                y: this._pivotPoint.quaternion.y,
                z: this._pivotPoint.quaternion.z,
            },
        };
        let physicsModel = global.physics.createRigidStatic(transform);
        physicsModel.attachShape(shape);
        physicsModel.setId(this.id);
        return physicsModel;
    }

    getSquare(raycaster, positions) {
        for(let position in positions) {
            let intersections = raycaster.intersectObject(this.positions[position]);
            if(intersections.length > 0) {
                return this.positions[position];
            }
        }
        return null;
    }

    getSquareFromPiece(piece) {
        let square;
        if(piece) {
            let shortestDistance = this._length / 10;
            let positions = global.chessXR.moves[piece.chessPosition];
            piece.getWorldPosition(this._v1);
            for(let position in positions) {
                this.positions[position].getWorldPosition(this._v2);
                let distance = this._v1.distanceTo(this._v2);
                if(distance < shortestDistance) {
                    square = this.positions[position];
                    shortestDistance = distance;
                }
            }
        }
        return square;
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
        global.physicsScene.addActor(this._physicsModel, null);
        if(this._sideTablesEnabled) {
            global.physicsScene.addActor(this._leftSideTablePhysicsModel, null);
            global.physicsScene.addActor(this._rightSideTablePhysicsModel, null);
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

    update(timeDelta) {
    }
}
