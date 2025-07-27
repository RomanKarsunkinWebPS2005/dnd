export class DragDrop {
    constructor(app) {
        this.app = app;
        this.draggedCard = null;
        this.draggedCardHeight = 0;
        this.draggedCardWidth = 0;
        this.isDragging = false;
        this.offsetY = 0;
        this.offsetX = 0;
        this.ghost = null;
    }

    setupEventListeners() {
        this.app.board.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        const card = e.target.closest('.card');
        // Не начинаем drag, если клик по кнопке удаления
        if (card && e.button === 0 && !e.target.closest('.card-delete')) {
            e.preventDefault();
            this.isDragging = true;
            this.draggedCard = card;
            this.draggedCardHeight = card.offsetHeight;
            this.draggedCardWidth = card.offsetWidth;
            const rect = card.getBoundingClientRect();
            this.offsetY = e.clientY - rect.top;
            this.offsetX = e.clientX - rect.left;
            card.classList.add('dragging');
            document.body.classList.add('dragging');
            this.createGhost(card, e.clientX, e.clientY);
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.ghost) return;
        this.ghost.style.left = (e.clientX - this.offsetX) + 'px';
        this.ghost.style.top = (e.clientY - this.offsetY) + 'px';
        this.updateActiveDropZone(e);
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (this.ghost) {
            this.ghost.remove();
            this.ghost = null;
        }
        if (this.draggedCard) {
            this.draggedCard.classList.remove('dragging');
        }
        document.body.classList.remove('dragging');
        // Вставка карточки через обновление state
        const dropZone = document.querySelector('.drop-zone.active');
        if (dropZone && this.draggedCard) {
            const cardsContainer = dropZone.parentElement;
            const targetColumn = cardsContainer.closest('.column').dataset.column;
            const cardId = this.draggedCard.dataset.cardId;
            // Определяем позицию вставки
            const dropZones = Array.from(cardsContainer.querySelectorAll('.drop-zone'));
            const insertIndex = dropZones.indexOf(dropZone);
            // Находим исходную колонку
            let sourceColumn = null;
            for (const col in this.app.state.columns) {
                if (this.app.state.columns[col].some(card => card.id === cardId)) {
                    sourceColumn = col;
                    break;
                }
            }
            if (sourceColumn) {
                // Удаляем карточку из исходной колонки
                const cardIdx = this.app.state.columns[sourceColumn].findIndex(card => card.id === cardId);
                const [cardObj] = this.app.state.columns[sourceColumn].splice(cardIdx, 1);
                // Вставляем в целевую колонку
                this.app.state.columns[targetColumn].splice(insertIndex, 0, cardObj);
                this.app.saveState();
                this.app.renderBoard();
            }
        }
        this.clearDropZones();
        this.draggedCard = null;
    }

    createGhost(card, x, y) {
        this.ghost = card.cloneNode(true);
        this.ghost.classList.add('ghost-card');
        this.ghost.style.position = 'fixed';
        this.ghost.style.pointerEvents = 'none';
        this.ghost.style.width = card.offsetWidth + 'px';
        this.ghost.style.height = card.offsetHeight + 'px';
        this.ghost.style.left = (x - this.offsetX) + 'px';
        this.ghost.style.top = (y - this.offsetY) + 'px';
        this.ghost.style.opacity = '0.8';
        this.ghost.style.zIndex = '9999';
        document.body.appendChild(this.ghost);
    }

    updateActiveDropZone(e) {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('active');
            zone.style.height = '8px';
        });

        const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
        let dropZone = null;
        let card = elementUnderMouse?.closest('.card');
        if (card && card.parentElement) {
            if (card === this.draggedCard) {
                const rect = card.getBoundingClientRect();
                const mouseY = e.clientY;
                if (mouseY < rect.top + rect.height / 2) {
                    dropZone = card.previousElementSibling;
                } else {
                    dropZone = card.nextElementSibling;
                }
            } else {
                const rect = card.getBoundingClientRect();
                const mouseY = e.clientY;
                if (mouseY < rect.top + rect.height / 2) {
                    dropZone = card.previousElementSibling;
                } else {
                    dropZone = card.nextElementSibling;
                }
            }
        } else if (elementUnderMouse?.classList.contains('drop-zone')) {
            dropZone = elementUnderMouse;
        } else {
            // Если мышь над колонкой, но не над карточкой/drop-зоной
            const column = elementUnderMouse?.closest('.column');
            if (column) {
                const dropZones = column.querySelectorAll('.drop-zone');
                if (dropZones.length) {
                    dropZone = dropZones[dropZones.length - 1]; // последняя drop-зона (в конец)
                }
            }
        }
        if (dropZone && dropZone.classList.contains('drop-zone')) {
            dropZone.classList.add('active');
            dropZone.style.height = this.draggedCardHeight + 'px';
        }
    }

    clearDropZones() {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('active');
            zone.style.height = '8px';
        });
    }
} 