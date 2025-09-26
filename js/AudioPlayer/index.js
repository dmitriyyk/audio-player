import {debounce, isMobileScreen, toMinAndSec} from '../utils.js'

export default class AudioPlayer {
  selectors = {
    playerBackground: '.player__background',
    playerBackgroundMusicName: '.player__background-music-name',
    playerMusicThumb: '.player__img',
    playerMusicName: '.player__music-name',
    playerMusicAuthor: '.player__music-author',
    playerPlayPauseBtn: '.player__control--play',
    playerNextBtn: '.player__control--next',
    playerPrevBtn: '.player__control--prev',
    progressRewindMusicSlider: '.progress__range',
    progressCurrentTime: '.progress__current',
    progressMusicDuration: '.progress__duration',
    audioList: '.audio-list',
    audioListShowBtn: '.audio-list__btn',
    audioListSearch: '.audio-list__search',
    audioListMusicCount: '.audio-list__music-count',
    audioListVolumeRangeSlider: '.audio-list__control--volume-range',
    audioListVolumeButton: '.audio-list__control--volume',
    musicList: '.music',
    musicItem: '.music__item',
  }

  stateClasses = {
    activeMusicItem: 'music__item--active',
    showAudioList: 'audio-list--show',
  }

  constructor(audios) {
    this.audioData = audios
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = 32
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.init()
  }

  musicThumbPath = './assets/music-bg.png'

  icons = {
    pauseIcon: `
          <svg width="106" height="104" viewBox="0 0 106 104" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="104" />
          <rect x="74" width="32" height="104" />
          </svg>`,
    playIcon: `<svg
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 335 335"
          xml:space="preserve"
        >
          <polygon points="22.5,0 22.5,335 312.5,167.5 " />
        </svg>`
  }

  state = {
    isPlaying: false,
    isRepeating: false,
    isRewinding: false,
    isMuted: false,
    volume: 0.7,
    current: {},
    filteredAudios: null,
    audios: []
  }

  init() {
    this.initVariables()
    this.initAudios()
      .then(() => {
        this.renderAudioList()
        this.setCurrentItem()
      })
      .then(() => {
        this.events()
      })
  }

  initAudios() {
    const audioPromises = this.audioData.map((data, index) => {
      return new Promise((resolve) => {
        const audioPath = `${data.url}/audio.mp3`
        const audio = new Audio(audioPath)
        audio.addEventListener('loadeddata', () => {
          const source = this.audioCtx.createMediaElementSource(audio)
          this.state.audios[index] = {
            ...data,
            id: crypto.randomUUID() ?? Date.now().toString(),
            url: audioPath,
            thumb_url: data.hasThumb ? `${data.url}/thumb.jpg` : undefined,
            duration: audio.duration,
            audio,
            source
          }
          resolve()
        })
      })
    })

    return Promise.all(audioPromises)
  }

  initVariables() {
    this.audioList = document.querySelector(this.selectors.audioList)
    this.musicList = document.querySelector(this.selectors.musicList)

    this.showAudioListBtn = document.querySelector(this.selectors.audioListShowBtn)
    this.audioListSearch = document.querySelector(this.selectors.audioListSearch)
    this.audioListMusicCount = document.querySelector(this.selectors.audioListMusicCount)

    this.playPauseBtn = document.querySelector(this.selectors.playerPlayPauseBtn)
    this.nextBtn = document.querySelector(this.selectors.playerNextBtn)
    this.prevBtn = document.querySelector(this.selectors.playerPrevBtn)
    this.rewindMusicSlider = document.querySelector(this.selectors.progressRewindMusicSlider)

    this.volumeRangeSlider = document.querySelector(this.selectors.audioListVolumeRangeSlider)
    this.volumeButton = document.querySelector(this.selectors.audioListVolumeButton)
  }

  renderBackgroundAnimation() {
    const {source} = this.state.current

    try {
      source.disconnect()
    } catch {
    }

    source.connect(this.analyser)
    this.analyser.connect(this.audioCtx.destination)

    const playerBackground = document.querySelector(this.selectors.playerBackground)

    const renderFrame = () => {
      this.analyser.getByteFrequencyData(this.frequencyData)
      const frequencyDataOne = Math.max(this.frequencyData[2], this.frequencyData[3], this.frequencyData[4])
      const frequencyDataTwo = Math.max(this.frequencyData[5], this.frequencyData[6], this.frequencyData[7], this.frequencyData[8])
      const frequencyDataThree = this.frequencyData[10]

      if (this.backgroundMusicName.textContent) {
        this.backgroundMusicName.style.scale = `${frequencyDataThree <= 0 ? 1 : 1.0 + (frequencyDataThree / 1000)}`
      }

      playerBackground.style.background = `linear-gradient(60deg, rgb(0, 0, ${frequencyDataOne}),rgb(0, 0, 0),rgb(0, 0, ${frequencyDataTwo}))`

      requestAnimationFrame(renderFrame)
    }
    renderFrame()
  }

