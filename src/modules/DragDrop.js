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
        this.hasMoved = false;
        this.startX = 0;
        this.startY = 0;
        this.cardHeight = 0;
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
            this.hasMoved = false;
            
            this.originalParent = card.parentNode;
            this.originalNextSibling = card.nextSibling;
            this.originalColumn = card.closest('.column').dataset.column;
            
            const rect = card.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            
            this.startX = e.clientX;
            this.startY = e.clientY;
            
            this.createGhost(card);
            document.body.classList.add('dragging');
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.ghost) return;
        
        if (!this.hasMoved) {
            const moveThreshold = 5;
            const deltaX = Math.abs(e.clientX - this.startX);
            const deltaY = Math.abs(e.clientY - this.startY);
            
            if (deltaX < moveThreshold && deltaY < moveThreshold) {
                return;
            }
            
            this.hasMoved = true;
            this.cardHeight = this.draggedCard.offsetHeight;
            
            if (this.draggedCard && this.draggedCard.parentNode) {
                this.draggedCard.remove();
            }
            
            const nextElement = this.originalNextSibling;
            if (nextElement && nextElement.classList.contains('drop-zone') && nextElement.parentNode) {
                nextElement.remove();
            }
        }
        
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
        
        if (this.hasMoved) {
            this.moveCard(e);
        } else {
            this.returnCardToOriginalPosition();
        }
        
        this.clearDropZones();
        
        this.draggedCard = null;
        this.originalParent = null;
        this.originalNextSibling = null;
        this.originalColumn = null;
        this.hasMoved = false;
        this.startX = 0;
        this.startY = 0;
        this.cardHeight = 0;
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
        
        const rect = card.getBoundingClientRect();
        this.ghost.style.left = rect.left + 'px';
        this.ghost.style.top = rect.top + 'px';
        
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
            if (card && card !== this.draggedCard) {
                const rect = card.getBoundingClientRect();
                const mouseY = e.clientY;
                
                const cardCenter = rect.top + rect.height / 2;
                const mousePosition = mouseY;
                
                if (mousePosition < cardCenter) {
                    activeDropZone = card.previousElementSibling;
                } else {
                    activeDropZone = card.nextElementSibling;
                }
                
                if (activeDropZone && !activeDropZone.classList.contains('drop-zone')) {
                    const cardsContainer = card.closest('.cards-container');
                    if (cardsContainer) {
                        const allDropZones = cardsContainer.querySelectorAll('.drop-zone');
                        let closestDropZone = null;
                        let minDistance = Infinity;
                        
                        allDropZones.forEach(zone => {
                            const zoneRect = zone.getBoundingClientRect();
                            const distance = Math.abs(zoneRect.top - mouseY);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestDropZone = zone;
                            }
                        });
                        
                        activeDropZone = closestDropZone;
                    }
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
            activeDropZone.style.height = this.cardHeight + 'px';
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
        const isMovingDownOnePosition = sourceColumn === targetColumn && sourceIndex === insertPosition - 1;

        if (isSamePosition && !isMovingDownOnePosition) {
            this.returnCardToOriginalPosition();
            return;
        }

        try {
            const [cardObj] = sourceCards.splice(sourceIndex, 1);
            targetCards.splice(insertPosition, 0, cardObj);
            this.app.saveState();

            if (sourceColumn !== targetColumn) {
                const sourceColumnElement = this.app.board.querySelector(`[data-column="${sourceColumn}"]`);
                if (sourceColumnElement) {
                    const sourceCardsContainer = sourceColumnElement.querySelector('.cards-container');
                    if (sourceCardsContainer) {
                        const sourceDropZones = sourceCardsContainer.querySelectorAll('.drop-zone');
                        sourceDropZones.forEach(zone => zone.remove());
                        
                        this.app.cardManager.ensureDropZoneStructure(sourceCardsContainer);
                    }
                }
            }

            this.insertCardInDOM(activeDropZone);
        } catch (error) {
            console.error('Error moving card:', error);
            this.returnCardToOriginalPosition();
        }
    }

    getInsertPosition(activeDropZone) {
        const cardsContainer = activeDropZone.parentElement;
        
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

    insertCardInDOM(activeDropZone) {
        const cardsContainer = activeDropZone.parentElement;

        activeDropZone.style.height = '8px';
        activeDropZone.classList.remove('active');

        if (activeDropZone && cardsContainer.contains(activeDropZone)) {
            cardsContainer.insertBefore(this.draggedCard, activeDropZone);
            activeDropZone.remove();
        } else {
            this.returnCardToOriginalPosition();
            return;
        }
        
        this.app.cardManager.ensureDropZoneStructure(cardsContainer);
    }

    clearDropZones() {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('active');
            zone.style.height = '8px';
        });
    }

    returnCardToOriginalPosition() {
        if (this.originalParent && this.draggedCard) {
            if (this.originalNextSibling && this.originalParent.contains(this.originalNextSibling)) {
                this.originalParent.insertBefore(this.draggedCard, this.originalNextSibling);
            } else {
                const cards = this.originalParent.querySelectorAll('.card');
                const cardId = this.draggedCard.dataset.cardId;
                
                const columnTitle = this.originalParent.closest('.column').dataset.column;
                const columnCards = this.app.state.columns[columnTitle] || [];
                const cardIndex = columnCards.findIndex(card => card.id === cardId);
                
                if (cardIndex !== -1 && cards.length > 0) {
                    if (cardIndex === 0) {
                        this.originalParent.insertBefore(this.draggedCard, cards[0]);
                    } else if (cardIndex >= cards.length) {
                        const addButton = this.originalParent.querySelector('.add-card-button');
                        if (addButton) {
                            this.originalParent.insertBefore(this.draggedCard, addButton);
                        } else {
                            this.originalParent.append(this.draggedCard);
                        }
                    } else {
                        this.originalParent.insertBefore(this.draggedCard, cards[cardIndex]);
                    }
                } else {
                    const addButton = this.originalParent.querySelector('.add-card-button');
                    if (addButton) {
                        this.originalParent.insertBefore(this.draggedCard, addButton);
                    } else {
                        this.originalParent.append(this.draggedCard);
                    }
                }
            }
            
            this.app.cardManager.ensureDropZoneStructure(this.originalParent);
        }
    }
} 