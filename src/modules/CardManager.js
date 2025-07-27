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

        cardElement.appendChild(content);
        cardElement.appendChild(deleteButton);

        return cardElement;
    }

    addCard(columnTitle, content) {
        const cardId = Date.now().toString();
        const card = { id: cardId, content };

        if (!this.app.state.columns[columnTitle]) {
            this.app.state.columns[columnTitle] = [];
        }
        this.app.state.columns[columnTitle].push(card);
        this.app.saveState();

        const column = this.app.board.querySelector(`[data-column="${columnTitle}"]`);
        const cardsContainer = column.querySelector('.cards-container');
        const addButton = cardsContainer.querySelector('.add-card-button');
        const cardElement = this.createCard(card);
        
        cardsContainer.insertBefore(cardElement, addButton);
    }

    deleteCard(cardId) {
        // Находим карточку в состоянии и удаляем её
        for (const columnTitle in this.app.state.columns) {
            const cards = this.app.state.columns[columnTitle];
            const cardIndex = cards.findIndex(card => card.id === cardId);
            if (cardIndex !== -1) {
                cards.splice(cardIndex, 1);
                break;
            }
        }
        this.app.saveState();

        // Удаляем элемент из DOM
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            cardElement.remove();
        }
        // После удаления карточки пересоздаём доску для корректных drop-зон
        this.app.renderBoard();
    }

    moveCard(cardId, sourceColumnTitle, targetColumnTitle, insertIndex) {
        // Находим карточку в исходной колонке
        const sourceCards = this.app.state.columns[sourceColumnTitle];
        const cardIndex = sourceCards.findIndex(card => card.id === cardId);
        
        if (cardIndex === -1) return;

        const card = sourceCards.splice(cardIndex, 1)[0];

        // Добавляем карточку в целевую колонку
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