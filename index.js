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
    }
}

class CheckersBoard{
    constructor(parentNode){
        //these should be one vec2 
        this.HEIGHT = 8
        this.WIDTH = 8
        this.size = new Vec2(this.WIDTH-1, this.HEIGHT-1)
        
        this.parentNode = parentNode

        this.cells = new Map()
        this.whitePieces = []
        this.blackPieces = []

        this.initialize()
    }

    #cellClicked(e){
        console.log(e.target.pos)
    }

    /**
     * 
     */
    initialize() {
        //setting table dimension
        this.parentNode.setAttribute('style',
             'grid-template-columns: repeat(' + this.HEIGHT + ', 1fr);' +
             'grid-template-rows: repeat(' + this.WIDTH + ', 1fr);');

        //generating cells
        for(let i = 0; i < this.HEIGHT; i++){
            for(let j = 0; j < this.WIDTH; j++){
                const cell = document.createElement('div')
                const pos = new Vec2(j, this.HEIGHT - i - 1)

                //probably not a great idea
                this.cells.set(pos.encode, cell)
                cell.pos = pos 

                cell.classList.add('cell')
                cell.classList.add((i+j) % 2 === 1 ? "black" : "white")

                cell.addEventListener('click', this.#cellClicked)

                this.parentNode.appendChild(cell)
            }
        }

        //placeing pieces 
        const pattern = [
            new Vec2(0,2), //2 up
            new Vec2(1,-1), //1 down, 1 left 
            new Vec2(1,-1), //1 down, 1 left 
        ];

        let currentPos = new Vec2(0,0);
        let offset = 0;
        while(true){
            const whitePiece = new Piece(currentPos)
            const blackPiece = new Piece(this.size.add(currentPos.multiply(-1)))

            this.blackPieces.push(blackPiece)
            this.whitePieces.push(whitePiece)

            currentPos = currentPos.add(pattern[offset])
            if(currentPos.x > this.size.x || currentPos.y > this.size.y) break; //exit condition

            if(offset >= pattern.length - 1) offset = -1
            offset++;
        }

    }
}

document.body.onload = () => {
    let a = new CheckersBoard(document.querySelector('main'))
}