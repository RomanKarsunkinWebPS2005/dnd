import './styles.css';
import { Storage } from './modules/Storage.js';
import { DragDrop } from './modules/DragDrop.js';
import { CardManager } from './modules/CardManager.js';
import { UI } from './modules/UI.js';

class TrelloApp {
    constructor() {
        this.board = document.getElementById('board');
        this.columns = ['TODO', 'IN PROGRESS', 'DONE'];
        this.state = Storage.loadState();
        
        // Инициализируем модули
        this.cardManager = new CardManager(this);
        this.ui = new UI(this);
        this.dragDrop = new DragDrop(this);
        
        this.init();
    }

    init() {
        this.renderBoard();
        this.dragDrop.setupEventListeners();
    }

    saveState() {
        Storage.saveState(this.state);
    }

    renderBoard() {
        this.board.innerHTML = '';
        
        this.columns.forEach(columnTitle => {
            const column = this.ui.createColumn(columnTitle);
            this.board.append(column);
        });
    }

    moveCard(cardId, sourceColumnTitle, targetColumnTitle, insertIndex) {
        this.cardManager.moveCard(cardId, sourceColumnTitle, targetColumnTitle, insertIndex);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new TrelloApp();
}); 