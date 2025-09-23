class CheckersBoard{
    constructor(parentNode){
        this.HEIGHT = 8
        this.WIDTH = 8
        
        this.parentNode = parentNode
        this.initialize()
    }

    /**
     * 
     */
    initialize() {
        console.log(this.parentNode) 
        this.parentNode.setAttribute('style',
             'grid-template-columns: repeat(' + this.HEIGHT + ', 1fr);' +
             'grid-template-rows: repeat(' + this.WIDTH + ', 1fr);') 

        for(let i = 0; i < this.HEIGHT; i++){
            for(let j = 0; j < this.WIDTH; j++){
                const cell = document.createElement('div')
                cell.classList.add('cell')
                cell.classList.add((i+j) % 2 === 0 ? "black" : "white")
                this.parentNode.appendChild(cell)
            }
        }
    } 
}

document.body.onload = () => {
    let a = new CheckersBoard(document.querySelector('main'))
}