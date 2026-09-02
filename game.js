function cleanHtmlUrl(){
  if(window.location.pathname.endsWith('/game.html')){
    window.history.replaceState(null,'',`/game/${window.location.search}${window.location.hash}`);
  }
}

cleanHtmlUrl();

async function loadJson(path){
  const separator = path.includes('?') ? '&' : '?';
  const url = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${url}${separator}v=20260902-7`,{cache:'no-store'});
  if(!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function escapeHtml(value = ''){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function assetPath(path = ''){
  if(!path || /^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

function setText(selector,value){
  const element = document.querySelector(selector);
  if(element && value !== undefined) element.textContent = value;
}

function setMeta(selector,value){
  const element = document.querySelector(selector);
  if(element && value !== undefined) element.setAttribute('content',assetPath(value));
}

function renderLeaderboard(leaderboardData,activeTabId){
  const leaderboard = document.querySelector('[data-leaderboard]');
  const tabs = document.querySelector('[data-leaderboard-tabs]');
  if(!leaderboard || !leaderboardData) return;

  const tabData = leaderboardData.tabs || [{ id:'current', label:'Current Competition', entries:leaderboardData.entries || [] }];
  const activeTab = tabData.find(tab=>tab.id === activeTabId) || tabData[0];

  if(tabs){
    tabs.innerHTML = tabData.map(tab=>`
      <button type="button" class="${tab.id === activeTab.id ? 'active' : ''}" data-leaderboard-tab="${escapeHtml(tab.id)}" aria-selected="${tab.id === activeTab.id ? 'true' : 'false'}">
        ${escapeHtml(tab.label)}
      </button>
    `).join('');
  }

  leaderboard.innerHTML = `
    <div class="leaderboard-row leaderboard-head">
      ${(leaderboardData.columns || []).map(column=>`<span>${escapeHtml(column)}</span>`).join('')}
    </div>
    ${(activeTab.entries || []).map(entry=>{
      const savedWallet = localStorage.getItem(`loopGameWallet:${activeTab.id}:${entry.rank}`);
      const canClaim = activeTab.id === 'current' && entry.eligible;
      const walletPreview = savedWallet ? `${savedWallet.slice(0,4)}...${savedWallet.slice(-4)}` : '';
      return `
        <div class="leaderboard-row ${canClaim ? 'claimable' : ''}">
          <span class="rank">#${escapeHtml(entry.rank)}</span>
          <span>${escapeHtml(entry.player)}</span>
          <span>${escapeHtml(entry.score)}</span>
          <span>${escapeHtml(entry.multiplier)}</span>
          <span>
            ${canClaim ? `<button class="claim-button" type="button" data-claim-tab="${escapeHtml(activeTab.id)}" data-claim-rank="${escapeHtml(entry.rank)}" data-claim-player="${escapeHtml(entry.player)}">${savedWallet ? `SAVED ${escapeHtml(walletPreview)}` : 'SUBMIT WALLET'}</button>` : '<em>TOP 3 ONLY</em>'}
          </span>
        </div>
      `;
    }).join('')}
  `;
}

function renderDevlogPosts(posts = [],activeFilter = 'All'){
  const devlogPosts = document.querySelector('[data-devlog-posts]');
  if(!devlogPosts) return;
  const visiblePosts = activeFilter === 'All' ? posts : posts.filter(post=>post.category === activeFilter || post.tags?.includes(activeFilter));
  devlogPosts.innerHTML = visiblePosts.map(post=>`
    <article class="devlog-card">
      <div class="devlog-image">
        <img src="${escapeHtml(assetPath(post.image))}" alt="" loading="lazy" />
      </div>
      <div class="devlog-copy">
        <div class="devlog-meta">
          <span>${escapeHtml(post.date)}</span>
          <strong>${escapeHtml(post.status)}</strong>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body)}</p>
        <div class="devlog-tags">
          ${(post.tags || []).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

function renderGamePage(data){
  if(data?.meta){
    document.title = data.meta.title || document.title;
    setMeta('meta[name="description"]',data.meta.description);
    setMeta('meta[property="og:title"]',data.meta.shareTitle);
    setMeta('meta[property="og:description"]',data.meta.shareDescription);
    setMeta('meta[property="og:image"]',data.meta.shareImage);
    setMeta('meta[name="twitter:title"]',data.meta.shareTitle);
    setMeta('meta[name="twitter:description"]',data.meta.shareDescription);
    setMeta('meta[name="twitter:image"]',data.meta.shareImage);
  }

  setText('.game-hero-copy .kicker',data?.hero?.kicker);
  setText('.game-hero-copy p',data?.hero?.body);
  setText('.game-status',data?.hero?.status);
  const cartridge = document.querySelector('.game-hero-cart img');
  if(cartridge && data?.hero?.image) cartridge.src = assetPath(data.hero.image);

  setText('.prototype-copy .kicker',data?.prototype?.kicker);
  setText('.prototype-copy h2',data?.prototype?.title);
  setText('.prototype-copy p',data?.prototype?.body);
  setText('[data-prototype-status]',data?.prototype?.status);
  setText('[data-prototype-title]',data?.prototype?.title);
  setText('[data-prototype-objective]',data?.prototype?.objective);
  const prototypeHud = document.querySelector('[data-prototype-hud]');
  if(prototypeHud && data?.prototype?.hud){
    prototypeHud.innerHTML = data.prototype.hud.map(item=>`
      <span><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong></span>
    `).join('');
  }
  const prototypeThreats = document.querySelector('[data-prototype-threats]');
  if(prototypeThreats && data?.prototype?.threats){
    prototypeThreats.innerHTML = data.prototype.threats.map(threat=>`<span>${escapeHtml(threat)}</span>`).join('');
  }

  setText('.gameplay-section .section-head span',data?.gameplay?.kicker);
  setText('.gameplay-section .section-head h2',data?.gameplay?.title);
  setText('.gameplay-section .section-head p',data?.gameplay?.body);
  const howToPlay = document.querySelector('[data-how-to-play]');
  if(howToPlay && data?.gameplay?.steps){
    howToPlay.innerHTML = data.gameplay.steps.map((step,index)=>`
      <article class="how-card">
        <span>${String(index + 1).padStart(2,'0')}</span>
        <strong>${escapeHtml(step.label)}</strong>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.body)}</p>
      </article>
    `).join('');
  }
  setText('.enemy-head .kicker',data?.gameplay?.enemies?.kicker);
  setText('.enemy-head h2',data?.gameplay?.enemies?.title);
  const enemies = document.querySelector('[data-enemies]');
  if(enemies && data?.gameplay?.enemies?.items){
    enemies.innerHTML = data.gameplay.enemies.items.map(enemy=>`
      <article class="enemy-card">
        <span>${escapeHtml(enemy.type)}</span>
        <h3>${escapeHtml(enemy.name)}</h3>
        <p>${escapeHtml(enemy.body)}</p>
        <strong>${escapeHtml(enemy.impact)}</strong>
      </article>
    `).join('');
  }

  setText('.devlog-section .section-head span',data?.devlog?.kicker);
  setText('.devlog-section .section-head h2',data?.devlog?.title);
  setText('.devlog-section .section-head p',data?.devlog?.body);
  const devlogFilters = document.querySelector('[data-devlog-filters]');
  if(devlogFilters && data?.devlog?.filters){
    devlogFilters.innerHTML = data.devlog.filters.map((filter,index)=>`
      <button type="button" class="${index === 0 ? 'active' : ''}" data-devlog-filter="${escapeHtml(filter)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${escapeHtml(filter)}</button>
    `).join('');
  }
  const devlogProgress = document.querySelector('[data-devlog-progress]');
  if(devlogProgress && data?.devlog?.progress){
    devlogProgress.innerHTML = data.devlog.progress.map(item=>{
      const value = Math.max(0,Math.min(100,Number(item.value) || 0));
      return `
        <article>
          <div><span>${escapeHtml(item.label)}</span><strong>${value}%</strong></div>
          <i style="--progress:${value}%"></i>
        </article>
      `;
    }).join('');
  }

  renderDevlogPosts(data?.devlog?.posts || []);

  setText('.leaderboard-section .section-head span',data?.leaderboard?.kicker);
  setText('.leaderboard-section .section-head h2',data?.leaderboard?.title);
  setText('.leaderboard-section .section-head p',data?.leaderboard?.body);

  renderLeaderboard(data?.leaderboard,'current');

  setText('.game-rules-section .rules-panel .kicker',data?.rules?.kicker);
  setText('.rules-panel h2',data?.rules?.title);
  const rules = document.querySelector('[data-rules]');
  if(rules && data?.rules?.items){
    rules.innerHTML = data.rules.items.map(item=>`<li>${escapeHtml(item)}</li>`).join('');
  }

  setText('.rewards-panel .kicker',data?.rewards?.kicker);
  setText('.rewards-panel h2',data?.rewards?.title);
  setText('.rewards-panel p',data?.rewards?.body);
  const rewards = document.querySelector('[data-rewards]');
  if(rewards && data?.rewards?.slots){
    rewards.innerHTML = data.rewards.slots.map(slot=>`
      <article>
        <span>${escapeHtml(slot.place)}</span>
        <strong>${escapeHtml(slot.reward)}</strong>
        <small>${escapeHtml(slot.status)}</small>
      </article>
    `).join('');
  }

  setText('.game-modes-section .section-head span',data?.modes?.kicker);
  setText('.game-modes-section .section-head h2',data?.modes?.title);
  const modes = document.querySelector('[data-modes]');
  if(modes && data?.modes?.items){
    modes.innerHTML = data.modes.items.map(item=>`
      <article class="mode-card">
        <span>${escapeHtml(item.status)}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.details)}</p>
      </article>
    `).join('');
  }

  setText('.competitions-section .section-head span',data?.competitions?.kicker);
  setText('.competitions-section .section-head h2',data?.competitions?.title);
  const competitions = document.querySelector('[data-competitions]');
  if(competitions && data?.competitions?.items){
    competitions.innerHTML = data.competitions.items.map(item=>`
      <article class="competition-card">
        <span>${escapeHtml(item.status)}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.details)}</p>
        <strong>${escapeHtml(item.reward)}</strong>
      </article>
    `).join('');
  }

  setText('.fame-panel .kicker',data?.hallOfFame?.kicker);
  setText('.fame-panel h2',data?.hallOfFame?.title);
  setText('.fame-panel p',data?.hallOfFame?.body);
  const winners = document.querySelector('[data-winners]');
  if(winners && data?.hallOfFame?.winners){
    winners.innerHTML = data.hallOfFame.winners.map(winner=>`
      <article>
        <span>${escapeHtml(winner.place)}</span>
        <div>
          <strong>${escapeHtml(winner.player)}</strong>
          <small>${escapeHtml(winner.competition)} · ${escapeHtml(winner.reward)}</small>
        </div>
      </article>
    `).join('');
  }

  setText('.fair-panel .kicker',data?.fairPlay?.kicker);
  setText('.fair-panel h2',data?.fairPlay?.title);
  setText('.fair-panel p',data?.fairPlay?.body);
  const fairPlay = document.querySelector('[data-fair-play]');
  if(fairPlay && data?.fairPlay?.checks){
    fairPlay.innerHTML = data.fairPlay.checks.map(check=>`<li>${escapeHtml(check)}</li>`).join('');
  }
}

function initGameInteractions(data){
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) entry.target.classList.add('visible');
    });
  },{threshold:.12});

  document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));

  const menuBtn = document.querySelector('.menu-btn');
  const navLinks = document.querySelector('.nav-links');
  menuBtn?.addEventListener('click',()=>{
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded',String(open));
  });
  navLinks?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    navLinks.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded','false');
  }));

  document.querySelectorAll('video[autoplay]').forEach(video=>{
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    const requestPlay = ()=>video.play?.().catch(()=>{});
    video.addEventListener('canplay',requestPlay,{once:true});
    requestPlay();
    setTimeout(requestPlay,600);
  });

  const copyContract = document.querySelector('[data-copy-contract]');
  const contractAddress = document.querySelector('[data-contract-address]');
  const copyMessage = document.querySelector('[data-copy-message]');
  copyContract?.addEventListener('click',async ()=>{
    const value = contractAddress?.textContent?.trim();
    if(!value) return;
    try{
      await navigator.clipboard.writeText(value);
      copyContract.textContent = 'COPIED';
      if(copyMessage) copyMessage.textContent = 'Contract address copied.';
    }catch(error){
      if(copyMessage) copyMessage.textContent = `Copy this CA: ${value}`;
    }
    setTimeout(()=>{
      copyContract.textContent = 'COPY CA';
      if(copyMessage) copyMessage.textContent = '';
    },1600);
  });

  const dialog = document.querySelector('[data-wallet-dialog]');
  const form = document.querySelector('[data-wallet-form]');
  const playerLabel = document.querySelector('[data-claim-player]');
  const message = document.querySelector('[data-wallet-message]');
  const closeWallet = document.querySelector('[data-close-wallet]');

  function closeWalletDialog(){
    message.textContent = '';
    form?.reset();
    dialog?.close();
  }

  closeWallet?.addEventListener('click',closeWalletDialog);
  dialog?.addEventListener('click',event=>{
    if(event.target === dialog) closeWalletDialog();
  });

  document.addEventListener('click',event=>{
    const devlogFilter = event.target.closest('[data-devlog-filter]');
    if(devlogFilter && data?.devlog?.posts){
      document.querySelectorAll('[data-devlog-filter]').forEach(button=>{
        const active = button === devlogFilter;
        button.classList.toggle('active',active);
        button.setAttribute('aria-pressed',String(active));
      });
      renderDevlogPosts(data.devlog.posts,devlogFilter.dataset.devlogFilter);
      return;
    }

    const tab = event.target.closest('[data-leaderboard-tab]');
    if(tab && data?.leaderboard){
      renderLeaderboard(data.leaderboard,tab.dataset.leaderboardTab);
      return;
    }

    const button = event.target.closest('[data-claim-rank]');
    if(!button || !dialog || !form) return;
    form.reset();
    message.textContent = '';
    form.elements.rank.value = button.dataset.claimRank;
    form.elements.board.value = button.dataset.claimTab;
    playerLabel.textContent = `#${button.dataset.claimRank} ${button.dataset.claimPlayer}`;
    dialog.showModal();
  });

  form?.addEventListener('submit',event=>{
    event.preventDefault();
    const wallet = form.elements.walletAddress.value.trim();
    const rank = form.elements.rank.value;
    const isSolanaLike = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
    if(!isSolanaLike){
      message.textContent = 'Enter a valid Solana-style wallet address.';
      return;
    }
    const board = form.elements.board.value || 'current';
    localStorage.setItem(`loopGameWallet:${board}:${rank}`,wallet);
    message.textContent = 'Wallet saved for this preview slot.';
    const button = document.querySelector(`[data-claim-rank="${rank}"]`);
    if(button) button.textContent = `SAVED ${wallet.slice(0,4)}...${wallet.slice(-4)}`;
    setTimeout(()=>dialog.close(),900);
  });
}

(async function init(){
  let data = null;
  try{
    data = await loadJson('content/game.json');
    renderGamePage(data);
  }catch(error){
    console.warn('Using inline game page content because content file could not be loaded.',error);
  }

  initGameInteractions(data);
})();
