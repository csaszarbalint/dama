class Vec2{
    constructor(x,y){
        this.x = x
        this.y = y
    }

    add(vec){
        return new Vec2(this.x + vec.x, this.y + vec.y) 
    }

    subtract(vec){
        return new Vec2(this.x - vec.x, this.y - vec.y) 
    }

    multiply(n){
        return new Vec2(this.x * n, this.y * n)
    }

    get encode(){
        return this.x * 10 + this.y
    }

    static decode(n){
        return new Vec2(parseInt(n / 10), n % 10)
    }
}

class Piece extends HTMLElement{
    constructor(relativePosition, anchorPoint, rotationMatrix){
        super()

        this.anchorPoint = anchorPoint
        this.rotationMatrix = rotationMatrix
        
        this.pos = relativePosition 
        this.moveVectors = []
        this.owner; //group id
    }

    moveBy(vec){
        this.pos = this.pos.add(vec)
    }

    moveTo(vec){
        this.pos = vec 
    }

    #getBoardSpacePosition(){
        const anchorDiff = this.relativePosition.add(this.anchorPoint.multiply(-1))

        const rotatedAnchorDiff = new Vec2(
            Math.round((anchorDiff.x * this.rotationMatrix[0].x + anchorDiff.y * this.rotationMatrix[0].y) * 10) / 10
        ,
            Math.round((anchorDiff.x * this.rotationMatrix[1].x + anchorDiff.y * this.rotationMatrix[1].y) * 10) / 10
        )
        
        return rotatedAnchorDiff.add(this.anchorPoint)
    }

    set pos(vec){
        this.relativePosition = vec

        const boardSpacePosition = this.#getBoardSpacePosition()

        this.style.gridRow = boardSpacePosition.y
        this.style.gridColumn = boardSpacePosition.x
    }

    get pos(){
        return this.position
    }
}

class Marker extends Piece{
    constructor(position, node, onClickAction){
        super(position)
        node.appendChild(this)
        this.classList.add('marker')

        this.node = node
        this.onclick = onClickAction
    }
    delete(){
        this.node.removeChild(this)
    }
}

class CheckersBoard{
    constructor(parentNode){
        this.HEIGHT = 8
        this.WIDTH = 8
        this.SIZE = new Vec2(this.WIDTH-1, this.HEIGHT-1)
        this.BLACK_CELL_STYLE = "cell_black"
        this.WHITE_CELL_STYLE = "cell_white"
        this.BLACK_PIECE_STYLE = "piece_black"
        this.WHITE_PIECE_STYLE = "piece_white"
        this.BLACK_MOVE_VECTORS = [
            new Vec2(-1,1),
            new Vec2(1,1)
        ]
        this.WHITE_MOVE_VECTORS = [
            new Vec2(-1,-1),
            new Vec2(1,-1)
        ]
        this.STARTING_PATTERN = [
            new Vec2(0,2), //2 up
            new Vec2(1,-1), //1 down, 1 left 
            new Vec2(1,-1), //1 down, 1 left 
        ]

        this.ACTION_PIECE_MOVE = (piece, pos) => {
            piece.moveTo(pos)
            this.removeMarkers()
            this.onMoveMade(this.ACTION_PIECE_MOVE)
        }

        this.ACTION_PIECE_TAKEN = (pieceToMove, pos, takenPiece) => {
            this.removePiece(takenPiece);
            pieceToMove.moveTo(pos)
            this.removeMarkers()
            this.onMoveMade(this.ACTION_PIECE_TAKEN)
        }
        
        this.parentNode = parentNode
        this.cells = new Map()
        this.pieces = []
        this.currentTurn = new Turn() 
        this.onMoveMadeCallback = () => {}
    }

    initialize(players) {
        customElements.define("piece-div", Piece)
        customElements.define("marker-div", Marker)

        //layers
        this.background = document.createElement('div')
        this.foreground = document.createElement('div')

        this.foreground.classList.add('layer')
        this.foreground.setAttribute('style',
             'grid-template-columns: repeat(' + this.HEIGHT + ', 1fr);' +
             'grid-template-rows: repeat(' + this.WIDTH + ', 1fr);');

        this.background.classList.add('layer')
        this.background.setAttribute('style',
             'grid-template-columns: repeat(' + this.HEIGHT + ', 1fr);' +
             'grid-template-rows: repeat(' + this.WIDTH + ', 1fr);');

        this.parentNode.appendChild(this.background)
        this.parentNode.appendChild(this.foreground)

        this.generateCells(this.background)
        this.generatePieces(this.foreground, players)
    }

