// Simple mixtape loader + audio player
const els = {
  grid: document.getElementById('mixtape-grid'),
  audio: document.getElementById('audio'),
  playPause: document.getElementById('playPauseBtn'),
  stop: document.getElementById('stopBtn'),
  next: document.getElementById('nextBtn'),
  prev: document.getElementById('prevBtn'),
  loop: document.getElementById('loopBtn'),
  shuffle: document.getElementById('shuffleBtn'),
  volume: document.getElementById('volume'),
  progress: document.getElementById('progress'),
  progressBar: document.getElementById('progressBar'),
  currentTime: document.getElementById('currentTime'),
  duration: document.getElementById('duration'),
  cover: document.getElementById('cover'),
  nowAlbum: document.getElementById('now-album'),
  nowTrack: document.getElementById('now-track'),
  nowExtra: document.getElementById('now-extra'),
  download: document.getElementById('downloadLink'),
  year: document.getElementById('year'),
};

if (els.year) els.year.textContent = new Date().getFullYear();

let catalog = [];
let albumIndex = 0;
let trackIndex = 0;
let isShuffle = false;

// Fetch mixtapes catalog
fetch('data/mixtapes.json')
  .then(r => r.json())
  .then(data => {
    catalog = data;
    renderGrid();
    // Autoload first track
    if (catalog[0] && catalog[0].tracks[0]) loadTrack(0, 0, { autoplay: false });
  });

function renderGrid() {
  els.grid.innerHTML = '';
  catalog.forEach((album, ai) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${album.cover}" alt="${album.title} cover">
      <div class="pad">
        <h3>${album.title}</h3>
        <div class="meta">${album.year ?? ''}</div>
        <a href="#" class="button" data-ai="${ai}">Open</a>
      </div>
    `;
    card.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      albumIndex = ai;
      trackIndex = 0;
      loadTrack(albumIndex, trackIndex, { autoplay: true });
      scrollToPlayer();
    });
    els.grid.appendChild(card);
  });
}

function loadTrack(ai, ti, opts = {}) {
  const album = catalog[ai];
  const track = album.tracks[ti];
  const a = els.audio;

  a.src = track.src;
  a.loop = false;
  a.load();

  els.cover.src = album.cover;
  els.nowAlbum.textContent = album.title;
  els.nowTrack.textContent = track.title;
  els.nowExtra.textContent = [(track.bpm ? `${track.bpm} BPM` : ''), (track.key || '')].filter(Boolean).join(' • ') || '—';
  els.download.href = track.src;

  if (opts.autoplay) a.play().catch(()=>{});
  updatePlayIcon();
}

function fmt(t) {
  if (!isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = String(Math.floor(t % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function updatePlayIcon() {
  els.playPause.textContent = els.audio.paused ? '▶️' : '⏸';
}

function scrollToPlayer() {
  document.querySelector('.player-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Controls
els.playPause.addEventListener('click', () => {
  if (els.audio.paused) els.audio.play(); else els.audio.pause();
  updatePlayIcon();
});
els.stop.addEventListener('click', () => { els.audio.pause(); els.audio.currentTime = 0; updatePlayIcon(); });
els.next.addEventListener('click', nextTrack);
els.prev.addEventListener('click', prevTrack);
els.loop.addEventListener('click', () => { els.audio.loop = !els.audio.loop; els.loop.classList.toggle('on', els.audio.loop); });
els.shuffle.addEventListener('click', () => { isShuffle = !isShuffle; els.shuffle.classList.toggle('on', isShuffle); });
els.volume.addEventListener('input', () => els.audio.volume = Number(els.volume.value));

// Seek
els.progress.addEventListener('click', (e) => {
  const rect = els.progress.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  els.audio.currentTime = Math.max(0, Math.min(els.audio.duration || 0, ratio * (els.audio.duration || 0)));
});

// Audio events
els.audio.addEventListener('timeupdate', () => {
  const d = els.audio.duration || 0;
  const t = els.audio.currentTime || 0;
  els.progressBar.style.width = (d ? (t / d) * 100 : 0) + '%';
  els.currentTime.textContent = fmt(t);
  els.duration.textContent = fmt(d);
});
els.audio.addEventListener('play', updatePlayIcon);
els.audio.addEventListener('pause', updatePlayIcon);
els.audio.addEventListener('ended', () => {
  if (!els.audio.loop) nextTrack();
});

function nextTrack() {
  const album = catalog[albumIndex];
  if (!album) return;
  if (isShuffle) {
    let n;
    do n = Math.floor(Math.random() * album.tracks.length);
    while (n === trackIndex && album.tracks.length > 1);
    trackIndex = n;
  } else {
    trackIndex = (trackIndex + 1) % album.tracks.length;
  }
  loadTrack(albumIndex, trackIndex, { autoplay: true });
}
function prevTrack() {
  const album = catalog[albumIndex];
  if (!album) return;
  trackIndex = (trackIndex - 1 + album.tracks.length) % album.tracks.length;
  loadTrack(albumIndex, trackIndex, { autoplay: true });
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); els.playPause.click(); }
  if (e.code === 'ArrowRight') els.audio.currentTime += 5;
  if (e.code === 'ArrowLeft') els.audio.currentTime -= 5;
  if (e.code === 'KeyN') els.next.click();
  if (e.code === 'KeyP') els.prev.click();
  if (e.code === 'KeyL') els.loop.click();
  if (e.code === 'KeyS') els.shuffle.click();
});
