export class CardManager {
    constructor(app) {
        this.app = app;
    }

    createCard(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.draggable = false;
        cardElement.dataset.cardId = card.id;

        const content = document.createElement('div');
        content.className = 'card-content';
        content.textContent = card.content;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'card-delete';
        deleteButton.innerHTML = '×';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(card.id);
        });

        cardElement.append(content);
        cardElement.append(deleteButton);

        return cardElement;
    }

    addCard(columnTitle, content) {
        const cardId = Date.now().toString();
        const card = { id: cardId, content };

        if (!this.app.state.columns[columnTitle]) {
            this.app.state.columns[columnTitle] = [];
        }
        
        const cards = this.app.state.columns[columnTitle];
        cards.push(card);
        this.app.saveState();

        const column = this.app.board.querySelector(`[data-column="${columnTitle}"]`);
        const cardsContainer = column.querySelector('.cards-container');
        const addButton = cardsContainer.querySelector('.add-card-button');

        const cardElement = this.createCard(card);
        
        cardsContainer.insertBefore(cardElement, addButton);
        
        this.ensureDropZoneStructure(cardsContainer);
    }

    deleteCard(cardId) {
        let sourceColumn = null;
        let cardIndex = -1;
        
        for (const columnTitle in this.app.state.columns) {
            const cards = this.app.state.columns[columnTitle];
            cardIndex = cards.findIndex(card => card.id === cardId);
            if (cardIndex !== -1) {
                sourceColumn = columnTitle;
                cards.splice(cardIndex, 1);
                break;
            }
        }
        
        if (sourceColumn) {
            this.app.saveState();
            
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                const cardsContainer = cardElement.closest('.cards-container');
                
                cardElement.remove();
                
                this.ensureDropZoneStructure(cardsContainer);
            }
        }
    }

    ensureDropZoneStructure(cardsContainer) {
        const children = Array.from(cardsContainer.children);
        const cards = children.filter(child => child.classList.contains('card'));
        const dropZones = children.filter(child => child.classList.contains('drop-zone'));
        const addButton = children.find(child => child.classList.contains('add-card-button'));
        
        dropZones.forEach(zone => {
            zone.remove();
        });
        
        if (cards.length > 0) {
            const topDropZone = document.createElement('div');
            topDropZone.className = 'drop-zone';
            cardsContainer.insertBefore(topDropZone, cards[0]);
            
            cards.forEach(card => {
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                cardsContainer.insertBefore(dropZone, card.nextSibling);
            });
        } else {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            cardsContainer.insertBefore(dropZone, addButton);
        }
    }

    moveCard(cardId, sourceColumnTitle, targetColumnTitle, insertIndex) {
        const sourceCards = this.app.state.columns[sourceColumnTitle];
        const cardIndex = sourceCards.findIndex(card => card.id === cardId);
        
        if (cardIndex === -1) return;

        const card = sourceCards.splice(cardIndex, 1)[0];

        if (!this.app.state.columns[targetColumnTitle]) {
            this.app.state.columns[targetColumnTitle] = [];
        }

        if (insertIndex === -1 || insertIndex >= this.app.state.columns[targetColumnTitle].length) {
            this.app.state.columns[targetColumnTitle].push(card);
        } else {
            this.app.state.columns[targetColumnTitle].splice(insertIndex, 0, card);
        }

        this.app.saveState();
        this.app.renderBoard();
    }
} 