    generatePieces(node, players){
        let currentPos = new Vec2(1,1);
        const angle90 = Math.PI *-1
        const roationMatrix = [
            new Vec2(Math.cos(angle90), -Math.sin(angle90)),
            new Vec2(Math.sin(angle90), Math.cos(angle90))
        ]
        const noRotate = [
            new Vec2(1,0),
            new Vec2(0,1),
        ]

        const middle = new Vec2(4.5,4.5)
        let offset = 0;
        while(true){
            const blackPiece = new Piece(currentPos, middle, noRotate)
            const whitePiece = new Piece(currentPos, middle, roationMatrix)

            blackPiece.classList.add("piece", this.BLACK_PIECE_STYLE)
            blackPiece.addEventListener('click', (e) => this.onPieceClicked(e))
            whitePiece.classList.add("piece", this.WHITE_PIECE_STYLE)
            whitePiece.addEventListener('click', (e) => this.onPieceClicked(e))

            blackPiece.moveVectors = this.BLACK_MOVE_VECTORS
            whitePiece.moveVectors = this.WHITE_MOVE_VECTORS

            blackPiece.owner = players[0]
            whitePiece.owner = players[1] 
            
            this.pieces.push(blackPiece)
            this.pieces.push(whitePiece)

            node.appendChild(blackPiece)
            node.appendChild(whitePiece)

            currentPos = currentPos.add(this.STARTING_PATTERN[offset++])
            if(currentPos.x > this.SIZE.x + 1 || currentPos.y > this.SIZE.y + 1) break;  

            if(offset >= this.STARTING_PATTERN.length) offset = 0
        }

    }

    generateCells(node){
        node.innerHTML = ''
        this.cells = new Map()
        for(let i = 0; i < this.HEIGHT; i++){
            for(let j = 0; j < this.WIDTH; j++){
                const cell = document.createElement('div')
                const pos = new Vec2(j, this.HEIGHT - i - 1)

                this.cells.set(pos.encode, cell)
                cell.pos = pos 

                cell.classList.add('cell')
                cell.classList.add((i+j) % 2 === 1 ? this.BLACK_CELL_STYLE : this.WHITE_CELL_STYLE)

                node.appendChild(cell)
            }
        }

    }

    removePiece(piece){
        this.pieces = this.pieces.filter(e => e != piece)
        this.foreground.removeChild(piece)
        this.currentTurn.pieceTaken = true
    }
    removeMarkers(){
        const markers = this.foreground.querySelectorAll('marker-div')
        for(const m of markers){
            this.foreground.removeChild(m)
        }
    }

    /**
     * 
     * @param {Vec2} vec 
     * @returns 
     * null- if position is outside of play area
     * Piece - if there is a piece under the position  
     * Cell - if there is no peace under the position
     */
    whatIsAtPosition(vec){
        const dV = this.SIZE.subtract(vec)

        if(dV.x > this.SIZE.x || dV.x < 0 ){
            console.warn("Invalid x position")
            console.dir(vec)
            return null
        }
        
        if(dV.y > this.SIZE.y || dV.y < 0 ){
            console.warn("Invalid y position")
            console.dir(vec)
            return null
        }

        for(const piece of this.pieces){
            if(piece.pos.encode == vec.encode) return piece
        }

        return this.cells.get(vec.encode)
    }

    setMarkers(piece){
        let vp = []
        for(const vec of piece.moveVectors){
            const posToCheck = piece.pos.add(vec)

            const objAtPos = this.whatIsAtPosition(posToCheck)

            //outside
            if(!objAtPos) continue

            if(objAtPos instanceof Piece){
                //players own piece
                if(objAtPos.owner === piece.owner) continue  

                //opponents piece
                const posBehindOpponentPiece = posToCheck.add(vec)
                const objBehindOpponentPiece = this.whatIsAtPosition(posBehindOpponentPiece)

                if(objBehindOpponentPiece instanceof Piece || objBehindOpponentPiece == null) continue
                vp.push(new Marker(posBehindOpponentPiece, this.foreground, () => {this.ACTION_PIECE_TAKEN(piece, posBehindOpponentPiece, objAtPos)}))
                continue 
            }

            //nothing there
            vp.push(new Marker(posToCheck, this.foreground, () => {this.ACTION_PIECE_MOVE(piece, posToCheck)}))
        }
        return vp
    }

