document.addEventListener('DOMContentLoaded', () => {
    // (기존 DOM 요소 생략)
    const top10List = document.getElementById('top-10-list');
    const allMusicList = document.getElementById('all-music-list');
    const searchInput = document.getElementById('search-input');
    const audioPlayer = document.getElementById('audio-player');
    const playerBar = document.getElementById('player-bar');
    const playerCover = document.getElementById('player-cover');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const playerInfoClickable = document.getElementById('player-info-clickable');
    const playerModal = document.getElementById('player-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCover = document.getElementById('modal-cover');
    const modalTitle = document.getElementById('modal-title');
    const modalArtist = document.getElementById('modal-artist');
    const modalPlayPauseBtn = document.getElementById('modal-play-pause-btn');
    const modalPlayIcon = document.getElementById('modal-play-icon');
    const modalPauseIcon = document.getElementById('modal-pause-icon');
    const modalPrevBtn = document.getElementById('modal-prev-btn');
    const modalNextBtn = document.getElementById('modal-next-btn');
    const modalShuffleBtn = document.getElementById('modal-shuffle-btn');
    const modalRepeatBtn = document.getElementById('modal-repeat-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const playlistQueue = document.getElementById('playlist-queue');

    // [신규] 재생바 요소
    const progressBarMini = document.getElementById('progress-bar-mini');
    const progressMiniPlayed = document.getElementById('progress-mini-played');
    const progressContainerModal = document.getElementById('progress-container-modal');
    const progressBarModal = document.getElementById('progress-bar-modal');
    const progressModalPlayed = document.getElementById('progress-modal-played');
    const progressModalThumb = document.getElementById('progress-modal-thumb');
    const modalCurrentTime = document.getElementById('modal-current-time');
    const modalTotalTime = document.getElementById('modal-total-time');

    // (상태 변수 생략)
    let allMusic = []; 
    let currentPlaylist = []; 
    let currentSongIndex = 0;
    let isShuffle = false;
    let isRepeat = false;

    // [신규] 헬퍼: 시간 포맷 (0:00)
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // 1. 음악 리스트 로드 및 파싱 (생략)
    async function loadMusicList() {
        try {
            const response = await fetch('musiclist.xml');
            const text = await response.text();
            
            allMusic = text.split('\n')
                .filter(line => line.trim() !== '') 
                .map(line => {
                    const parts = line.split(';');
                    if (parts.length === 4) {
                        return {
                            artist: parts[0].trim(),
                            title: parts[1].trim(),
                            cover: parts[2].trim(),
                            file: parts[3].trim()
                        };
                    }
                    return null;
                })
                .filter(song => song !== null); 

            displayTop10();
            displayAllMusic(allMusic); 

        } catch (error) {
            console.error('musiclist.xml을 불러오는 데 실패했습니다.', error);
            allMusicList.innerHTML = '<p style="color: #f00;">음악 목록을 불러올 수 없습니다.</p>';
        }
    }

    // (2~4. HTML 생성, 리스트 표시, 검색 함수 생략)
    function createSongItemHTML(song) {
        return `
            <div class="song-item" 
                 data-title="${song.title}" 
                 data-artist="${song.artist}" 
                 data-cover="${song.cover}" 
                 data-file="${song.file}">
                <img src="${song.cover}" alt="${song.title} 표지">
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
            </div>
        `;
    }
    function displayTop10() {
        const top10 = allMusic.slice(-10).reverse();
        top10List.innerHTML = top10.map(song => createSongItemHTML(song)).join('');
    }
    function displayAllMusic(musicArray) {
        allMusicList.innerHTML = musicArray.map(song => createSongItemHTML(song)).join('');
    }
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm) {
            const filteredMusic = allMusic.filter(song => 
                song.title.toLowerCase().includes(searchTerm) || 
                song.artist.toLowerCase().includes(searchTerm)
            );
            displayAllMusic(filteredMusic);
        } else {
            displayAllMusic(allMusic);
        }
    });

    // 5. 음악 재생 함수 (생략)
    function playSong(songData) {
        if (!songData) {
            audioPlayer.pause();
            updatePlayPauseButtons(false);
            return;
        }
        audioPlayer.src = songData.file;
        audioPlayer.play();
        playerCover.src = songData.cover;
        playerTitle.textContent = songData.title;
        playerArtist.textContent = songData.artist;
        playerBar.classList.add('visible');
        modalCover.src = songData.cover;
        modalTitle.textContent = songData.title;
        modalArtist.textContent = songData.artist;
        updatePlayPauseButtons(true);
        updatePlaylistQueue();
    }

    // (6~9. 버튼 동기화, 토글, 이전/다음, 재생목록 UI 함수 생략)
    function updatePlayPauseButtons(isPlaying) {
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            modalPlayIcon.style.display = 'none';
            modalPauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            modalPlayIcon.style.display = 'block';
            modalPauseIcon.style.display = 'none';
        }
    }
    function togglePlay() {
        if (!audioPlayer.src) return;
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    }
    function playNextSong() {
        if (currentPlaylist.length === 0) return;
        if (isShuffle) {
            let nextIndex = currentSongIndex;
            while (nextIndex === currentSongIndex && currentPlaylist.length > 1) {
                nextIndex = Math.floor(Math.random() * currentPlaylist.length);
            }
            currentSongIndex = nextIndex;
        } else {
            currentSongIndex++;
            if (currentSongIndex >= currentPlaylist.length) {
                if (isRepeat) {
                    currentSongIndex = 0;
                } else {
                    currentSongIndex = currentPlaylist.length - 1; 
                    audioPlayer.pause();
                    return;
                }
            }
        }
        playSong(currentPlaylist[currentSongIndex]);
    }
    function playPrevSong() {
        if (currentPlaylist.length === 0) return;
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = currentPlaylist.length - 1;
        }
        playSong(currentPlaylist[currentSongIndex]);
    }
    function updatePlaylistQueue() {
        playlistQueue.innerHTML = ''; 
        currentPlaylist.forEach((song, index) => {
            const isPlaying = (index === currentSongIndex);
            const item = document.createElement('div');
            item.className = `queue-item ${isPlaying ? 'playing' : ''}`;
            item.innerHTML = `
                <img src="${song.cover}" alt="${song.title}">
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                currentSongIndex = index;
                playSong(currentPlaylist[currentSongIndex]);
            });
            playlistQueue.appendChild(item);
        });
        const playingItem = playlistQueue.querySelector('.playing');
        if (playingItem) {
            playingItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // 10. [신규] 재생 진행률 업데이트
    function updateProgress() {
        const { duration, currentTime } = audioPlayer;
        if (isNaN(duration) || duration === 0) return;

        const progressPercent = (currentTime / duration) * 100;

        // 미니 플레이어 바
        progressMiniPlayed.style.width = `${progressPercent}%`;

        // 모달 플레이어 바
        progressModalPlayed.style.width = `${progressPercent}%`;
        progressModalThumb.style.left = `${progressPercent}%`;

        // 시간 텍스트
        modalCurrentTime.textContent = formatTime(currentTime);
    }

    // 11. [신규] 총 재생 시간 설정 (파일 로드 시)
    function setDuration() {
        const { duration } = audioPlayer;
        if (isNaN(duration)) return;
        modalTotalTime.textContent = formatTime(duration);
    }

    // 12. [신규] 재생바 클릭 탐색 (Seek)
    function setProgress(e, progressBarElement) {
        const { duration } = audioPlayer;
        if (isNaN(duration) || duration === 0) return;

        // 클릭된 위치 계산
        const width = progressBarElement.clientWidth;
        const clickX = e.offsetX; // 클릭된 x좌표
        const newTime = (clickX / width) * duration;
        
        audioPlayer.currentTime = newTime;
    }


    // ==================================
    //         이벤트 리스너 바인딩
    // ==================================

    // 오디오 상태 이벤트
    audioPlayer.addEventListener('play', () => updatePlayPauseButtons(true));
    audioPlayer.addEventListener('pause', () => updatePlayPauseButtons(false));
    audioPlayer.addEventListener('ended', playNextSong);
    audioPlayer.addEventListener('timeupdate', updateProgress); // [신규]
    audioPlayer.addEventListener('loadedmetadata', setDuration); // [신규] (곡의 메타데이터 로드 완료 시)

    // (하단 바) 재생/일시정지
    playPauseBtn.addEventListener('click', togglePlay);

    // 모달 열기/닫기 (생략)
    playerInfoClickable.addEventListener('click', () => playerModal.classList.add('visible'));
    modalCloseBtn.addEventListener('click', () => playerModal.classList.remove('visible'));

    // 모달 컨트롤 (생략)
    modalPlayPauseBtn.addEventListener('click', togglePlay);
    modalNextBtn.addEventListener('click', playNextSong);
    modalPrevBtn.addEventListener('click', playPrevSong);
    
    // 볼륨 조절 (생략)
    volumeSlider.addEventListener('input', (e) => audioPlayer.volume = e.target.value);

    // 셔플/반복 (생략)
    modalShuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        modalShuffleBtn.classList.toggle('active', isShuffle);
    });
    modalRepeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        modalRepeatBtn.classList.toggle('active', isRepeat);
    });

    // [신규] 재생바 클릭 이벤트
    progressBarMini.addEventListener('click', (e) => setProgress(e, progressBarMini));
    progressBarModal.addEventListener('click', (e) => setProgress(e, progressBarModal));
    // (참고: 더 부드러운 드래그 탐색은 mousedown, mousemove, mouseup을 모두 구현해야 합니다)

    // 리스트 클릭 이벤트 (생략)
    document.body.addEventListener('click', (e) => {
        const songItem = e.target.closest('.song-item');
        if (songItem) {
            const parentListElement = songItem.closest('.music-list');
            const allItemsInList = parentListElement.querySelectorAll('.song-item');
            currentPlaylist = Array.from(allItemsInList).map(item => {
                return {
                    title: item.dataset.title,
                    artist: item.dataset.artist,
                    cover: item.dataset.cover,
                    file: item.dataset.file
                };
            });
            currentSongIndex = Array.from(allItemsInList).indexOf(songItem);
            playSong(currentPlaylist[currentSongIndex]);
        }
    });

    // 앱 시작
    loadMusicList();
});
