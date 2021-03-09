importScripts('./chess.js');
class ChessAI {
    constructor() {
        this._game = new Chess();
        this._minimaxDepth = 0;
        this._setup();
    }

    _setup() {
        let reverseArray = function(array) {
            return array.slice().reverse();
        };

        this._whitePawnEval =
            [
                [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
                [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
                [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
                [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
                [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
                [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
                [0.5,  1.0,  1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
                [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
            ];

        this._blackPawnEval = reverseArray(this._whitePawnEval);

        this._knightEval =
            [
                [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
                [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
                [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
                [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
                [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
                [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
                [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
                [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
            ];

        this._whiteBishopEval = [
            [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
            [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
            [ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
            [ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
            [ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
            [ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
            [ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
            [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
        ];

        this._blackBishopEval = reverseArray(this._whiteBishopEval);

        this._whiteRookEval = [
            [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
            [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
            [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
            [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
            [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
            [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
            [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
            [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
        ];

        this._blackRookEval = reverseArray(this._whiteRookEval);

        this._evalQueen = [
            [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
            [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
            [ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
            [ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
            [  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
            [ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
            [ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
            [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
        ];

        this._whiteKingEval = [

            [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
            [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
            [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
            [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
            [ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
            [ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
            [  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
            [  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
        ];

        this._blackKingEval = reverseArray(this._whiteKingEval);
    }

    setDepth(depth) {
        this._minimaxDepth = depth;
    }

    calculateBestMove(fen) {
        this._game = new Chess(fen);
	    let possibleNextMoves = this._game.moves();
	    let bestMove = -9999;
	    let bestMoveFound;

	    for(let i = 0; i < possibleNextMoves.length; i++) {
	        let possibleNextMove = possibleNextMoves[i]
	        this._game.move(possibleNextMove);
	        let value = this._minimax(this._minimaxDepth, -10000, 10000, false);
	        this._game.undo();
	        if(value >= bestMove) {
	            bestMove = value;
	            bestMoveFound = possibleNextMove;
	        }
	    }
	    return bestMoveFound;
	}

    _minimax(depth, alpha, beta, isMaximisingPlayer) {
	    if (depth === 0) {
	        return -this._evaluateBoard(this._game.board());
	    }
	    let possibleNextMoves = this._game.moves();
	    let numPossibleMoves = possibleNextMoves.length
        let bestMove;
	    if (isMaximisingPlayer) {
	        bestMove = -9999;
	        for (let i = 0; i < numPossibleMoves; i++) {
	            this._game.move(possibleNextMoves[i]);
	            bestMove = Math.max(bestMove, this._minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
	            this._game.undo();
	            alpha = Math.max(alpha, bestMove);
	            if(beta <= alpha){
	            	return bestMove;
	            }
	        }
	    } else {
	        bestMove = 9999;
	        for (let i = 0; i < numPossibleMoves; i++) {
	            this._game.move(possibleNextMoves[i]);
	            bestMove = Math.min(bestMove, this._minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
	            this._game.undo();
	            beta = Math.min(beta, bestMove);
	            if(beta <= alpha){
	            	return bestMove;
	            }
	        }
	    }
		return bestMove;
	}

    _evaluateBoard(board) {
	    let totalEvaluation = 0;
	    for (let i = 0; i < 8; i++) {
	        for (let j = 0; j < 8; j++) {
	            totalEvaluation = totalEvaluation + this._getPieceValue(board[i][j], i, j);
	        }
	    }
	    return totalEvaluation;
	}

    _getPieceValue(piece, x, y) {
	    if (piece === null) {
	        return 0;
	    }
	    let absoluteValue = this._getAbsoluteValue(piece, piece.color === 'w', x ,y);
	    if(piece.color === 'w'){
	    	return absoluteValue;
	    } else {
	    	return -absoluteValue;
	    }
	}

    _getAbsoluteValue(piece, isWhite, x ,y) {
        if (piece.type === 'p') {
            return 10 + ( isWhite
                ? this._whitePawnEval[y][x]
                : this._blackPawnEval[y][x] );
        } else if (piece.type === 'r') {
            return 50 + ( isWhite
                ? this._whiteRookEval[y][x]
                : this._blackRookEval[y][x] );
        } else if (piece.type === 'n') {
            return 30 + this._knightEval[y][x];
        } else if (piece.type === 'b') {
            return 30 + ( isWhite
                ? this._whiteBishopEval[y][x]
                : this._blackBishopEval[y][x] );
        } else if (piece.type === 'q') {
            return 90 + this._evalQueen[y][x];
        } else if (piece.type === 'k') {
            return 900 + ( isWhite
                ? this._whiteKingEval[y][x]
                : this._blackKingEval[y][x] );
        }
	}

}

let chessAI = new ChessAI();
onmessage = function(e) {
    let data = e.data;
    if(data.key == "setDepth") {
        chessAI.setDepth(data.value);
    } else if(data.key == "calculateBestMove") {
        postMessage({ key: "calculateBestMove", value: chessAI.calculateBestMove(data.value) });
    }
};
