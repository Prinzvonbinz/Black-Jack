let players = [];
let dealer = null;
let deck = [];
let currentPlayerIndex = 0;

function addPlayer() {
  const nameInput = document.getElementById("playerNameInput");
  const name = nameInput.value.trim();
  if (!name || players.find(p => p.name === name)) return;
  players.push({ name, hand: [], chips: 500, bet: 0, isDealer: false });
  nameInput.value = "";
  renderPlayerList();
}

function renderPlayerList() {
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  players.forEach((p, index) => {
    const isDealer = p.isDealer ? " (Dealer)" : "";
    const div = document.createElement("div");
    div.innerHTML = `
      ${p.name}${isDealer} – <button onclick="setDealer(${index})">Als Dealer wählen</button>
    `;
    list.appendChild(div);
  });
}

function setDealer(index) {
  players.forEach(p => p.isDealer = false);
  players[index].isDealer = true;
  dealer = players[index];
  renderPlayerList();
}

function startGame() {
  if (!dealer || players.length < 2) {
    setMessage("Wähle einen Dealer und mindestens 1 Spieler.");
    return;
  }
  document.getElementById("mainMenu").classList.add("hidden");
  document.getElementById("gameArea").classList.remove("hidden");
  document.getElementById("dealerName").textContent = dealer.name;
  playRound();
}

function playRound() {
  deck = createDeck();
  shuffleDeck(deck);

  players.forEach(p => {
    p.hand = [];
    p.bet = 0;
    if (!p.isDealer && p.chips > 0) {
      let bet = parseInt(prompt(`${p.name}, wie viel möchtest du setzen? (Chips: ${p.chips})`)) || 0;
      if (bet > p.chips) bet = p.chips;
      p.bet = bet;
      p.chips -= bet;
    }
  });

  for (let i = 0; i < 2; i++) {
    players.forEach(p => {
      if (!p.isDealer || i === 0) p.hand.push(deck.pop());
    });
  }

  currentPlayerIndex = players.findIndex(p => !p.isDealer && p.bet > 0);
  updateUI();
  if (currentPlayerIndex === -1) return endRound(); // Niemand hat gesetzt
  setMessage("");
}

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (let s of suits) {
    for (let v of values) {
      deck.push({ suit: s, value: v });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function updateUI() {
  document.getElementById("dealerHand").innerHTML = dealer.hand.map(renderCard).join("");
  document.getElementById("dealerTotal").textContent = `Punkte: ${calculateHandValue(dealer.hand)}`;

  const area = document.getElementById("playersArea");
  area.innerHTML = "";

  players.forEach((p, index) => {
    if (p.isDealer) return;
    const div = document.createElement("div");
    div.className = "playerBox";
    div.innerHTML = `
      <h3>${p.name} (Chips: ${p.chips})</h3>
      <div class="hand">${p.hand.map(renderCard).join("")}</div>
      <div>Punkte: ${calculateHandValue(p.hand)}</div>
      <div>Einsatz: ${p.bet}</div>
    `;
    if (index === currentPlayerIndex) {
      div.innerHTML += `
        <button onclick="hit()">Hit</button>
        <button onclick="stand()">Stand</button>
      `;
    }
    area.appendChild(div);
  });
}

function renderCard(card) {
  return `<div class="card">${card.value}${card.suit}</div>`;
}

function calculateHandValue(hand) {
  let total = 0, aces = 0;
  hand.forEach(c => {
    if (['J', 'Q', 'K'].includes(c.value)) total += 10;
    else if (c.value === 'A') {
      total += 11;
      aces++;
    } else total += parseInt(c.value);
  });
  while (total > 21 && aces--) total -= 10;
  return total;
}

function isBlackjack(hand) {
  return hand.length === 2 && calculateHandValue(hand) === 21;
}

function hit() {
  const p = players[currentPlayerIndex];
  p.hand.push(deck.pop());
  if (calculateHandValue(p.hand) > 21) {
    setMessage(`${p.name} hat sich überkauft!`);
    nextTurn();
  } else updateUI();
}

function stand() {
  nextTurn();
}

function nextTurn() {
  const next = players.findIndex((p, i) => i > currentPlayerIndex && !p.isDealer && p.bet > 0);
  if (next === -1) return playDealer();
  currentPlayerIndex = next;
  updateUI();
}

function playDealer() {
  while (calculateHandValue(dealer.hand) < 17) {
    dealer.hand.push(deck.pop());
  }
  updateUI();
  endRound();
}

function endRound() {
  const dealerScore = calculateHandValue(dealer.hand);
  const dealerBJ = isBlackjack(dealer.hand);
  let roundWinners = [];

  players.forEach(p => {
    if (p.isDealer || p.bet === 0) return;

    const score = calculateHandValue(p.hand);
    const bj = isBlackjack(p.hand);

    if (score > 21) {
      setMessage(`${p.name} verliert (überkauft).`);
    } else if (bj && !dealerBJ) {
      p.chips += Math.floor(p.bet * 2.5);
      roundWinners.push(p.name);
    } else if (!bj && dealerBJ) {
      setMessage(`${p.name} verliert – Dealer hat Blackjack.`);
    } else if (score > dealerScore || dealerScore > 21) {
      p.chips += p.bet * 2;
      roundWinners.push(p.name);
    } else if (score === dealerScore) {
      p.chips += p.bet;
      setMessage(`${p.name} spielt unentschieden.`);
    } else {
      setMessage(`${p.name} verliert.`);
    }
  });

  document.getElementById("winnerArea").textContent =
    roundWinners.length ? `Gewinner: ${roundWinners.join(", ")}` : `Keine Gewinner in dieser Runde.`;

  setTimeout(() => {
    const activePlayers = players.filter(p => !p.isDealer && p.chips > 0);
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0];
      document.getElementById("winnerArea").textContent = winner
        ? `${winner.name} gewinnt das Spiel!`
        : `Niemand hat Chips übrig.`;
      setMessage("Spiel beendet.");
    } else {
      playRound();
    }
  }, 3000);
}

function setMessage(text) {
  document.getElementById("messageArea").textContent = text;
}