    //events
    onPieceClicked(e){
        const piece = e.target
        if(piece.owner != this.currentTurn.activePlayer) return

        this.removeMarkers()

        this.setMarkers(piece)
    }
    
    onMoveMade(action){
        this.onMoveMadeCallback(action)
    }
}

class Player{
    constructor(name){
        this.name = name
    }
}

class Turn{
    constructor(activePlayer, inactivePlayer){
        this.activePlayer = activePlayer
        this.inactivePlayer = inactivePlayer

        this.pieceTaken = false
        this.action = () => {}
    }
}
class Game{
    constructor(checkersBoard, player1, player2){
        this.checkersBoard = checkersBoard
        this.checkersBoard.onMoveMadeCallback = (action) => {this.onMoveMadeCallback(action)}

        this.turns = []
        this.turns.push(new Turn(player1, player2))
    }

    start(){
        this.checkersBoard.initialize([this.turns[this.turns.length-1].activePlayer, this.turns[this.turns.length-1].inactivePlayer])
        this.checkersBoard.currentTurn = this.turns[this.turns.length-1]
    }

    checkForWin(){
        //does the inactive player have any pieces left
        return this.checkersBoard.pieces.some(p => p.owner == this.turns[this.turns.length-1].inactivePlayer) == 0 
    }
    
    onWin(){
        alert(this.turns[this.turns.length-1].activePlayer.name + " won")

        const node = this.checkersBoard.parentNode
        node.innerHTML = ''
        this.checkersBoard = new CheckersBoard(node)

        //location.reload() //the laziest shit ever
    }

    onMoveMadeCallback(action){
        const prevTurn = this.turns[this.turns.length-1]

        prevTurn.action = action

        if(this.checkForWin()) return this.onWin()

        if(prevTurn.pieceTaken){
            this.turns.push(new Turn(prevTurn.activePlayer, prevTurn.inactivePlayer))
        }else{
            this.turns.push(new Turn(prevTurn.inactivePlayer, prevTurn.activePlayer))
        }

        this.checkersBoard.currentTurn = this.turns[this.turns.length-1]
    }
}

// Háttérszín váltás (egyszerű)
function changeBackground() {
  document.body.style.backgroundColor =
    document.body.style.backgroundColor === "lightgreen" ? "#c1bfbeff" : "lightgreen";
}

// Tábla szín váltás — a te kódodban a "fekete" cellák osztálya: .cell_black
function changeBoard() {
  document.querySelectorAll(".cell_black").forEach(el => {
    el.classList.toggle("cell_black_alt");
  });
   document.querySelectorAll(".cell_white").forEach(el => {
    el.classList.toggle("cell_white_alt");
  });
}

// Bábuk szín váltás — a te kódodban a bábuk osztályai: .piece_black és .piece_white
function changePieces() {
  document.querySelectorAll(".piece_black").forEach(el => {
    el.classList.toggle("piece_black_alt");
  });
  document.querySelectorAll(".piece_white").forEach(el => {
    el.classList.toggle("piece_white_alt");
  });
}

// Minden visszaállítása alapértelmezettre
function resetAll() {
  // Háttér visszaállítása
  document.body.style.backgroundColor = "#c1bfbeff";

  // Táblaszínek visszaállítása
  document.querySelectorAll(".cell_black_alt").forEach(el => {
    el.classList.remove("cell_black_alt");
  });

  document.querySelectorAll(".cell_white_alt").forEach(el => {
    el.classList.remove("cell_white_alt");
  });

  // Bábuk visszaállítása
  document.querySelectorAll(".piece_black_alt").forEach(el => {
    el.classList.remove("piece_black_alt");
  });
  document.querySelectorAll(".piece_white_alt").forEach(el => {
    el.classList.remove("piece_white_alt");
  });
}


document.body.onload = () => {

    const angle = Math.PI / 2

    const rotation_matrix = [
        new Vec2(Math.cos(angle), -Math.sin(angle)),
        new Vec2(Math.sin(angle), Math.cos(angle))
    ]
    const vec1 = new Vec2(2,1);

    const newVec = new Vec2(
            Math.round(vec1.x * rotation_matrix[0].x + vec1.y * rotation_matrix[0].y,1)
        ,
            Math.round(vec1.x * rotation_matrix[1].x + vec1.y * rotation_matrix[1].y,1)
    )

    console.log(newVec)
    
    const game = new Game(
        new CheckersBoard(document.querySelector('main')),
        new Player('Big'),
        new Player('Balls'))

    game.start()
}