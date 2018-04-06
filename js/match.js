class Match {
    constructor(options) {
        options = options || {};
        this._validateOptions(options);
        this._init(options);
        this.moveHistory = [];
        this.count = 0;
    }

    _init(options) {
        this.maxDeepth = options.maxDeepth;
        this.board = options.board;
        this.board.state = Array(this.board.rows).fill().map(()=>Array(this.board.cols).fill(-1));
        this.board.numberSquares =  this.board.cols*this.board.rows
        this.players = options.players;
        this.connectToWin = options.connect;
        this.currentPlayer = this.players[options.startPlayerId];
    }

    _validateOptions(options) {
        options.board = options.board || {rows: 3, cols: 3}
        options.connect = options.connect || 3;
        options.players = options.players || [{
            id: 0,
            name: "Player 1",
            isHuman: true,
            simbol: "cross",
        },{
            id: 1,
            name: "Player 2",
            isHuman: true,
            simbol: "circle"
        }];
        options.maxDeepth = options.maxDeepth || 9;
        options.startPlayerId = options.startPlayerId || 0;
    }

    onSquareClick(square,player) {
        let isValideMove = this.isValideMove(square)
        
        if(isValideMove) {
            this.makeMove(square,player);
        }

        return isValideMove;
    }

    changePlayer() {
        let currentPlayerId = this.currentPlayer.id;
        let nextPlayerId = currentPlayerId + 1;
        if( nextPlayerId >= this.players.length )
            nextPlayerId = 0;

        this.currentPlayer = this.players[nextPlayerId];
    }

    _getNextPlayer(player) {
        let currentPlayerId = player.id;
        let nextPlayerId = currentPlayerId + 1;
        if( nextPlayerId >= this.players.length )
            nextPlayerId = 0;

        return this.players[nextPlayerId];
    }

    isValideMove(square,board) {
        board = board || this.board;
        return board.state[square.y][square.x] === -1;
    }

    makeMove(square,player) {
        this.board.state[square.y][square.x] = player.id;

        this.moveHistory.push({
            time: new Date(),
            playerId: player.id,
            move: square
        });
    }

    getMoveState(square,playerId,board) {
        if( playerId !== 0 )
            playerId = playerId || this.currentPlayer.id;
        board = board || this.board;

        let state = board.state;
        let cols = board.cols;
        let rows = board.rows;

        let result = {
            "0":  { value: 0, squares: [] },
            "45": { value: 0, squares: [] },
            "90": { value: 0, squares: [] },
            "135":{ value: 0, squares: [] },
        };
        
        for(let i= 0; square.x+i < cols && state[square.y][square.x+i] == playerId; i++ ) {
            result["0"].value += 1;
            result["0"].squares.push({x: square.x+i, y: square.y});
        }
        for(let i = 1; square.x-i >= 0 && state[square.y][square.x-i] == playerId; i++ ) {
            result["0"].value += 1;
            result["0"].squares.push({x: square.x-i, y: square.y});
        }
        
        for(
            let i= 0;
            square.y - i >= 0
            && square.x + i < cols
            && state[square.y-i][square.x+i] == playerId;
            i++
        ) {
            result["45"].value += 1;
            result["45"].squares.push({x: square.x+i, y: square.y-i});
        }

        for(
            let i = 1;
            square.y + i < rows
            && square.x - i < cols
            && state[square.y+i][square.x-i] == playerId;
        i++ ) {
            result["45"].value += 1;
            result["45"].squares.push({x: square.x-i, y: square.y+i});
        }

        for(let i= 0; square.y+i < rows && state[square.y+i][square.x] == playerId; i++ ) {
            result["90"].value += 1;
            result["90"].squares.push({x: square.x, y: square.y+i});
        }
        for(let i= 1; square.y-i >= 0 && state[square.y-i][square.x] == playerId; i++ ) {
            result["90"].value += 1;
            result["90"].squares.push({x: square.x, y: square.y-i});
        }

        for(
            let i= 0;
            square.y-i >= 0 && square.x-i >= 0 && state[square.y-i][square.x-i] == playerId;
            i++
        ){
            result["135"].value += 1;
            result["135"].squares.push({x: square.x-i, y: square.y-i});
        }

        for(
            let i = 1;
            square.y+i < rows && square.x+i < cols && state[square.y+i][square.x+i] == playerId;
            i++
        ) {
            result["135"].value += 1;
            result["135"].squares.push({x: square.x+i, y: square.y+i});
        }

        return result;
    }

    isWinMove(moveState) {
        let isWinMove = false;
        
        isWinMove = 
            moveState["0"].value >= this.connectToWin
            || moveState["45"].value >= this.connectToWin
            || moveState["90"].value >= this.connectToWin
            || moveState["135"].value >= this.connectToWin;
            
        return isWinMove;
    }


    _scoreMove(board,player,deepth,move) {
        let moveState = this.getMoveState(move,player.id,board);
        let moveStateScore = this._scoreMoveState(board,player,moveState);
        let availableMoves = this._getAvailableMoves(board);
        let score = moveStateScore;
        let drawScore = 0;

        if( availableMoves.length === 0 && score != 20) {
            score = drawScore;
        }

        if( score !== null ) {
            score = !player.isHuman ? score - deepth : deepth-score;
        }

        return score;
    }

    isDraw() {
        return this._getAvailableMoves(this.board).length === 0;
    }

    _scoreMoveState(board,player,moveState) {
        let isWinMove = false;
        let score = null;
    
        isWinMove = 
            moveState["0"].value >= this.connectToWin
            || moveState["45"].value >= this.connectToWin
            || moveState["90"].value >= this.connectToWin
            || moveState["135"].value >= this.connectToWin;
        
        if( isWinMove ) {
            score = 20;
        }
    
        return score;
    }

    getComputerMove() {
        this.currentPlayer.isThinking = true;
        
        let square = null;

        if( this.moveHistory.length < this.board.rows * this.board.cols) {
            square = this._smartComputerMove(this.currentPlayer,this.board);
            if( square === null ) {
                square = this._randomComputerMove(this.currentPlayer,this.board);
            }
            if( square !== null ) {
                this.makeMove(square,this.currentPlayer);
            }
        }

        this.currentPlayer.isThinking = false;
        return square;
    }

    _randomComputerMove(player,board) {
        let square = null;
        let availableMoves = this._getAvailableMoves(board);

        if( availableMoves.length > 0 ) {
            let randomIndex = Math.round(Math.random() * (availableMoves.length-1));
            square = availableMoves[randomIndex];
        }

        return square;
    }
    
    _smartComputerMove(player,board) {
        let square = null;
        square = this.minmax(board,player,0);

        return square;
    }

    _getAvailableMoves(board) {
        let squares = [];
        
        for(let y=0; y<board.rows; y++) {
            for(let x=0;x<board.cols; x++) {
                if( board.state[y][x] === -1 ) {
                    squares.push({
                        x:x,
                        y:y
                    });
                }
            }
        }

        return squares;
    }

    minmax(board, player, deepth) {
        let moves = [];

        let emptySquares = this._getAvailableMoves(board);
        for(let i=0; i<emptySquares.length;i++) {
            let move = emptySquares[i]; 

            board.state[move.y][move.x] = player.id;

            let score = this._scoreMove(board,player,deepth,move);
            if( score != null ) {
                move.score = score;
                move.player = player;
                moves.push(move);
            }

            board.state[move.y][move.x] = -1;
        }

        for(let i=0; i<emptySquares.length;i++) {
            let move = emptySquares[i]; 

            board.state[move.y][move.x] = player.id;

            if( deepth <=  this.maxDeepth && !move.player) {
                let minmax = this.minmax(board,this._getNextPlayer(player), deepth + 1);
                if( minmax != null ) {
                    move.score = minmax.score;
                
                    move.player = minmax.player;
                    moves.push(move);
                }
            }

            board.state[move.y][move.x] = -1;
        }

        let bestMove = this._getBestMove(moves,player);

        return bestMove;
    }

    _getBestMove(moves,player) {
        let bestMove = null;

        if( !player.isHuman ) {
            let bestRating = -1000;
            for(let i=0;i<moves.length;i++) {
                let move = moves[i];
                if( move.score > bestRating ) {
                    bestMove = move;
                    bestRating = move.score;
                }
            }
        }
        else {
            let bestRating = 1000;
            for(let i=0;i<moves.length;i++) {
                let move = moves[i];
                if( move.score < bestRating ) {
                    bestMove = move;
                    bestRating = move.score;
                }
            }
        }
 
        return bestMove;
    }
}