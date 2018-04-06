class TicTacToe {

    constructor(options) {
        let opts = options || {};
        this.match = null;

        this.bindUI(opts.container);
        this.bindEvents();
    }

    bindUI(container) {
        container = container || document;
        this.ui = {
            container: container,
            cells: container.getElementsByClassName("board-cell"),
            board: {
                config: {
                    nine: container.getElementById("3x3"),
                    sixteen: container.getElementById("4x4"),
                },
                nine: container.getElementById("board3x3"),
                sixteen: container.getElementById("board4x4"),
            },
            players: {
                one: container.getElementById("hvsc"),
                two: container.getElementById("hvsh"),
            },
            buttonRestart: container.getElementById("button-restart"),
            status: container.getElementById("status"),
            scores: container.getElementsByClassName("player-score-value")
        };
    }

    bindEvents() {
        Array.prototype.forEach.call(this.ui.cells, (cell) => {
            cell.addEventListener("click", () => this.onCellClick(cell));
        });

        this.ui.players.one.addEventListener("change", () => {
            this.startMatch();
        });
        this.ui.players.two.addEventListener("change", () => {
            this.startMatch();
        });

        this.ui.board.config.nine.addEventListener("change", () => {
            this.startMatch();
        });

        this.ui.board.config.sixteen.addEventListener("change", () => {
            this.startMatch();
        });

        this.ui.buttonRestart.addEventListener("click", () => this.startMatch());
        this.scores = [0, 0];
    }

    getConfigurations() {
        let configs = {
            board: {
                cols: this.ui.board.config.nine.checked ? 3 : 4,
                rows: this.ui.board.config.nine.checked ? 3 : 4,
            },
            players: [{
                id: 0,
                name: "Player 1",
                isHuman: true,
                simbol: "cross"
            }, {
                id: 1,
                name: "Player 2",
                isHuman: this.ui.players.two.checked,
                simbol: "circle"
            }
            ],
            maxDeepth: this.ui.board.config.nine.checked ? 9 : 3,
            startPlayerId: 0,
            connect: this.ui.board.config.nine.checked ? 3 : 3,
        };

        return configs;
    }

    startMatch() {
        this.clearUI();
        this.updateUI();

        let matchOptions = this.getConfigurations();
        this.match = new Match(matchOptions);
        this.winScreen = false;
        this.processingClick = false;
        this.setStatusPlayerTurn(this.match.currentPlayer);
    }

    clearUI() {
        Array.prototype.forEach.call(this.ui.cells, function (cell) {
            cell.className = "board-cell";
        });
    }

    updateUI() {
        if (this.ui.board.config.nine.checked) {
            this.ui.board.nine.className = this.ui.board.nine.className.replace(/\bhidden\b/g, "");
            this.ui.board.sixteen.className += " hidden";
            this.ui.board.current = this.ui.board.nine;
        }
        else if (this.ui.board.config.sixteen.checked) {
            this.ui.board.sixteen.className = this.ui.board.sixteen.className.replace(/\bhidden\b/g, "");
            this.ui.board.nine.className += " hidden";
            this.ui.board.current = this.ui.board.sixteen;
        }

    }

    onCellClick(cell) {

        if (!this.processingClick) {
            if (!this.match.currentPlayer.isThinking && !this.winScreen) {
                this.processingClick = true;
                this.processCurrentPlayerMove(cell);
            }
        }

        this.processingClick = false;
    }

    processCurrentPlayerMove(cell) {
        if (!this.winScreen && !this.match.currentPlayer.isThinking) {
            if (this.match.currentPlayer.isHuman) {
                let square = this.processHumanMove(cell);
                if (square && !this.showWinScreen(square)) {
                    this.match.changePlayer();
                    this.setStatusPlayerTurn(this.match.currentPlayer);

                    if (!this.match.currentPlayer.isHuman)
                        this.processCurrentPlayerMove(null);
                }
            }
            else if (!this.match.currentPlayer.isHuman) {
                setTimeout(() => {
                    let square = this.processComputerMove();
                    if (!this.showWinScreen(square)) {
                        this.match.changePlayer();
                        this.setStatusPlayerTurn(this.match.currentPlayer);
                    }
                }, 100);
            }

        }
    }

    setStatusPlayerTurn(player) {
        let text = "turn";

        if (!player.isHuman) {
            text = "is thinking!";
        }

        this.ui.status.innerHTML = `<span class='player-${player.simbol}'> ${text}</span>`;
    }

    showWinScreen(square) {
        if (square == null) return;
        let winMove = false;
        let move = this.match.getMoveState(square);

        if (this.match.isWinMove(move)) {
            winMove = true;
            this.winScreen = true;
            let squares = [];

            if (move["0"].value === this.match.connectToWin) {
                squares = move["0"].squares;
            }
            if (move["45"].value === this.match.connectToWin) {
                squares = move["45"].squares;
            }
            if (move["90"].value === this.match.connectToWin) {
                squares = move["90"].squares;
            }
            if (move["135"].value === this.match.connectToWin) {
                squares = move["135"].squares;
            }

            for (let i = 0; i < squares.length; i++) {
                let cell = this.getCellFromSquare(squares[i]);
                cell.className += " win-cell";
            }

            this.ui.status.innerHTML = `Player <span class='player-${this.match.currentPlayer.simbol}'></span> Wins!`;
            this.scores[this.match.currentPlayer.id]++;

            let score = this.ui.scores[this.match.currentPlayer.id];
            score.innerText = this.scores[this.match.currentPlayer.id];
        }
        else if (this.match.isDraw()) {
            this.ui.status.innerHTML = `Draw!`;
            winMove = true;
        }

        return winMove;
    }

    processComputerMove() {
        this.match.currentPlayer.isThinking = true;
        let square = this.match.getComputerMove();
        let cell = this.getCellFromSquare(square);
        cell.className += " player-" + this.match.currentPlayer.simbol;

        this.match.currentPlayer.isThinking = false;
        return square;
    }

    getCellFromSquare(square) {
        return this.ui.board.current.querySelectorAll(
            `[data-col="${square.x}"][data-row="${square.y}"]`
        )[0];
    }

    processHumanMove(cell) {
        var square = {
            x: parseInt(cell.getAttribute("data-col")),
            y: parseInt(cell.getAttribute("data-row"))
        }

        var isValideMove = this.match.onSquareClick(
            square,
            this.match.currentPlayer
        );

        if (isValideMove) {
            cell.className += " player-" + this.match.currentPlayer.simbol;
        }
        else {
            square = null;
        }

        return square;
    }
}