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
    constructor(position){
        super()

        this.onPositionSet = () => {};
        
        this.pos = position
        this.moveVectors = []
        this.owner; //group id
    }

    moveBy(vec){
        this.pos = this.pos.add(vec)
    }

    moveTo(vec){
        this.pos = vec 
    }

    set pos(vec){
        this.position = vec
        this.style.gridRow = 8 - this.position.y //TODO: remove magic number 
        this.style.gridColumn = this.position.x + 1
        this.onPositionSet(this.position)
    }

    get pos(){
        return this.position
    }
}

class Move{
    constructor(position, action){
        this.pos = position
        this.action = action
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
        
        this.parentNode = parentNode

        //layers
        this.foreground = document.createElement('div')
        this.background = document.createElement('div')

        this.cells = new Map()
        this.pieceDivLookup = new Map()
        this.markers = new Map() 

        this.pieces = []
        this.validMoves = []

        this.initialize()

    }

    initialize() {
        customElements.define("piece-div", Piece)

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
        this.generateMarkers(this.foreground)
        this.generatePieces(this.foreground)
    }

    generatePieces(node){
        let currentPos = new Vec2(0,0);
        let offset = 0;
        while(true){
            const blackPiece = new Piece(currentPos)
            const whitePiece = new Piece(this.SIZE.add(currentPos.multiply(-1)))

            blackPiece.classList.add("piece", this.BLACK_PIECE_STYLE)
            blackPiece.addEventListener('click', (e) => this.onPieceClicked(e))
            whitePiece.classList.add("piece", this.WHITE_PIECE_STYLE)
            whitePiece.addEventListener('click', (e) => this.onPieceClicked(e))

            blackPiece.moveVectors = this.BLACK_MOVE_VECTORS
            whitePiece.moveVectors = this.WHITE_MOVE_VECTORS

            blackPiece.owner = "black" //TODO: remove these magic values
            whitePiece.owner = "white"
            
            this.pieces.push(blackPiece)
            this.pieces.push(whitePiece)

            node.appendChild(blackPiece)
            node.appendChild(whitePiece)

            currentPos = currentPos.add(this.STARTING_PATTERN[offset++])
            if(currentPos.x > this.SIZE.x || currentPos.y > this.SIZE.y) break;  

            if(offset >= this.STARTING_PATTERN.length) offset = 0
        }

    }

    generateMarkers(node){
        for(let i = 0; i <= this.SIZE.x; i++){
            for(let j = 0; j <= this.SIZE.y; j++){
                const marker = new Piece(new Vec2(i,j))

                marker.classList.add('piece')
                marker.classList.add('marker')
                marker.addEventListener('click', (e) => {this.onMarkerClicked(e)})

                this.markers.set(marker.pos.encode, marker)
                this.foreground.appendChild(marker)
            }
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

    getValidPositions(piece){
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
                vp.push(new Move(posBehindOpponentPiece, () => {
                    this.removePiece(objAtPos);
                    piece.moveTo(posBehindOpponentPiece)
                }))
                continue 
            }

            //nothing there
            vp.push(new Move(posToCheck, () => {piece.moveTo(posToCheck)}))
        }
        return vp
    }

    //events
    onPieceClicked(e){
        const piece = e.target

        this.validMoves = this.getValidPositions(piece) 
        for(let e of this.validMoves){
            this.markers.get(e.pos.encode).classList.add('active_marker')
        }
    }

    onMarkerClicked(e){
        if(this.validMoves == []) return
        for(const move of this.validMoves){
            if(move.pos.encode === e.target.pos.encode)
                move.action()
        }
        for(const m of this.markers){
            m[1].classList.remove('active_marker')
        }
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
    new CheckersBoard(document.querySelector('main'))
}