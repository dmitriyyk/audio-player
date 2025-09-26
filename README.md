# Audio player

Простой аудио плеер на `HTML`, `CSS`, `JavaScript` с визуализацией звука и адаптивным интерфейсом для мобильных устройств.

В проекте используются ES Modules, для запуска необходим сервер.

Для добавления новых песен необходимо:
1. Создать новую папку по пути `assets/music`;
2. В созданную папку добавить файл `audio.mp3`;
3. Добавить файл `thumb.jpg` для установки обложки песни (опционально);
4. Добавить новую песню в файле `main.js` Пример:

```JavaScript
import AudioPlayer from './AudioPlayer'

// Массив песен
const audios = [
    {
        name: 'Royalty',
        author: 'Maestro Chives, Egzod, Neoni',
        url: './assets/music/royalty',
        hasThumb: true, // обложка установлена
    },
    {
        name: 'Explorer',
        author: 'Avenza',
        url: './assets/music/explorer',
        hasThumb: false, // файл обложки отсутствует
    },
]

new AudioPlayer(audios)
```

Демо - https://dmitriyyk.github.io/audio-player