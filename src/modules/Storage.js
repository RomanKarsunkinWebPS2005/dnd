export class Storage {
    static STORAGE_KEY = 'trello-state';

    static loadState() {
        const savedState = localStorage.getItem(this.STORAGE_KEY);
        if (savedState) {
            return JSON.parse(savedState);
        }
        
        // Начальное состояние с примерами карточек
        return {
            columns: {
                'TODO': [
                    { id: '1', content: 'Добро пожаловать в Trello!' },
                    { id: '2', content: 'Это карточка.' },
                    { id: '3', content: 'Нажмите на карточку, чтобы увидеть, что за ней.' },
                    { id: '4', content: 'Вы можете прикреплять картинки и файлы...' }
                ],
                'IN PROGRESS': [
                    { id: '5', content: 'Перетащите людей на карточку, чтобы указать, что они за нее отвечают.' },
                    { id: '6', content: 'Используйте цветные метки для организации' },
                    { id: '7', content: 'Создавайте столько списков, сколько вам нужно!' },
                    { id: '8', content: 'Закончили с карточкой? Архивируйте ее.' },
                    { id: '9', content: 'Попробуйте перетаскивать карточки куда угодно.' }
                ],
                'DONE': [
                    { id: '10', content: 'Чтобы узнать больше хитростей, ознакомьтесь с руководством.' },
                    { id: '11', content: 'Используйте столько досок, сколько хотите. Мы сделаем больше!' },
                    { id: '12', content: 'Хотите использовать горячие клавиши? У нас они есть!' },
                    { id: '13', content: 'Хотите получать обновления о новых функциях?' }
                ]
            }
        };
    }

    static saveState(state) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }
} 