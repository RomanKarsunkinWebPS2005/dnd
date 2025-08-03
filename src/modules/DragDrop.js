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
            if (this.originalParent) {
                if (this.originalNextSibling) {
                    this.originalParent.insertBefore(this.draggedCard, this.originalNextSibling);
                } else {
                    this.originalParent.append(this.draggedCard);
                }
            }
            return;
        }

        const cardsContainer = activeDropZone.parentElement;
        const targetColumn = cardsContainer.closest('.column').dataset.column;
        const cardId = this.draggedCard.dataset.cardId;
        const insertIndex = parseInt(activeDropZone.dataset.position);

        let sourceColumn = null;
        for (const col in this.app.state.columns) {
            if (this.app.state.columns[col].some(card => card.id === cardId)) {
                sourceColumn = col;
                break;
            }
        }

        if (sourceColumn) {
            const sourceCards = this.app.state.columns[sourceColumn];
            const sourceIndex = sourceCards.findIndex(card => card.id === cardId);
            const targetCards = this.app.state.columns[targetColumn];

            const isSamePosition = sourceColumn === targetColumn && sourceIndex === insertIndex;

            if (!isSamePosition) {
                const [cardObj] = sourceCards.splice(sourceIndex, 1);

                targetCards.splice(insertIndex, 0, cardObj);
                this.app.saveState();

                if (insertIndex === 0) {
                    const firstCard = cardsContainer.querySelector('.card');
                    if (firstCard) {
                        cardsContainer.insertBefore(this.draggedCard, firstCard);
                    } else {
                        const addButton = cardsContainer.querySelector('.add-card-button');
                        if (addButton) {
                            cardsContainer.insertBefore(this.draggedCard, addButton);
                        }
                    }
                } else {
                    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
                    const dropZones = Array.from(cardsContainer.querySelectorAll('.drop-zone'));
                    
                    if (insertIndex === 0) {
                        const firstCard = cardsContainer.querySelector('.card');
                        if (firstCard) {
                            cardsContainer.insertBefore(this.draggedCard, firstCard);
                        } else {
                            const addButton = cardsContainer.querySelector('.add-card-button');
                            if (addButton) {
                                cardsContainer.insertBefore(this.draggedCard, addButton);
                            }
                        }
                    } else if (insertIndex <= cards.length) {
                        if (cards[insertIndex - 1]) {
                            cardsContainer.insertBefore(this.draggedCard, cards[insertIndex - 1].nextSibling);
                        } else {
                            const addButton = cardsContainer.querySelector('.add-card-button');
                            if (addButton) {
                                cardsContainer.insertBefore(this.draggedCard, addButton);
                            }
                        }
                    } else {
                        const addButton = cardsContainer.querySelector('.add-card-button');
                        if (addButton) {
                            cardsContainer.insertBefore(this.draggedCard, addButton);
                        }
                    }
                }
            } else {
                if (this.originalParent) {
                    if (this.originalNextSibling) {
                        this.originalParent.insertBefore(this.draggedCard, this.originalNextSibling);
                    } else {
                        this.originalParent.append(this.draggedCard);
                    }
                }
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