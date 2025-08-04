export class DragDrop {
    constructor(app) {
        this.app = app;
        this.draggedCard = null;
        this.isDragging = false;
        this.ghost = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.originalParent = null;
        this.originalNextSibling = null;
        this.originalColumn = null;
    }

    setupEventListeners() {
        this.app.board.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        const card = e.target.closest('.card');
        if (card && e.button === 0 && !e.target.closest('.card-delete')) {
            e.preventDefault();
            
            this.isDragging = true;
            this.draggedCard = card;
            
            this.originalParent = card.parentNode;
            this.originalNextSibling = card.nextSibling;
            this.originalColumn = card.closest('.column').dataset.column;
            
            const rect = card.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            
            this.createGhost(card);
            card.remove();
            
            document.body.classList.add('dragging');
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.ghost) return;
        
        this.ghost.style.left = (e.clientX - this.offsetX) + 'px';
        this.ghost.style.top = (e.clientY - this.offsetY) + 'px';
        
        this.updateDropZones(e);
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        if (this.ghost) {
            this.ghost.remove();
            this.ghost = null;
        }
        
        document.body.classList.remove('dragging');
        
        this.moveCard(e);
        
        this.clearDropZones();
        
        this.draggedCard = null;
        this.originalParent = null;
        this.originalNextSibling = null;
        this.originalColumn = null;
    }

    createGhost(card) {
        this.ghost = card.cloneNode(true);
        this.ghost.classList.add('ghost-card');
        this.ghost.style.position = 'fixed';
        this.ghost.style.pointerEvents = 'none';
        this.ghost.style.zIndex = '9999';
        this.ghost.style.opacity = '0.9';
        this.ghost.style.transform = 'rotate(3deg)';
        this.ghost.style.boxShadow = '0 8px 24px rgba(9, 30, 66, 0.25)';
        this.ghost.style.border = '2px solid #0079bf';
        this.ghost.style.backgroundColor = 'white';
        this.ghost.style.width = card.offsetWidth + 'px';
        this.ghost.style.height = card.offsetHeight + 'px';
        document.body.append(this.ghost);
    }

    updateDropZones(e) {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('active');
            zone.style.height = '8px';
        });

        const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
        let activeDropZone = null;

        if (elementUnderMouse?.classList.contains('drop-zone')) {
            activeDropZone = elementUnderMouse;
        } else {
            const card = elementUnderMouse?.closest('.card');
            if (card) {
                const rect = card.getBoundingClientRect();
                const mouseY = e.clientY;
                
                if (mouseY < rect.top + rect.height / 2) {
                    activeDropZone = card.previousElementSibling;
                } else {
                    activeDropZone = card.nextElementSibling;
                }
            } else {
                const column = elementUnderMouse?.closest('.column');
                if (column) {
                    const cardsContainer = column.querySelector('.cards-container');
                    if (cardsContainer) {
                        const cards = cardsContainer.querySelectorAll('.card');
                        if (cards.length > 0) {
                            activeDropZone = cards[cards.length - 1].nextElementSibling;
                        } else {
                            activeDropZone = cardsContainer.querySelector('.drop-zone');
                        }
                    }
                }
            }
        }

        if (activeDropZone && activeDropZone.classList.contains('drop-zone')) {
            activeDropZone.classList.add('active');
            activeDropZone.style.height = '60px';
        }
    }

    moveCard(e) {
        const activeDropZone = document.querySelector('.drop-zone.active');
        
        if (!activeDropZone || !this.draggedCard) {
            this.returnCardToOriginalPosition();
            return;
        }

        const cardsContainer = activeDropZone.parentElement;
        const targetColumn = cardsContainer.closest('.column').dataset.column;
        const cardId = this.draggedCard.dataset.cardId;

        let sourceColumn = null;
        for (const col in this.app.state.columns) {
            if (this.app.state.columns[col].some(card => card.id === cardId)) {
                sourceColumn = col;
                break;
            }
        }

        if (!sourceColumn) {
            this.returnCardToOriginalPosition();
            return;
        }

        const insertPosition = this.getInsertPosition(activeDropZone);

        const sourceCards = this.app.state.columns[sourceColumn];
        const sourceIndex = sourceCards.findIndex(card => card.id === cardId);
        const targetCards = this.app.state.columns[targetColumn];

        const isSamePosition = sourceColumn === targetColumn && sourceIndex === insertPosition;

        if (isSamePosition) {
            this.returnCardToOriginalPosition();
            return;
        }

        const [cardObj] = sourceCards.splice(sourceIndex, 1);
        targetCards.splice(insertPosition, 0, cardObj);
        this.app.saveState();

        this.insertCardInDOM(activeDropZone, insertPosition);
    }

    getInsertPosition(activeDropZone) {
        const cardsContainer = activeDropZone.parentElement;
        const cards = Array.from(cardsContainer.querySelectorAll('.card'));
        
        if (activeDropZone === cardsContainer.firstElementChild) {
            return 0;
        }
        
        let cardCount = 0;
        let currentElement = cardsContainer.firstElementChild;
        
        while (currentElement && currentElement !== activeDropZone) {
            if (currentElement.classList.contains('card')) {
                cardCount++;
            }
            currentElement = currentElement.nextElementSibling;
        }
        
        return cardCount;
    }

    insertCardInDOM(activeDropZone, insertPosition) {
        const cardsContainer = activeDropZone.parentElement;
        const addButton = cardsContainer.querySelector('.add-card-button');

        activeDropZone.style.height = '8px';
        activeDropZone.classList.remove('active');

        cardsContainer.insertBefore(this.draggedCard, activeDropZone.nextSibling);
        
        activeDropZone.remove();
        
        const newDropZone = document.createElement('div');
        newDropZone.className = 'drop-zone';
        cardsContainer.insertBefore(newDropZone, this.draggedCard.nextSibling);
    }

    returnCardToOriginalPosition() {
        if (this.originalParent && this.draggedCard) {
            if (this.originalNextSibling) {
                this.originalParent.insertBefore(this.draggedCard, this.originalNextSibling);
            } else {
                this.originalParent.append(this.draggedCard);
            }
            
            const nextElement = this.draggedCard.nextElementSibling;
            if (!nextElement || !nextElement.classList.contains('drop-zone')) {
                const newDropZone = document.createElement('div');
                newDropZone.className = 'drop-zone';
                this.originalParent.insertBefore(newDropZone, this.draggedCard.nextSibling);
            }
        }
    }

    clearDropZones() {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('active');
            zone.style.height = '8px';
        });
    }
} 