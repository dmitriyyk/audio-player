import AudioPlayer from './AudioPlayer'

const audios = [
  {
    name: 'Royalty',
    author: 'Maestro Chives, Egzod, Neoni',
    url: './assets/music/royalty',
    hasThumb: true,
  },
  {
    name: 'Explorer',
    author: 'Avenza',
    url: './assets/music/explorer',
    hasThumb: false,
  },
]

new AudioPlayer(audios)