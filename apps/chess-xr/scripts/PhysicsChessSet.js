import * as THREE from '/library/scripts/three/build/three.module.js';
import PhysicsChessPiece from './PhysicsChessPiece.js';
import PhysicsChessBoard from './PhysicsChessBoard.js';

export default class PhysicsChessSet {
    constructor(params) {
        this._boardLength = (params['Board Length'])
            ? params['Board Length']
            : 1;
        this._position = (params['Position']) ? params['Position'] : [0,0,0];
        this._rotation = (params['Rotation']) ? params['Rotation'] : [0,0,0];
        this._surfaceHeight = this._position[1];
        this._position[1] -= this._boardLength / 40;
        this._chessBoard;
        this._pieces = [];

        this._createAssets();
    }

    _createAssets() {
        this._chessBoard = new PhysicsChessBoard({
            "Length": this._boardLength,
            "Position": this._position,
            "Rotation": this._rotation,
            "Side Tables Enabled": true,
        });

        let pieceHeight = this._boardLength / 40;
        let pawnParams = {
            "Filename": "/library/models/chess_pawn.glb",
            "Chess Position": "h7",
            "Color": 0x333333,
            "Radii": [0.015,0.015,0.005,0.009,0.01,0.008,0.003],
            "Heights": [0.012,0.027,0.0049,0.0049,0.0049,0.0049],
            "Position": [
                -this._boardLength * 7 / 20,
                pieceHeight,
                this._boardLength / 4,
            ],
            "Dead Position": [
                this._boardLength * 14 / 20,
                pieceHeight,
                -this._boardLength * 7 / 20,
            ],
            "Rotation": [0,0,0],
            "Radial Segments": 8,
            "Mass": 40,
            "Center Of Mass Height Scale": 0.5,
            "Scale": this._boardLength * 2,
        };
        let rookParams = {
            "Filename": "/library/models/chess_rook.glb",
            "Chess Position": "h8",
            "Color": 0x333333,
            "Radii": [0.02,0.02,0.01,0.0134,0.0134],
            "Heights": [0.015,0.035,0.005,0.0146],
            "Position": [
                -this._boardLength * 7 / 20,
                pieceHeight,
                this._boardLength * 7 / 20,
            ],
            "Dead Position": [
                this._boardLength * 16 / 20,
                pieceHeight,
                -this._boardLength * 7 / 20,
            ],
            "Rotation": [0,0,0],
            "Radial Segments": 8,
            "Mass": 40,
            "Center Of Mass Height Scale": 0.5,
            "Scale": this._boardLength * 2,
        };
        let knightParams = {
            "Filename": "/library/models/chess_knight.glb",
            "Chess Position": "g8",
            "Color": 0x333333,
            "Radii": [0.02,0.02,0.0145,0.019,0.0183,0.015,0.021,0.021,0.011,0.001],
            "Heights": [0.013,0.008,0.004,0.0075,0.0058,0.0165,0.008,0.0075,0.002],
            "Position": [
                -this._boardLength / 4,
                pieceHeight,
                this._boardLength * 7 / 20,
            ],
            "Dead Position": [
                this._boardLength * 16 / 20,
                pieceHeight,
                -this._boardLength / 4,
            ],
            "Rotation": [0,0,0],
            "Radial Segments": 8,
            "Mass": 40,
            "Center Of Mass Height Scale": 0.5,
            "Scale": this._boardLength * 2,
        };
        let bishopParams = {
            "Filename": "/library/models/chess_bishop.glb",
            "Chess Position": "f8",
            "Color": 0x333333,
            "Radii": [0.02,0.02,0.0072,0.0105,0.0113,0.0078,0.003],
            "Heights": [0.015,0.046,0.007,0.007,0.007,0.0065],
            "Position": [
                -this._boardLength * 3 / 20,
                pieceHeight,
                this._boardLength * 7 / 20,
            ],
            "Dead Position": [
                this._boardLength * 16 / 20,
                pieceHeight,
                -this._boardLength * 3 / 20,
            ],
            "Rotation": [0,0,0],
            "Radial Segments": 8,
            "Mass": 40,
            "Center Of Mass Height Scale": 0.5,
            "Scale": this._boardLength * 2,
        };
        let kingParams = {
            "Filename": "/library/models/chess_king.glb",
            "Chess Position": "e8",
            "Color": 0x333333,
            "Radii": [0.0225,0.0225,0.008,0.0127,0.008, 0.008],
            "Heights": [0.012,0.049,0.016,0.008,0.0126],
            "Position": [
                -this._boardLength / 20,
                pieceHeight,
                this._boardLength * 7 / 20,
            ],
            "Dead Position": [
                this._boardLength * 16 / 20,
                pieceHeight,
                -this._boardLength / 20,
            ],
            "Rotation": [0,Math.PI/2,0],
            "Radial Segments": 8,
            "Mass": 40,
            "Center Of Mass Height Scale": 0.5,
            "Scale": this._boardLength * 2,
        };
        let queenParams = {
            "Filename": "/library/models/chess_queen.glb",
            "Chess Position": "d8",
            "Color": 0x333333,
            "Radii": [0.021,0.021,0.0078,0.0116,0.001],
            "Heights": [0.012,0.052,0.016,0.0095],
            "Position": [
                this._boardLength / 20,
                pieceHeight,
                this._boardLength * 7 / 20,
            ],
            "Dead Position": [
                this._boardLength * 16 / 20,
                pieceHeight,
                this._boardLength / 20,
            ],
            "Rotation": [0,0,0],
            "Radial Segments": 8,
            "Mass": 40,
            "Center Of Mass Height Scale": 0.5,
            "Scale": this._boardLength * 2,
        };
        for(let i = 0; i < 8; i++) {
            let pawn = this._addWithRotation(pawnParams);
            this._pieces.push(pawn);
            pawnParams['Position'][0] += this._boardLength / 10;
            pawnParams['Dead Position'][2] += this._boardLength / 10;
            pawnParams['Chess Position'] = String.fromCharCode(
                pawnParams['Chess Position'].charCodeAt(0) - 1) + "7";
        }
        pawnParams['Color'] = 0xcccccc;
        pawnParams['Position'][2] -= this._boardLength / 2;
        pawnParams['Dead Position'][0] -= this._boardLength * 28 / 20;
        for(let i = 0; i < 8; i++) {
            pawnParams['Position'][0] -= this._boardLength / 10;
            pawnParams['Dead Position'][2] -= this._boardLength / 10;
            pawnParams['Chess Position'] = String.fromCharCode(
                pawnParams['Chess Position'].charCodeAt(0) + 1) + "2";
            let pawn = this._addWithRotation(pawnParams);
            this._pieces.push(pawn);
        }
        this._addDuos(rookParams, 'a', 'h');
        this._addDuos(knightParams, 'b', 'g');
        this._addDuos(bishopParams, 'c', 'f');
        this._addRoyalty(kingParams);
        this._addRoyalty(queenParams);
    }

