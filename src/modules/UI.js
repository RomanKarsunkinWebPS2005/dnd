export class UI {
    constructor(app) {
        this.app = app;
    }

    createColumn(title) {
        const column = document.createElement('div');
        column.className = 'column';
        column.dataset.column = title;

        const header = document.createElement('div');
        header.className = 'column-header';

        const titleElement = document.createElement('h3');
        titleElement.className = 'column-title';
        titleElement.textContent = title;

        const menu = document.createElement('div');
        menu.className = 'column-menu';
        menu.innerHTML = '⋯';

        header.appendChild(titleElement);
        header.appendChild(menu);

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';

        // Добавляем drop-зону перед первой карточкой
        cardsContainer.appendChild(this.createDropZone(0));

        // Добавляем карточки и drop-зоны между ними
        const cards = this.app.state.columns[title] || [];
        cards.forEach((card, idx) => {
            const cardElement = this.app.cardManager.createCard(card);
            cardsContainer.appendChild(cardElement);
            cardsContainer.appendChild(this.createDropZone(idx + 1));
        });

        // Добавляем кнопку "Add another card"
        const addCardButton = this.createAddCardButton(title);
        cardsContainer.appendChild(addCardButton);

        column.appendChild(header);
        column.appendChild(cardsContainer);

        return column;
    }

    createDropZone(position) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.position = position;
        return dropZone;
    }

    createAddCardButton(columnTitle) {
        const button = document.createElement('button');
        button.className = 'add-card-button';
        button.textContent = '+ Add another card';
        button.addEventListener('click', () => this.showAddCardForm(columnTitle));
        return button;
    }

    showAddCardForm(columnTitle) {
        const column = this.app.board.querySelector(`[data-column="${columnTitle}"]`);
        const cardsContainer = column.querySelector('.cards-container');
        const addButton = cardsContainer.querySelector('.add-card-button');

        const form = document.createElement('div');
        form.className = 'add-card-form';

        const textarea = document.createElement('textarea');
        textarea.className = 'add-card-input';
        textarea.placeholder = 'Введите заголовок для этой карточки...';
        textarea.focus();

        const actions = document.createElement('div');
        actions.className = 'add-card-actions';

        const submitButton = document.createElement('button');
        submitButton.className = 'add-card-submit';
        submitButton.textContent = 'Добавить карточку';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'add-card-cancel';
        cancelButton.innerHTML = '×';

        actions.appendChild(submitButton);
        actions.appendChild(cancelButton);

        form.appendChild(textarea);
        form.appendChild(actions);

        addButton.style.display = 'none';
        cardsContainer.insertBefore(form, addButton);

        // Обработчики событий
        const handleSubmit = () => {
            const content = textarea.value.trim();
            if (content) {
                this.app.cardManager.addCard(columnTitle, content);
            }
            this.hideAddCardForm(columnTitle);
        };

        const handleCancel = () => {
            this.hideAddCardForm(columnTitle);
        };

        submitButton.addEventListener('click', handleSubmit);
        cancelButton.addEventListener('click', handleCancel);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        });
    }

    hideAddCardForm(columnTitle) {
        const column = this.app.board.querySelector(`[data-column="${columnTitle}"]`);
        const cardsContainer = column.querySelector('.cards-container');
        const form = cardsContainer.querySelector('.add-card-form');
        const addButton = cardsContainer.querySelector('.add-card-button');

        if (form) {
            form.remove();
        }
        addButton.style.display = 'block';
    }
} 