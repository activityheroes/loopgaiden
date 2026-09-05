function cleanHtmlUrl(){
  if(window.location.pathname.endsWith('/index.html')){
    const cleanPath = window.location.pathname.replace(/index\.html$/,'');
    window.history.replaceState(null,'',`${cleanPath}${window.location.search}${window.location.hash}`);
  }
}

cleanHtmlUrl();

async function loadJson(path){
  const separator = path.includes('?') ? '&' : '?';
  const url = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${url}${separator}v=20260904-1`,{cache:'no-store'});
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

function setText(selector,value){
  const element = document.querySelector(selector);
  if(element && value !== undefined) element.textContent = value;
}

function setHtml(selector,value){
  const element = document.querySelector(selector);
  if(element && value !== undefined) element.innerHTML = value;
}

function setMeta(selector,value){
  const element = document.querySelector(selector);
  if(element && value !== undefined) element.setAttribute('content',value);
}

function renderSocialLinks(socials = [],buyUrl = 'https://pump.fun/'){
  const socialHtml = socials.map(social=>`
    <a href="${escapeHtml(social.url)}" target="_blank" rel="noopener">${escapeHtml(social.label)}</a>
  `).join('');

  document.querySelectorAll('.social-links').forEach(element=>{
    element.innerHTML = socialHtml;
  });

  const footerSocials = document.querySelector('.footer-socials');
  if(footerSocials) footerSocials.innerHTML = socialHtml;

  const mobileSticky = document.querySelector('.mobile-sticky');
  if(mobileSticky){
    const chart = socials.find(social=>social.label.toLowerCase().includes('dex'));
    const x = socials.find(social=>social.label.toLowerCase() === 'x');
    const tiktok = socials.find(social=>social.label.toLowerCase().includes('tiktok'));
    const instagram = socials.find(social=>social.label.toLowerCase().includes('instagram'));
    mobileSticky.innerHTML = `
      <a href="${escapeHtml(buyUrl)}" target="_blank" rel="noopener">Buy</a>
      ${x ? `<a href="${escapeHtml(x.url)}" target="_blank" rel="noopener">X</a>` : ''}
      ${tiktok ? `<a href="${escapeHtml(tiktok.url)}" target="_blank" rel="noopener">TikTok</a>` : ''}
      ${instagram ? `<a href="${escapeHtml(instagram.url)}" target="_blank" rel="noopener">Instagram</a>` : ''}
      ${chart ? `<a href="${escapeHtml(chart.url)}" target="_blank" rel="noopener">Chart</a>` : ''}
    `;
  }

  const hubGrid = document.querySelector('.hub-grid');
  if(hubGrid){
    hubGrid.innerHTML = socials.map(social=>`
      <a href="${escapeHtml(social.url)}" target="_blank" rel="noopener">
        <span>${escapeHtml(social.label)}</span>
        <strong>${escapeHtml(social.handle || social.label)}</strong>
      </a>
    `).join('');
  }
}

function getIssueEntries(issueData = {}){
  return [
    { key: 'activeIssue', issue: issueData.activeIssue },
    { key: 'nextIssue', issue: issueData.nextIssue },
    ...(issueData.openIssues || []).map(issue=>({ key: issue.key, issue }))
  ].filter(entry=>entry.issue);
}

function getVisibleIssueEntries(issueData = {}){
  const entries = getIssueEntries(issueData);
  const visibleKeys = issueData.release?.visibleIssueKeys;
  if(!Array.isArray(visibleKeys) || !visibleKeys.length) return entries;
  return entries.filter(entry=>visibleKeys.includes(entry.key) || visibleKeys.includes(entry.issue.number));
}

function getIssueList(issueData = {}){
  return getVisibleIssueEntries(issueData).map(entry=>entry.issue);
}

function getIssueByKey(issueData = {},issueKey = 'activeIssue'){
  const entry = getIssueEntries(issueData).find(item=>item.key === issueKey || item.issue.number === issueKey);
  return entry?.issue || issueData.activeIssue;
}

function getSceneLimit(issueData = {},issueKey = 'activeIssue',issue){
  const scenes = issue?.scenes || [];
  const limits = issueData.release?.sceneLimits || {};
  const rawLimit = limits[issueKey] ?? limits[issue?.number];
  if(rawLimit === undefined || rawLimit === null) return scenes.length;
  const limit = Number(rawLimit);
  if(!Number.isFinite(limit)) return scenes.length;
  return Math.max(0,Math.min(scenes.length,Math.floor(limit)));
}

function getLockedIssueCards(issueData = {}){
  const visibleIssues = new Set(getIssueList(issueData).map(issue=>issue.number));
  const release = issueData.release || {};
  const hiddenIssues = getIssueEntries(issueData)
    .map(entry=>entry.issue)
    .filter(issue=>!visibleIssues.has(issue.number))
    .map(issue=>({
      number: issue.number,
      title: 'CLASSIFIED',
      quote: release.lockedQuote || 'NEXT TRANSMISSION SEALED.',
      status: release.lockedStatus || 'ISSUE LOCKED'
    }));

  const existingLocks = issueData.lockedLords || [];
  return [...hiddenIssues,...existingLocks].filter(lord=>!visibleIssues.has(lord.number));
}

function renderIssueContent(issue,siteData = {},issueKey = 'activeIssue',issueData = {}){
  if(!issue) return;
  const issueNumber = escapeHtml(issue.number);
  const issueTitle = escapeHtml(issue.title);
  const allScenes = issue.scenes || [];
  const sceneLimit = getSceneLimit(issueData,issueKey,issue);
  const scenes = allScenes.slice(0,sceneLimit);
  const lockedSceneCount = Math.max(0,allScenes.length - scenes.length);
  const hasLockedScenes = lockedSceneCount > 0;
  const release = issueData.release || {};
  const buyUrl = siteData?.token?.buyUrl || '#token';
  const buyLabel = siteData?.token?.buyUrl ? 'BUY $LGDN' : 'TOKEN STATUS';

  setText('#story .section-head h2',`ISSUE ${issue.number} — ${issue.title}`);
  setText('#story .section-head p',issue.summary);
  setText('#readerProgressText',`Scene 1 / ${Math.max(scenes.length,1)}`);

  const sceneStack = document.querySelector('.scene-stack');
  if(!sceneStack) return;

  sceneStack.innerHTML = `
    <article class="issue-start reveal visible" id="issue-cover" data-issue-cover>
      <div class="issue-start-cover">
        <img src="${escapeHtml(issue.cover)}" alt="Issue ${issueNumber} cover" />
      </div>
      <div class="issue-start-copy">
        <span class="kicker">ISSUE ${issueNumber}</span>
        <h3>${issueTitle}</h3>
        <p>${escapeHtml(issue.coverIntro)}</p>
        <div class="issue-actions">
          <button class="btn primary" type="button" data-start-scenes>START SCENE 01</button>
          <button class="btn" type="button" data-share-issue>SHARE ISSUE</button>
        </div>
      </div>
    </article>
    ${scenes.map((scene,index)=>{
      const number = index + 1;
      const padded = String(number).padStart(2,'0');
      const prevId = number > 1 ? `scene-${String(number - 1).padStart(2,'0')}` : '';
      const hasNextVisibleScene = number < scenes.length;
      const nextId = hasNextVisibleScene ? `scene-${String(number + 1).padStart(2,'0')}` : '';
      const poster = scene.poster ? ` poster="${escapeHtml(scene.poster)}"` : '';
      const reverse = number % 2 === 0 ? ' reverse' : '';
      const finalControls = number === scenes.length ? `
        <div class="scene-nav">
          <button class="scene-next" type="button"${prevId ? ` data-prev-scene="${prevId}"` : ' disabled'}>PREVIOUS SCENE</button>
          ${hasLockedScenes ? '<button class="scene-next" type="button" disabled>NEXT SCENE LOCKED</button>' : ''}
        </div>
      ` : `
        <div class="scene-nav">
          <button class="scene-next" type="button"${prevId ? ` data-prev-scene="${prevId}"` : ' disabled'}>PREVIOUS SCENE</button>
          <button class="scene-next" type="button" data-next-scene="${nextId}">NEXT SCENE</button>
        </div>
      `;

      return `
        <article class="scene reveal visible${reverse}${number === scenes.length ? ' final-scene' : ''}" id="scene-${padded}" data-progress-scene="${number}">
          <div class="scene-num">${padded}</div>
          <div class="scene-media">
            <video${poster} data-src="${escapeHtml(scene.video)}" controls muted loop playsinline preload="none" aria-label="${escapeHtml(scene.ariaLabel || scene.title)}"></video>
            <div class="video-loading">LOADING TRANSMISSION</div>
            <button class="video-retry" type="button" data-retry-video>TRANSMISSION FAILED — RETRY</button>
          </div>
          <div class="scene-copy">
            <span>${escapeHtml(scene.kicker)}</span>
            <h3>${escapeHtml(scene.title)}</h3>
            <p>${escapeHtml(scene.body)}</p>
            ${finalControls}
          </div>
        </article>
      `;
    }).join('')}
    <article class="issue-complete-panel reveal visible" id="issue-complete">
      <div>
        <span>${hasLockedScenes ? 'NEXT DROP LOCKED' : 'ISSUE COMPLETE'}</span>
        <h3>${hasLockedScenes ? escapeHtml(release.lockedSceneTitle || 'NEXT SCENE SEALED.') : (issueNumber === '001' ? 'THE FARMER FILE IS OPEN.' : `${issueTitle} SIGNAL IS OPEN.`)}</h3>
        <p>${hasLockedScenes ? escapeHtml(release.lockedSceneBody || 'The next transmission unlocks soon.') : 'Share the transmission, join the Trenches, or open the live $LGDN token.'}</p>
      </div>
      <div class="issue-actions issue-actions-bottom">
        <button class="btn" type="button" data-start-issue>START FROM BEGINNING</button>
        <button class="btn" type="button" data-share-issue>SHARE ISSUE</button>
        <a class="btn" href="${escapeHtml(buyUrl)}"${siteData?.token?.buyUrl ? ' target="_blank" rel="noopener"' : ''}>${buyLabel}</a>
        <a class="btn" href="#community">JOIN COMMUNITY</a>
        <button class="btn primary" type="button" data-close-issue>BACK TO GREED LORDS</button>
        <a class="btn" href="#top">FRONT PAGE</a>
      </div>
    </article>
  `;
}

function renderIssue(issueData,siteData = {}){
  if(!issueData?.activeIssue) return;

  const issues = getIssueList(issueData);
  const activeNumbers = new Set(issues.map(issue=>issue.number));
  const lordGrid = document.querySelector('.lord-grid');
  if(lordGrid){
    lordGrid.innerHTML = `
      ${getVisibleIssueEntries(issueData).map((entry,index)=>{
        const issue = entry.issue;
        const issueNumber = escapeHtml(issue.number);
        const issueTitle = escapeHtml(issue.title);
        const issueKey = escapeHtml(entry.key || issue.key || (index === 0 ? 'activeIssue' : 'nextIssue'));
        return `
          <article class="lord-card farmer issue-cover reveal visible${index === 0 ? '' : ' next-file'}" data-issue-key="${issueKey}" data-issue-target="story" role="button" tabindex="0" aria-controls="story" aria-expanded="false">
            <div class="cover-frame">
              <img src="${escapeHtml(issue.cover || 'assets/optimized/cover.jpg')}" alt="Issue ${issueNumber} cover" />
            </div>
            <div class="lord-info issue-card-info">
              <div class="lord-index">ISSUE ${issueNumber}</div>
              <h3>${issueTitle}</h3>
              <p>${escapeHtml(issue.cardSubtitle)}</p>
              <span class="status active issue-button" data-issue-label="OPEN ISSUE ${issueNumber}" data-issue-key="${issueKey}">OPEN ISSUE ${issueNumber}</span>
            </div>
          </article>
        `;
      }).join('')}
      ${getLockedIssueCards(issueData).filter(lord=>!activeNumbers.has(lord.number)).map(lord=>`
        <article class="lord-card silhouette reveal">
          <div>
            <b>${escapeHtml(lord.number)}</b>
            <h3>${escapeHtml(lord.title)}</h3>
            <p>${escapeHtml(lord.quote)}</p>
            <span>${escapeHtml(lord.status)}</span>
          </div>
        </article>
      `).join('')}
    `;
  }

  renderIssueContent(issueData.activeIssue,siteData,'activeIssue',issueData);
}

function renderMission(mission){
  const section = document.querySelector('#mission');
  if(!section || !mission) return;

  setText('#mission .section-head span',mission.kicker);
  setText('#mission .section-head h2',mission.title);
  setText('#mission .section-head p',mission.body);

  const missionPath = section.querySelector('.mission-path');
  if(!missionPath) return;

  const chapters = (mission.chapters || []).map(chapter=>{
    const items = chapter.items?.length ? `
      <ul>
        ${chapter.items.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    ` : '';

    const badge = chapter.badge ? `<div class="boss-chip defeated">${escapeHtml(chapter.badge)}</div>` : '';
    const callout = chapter.callout ? `<strong class="trenches-call">${escapeHtml(chapter.callout)}</strong>` : '';
    const silhouette = chapter.silhouette ? `<div class="extractor-silhouette" aria-hidden="true">${escapeHtml(chapter.silhouette)}</div>` : '';
    const bosses = chapter.bosses?.length ? `
      <div class="boss-grid">
        ${chapter.bosses.map(boss=>`<span class="${escapeHtml(boss.state || '')}">${escapeHtml(boss.label)}</span>`).join('')}
      </div>
    ` : '';

    return `
      <article class="mission-chapter ${escapeHtml(chapter.tone || '')}">
        <div class="mission-marker">${escapeHtml(chapter.number)}</div>
        <div class="mission-card">
          <span class="mission-status">${escapeHtml(chapter.status)}</span>
          <h3>${escapeHtml(chapter.title)}</h3>
          <p>${escapeHtml(chapter.body)}</p>
          ${items}
          ${badge}
          ${callout}
          ${silhouette}
          ${bosses}
        </div>
      </article>
    `;
  }).join('');

  const final = mission.final ? `
    <article class="mission-final">
      <span>${escapeHtml(mission.final.kicker)}</span>
      <h3>${mission.final.title}</h3>
      <p>${escapeHtml(mission.final.body)}</p>
      <strong>${escapeHtml(mission.final.status)}</strong>
    </article>
  ` : '';

  missionPath.innerHTML = chapters + final;
}

function renderSite(site,socials,issues){
  window.loopGaidenSiteData = site;
  if(site?.meta){
    document.title = site.meta.title || document.title;
    setMeta('meta[name="description"]',site.meta.description);
    setMeta('meta[property="og:title"]',site.meta.shareTitle);
    setMeta('meta[property="og:description"]',site.meta.shareDescription);
    setMeta('meta[property="og:image"]',site.meta.shareImage);
    setMeta('meta[name="twitter:title"]',site.meta.shareTitle);
    setMeta('meta[name="twitter:description"]',site.meta.shareDescription);
    setMeta('meta[name="twitter:image"]',site.meta.shareImage);
  }

  setText('.hero .eyebrow',site?.hero?.eyebrow);
  const heroMedia = document.querySelector('.hero-bg');
  const heroPoster = document.querySelector('.hero-poster');
  if(heroPoster && site?.hero?.image) heroPoster.src = site.hero.image;
  if(heroMedia?.tagName === 'VIDEO'){
    if(site?.hero?.image) heroMedia.poster = site.hero.image;
    const source = heroMedia.querySelector('source');
    if(source && site?.hero?.video && source.getAttribute('src') !== site.hero.video){
      source.src = site.hero.video;
      heroMedia.load();
      heroMedia.play?.().catch(()=>{});
    }
  }else if(heroMedia && site?.hero?.image){
    heroMedia.src = site.hero.image;
  }
  setHtml('.hero h1',site?.hero?.headline);
  setHtml('.hero-line',site?.hero?.line);
  const heroPrimary = document.querySelector('.hero-actions .primary');
  setText('.hero-actions .primary',site?.hero?.primaryCta);
  if(heroPrimary && site?.hero?.primaryUrl) heroPrimary.setAttribute('href',site.hero.primaryUrl);
  const heroSecondary = document.querySelector('.hero-actions .btn:not(.primary):not(.ghost)');
  if(heroSecondary && site?.hero){
    heroSecondary.textContent = site.hero.secondaryCta || heroSecondary.textContent;
    if(site.hero.secondaryUrl) heroSecondary.setAttribute('href',site.hero.secondaryUrl);
  }
  setText('.latest-inner .kicker',site?.latest?.kicker);
  setText('.latest-inner h2',site?.latest?.title);
  setText('.latest-inner button',site?.latest?.button);

  setText('.game-copy .kicker',site?.game?.kicker);
  setText('.game-copy h2',site?.game?.title);
  setText('.game-copy p',site?.game?.body);
  const gameCta = document.querySelector('.game-cta');
  if(gameCta && site?.game){
    gameCta.textContent = site.game.status || gameCta.textContent;
    gameCta.href = site.game.url || '#game';
    gameCta.removeAttribute('aria-disabled');
  }
  const gameImage = document.querySelector('.game-cartridge img');
  if(gameImage && site?.game?.image) gameImage.src = site.game.image;

  setText('.manifesto .trenches-panel span',site?.manifesto?.kicker);
  setText('.manifesto .trenches-panel h2',site?.manifesto?.title);
  const manifestoCopy = document.querySelector('.manifesto .trenches-panel > div:first-child');
  if(manifestoCopy && site?.manifesto?.paragraphs){
    manifestoCopy.querySelectorAll('p').forEach(paragraph=>paragraph.remove());
    site.manifesto.paragraphs.forEach(paragraph=>{
      const element = document.createElement('p');
      element.textContent = paragraph;
      manifestoCopy.appendChild(element);
    });
  }
  const manifestoStatements = document.querySelector('.manifesto .trenches-statements');
  if(manifestoStatements && site?.manifesto?.statements){
    manifestoStatements.innerHTML = site.manifesto.statements.map(statement=>`
      <strong>${escapeHtml(statement)}</strong>
    `).join('');
  }

  renderMission(site?.mission);

  setText('.token-card h2',site?.token?.symbol);
  const tokenNetwork = document.querySelector('.token-card h2 + p');
  if(tokenNetwork && site?.token?.network) tokenNetwork.textContent = site.token.network;
  setText('.launch-badge',site?.token?.launchStatus);
  setText('.launch-state span',site?.token?.contractStatus);
  setText('.launch-state strong',site?.token?.contractMessage);
  setText('#ca',site?.token?.contractAddress);
  const buyButton = document.querySelector('.token-actions .primary');
  if(buyButton){
    buyButton.textContent = site?.token?.buyLabel || buyButton.textContent;
    if(site?.token?.buyUrl){
      buyButton.href = site.token.buyUrl;
      buyButton.setAttribute('target','_blank');
      buyButton.setAttribute('rel','noopener');
    }else{
      buyButton.href = '#token';
      buyButton.removeAttribute('target');
      buyButton.removeAttribute('rel');
    }
  }
  setText('.fineprint',site?.token?.fineprint);

  setText('.community .kicker',site?.community?.kicker);
  setText('.community h2',site?.community?.title);
  setHtml('.community p:not(.official-warning)',site?.community?.body);
  setText('.official-warning',site?.community?.warning);
  setText('.community-actions .primary',site?.community?.joinLabel);
  const readCommunity = document.querySelector('.community-actions [data-open-issue]');
  if(readCommunity && site?.community?.readLabel) readCommunity.textContent = site.community.readLabel;

  setText('.next-issue .kicker',site?.nextIssue?.kicker);
  setText('.next-issue h2',site?.nextIssue?.title);
  setText('.next-issue p',site?.nextIssue?.body);
  setText('.next-issue .btn',site?.nextIssue?.button);

  renderSocialLinks(socials,site?.token?.buyUrl);
  renderIssue(issues,site);
}

function initInteractions(issueData){
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

  const heroVideo = document.querySelector('.hero-bg');
  const heroVideoToggle = document.querySelector('[data-hero-video-toggle]');
  function setHeroVideoPaused(paused){
    if(!heroVideo || heroVideo.tagName !== 'VIDEO') return;
    document.body.classList.toggle('hero-video-paused',paused);
    if(heroVideoToggle){
      heroVideoToggle.textContent = paused ? 'PLAY VIDEO' : 'PAUSE VIDEO';
      heroVideoToggle.setAttribute('aria-pressed',String(paused));
    }
  }
  if(heroVideo?.tagName === 'VIDEO'){
    let heroVideoUserPaused = false;
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.setAttribute('muted','');
    heroVideo.setAttribute('playsinline','');
    function requestHeroVideoPlay(){
      if(heroVideoUserPaused) return;
      heroVideo.play?.().catch(()=>{});
    }
    heroVideo.addEventListener('loadeddata',()=>heroVideo.classList.add('loaded'));
    heroVideo.addEventListener('canplay',requestHeroVideoPlay,{once:true});
    heroVideo.addEventListener('pause',()=>setHeroVideoPaused(true));
    heroVideo.addEventListener('play',()=>setHeroVideoPaused(false));
    if(heroVideo.readyState >= 2) heroVideo.classList.add('loaded');
    setHeroVideoPaused(heroVideo.paused);
    requestHeroVideoPlay();
    setTimeout(requestHeroVideoPlay,600);
    heroVideoToggle?.addEventListener('click',()=>{
      if(heroVideo.paused){
        heroVideoUserPaused = false;
        heroVideo.play().catch(()=>{});
      }else{
        heroVideoUserPaused = true;
        heroVideo.pause();
      }
    });
  }

  const issueViewer = document.getElementById('story');
  const issueTriggers = document.querySelectorAll('[data-issue-target="story"]');
  const openIssueButtons = document.querySelectorAll('[data-open-issue]');
  let issueCover = document.getElementById('issue-cover');
  let closeIssueButtons = document.querySelectorAll('[data-close-issue]');
  let issueLabels = document.querySelectorAll('[data-issue-label]');
  let progressScenes = document.querySelectorAll('[data-progress-scene]');
  let sceneVideos = document.querySelectorAll('.scene video');
  let scenePicker = document.querySelector('.scene-picker');
  let sceneNavButtons = document.querySelectorAll('[data-next-scene],[data-prev-scene]');
  let startIssueButtons = document.querySelectorAll('[data-start-issue]');
  let startScenesButtons = document.querySelectorAll('[data-start-scenes]');
  let soundToggleButtons = document.querySelectorAll('[data-sound-toggle]');
  let shareIssueButtons = document.querySelectorAll('[data-share-issue]');
  let readerProgressText = document.getElementById('readerProgressText');
  let readerProgressBar = document.getElementById('readerProgressBar');
  let mobileProgressText = document.querySelector('[data-mobile-progress-text]');
  let mobileProgressBar = document.querySelector('[data-mobile-progress-bar]');
  let mobilePrevButton = document.querySelector('[data-mobile-prev]');
  let mobileNextButton = document.querySelector('[data-mobile-next]');
  let totalScenes = progressScenes.length || 1;
  let videoLoadObserver = null;
  let progressObserver = null;
  let soundEnabled = false;
  let syncingVideoSound = false;
  let currentSceneNumber = 1;
  let currentIssueKey = 'activeIssue';

  function getCurrentIssue(){
    return getIssueByKey(issueData,currentIssueKey);
  }

  function refreshReaderRefs(){
    issueCover = document.getElementById('issue-cover');
    closeIssueButtons = document.querySelectorAll('[data-close-issue]');
    issueLabels = document.querySelectorAll('[data-issue-label]');
    progressScenes = document.querySelectorAll('[data-progress-scene]');
    sceneVideos = document.querySelectorAll('.scene video');
    scenePicker = document.querySelector('.scene-picker');
    sceneNavButtons = document.querySelectorAll('[data-next-scene],[data-prev-scene]');
    startIssueButtons = document.querySelectorAll('[data-start-issue]');
    startScenesButtons = document.querySelectorAll('[data-start-scenes]');
    soundToggleButtons = document.querySelectorAll('[data-sound-toggle]');
    shareIssueButtons = document.querySelectorAll('[data-share-issue]');
    readerProgressText = document.getElementById('readerProgressText');
    readerProgressBar = document.getElementById('readerProgressBar');
    mobileProgressText = document.querySelector('[data-mobile-progress-text]');
    mobileProgressBar = document.querySelector('[data-mobile-progress-bar]');
    mobilePrevButton = document.querySelector('[data-mobile-prev]');
    mobileNextButton = document.querySelector('[data-mobile-next]');
    totalScenes = progressScenes.length || 1;
  }

  function updateReaderProgress(sceneNumber){
    currentSceneNumber = sceneNumber;
    const progress = `${(sceneNumber / totalScenes) * 100}%`;
    if(readerProgressText) readerProgressText.textContent = `Scene ${sceneNumber} / ${totalScenes}`;
    if(readerProgressBar) readerProgressBar.style.width = progress;
    if(mobileProgressText) mobileProgressText.textContent = `SCENE ${String(sceneNumber).padStart(2,'0')} / ${String(totalScenes).padStart(2,'0')}`;
    if(mobileProgressBar) mobileProgressBar.style.width = progress;
    if(mobilePrevButton) mobilePrevButton.disabled = sceneNumber <= 1;
    if(mobileNextButton) mobileNextButton.disabled = sceneNumber >= totalScenes;
    document.querySelectorAll('[data-scene-pick]').forEach(button=>{
      const active = Number(button.dataset.scenePick) === sceneNumber;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active ? 'true' : 'false');
    });
  }

  function loadSceneVideo(video){
    if(!video || video.src || !video.dataset.src) return;
    video.src = video.dataset.src;
    video.load();
  }

  function unloadSceneVideo(video){
    if(!video || !video.src || !video.dataset.src) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.closest('.scene-media')?.classList.remove('loaded','failed');
  }

  function prepareNearbyVideos(sceneNumber){
    progressScenes.forEach(scene=>{
      const number = Number(scene.dataset.progressScene);
      const video = scene.querySelector('video');
      if(Math.abs(number - sceneNumber) <= 1){
        loadSceneVideo(video);
      }else{
        unloadSceneVideo(video);
      }
    });
  }

  function pauseSceneVideos(exceptVideo){
    sceneVideos.forEach(video=>{
      if(video === exceptVideo) return;
      video.pause();
      video.currentTime = 0;
    });
  }

  function playSceneVideo(scene){
    if(!issueViewer?.classList.contains('open')) return;
    const video = scene?.querySelector('video');
    pauseSceneVideos(video);
    if(!video) return;
    loadSceneVideo(video);
    video.muted = !soundEnabled;
    video.play().catch(()=>{});
  }

  function getSceneByNumber(sceneNumber){
    return document.querySelector(`[data-progress-scene="${sceneNumber}"]`);
  }

  function goToScene(sceneNumber,block = 'center'){
    const scene = getSceneByNumber(Math.min(Math.max(sceneNumber,1),totalScenes));
    if(!scene) return;
    const number = Number(scene.dataset.progressScene);
    updateReaderProgress(number);
    prepareNearbyVideos(number);
    playSceneVideo(scene);
    scene.scrollIntoView({behavior:'smooth',block});
  }

  function goToCover(){
    updateReaderProgress(1);
    prepareNearbyVideos(1);
    pauseSceneVideos();
    issueCover?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function updateSoundButtons(){
    soundToggleButtons.forEach(button=>{
      button.textContent = button.dataset.soundShort !== undefined
        ? (soundEnabled ? 'ON' : 'OFF')
        : (soundEnabled ? 'SOUND ON' : 'SOUND OFF');
      button.setAttribute('aria-pressed',String(soundEnabled));
    });
  }

  function toggleSound(){
    soundEnabled = !soundEnabled;
    sceneVideos.forEach(video=>video.muted = !soundEnabled);
    updateSoundButtons();
  }

  function syncSoundFromVideo(video){
    if(syncingVideoSound) return;
    syncingVideoSound = true;
    soundEnabled = !video.muted;
    sceneVideos.forEach(sceneVideo=>{
      if(sceneVideo !== video) sceneVideo.muted = video.muted;
    });
    updateSoundButtons();
    syncingVideoSound = false;
  }

  async function shareIssue(){
    const issue = getCurrentIssue();
    const sceneId = getSceneByNumber(currentSceneNumber)?.id || 'story';
    const shareUrl = `${window.location.origin}${window.location.pathname}#${sceneId}`;
    const shareData = {
      title:`Loop Gaiden — Issue ${issue?.number || '001'}`,
      text:`${issue?.shareText || 'Issue 001 is live.'} Scene ${currentSceneNumber} / ${totalScenes}.`,
      url:shareUrl
    };

    if(navigator.share){
      try{
        await navigator.share(shareData);
        return;
      }catch(e){}
    }

    try{
      await navigator.clipboard.writeText(shareUrl);
      shareIssueButtons.forEach(button=>{
        const old = button.textContent;
        button.textContent = 'LINK COPIED';
        setTimeout(()=>button.textContent = old,1400);
      });
    }catch(e){
      alert('Share this issue: ' + shareUrl);
    }
  }

  function setIssueLabels(){
    issueLabels.forEach(label=>{
      const baseLabel = label.dataset.issueLabel || label.textContent;
      const isCurrent = label.dataset.issueKey === currentIssueKey;
      label.textContent = issueViewer?.classList.contains('open') && isCurrent ? baseLabel.replace('OPEN ISSUE','ISSUE') + ' — OPEN' : baseLabel;
    });
  }

  function setupScenePicker(){
    if(!scenePicker) return;
    scenePicker.innerHTML = '';
    progressScenes.forEach(scene=>{
      const number = Number(scene.dataset.progressScene);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(number).padStart(2,'0');
      button.dataset.scenePick = String(number);
      button.addEventListener('click',()=>goToScene(number));
      scenePicker.appendChild(button);
    });
  }

  function bindReaderButtons(){
    closeIssueButtons.forEach(button=>{
      if(button.dataset.boundIssueControl) return;
      button.dataset.boundIssueControl = 'true';
      button.addEventListener('click',closeIssue);
    });
    soundToggleButtons.forEach(button=>{
      if(button.dataset.boundIssueControl) return;
      button.dataset.boundIssueControl = 'true';
      button.addEventListener('click',toggleSound);
    });
    shareIssueButtons.forEach(button=>{
      if(button.dataset.boundIssueControl) return;
      button.dataset.boundIssueControl = 'true';
      button.addEventListener('click',shareIssue);
    });
    startIssueButtons.forEach(button=>{
      if(button.dataset.boundIssueControl) return;
      button.dataset.boundIssueControl = 'true';
      button.addEventListener('click',goToCover);
    });
    startScenesButtons.forEach(button=>{
      if(button.dataset.boundIssueControl) return;
      button.dataset.boundIssueControl = 'true';
      button.addEventListener('click',()=>goToScene(1,'start'));
    });
    if(mobilePrevButton && !mobilePrevButton.dataset.boundIssueControl){
      mobilePrevButton.dataset.boundIssueControl = 'true';
      mobilePrevButton.addEventListener('click',()=>goToScene(currentSceneNumber - 1));
    }
    if(mobileNextButton && !mobileNextButton.dataset.boundIssueControl){
      mobileNextButton.dataset.boundIssueControl = 'true';
      mobileNextButton.addEventListener('click',()=>goToScene(currentSceneNumber + 1));
    }
    sceneNavButtons.forEach(button=>{
      if(button.dataset.boundIssueControl) return;
      button.dataset.boundIssueControl = 'true';
      button.addEventListener('click',()=>{
        const targetId = button.dataset.nextScene || button.dataset.prevScene;
        const targetScene = document.getElementById(targetId);
        const sceneNumber = Number(targetScene?.dataset.progressScene);
        if(sceneNumber) goToScene(sceneNumber);
      });
    });
  }

  function observeReaderScenes(){
    videoLoadObserver?.disconnect();
    progressObserver?.disconnect();

    videoLoadObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          loadSceneVideo(entry.target.querySelector('video'));
        }
      });
    },{rootMargin:'500px 0px'});

    progressObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const sceneNumber = Number(entry.target.dataset.progressScene);
          updateReaderProgress(sceneNumber);
          prepareNearbyVideos(sceneNumber);
          playSceneVideo(entry.target);
        }
      });
    },{threshold:.45});

    progressScenes.forEach(scene=>{
      videoLoadObserver.observe(scene);
      progressObserver.observe(scene);
    });

    sceneVideos.forEach(video=>{
      video.addEventListener('canplay',()=>video.closest('.scene-media')?.classList.add('loaded'));
      video.addEventListener('waiting',()=>video.closest('.scene-media')?.classList.remove('loaded'));
      video.addEventListener('play',()=>video.muted = !soundEnabled);
      video.addEventListener('volumechange',()=>syncSoundFromVideo(video));
      video.addEventListener('error',()=>video.closest('.scene-media')?.classList.add('failed'));
    });

    document.querySelectorAll('.scene-media').forEach(media=>{
      media.addEventListener('click',event=>{
        if(!event.target.matches('[data-retry-video]')) return;
        const video = media.querySelector('video');
        media.classList.remove('failed');
        if(video){
          video.removeAttribute('src');
          loadSceneVideo(video);
          video.play().catch(()=>{});
        }
      });
    });
  }

  function selectIssue(issueKey = 'activeIssue'){
    const issue = getIssueByKey(issueData,issueKey);
    if(!issue) return;
    pauseSceneVideos();
    currentIssueKey = issueKey;
    renderIssueContent(issue,window.loopGaidenSiteData || {},currentIssueKey,issueData);
    refreshReaderRefs();
    setupScenePicker();
    bindReaderButtons();
    observeReaderScenes();
    updateSoundButtons();
    updateReaderProgress(1);
  }

  function openIssue(scrollIntoView = true,issueKey = currentIssueKey){
    if(!issueViewer) return;
    selectIssue(issueKey);
    document.body.classList.add('issue-reader-active','issue-reader-in-view');
    issueViewer.classList.add('open');
    issueViewer.removeAttribute('aria-hidden');
    issueTriggers.forEach(trigger=>{
      const isCurrent = (trigger.dataset.issueKey || 'activeIssue') === currentIssueKey;
      trigger.setAttribute('aria-expanded',String(isCurrent));
      trigger.classList.toggle('issue-open',isCurrent);
    });
    setIssueLabels();
    updateReaderProgress(1);
    prepareNearbyVideos(1);

    if(scrollIntoView){
      issueCover?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  function closeIssue(){
    if(!issueViewer) return;
    pauseSceneVideos();
    document.body.classList.remove('issue-reader-active','issue-reader-in-view');
    issueViewer.classList.remove('open');
    issueViewer.setAttribute('aria-hidden','true');
    issueTriggers.forEach(trigger=>{
      trigger.setAttribute('aria-expanded','false');
      trigger.classList.remove('issue-open');
    });
    setIssueLabels();
    document.getElementById('lords')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  issueTriggers.forEach(trigger=>{
    trigger.addEventListener('click',()=>openIssue(true,trigger.dataset.issueKey || 'activeIssue'));
    trigger.addEventListener('keydown',event=>{
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        openIssue(true,trigger.dataset.issueKey || 'activeIssue');
      }
    });
  });

  openIssueButtons.forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    openIssue(true,'activeIssue');
  }));

  setupScenePicker();
  bindReaderButtons();
  observeReaderScenes();

  if(issueViewer){
    const issueViewObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        document.body.classList.toggle(
          'issue-reader-in-view',
          issueViewer.classList.contains('open') && entry.isIntersecting
        );
      });
    },{threshold:.04});
    issueViewObserver.observe(issueViewer);
  }

  updateSoundButtons();
  updateReaderProgress(1);

  document.addEventListener('keydown',event=>{
    if(!issueViewer?.classList.contains('open')) return;
    if(['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(document.activeElement?.tagName)) return;
    if(event.key === 'ArrowRight' || event.key === 'ArrowDown'){
      event.preventDefault();
      goToScene(currentSceneNumber + 1);
    }
    if(event.key === 'ArrowLeft' || event.key === 'ArrowUp'){
      event.preventDefault();
      goToScene(currentSceneNumber - 1);
    }
    if(event.key === 'Escape'){
      event.preventDefault();
      closeIssue();
    }
  });

  if(window.location.hash === '#story' || window.location.hash.startsWith('#scene-')){
    openIssue(false);
    const sceneNumber = Number(document.querySelector(window.location.hash)?.dataset.progressScene);
    if(sceneNumber) setTimeout(()=>goToScene(sceneNumber),100);
  }

  document.getElementById('copyCA')?.addEventListener('click',async ()=>{
    const ca = document.getElementById('ca').textContent.trim();
    if(!ca || ca === 'NOT LIVE YET'){
      alert('The new contract address will be posted here when relaunch is live.');
      return;
    }
    try{
      await navigator.clipboard.writeText(ca);
      const btn = document.getElementById('copyCA');
      const old = btn.textContent;
      btn.textContent = 'COPIED';
      setTimeout(()=>btn.textContent=old,1200);
    }catch(e){
      alert('Copy this CA: ' + ca);
    }
  });
}

(async function init(){
  let site = null;
  let socials = null;
  let issues = null;

  try{
    [site,socials,issues] = await Promise.all([
      loadJson('content/site.json'),
      loadJson('content/socials.json'),
      loadJson('content/issues.json')
    ]);
    renderSite(site,socials,issues);
  }catch(error){
    console.warn('Using inline page content because content files could not be loaded.',error);
  }

  initInteractions(issues);
})();