    _setPositionWithQuaternion(fieldName, quaternion) {

    }

    //Set local position, then rotate with board, then translate with board
    _addWithRotation(params) {
        let scale = new THREE.Vector3(1,1,1);
        let vec3 = new THREE.Vector3();
        let euler = new THREE.Euler();
        let quaternion = new THREE.Quaternion();
        let quaternion2 = new THREE.Quaternion();
        let matrix4 = new THREE.Matrix4();
        let parentMatrix4 = new THREE.Matrix4();

        //vec3.fromArray(this._position);
        euler.fromArray(this._rotation);
        quaternion.setFromEuler(euler);
        parentMatrix4.compose(vec3, quaternion, scale);

        let oldPosition = params['Position'];
        let oldDeadPosition = params['Dead Position'];
        let oldRotation = params['Rotation'];
        vec3.fromArray(oldPosition);
        euler.fromArray(oldRotation);
        quaternion.setFromEuler(euler);
        quaternion2.setFromEuler(euler);
        matrix4.compose(vec3, quaternion, scale);

        matrix4.premultiply(parentMatrix4);
        matrix4.decompose(vec3, quaternion, scale);
        euler.setFromQuaternion(quaternion);

        params['Rotation'] = euler.toArray();
        params['Position'] = vec3.toArray();
        params['Position'][0] += this._position[0];
        params['Position'][1] += this._position[1];
        params['Position'][2] += this._position[2];

        vec3.fromArray(oldDeadPosition);
        matrix4.compose(vec3, quaternion2, scale);
        matrix4.premultiply(parentMatrix4);
        matrix4.decompose(vec3, quaternion2, scale);
        
        params['Dead Position'] = vec3.toArray();
        params['Dead Position'][0] += this._position[0];
        params['Dead Position'][1] += this._position[1];
        params['Dead Position'][2] += this._position[2];
        let piece = new PhysicsChessPiece(params);
        params['Rotation'] = oldRotation;
        params['Position'] = oldPosition;
        params['Dead Position'] = oldDeadPosition;
        return piece;
    }

    _addDuos(params, leftLetter, rightLetter) {
        let piece = this._addWithRotation(params);
        this._pieces.push(piece);
        params['Position'][0] *= -1;
        params['Dead Position'][2] *= -1;
        params['Chess Position'] = leftLetter + "8";
        piece = this._addWithRotation(params);
        this._pieces.push(piece);
        params['Position'][2] -= this._boardLength * 14 / 20;
        params['Dead Position'][0] -= this._boardLength * 32 / 20;
        params['Chess Position'] = leftLetter + "1";
        params['Rotation'][1] = Math.PI;
        params['Color'] = 0xcccccc;
        piece = this._addWithRotation(params);
        this._pieces.push(piece);
        params['Position'][0] *= -1;
        params['Dead Position'][2] *= -1;
        params['Chess Position'] = rightLetter + "1";
        piece = this._addWithRotation(params);
        this._pieces.push(piece);
    }

    _addRoyalty(params) {
        let piece = this._addWithRotation(params);
        this._pieces.push(piece);
        params['Position'][2] -= this._boardLength * 14 / 20;
        params['Dead Position'][0] -= this._boardLength * 32 / 20;
        params['Chess Position'] = params['Chess Position'].charAt(0) + "1";
        params['Color'] = 0xcccccc;
        piece = this._addWithRotation(params);
        this._pieces.push(piece);
    }

    addToScene(parent) {
        this._chessBoard.addToScene(parent);
        for(let i = 0; i < this._pieces.length; i++) {
            this._pieces[i].addToScene(parent);
        }
    }

    wakeUp() {
        for(let i = 0; i < this._pieces.length; i++) {
            this._pieces[i].wakeUp();
        }
    }

    update(timeDelta) {
        for(let i = 0; i < this._pieces.length; i++) {
            this._pieces[i].update(timeDelta);
        }
    }
}
