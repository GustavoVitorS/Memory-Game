const CARD_DATA = [
  { pair: 'bird', image: '1.png', label: 'Pássaro' },
  { pair: 'bird', image: '2.png', label: 'Pássaro' },
  { pair: 'tux', image: '3.png', label: 'Pinguim Tux' },
  { pair: 'tux', image: '4.png', label: 'Pinguim Tux' },
  { pair: 'mask', image: '5.png', label: 'Pessoa de máscara' },
  { pair: 'mask', image: '6.png', label: 'Pessoa de máscara' },
  { pair: 'ghost', image: '7.png', label: 'Fantasma' },
  { pair: 'ghost', image: '8.png', label: 'Fantasma' },
  { pair: 'emoji', image: '9.png', label: 'Emoji sorridente' },
  { pair: 'emoji', image: '10.png', label: 'Emoji sorridente' },
  { pair: 'question', image: '11.png', label: 'Pessoa pensando' },
  { pair: 'question', image: '12.png', label: 'Pessoa pensando' }
];

const board = document.querySelector('#game-board');
const movesElement = document.querySelector('#moves');
const pairsElement = document.querySelector('#pairs');
const timerElement = document.querySelector('#timer');
const statusElement = document.querySelector('#game-status');
const winDialog = document.querySelector('#win-dialog');
const finalMoves = document.querySelector('#final-moves');
const finalTime = document.querySelector('#final-time');
const restartButtons = document.querySelectorAll('[data-restart]');

let firstCard = null;
let secondCard = null;
let lockBoard = true;
let matchedPairs = 0;
let moves = 0;
let elapsedSeconds = 0;
let timerId = null;
let previewId = null;
let mismatchId = null;
let roundId = 0;

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function createCard(cardData, index) {
  const card = document.createElement('button');
  card.className = 'memory-card is-flipped';
  card.type = 'button';
  card.dataset.pair = cardData.pair;
  card.setAttribute('aria-label', `Carta ${index + 1}: virada para baixo`);
  card.setAttribute('aria-pressed', 'false');

  card.innerHTML = `
    <span class="memory-card-inner">
      <span class="card-face card-back" aria-hidden="true"></span>
      <span class="card-face card-front">
        <img src="${cardData.image}" alt="${cardData.label}" draggable="false">
      </span>
    </span>
  `;

  card.addEventListener('click', () => selectCard(card));
  return card;
}

function renderBoard() {
  const cards = shuffle(CARD_DATA);
  const fragment = document.createDocumentFragment();

  cards.forEach((cardData, index) => {
    fragment.append(createCard(cardData, index));
  });

  board.replaceChildren(fragment);
}

function startRound() {
  roundId += 1;
  const activeRound = roundId;

  clearInterval(timerId);
  clearTimeout(previewId);
  clearTimeout(mismatchId);

  timerId = null;
  firstCard = null;
  secondCard = null;
  lockBoard = true;
  matchedPairs = 0;
  moves = 0;
  elapsedSeconds = 0;

  movesElement.textContent = '00';
  pairsElement.textContent = '0';
  timerElement.textContent = '00:00';
  statusElement.textContent = 'Memorize as cartas antes de começar.';
  winDialog.hidden = true;
  document.body.style.overflow = '';

  renderBoard();

  previewId = window.setTimeout(() => {
    if (activeRound !== roundId) return;

    board.querySelectorAll('.memory-card').forEach((card) => {
      card.classList.remove('is-flipped');
    });
    lockBoard = false;
    statusElement.textContent = 'Sua vez: encontre todos os pares.';
  }, 1500);
}

function startTimer() {
  if (timerId !== null) return;

  timerId = window.setInterval(() => {
    elapsedSeconds += 1;
    timerElement.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function revealCard(card) {
  card.classList.add('is-flipped');
  card.setAttribute('aria-pressed', 'true');
  card.setAttribute('aria-label', `Carta revelada: ${card.querySelector('img').alt}`);
}

function hideCard(card) {
  card.classList.remove('is-flipped');
  card.setAttribute('aria-pressed', 'false');
  const cardNumber = [...board.children].indexOf(card) + 1;
  card.setAttribute('aria-label', `Carta ${cardNumber}: virada para baixo`);
}

function selectCard(card) {
  if (lockBoard || card === firstCard || card.classList.contains('is-matched')) return;

  startTimer();
  revealCard(card);

  if (!firstCard) {
    firstCard = card;
    statusElement.textContent = 'Agora escolha a segunda carta.';
    return;
  }

  secondCard = card;
  moves += 1;
  movesElement.textContent = moves.toString().padStart(2, '0');
  lockBoard = true;

  if (firstCard.dataset.pair === secondCard.dataset.pair) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  const matchedCards = [firstCard, secondCard];

  matchedCards.forEach((card) => {
    card.classList.add('is-matched', 'just-matched');
    card.setAttribute('aria-label', `Par encontrado: ${card.querySelector('img').alt}`);
    card.disabled = true;
  });

  matchedPairs += 1;
  pairsElement.textContent = matchedPairs;
  statusElement.textContent = matchedPairs === 6 ? 'Todos os pares encontrados!' : 'Par encontrado! Continue assim.';

  window.setTimeout(() => {
    matchedCards.forEach((card) => card.classList.remove('just-matched'));
  }, 520);

  resetSelection();

  if (matchedPairs === 6) {
    finishGame();
  } else {
    lockBoard = false;
  }
}

function handleMismatch() {
  const activeRound = roundId;
  const cardsToHide = [firstCard, secondCard];
  statusElement.textContent = 'Não foi dessa vez. Observe e tente novamente.';

  mismatchId = window.setTimeout(() => {
    if (activeRound !== roundId) return;

    cardsToHide.forEach(hideCard);
    resetSelection();
    lockBoard = false;
    statusElement.textContent = 'Sua vez: encontre todos os pares.';
  }, 850);
}

function resetSelection() {
  firstCard = null;
  secondCard = null;
}

function finishGame() {
  clearInterval(timerId);
  timerId = null;
  lockBoard = true;

  finalMoves.textContent = `${moves} ${moves === 1 ? 'jogada' : 'jogadas'}`;
  finalTime.textContent = formatTime(elapsedSeconds);

  window.setTimeout(() => {
    winDialog.hidden = false;
    document.body.style.overflow = 'hidden';
    winDialog.querySelector('[data-restart]').focus();
  }, 650);
}

restartButtons.forEach((button) => {
  button.addEventListener('click', startRound);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !winDialog.hidden) {
    startRound();
  }
});

startRound();