  renderAudioList() {
    const audioList = document.querySelector(this.selectors.musicList)

    const audios = this.state.filteredAudios ?? this.state.audios

    this.audioListMusicCount.textContent = this.state.audios.length.toString()

    audioList.innerHTML = audios.map(({
                                        thumb_url,
                                        author,
                                        name,
                                        duration,
                                        id
                                      }) => {
      const time = toMinAndSec(duration)
      const thumb = thumb_url ? thumb_url : this.musicThumbPath

      const musicItemClass = id === this.state.current.id ? `music__item ${this.stateClasses.activeMusicItem}` : 'music__item'

      return `<div class="${musicItemClass}" data-id="${id}" tabIndex="0">
        <img src="${thumb}" width="40px" height="40px" alt="" class="music__bg"/>
          <div class="music__info">
              <h3 class="music__name">${name}</h3>
              <h4 class="music__author">${author}</h4>
          </div>
          <p class="music__duration">${time}</p>
        </div>`
    }).join('')
  }

  setActiveMusic() {
    const {id} = this.state.current

    const items = document.querySelectorAll(this.selectors.musicItem)

    items.forEach((item) => {
      item.classList.remove(this.stateClasses.activeMusicItem)
    })

    const currentItem = document.querySelector(`${this.selectors.musicItem}[data-id="${id}"]`)

    currentItem.classList.add(this.stateClasses.activeMusicItem)
  }

  renderCurrentItem() {
    const {thumb_url, name, author, duration} = this.state.current

    const time = toMinAndSec(duration)

    this.backgroundMusicName = document.querySelector(this.selectors.playerBackgroundMusicName)
    const musicThumb = document.querySelector(this.selectors.playerMusicThumb)
    const musicName = document.querySelector(this.selectors.playerMusicName)
    const musicAuthor = document.querySelector(this.selectors.playerMusicAuthor)
    const musicDuration = document.querySelector(this.selectors.progressMusicDuration)

    thumb_url ? musicThumb.src = thumb_url : musicThumb.src = this.musicThumbPath

    musicName.textContent = name
    this.backgroundMusicName.textContent = !isMobileScreen ? name : ''
    musicAuthor.textContent = author
    musicDuration.textContent = time
  }

  pauseCurrentItem() {
    const {audio} = this.state.current

    if (!audio) return

    audio.pause()
    audio.currentTime = '0'
  }

  togglePlaying() {
    const {isPlaying, current} = this.state
    const {audio} = current

    isPlaying ? audio.play() : audio.pause()
  }

  setCurrentItem(itemId) {
    const current = itemId ? this.state.audios.find(({id}) => id === itemId) : this.state.audios[0]
    if (!current) return

    this.pauseCurrentItem()

    this.state.current = current
    current.audio.volume = this.state.volume

    this.renderCurrentItem()

    this.setActiveMusic()

    setTimeout(() => {
      this.togglePlaying()
    })

    this.audioUpdateHandler(current)

    this.renderBackgroundAnimation()
  }

  setSliderValue(slider, value) {
    slider.style.background = `linear-gradient(to right, rgb(255, 255, 255) ${value}%, rgba(255, 255, 255, 0.313) ${value}%)`
    slider.value = value
  }

  audioUpdateHandler({audio, duration}) {
    const currentTime = document.querySelector(this.selectors.progressCurrentTime)
    audio.addEventListener('timeupdate', () => {
      currentTime.textContent = toMinAndSec(audio.currentTime)
      const currentValue = audio.currentTime * 100 / duration

      if (this.state.isRewinding) {
        return
      }

      this.setSliderValue(this.rewindMusicSlider, currentValue)
    })

    audio.addEventListener('ended', () => {
      this.handleNext()
    })
  }

