class CheckersBoard{
    constructor(heigth, width, parentNode){
        this.heigth = heigth 
        this.width = width 
        this.parentNode = parentNode
        this.initialize()
    }

    /**
     * 
     */
    initialize() {
        console.log(this.parentNode) 
        this.parentNode.style = `grid-template-columns: repeat(${this.heigth}, 50px);`
        this.parentNode.style = `grid-template-rows: repeat(${this.width}, 50px);`

        for(let i = 0; i < this.heigth; i++){
            for(let j = 0; j < this.width; j++){
                const cell = document.createElement('div')
                cell.className = 'cell'
                cell.style.backgroundColor = (this.heigth + this.width) % 2 === 0 ? "black" : "white"
                this.parentNode.appendChild(cell)
            }
        }
    } 
}

document.body.onload = () => {
    new CheckersBoard(8, 8, document.querySelector('main'))
}