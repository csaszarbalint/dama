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

    rotate(matrix){
        return new Vec2(
            Math.round((this.x * matrix[0].x + this.y * matrix[0].y) * 10) / 10
        ,
            Math.round((this.x * matrix[1].x + this.y * matrix[1].y) * 10) / 10
        )
    }

    get encode(){
        return this.x * 10 + this.y
    }

    static decode(n){
        return new Vec2(parseInt(n / 10), n % 10)
    }
}

class Piece extends HTMLElement{
    constructor(relativePosition, anchorPoint, rotationMatrix, moveVectors, owner){
        super()

        this.anchorPoint = anchorPoint
        this.rotationMatrix = rotationMatrix
        
        this.pos = relativePosition 
        this.moveVectors = moveVectors
        this.owner = owner; //group id

        this.classList.add('piece')
        if(owner) this.classList.add(owner.pieceStyle)
    }

    moveBy(vec){
        this.pos = this.relativePosition.add(vec)
    }

    moveTo(vec){
        this.pos = vec 
    }

    #converToBoardSpace(vec){
        const anchorDiff = vec.subtract(this.anchorPoint)

        const rotatedAnchorDiff = anchorDiff.rotate(this.rotationMatrix)
        
        return rotatedAnchorDiff.add(this.anchorPoint)
    }

    #convertToGridSpace(vec){
        //mirroring to the x axis
        const anchorDiff = vec.subtract(this.anchorPoint)
        anchorDiff.y *= -1
        return anchorDiff.add(this.anchorPoint)
    }

    set pos(vec){
        this.relativePosition = vec

        const boardSpacePosition = this.#converToBoardSpace(this.relativePosition)

        const gridSpacePosition = this.#convertToGridSpace(boardSpacePosition)

        this.style.gridRow = gridSpacePosition.y
        this.style.gridColumn = gridSpacePosition.x
    }

    get pos(){
        return this.#converToBoardSpace(this.relativePosition)
    }

    set moveVectors(arr){
        this.mVectors = arr
    }

    get moveVectors(){
        //return this.mVectors.map(vec => vec.rotate(this.rotationMatrix)) //not the best
        return this.mVectors
    }

    posAfterMove(vec){
        return this.#converToBoardSpace(this.relativePosition.add(vec)) 
    }

    // get positionsToMoveTo(){
    //     return this.mVectors.map(vec => this.#converToBoardSpace(this.relativePosition.add(vec)))
    // }
}