  handlePlayPause = async () => {
    const {isPlaying} = this.state
    const {audio} = this.state.current

    this.state.isPlaying = !isPlaying

    this.state.isPlaying = !isPlaying

    if (!isPlaying) {
      try {
        await this.audioCtx.resume()
        await audio.play()
        this.playPauseBtn.innerHTML = this.icons.pauseIcon
      } catch (err) {
        console.warn('Не удалось запустить воспроизведение:', err)
        this.state.isPlaying = false
      }
    } else {
      audio.pause()
      this.playPauseBtn.innerHTML = this.icons.playIcon
    }
  }

  handleChooseMusic = (e) => {
    if (!e.target.matches(this.selectors.musicItem)) return

    if (e.type === 'keydown' && e.code !== 'Enter') return

    const {current} = this.state

    const musicId = e.target.dataset.id
    const selectedMusic = this.state.audios.find(({id}) => id === musicId)

    if (selectedMusic.id === current.id) return

    this.setCurrentItem(selectedMusic.id)
  }

  handlePrev = () => {
    const {current} = this.state

    const currentItem = document.querySelector(`${this.selectors.musicItem}[data-id="${current.id}"]`)

    const prev = currentItem.previousSibling?.dataset
    const last = this.musicList.lastElementChild?.dataset

    const itemId = prev?.id || last?.id

    this.pauseCurrentItem()
    this.setCurrentItem(itemId)
  }

  handleNext = () => {
    const {current} = this.state

    const currentItem = document.querySelector(`${this.selectors.musicItem}[data-id="${current.id}"]`)
    const next = currentItem.nextSibling?.dataset
    const first = this.musicList.firstElementChild?.dataset

    const itemId = next?.id || first?.id

    this.pauseCurrentItem()
    this.setCurrentItem(itemId)
  }

  handleShowAudioList = () => {
    this.audioList.classList.toggle(this.stateClasses.showAudioList)
  }

  handleRewindSlider = ({target: {value}}) => {
    this.setSliderValue(this.rewindMusicSlider, value)
  }

  handleStartRewind = (e) => {
    if (e.type === 'keydown' && !e.code.includes('Arrow')) return

    this.state.isRewinding = true
  }

  handleEndRewind = (e) => {
    if (e.type === 'keyup' && !e.code.includes('Arrow')) return

    this.state.isRewinding = false
    const {audio} = this.state.current

    const rangeValue = this.rewindMusicSlider.value
    audio.currentTime = rangeValue / 100 * audio.duration
  }

  handleVolume = ({target: {value}}) => {
    const {current: {audio}} = this.state

    const currentVolume = value / 100
    this.state.volume = currentVolume
    audio.volume = currentVolume

    this.setSliderValue(this.volumeRangeSlider, value)
  }

  handleMuteVolume = () => {
    const {current: {audio}} = this.state

    const stateVolume = this.state.volume
    let currentVolume

    if (!this.state.isMuted) {
      this.state.isMuted = true
      currentVolume = 0
    } else {
      this.state.isMuted = false
      currentVolume = stateVolume
    }

    audio.volume = currentVolume

    this.setSliderValue(this.volumeRangeSlider, currentVolume * 100)
  }

  handleSearch = ({target: {value}}) => {
    const searchQuery = value.trim().toLowerCase()

    this.state.filteredAudios = this.state.audios.filter((audio) => {
      const title = audio.name.trim().toLowerCase()

      return title.includes(searchQuery)
    })

    this.renderAudioList()
  }

  events() {
    this.showAudioListBtn.addEventListener('click', this.handleShowAudioList)
    this.playPauseBtn.addEventListener('click', this.handlePlayPause)
    this.nextBtn.addEventListener('click', this.handleNext)
    this.prevBtn.addEventListener('click', this.handlePrev)
    this.rewindMusicSlider.addEventListener('input', this.handleRewindSlider)
    this.rewindMusicSlider.addEventListener('mousedown', this.handleStartRewind)
    this.rewindMusicSlider.addEventListener('keydown', this.handleStartRewind)
    this.rewindMusicSlider.addEventListener('mouseup', this.handleEndRewind)
    this.rewindMusicSlider.addEventListener('keyup', this.handleEndRewind)
    this.rewindMusicSlider.addEventListener('touchstart', this.handleStartRewind, {passive: true})
    this.rewindMusicSlider.addEventListener('touchend', this.handleEndRewind)
    this.volumeRangeSlider.addEventListener('input', this.handleVolume)
    this.volumeButton.addEventListener('click', this.handleMuteVolume)
    this.audioListSearch.addEventListener('input', debounce(this.handleSearch, 200))
    this.musicList.addEventListener('click', this.handleChooseMusic)
    this.musicList.addEventListener('keydown', this.handleChooseMusic)
  }
}
