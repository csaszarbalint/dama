class Vec2{
    constructor(x,y){
        this.x = x
        this.y = y
    }

    add(vec){
        return new Vec2(this.x + vec.x, this.y + vec.y) 
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

class Piece{
    constructor(position){
        this.pos = position
        this.div;
        this.moveVectors = []
    }

    moveBy(vec){
        this.pos = this.pos.add(vec)
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
        
        this.parentNode = parentNode

        this.cells = new Map()
        this.pieceDivLookup = new Map()
        this.whitePieces = []
        this.blackPieces = []

        this.initialize()

        this.render()

        this.blackPieces[1].moveBy(new Vec2(0,1))

        debugger
        this.render()
    }

    initialize() {
        //setting table dimension
        this.parentNode.setAttribute('style',
             'grid-template-columns: repeat(' + this.HEIGHT + ', 1fr);' +
             'grid-template-rows: repeat(' + this.WIDTH + ', 1fr);');

        //placeing pieces 
        const pattern = [
            new Vec2(0,2), //2 up
            new Vec2(1,-1), //1 down, 1 left 
            new Vec2(1,-1), //1 down, 1 left 
        ];

        let currentPos = new Vec2(0,0);
        let offset = 0;
        while(true){
            const blackPiece = new Piece(currentPos)
            const whitePiece = new Piece(this.SIZE.add(currentPos.multiply(-1)))

            blackPiece.div = document.createElement('div')
            blackPiece.div.classList.add("piece", this.BLACK_PIECE_STYLE)
            blackPiece.div.addEventListener('click', this.onPieceClicked)
            blackPiece.div.piece = blackPiece

            whitePiece.div = document.createElement('div')
            whitePiece.div.classList.add("piece", this.WHITE_PIECE_STYLE)
            whitePiece.div.addEventListener('click', this.onPieceClicked)
            whitePiece.div.piece = whitePiece 

            blackPiece.moveVectors = this.BLACK_MOVE_VECTORS
            whitePiece.moveVectors = this.WHITE_MOVE_VECTORS

            this.blackPieces.push(blackPiece)
            this.whitePieces.push(whitePiece)

            currentPos = currentPos.add(pattern[offset])
            if(currentPos.x > this.SIZE.x || currentPos.y > this.SIZE.y) break;  

            if(offset >= pattern.length - 1) offset = -1
            offset++;
        }
    }

    generateCells(){
        this.cells = new Map()
        for(let i = 0; i < this.HEIGHT; i++){
            for(let j = 0; j < this.WIDTH; j++){
                const cell = document.createElement('div')
                const pos = new Vec2(j, this.HEIGHT - i - 1)

                this.cells.set(pos.encode, cell)
                cell.pos = pos 

                cell.classList.add('cell')
                cell.classList.add((i+j) % 2 === 1 ? this.BLACK_CELL_STYLE : this.WHITE_CELL_STYLE)

                this.parentNode.appendChild(cell)
            }
        }

    }

    render(){
        while (this.parentNode.firstChild) {
            this.parentNode.removeChild(this.parentNode.lastChild);
        }
        this.generateCells()
        for(const piece of this.blackPieces.concat(this.whitePieces)){
            this.cells.get(piece.pos.encode).appendChild(piece.div)
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
    let a = new CheckersBoard(document.querySelector('main'))
}