class Marker extends Piece{
    constructor(relativePosition, anchorPoint, rotationMatrix, node, onClickAction){
        super(relativePosition, anchorPoint, rotationMatrix)
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
    constructor(parentNode, size){
        this.SIZE = new Vec2(size.x, size.y)
        this.BLACK_CELL_STYLE = "cell_black"
        this.WHITE_CELL_STYLE = "cell_white"
        this.BLACK_PIECE_STYLE = "piece_black"
        this.WHITE_PIECE_STYLE = "piece_white"

        this.PIECE_MOVE_VECTORS = [
            new Vec2(-1,1),
            new Vec2(1,1)
        ]
        this.KING_MOVE_VECTORS = [
            new Vec2(-1,1),
            new Vec2(1,1),
            new Vec2(-1,-1),
            new Vec2(1,-1)
        ]
        this.STARTING_PATTERN = [
            new Vec2(0,2), //2 up
            new Vec2(1,-1), //1 down, 1 left 
            new Vec2(1,-1), //1 down, 1 left 
        ]

        this.MIDDLE_POINT = new Vec2(4.5, 4.5) //hardcoded cause js don't have a built in median function or smth TODO: fix later

        this.TRANSFORM_NO_ROTATION = [
            new Vec2(1,0),
            new Vec2(0,1),
        ]
        this.TRANSFORM_180_ROTATION = [
            new Vec2(Math.cos(Math.PI), -Math.sin(Math.PI)),
            new Vec2(Math.sin(Math.PI), Math.cos(Math.PI))
        ]

        this.ACTION_PIECE_MOVE = (piece, vec) => {
            piece.moveBy(vec)
            if(piece.relativePosition.y >= this.SIZE.y) 
            {
                piece.moveVectors = this.KING_MOVE_VECTORS
                piece.innerText = 'K'
            }
            this.removeMarkers()
            this.onMoveMade(this.ACTION_PIECE_MOVE)
        }
        this.ACTION_PIECE_TAKEN = (pieceToMove, vec, takenPiece) => {
            this.removePiece(takenPiece);
            pieceToMove.moveBy(vec)
            if(pieceToMove.relativePosition.y >= this.SIZE.y)
            {
                pieceToMove.moveVectors = this.KING_MOVE_VECTORS
                pieceToMove.innerText = 'K'
            }
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
             'grid-template-columns: repeat(' + this.SIZE.y + ', 1fr);' +
             'grid-template-rows: repeat(' + this.SIZE.x + ', 1fr);');

        this.background.classList.add('layer')
        this.background.setAttribute('style',
             'grid-template-columns: repeat(' + this.SIZE.y + ', 1fr);' +
             'grid-template-rows: repeat(' + this.SIZE.x + ', 1fr);');

        this.parentNode.appendChild(this.background)
        this.parentNode.appendChild(this.foreground)

        this.generateCells(this.background)
        this.generatePieces(this.foreground, players)
    }

    generatePieces(node, players){
        let currentPos = new Vec2(1,1);
        let offset = 0;

        while(true){
            const blackPiece = new Piece(currentPos, this.MIDDLE_POINT, this.TRANSFORM_NO_ROTATION, this.PIECE_MOVE_VECTORS, players[0])
            const whitePiece = new Piece(currentPos, this.MIDDLE_POINT, this.TRANSFORM_180_ROTATION, this.PIECE_MOVE_VECTORS, players[1])

            blackPiece.addEventListener('click', (e) => this.onPieceClicked(e))
            whitePiece.addEventListener('click', (e) => this.onPieceClicked(e))
            
            this.pieces.push(blackPiece)
            this.pieces.push(whitePiece)

            node.appendChild(blackPiece)
            node.appendChild(whitePiece)

            currentPos = currentPos.add(this.STARTING_PATTERN[offset++])
            if(currentPos.x > this.SIZE.x || currentPos.y > this.SIZE.y) break;  

            if(offset >= this.STARTING_PATTERN.length) offset = 0
        }

    }

    generateCells(node){
        node.innerHTML = ''
        this.cells = new Map()
        for(let i = 0; i < this.SIZE.y; i++){
            for(let j = 0; j < this.SIZE.x; j++){
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
        if(vec.x > this.SIZE.x || vec.x < 1 ){
            console.warn("Invalid x position")
            console.dir(vec)
            return null
        }
        
        if(vec.y > this.SIZE.y || vec.y < 1 ){
            console.warn("Invalid y position")
            console.dir(vec)
            return null
        }

        for(const piece of this.pieces){
            if(piece.pos.encode == vec.encode) return piece
        }

        return true
    }

    setMarkers(piece){
        let vp = []
        for(const mVec of piece.moveVectors){
            const posToCheck = piece.posAfterMove(mVec)

            const objAtPos = this.whatIsAtPosition(posToCheck)

            //outside
            if(!objAtPos) continue

            if(objAtPos instanceof Piece){
                //players own piece
                if(objAtPos.owner === piece.owner) continue  

                //opponents piece
                const posBehindOpponentPiece = piece.posAfterMove(mVec.multiply(2))
                const objBehindOpponentPiece = this.whatIsAtPosition(posBehindOpponentPiece)

                if(objBehindOpponentPiece instanceof Piece || objBehindOpponentPiece == null) continue
                vp.push(new Marker(
                    posBehindOpponentPiece,
                    this.MIDDLE_POINT,
                    this.TRANSFORM_NO_ROTATION,
                    this.foreground,
                    () => {this.ACTION_PIECE_TAKEN(piece, mVec.multiply(2), objAtPos)}
                ))
                continue 
            }

            //nothing there
            vp.push(new Marker(
                posToCheck,
                this.MIDDLE_POINT,
                this.TRANSFORM_NO_ROTATION,
                this.foreground, 
                () => {this.ACTION_PIECE_MOVE(piece, mVec)}
            ))
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
    constructor(name, pieceStyle){
        this.name = name
        this.pieceStyle = pieceStyle
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


function change(action)
{  
    switch (action) {
    case "background":
      document.body.style.backgroundColor =
      document.body.style.backgroundColor === "lightslategray" ? "darkolivegreen" : "lightslategray";
      break;
    case "board":
      document.querySelectorAll(".cell_black").forEach(el => {
      el.classList.toggle("cell_black_alt");
      });
      document.querySelectorAll(".cell_white").forEach(el => {
      el.classList.toggle("cell_white_alt");
      });
      break;
    case "pieces":
      document.querySelectorAll(".piece_black").forEach(el => {
      el.classList.toggle("piece_black_alt");
      });
      document.querySelectorAll(".piece_white").forEach(el => {
      el.classList.toggle("piece_white_alt");
      });
      break;
    case "reset":
      document.body.style.backgroundColor = "darkolivegreen";

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
      break;
    }
}


document.body.onload = () => {
    const game = new Game(
        new CheckersBoard(document.querySelector('main'), new Vec2(8,8)),
        new Player('Big', 'piece_black'),
        new Player('Balls', 'piece_white'))

    game.start()
}