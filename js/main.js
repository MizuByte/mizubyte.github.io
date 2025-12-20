    function translateText(btn, text) {
        btn.disabled = true;
        btn.textContent = 'Translating...';
        fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`)
            .then(response => response.json())
            .then(data => {
                const translated = data[0][0][0];
                const tweet = btn.closest('.nitter-tweet');
                const contentDiv = tweet.querySelector('.nitter-content .text-part');
                if (contentDiv) {
                    contentDiv.textContent = translated;
                }
                const expandedDiv = tweet.querySelector('.nitter-content.expanded .text-part');
                if (expandedDiv) {
                    expandedDiv.textContent = translated;
                }
                btn.textContent = 'Translated';
                btn.disabled = false;
            })
            .catch(error => {
                console.error('Translation error:', error);
                btn.textContent = 'Error';
                btn.disabled = false;
            });
    }

    document.addEventListener('DOMContentLoaded', () => {
    // Modal for full image view
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const imageModalClose = document.getElementById('imageModalClose');

    // Modal carousel state
    let modalImages = [];
    let modalCurrentIdx = 0;

    // Zoom and pan variables
    let modalScale = 1;
    let modalTranslateX = 0;
    let modalTranslateY = 0;

    window.openImageModal = function(src, imagesArr) {
        if (!imageModal || !modalImage) return;
        if (Array.isArray(imagesArr) && imagesArr.length > 1) {
            modalImages = imagesArr;
            modalCurrentIdx = imagesArr.indexOf(src);
        } else {
            modalImages = [src];
            modalCurrentIdx = 0;
        }
        modalImage.src = modalImages[modalCurrentIdx] || '';
        imageModal.style.display = 'flex';
        // Reset zoom and pan
        modalScale = 1;
        modalTranslateX = 0;
        modalTranslateY = 0;
        modalImage.style.transform = `scale(${modalScale}) translate(${modalTranslateX}px, ${modalTranslateY}px)`;
        updateModalNavButtons();
    }
    function closeImageModal() {
        imageModal.style.display = 'none';
        modalImage.src = '';
        modalImages = [];
        modalCurrentIdx = 0;
        // Reset zoom and pan
        modalScale = 1;
        modalTranslateX = 0;
        modalTranslateY = 0;
        modalImage.style.transform = `scale(${modalScale}) translate(${modalTranslateX}px, ${modalTranslateY}px)`;
        updateModalNavButtons();
    }

    // Zoom and pan event listeners
    // Zoom and pan event listeners (wheel zoom + drag pan + double-click reset)
    (function bindModalInteractions() {
        if (!modalImage) return;
        let isDragging = false;
        let dragStartX = 0, dragStartY = 0;
        let dragImgX = 0, dragImgY = 0;

        // If an image never loads (blocked/hotlink/CORS), avoid follow-on logic elsewhere.
        modalImage.addEventListener('error', () => {
            try {
                modalImage.src = '';
            } catch (e) {
                // ignore
            }
        });

        modalImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            // Avoid wheel-zoom math on a not-yet-laid-out image.
            const w = modalImage.naturalWidth || 0;
            const h = modalImage.naturalHeight || 0;
            if (w === 0 || h === 0) return;
            const rect = modalImage.getBoundingClientRect();
            if (!rect || rect.width === 0 || rect.height === 0) return;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = modalScale * zoomFactor;
            if (newScale < 0.1 || newScale > 10) return;
            // Zoom to cursor: calculate relative point
            const relX = (mouseX - modalTranslateX) / modalScale;
            const relY = (mouseY - modalTranslateY) / modalScale;
            modalScale = newScale;
            modalTranslateX = mouseX - relX * modalScale;
            modalTranslateY = mouseY - relY * modalScale;
            modalImage.style.transform = `scale(${modalScale}) translate(${modalTranslateX}px, ${modalTranslateY}px)`;
        });

        modalImage.addEventListener('mousedown', function(e) {
            isDragging = true;
            dragStartX = e.clientX - dragImgX;
            dragStartY = e.clientY - dragImgY;
            modalImage.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            dragImgX = e.clientX - dragStartX;
            dragImgY = e.clientY - dragStartY;
            modalTranslateX = dragImgX;
            modalTranslateY = dragImgY;
            modalImage.style.transform = `scale(${modalScale}) translate(${modalTranslateX}px, ${modalTranslateY}px)`;
        });

        document.addEventListener('mouseup', function(e) {
            if (isDragging) {
                isDragging = false;
                modalImage.style.cursor = 'pointer';
            }
        });

        modalImage.addEventListener('dblclick', function(e) {
            modalScale = 1;
            modalTranslateX = 0; modalTranslateY = 0;
            modalImage.style.transform = 'scale(1) translate(0,0)';
        });
    })();

    // Modal nav buttons
    let modalPrevBtn, modalNextBtn;
    function createModalNavButtons() {
        if (!modalPrevBtn) {
            modalPrevBtn = document.createElement('button');
            modalPrevBtn.className = 'modal-img-prev';
            modalPrevBtn.innerHTML = '&#8592;';
            modalPrevBtn.style.position = 'fixed';
            modalPrevBtn.style.left = '60px';
            modalPrevBtn.style.top = '50%';
            modalPrevBtn.style.transform = 'translateY(-50%)';
            modalPrevBtn.style.zIndex = '200';
            modalPrevBtn.onclick = function(e) {
                e.stopPropagation();
                if (modalImages.length > 1) {
                    modalCurrentIdx = (modalCurrentIdx - 1 + modalImages.length) % modalImages.length;
                    modalImage.src = modalImages[modalCurrentIdx];
                    updateModalNavButtons();
                }
            };
        }
        if (!modalNextBtn) {
            modalNextBtn = document.createElement('button');
            modalNextBtn.className = 'modal-img-next';
            modalNextBtn.innerHTML = '&#8594;';
            modalNextBtn.style.position = 'fixed';
            modalNextBtn.style.right = '60px';
            modalNextBtn.style.top = '50%';
            modalNextBtn.style.transform = 'translateY(-50%)';
            modalNextBtn.style.zIndex = '200';
            modalNextBtn.onclick = function(e) {
                e.stopPropagation();
                if (modalImages.length > 1) {
                    modalCurrentIdx = (modalCurrentIdx + 1) % modalImages.length;
                    modalImage.src = modalImages[modalCurrentIdx];
                    updateModalNavButtons();
                }
            };
        }
    }
    function updateModalNavButtons() {
        createModalNavButtons();
        if (imageModal && modalImages.length > 1) {
            if (!imageModal.contains(modalPrevBtn)) imageModal.appendChild(modalPrevBtn);
            if (!imageModal.contains(modalNextBtn)) imageModal.appendChild(modalNextBtn);
        } else {
            if (modalPrevBtn && imageModal.contains(modalPrevBtn)) imageModal.removeChild(modalPrevBtn);
            if (modalNextBtn && imageModal.contains(modalNextBtn)) imageModal.removeChild(modalNextBtn);
        }
    }
    if (imageModalClose) {
        imageModalClose.onclick = closeImageModal;
    }
    if (imageModal) {
        imageModal.onclick = function(e) {
            if (e.target === imageModal) closeImageModal();
        };
    }
    const newsGrid = document.getElementById('news-grid');
    // --- Global variables ---
    const selectedAnimeKey = 'selectedAnime';
    const modal = document.getElementById("myModal");
    const modalButton = document.getElementById("modal-open-button");
    const closeButton = document.getElementsByClassName("close-button")[0];

    // Map anime to Nitter usernames
    const animeNitterHandles = {
        'one-piece': ['pewpiece', 'WorstGenHQ', 'Mugiwara_23'],
        'boruto': ['SchmurfiV1'],
        'black-clover': ['PacemanOP'],
        'berserk': ['daily_berserk']
    };

    // Nitter in-browser fetching is fragile: instances/proxies regularly go down.
    // Use fallbacks and keep failures non-fatal.
    const NITTER_BASE_URLS = [
        'https://nitter.net',
        'https://nitter.poast.org',
        'https://nitter.privacydev.net',
        'https://nitter.fdn.fr'
    ];

    // CORS proxies are also unreliable. Try a small set.
    // Note: some proxies require special URL formats; only include ones you know work.
    const CORS_PROXIES = [
        (url) => `https://corsproxy.io/?${url}`
    ];

    // Preferred data source for the website: a JSON file generated by GitHub Actions.
    // This avoids CORS/proxy issues entirely.
    const SITE_SPOILERS_JSON_URL = '/data/latestSpoilers.json';
    // When true the client will NOT attempt live Nitter fetches and will only use the JSON file.
    // This prevents CORS/proxy noise when developing locally or when proxies are unreliable.
    const FORCE_JSON_ONLY = true;

    async function fetchSiteSpoilersJson() {
        try {
            const resp = await fetch(`${SITE_SPOILERS_JSON_URL}?t=${Date.now()}`, { cache: 'no-store' });
            if (!resp.ok) return null;
            const data = await resp.json();
            if (!data || typeof data !== 'object') return null;
            if (!Array.isArray(data.items)) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    // Prevent console spam for repeating network failures.
    const __onceLogs = new Set();
    function logOnce(key, level, ...args) {
        if (__onceLogs.has(key)) return;
        __onceLogs.add(key);
        const fn = console[level] || console.log;
        fn.apply(console, args);
    }

    function buildNitterUrl(baseUrl, username, cursor) {
        const base = (baseUrl || '').replace(/\/$/, '');
        const qs = cursor ? `cursor=${encodeURIComponent(cursor)}` : '';
        return qs ? `${base}/${username}?${qs}` : `${base}/${username}`;
    }

    function looksLikeNitterTimelineHtml(html) {
        const lowered = (html || '').toLowerCase();
        const looksBlocked =
            lowered.includes('cloudflare') ||
            lowered.includes('attention required') ||
            lowered.includes('captcha') ||
            lowered.includes('access denied');
        const looksTimeline = lowered.includes('timeline-item') || lowered.includes('timeline');
        return !looksBlocked && looksTimeline;
    }

    async function tryFetchText(url) {
        const resp = await fetch(url, { cache: 'no-store' });
        if (!resp.ok) {
            return { ok: false, status: resp.status, text: '' };
        }
        const text = await resp.text();
        return { ok: true, status: resp.status, text };
    }

    async function fetchNitterTweets(username, count = 9, cursor = '') {
        try {
            let lastError = '';
            for (const baseUrl of NITTER_BASE_URLS) {
                const nitterUrl = buildNitterUrl(baseUrl, username, cursor);
                console.log('Nitter URL:', nitterUrl);

                // 1) Best-effort direct fetch (works for users with permissive CORS via extensions or same-origin)
                // Usually blocked by CORS, so we fall through.
                try {
                    const direct = await tryFetchText(nitterUrl);
                    if (direct.ok && looksLikeNitterTimelineHtml(direct.text)) {
                        const html = direct.text;
                        console.log('HTML length:', html.length);
                        return parseNitterTimelineHtml(username, html, count);
                    }
                    if (!direct.ok) {
                        lastError = `HTTP_${direct.status}`;
                    }
                } catch (e) {
                    // ignore: likely CORS
                }

                // 2) Proxy fetch fallback
                for (const proxyFn of CORS_PROXIES) {
                    const proxiedUrl = proxyFn(nitterUrl);
                    const res = await tryFetchText(proxiedUrl);
                    if (!res.ok) {
                        lastError = `HTTP_${res.status}`;
                        logOnce(`nitter_http_${res.status}`, 'warn', `Nitter/proxy fetch failing (first seen): HTTP ${res.status}`);
                        continue;
                    }
                    if (!looksLikeNitterTimelineHtml(res.text)) {
                        lastError = 'BLOCKED_OR_BAD_HTML';
                        logOnce('nitter_bad_html', 'warn', 'Nitter response blocked/unexpected (first seen). Tweets will be empty until it recovers.');
                        continue;
                    }
                    console.log('HTML length:', res.text.length);
                    return parseNitterTimelineHtml(username, res.text, count);
                }
            }

            return { tweets: [], nextCursor: '', error: lastError || 'FETCH_FAILED' };

        } catch (err) {
            console.error('Fetch error:', err);
            return { tweets: [], nextCursor: '', error: err.message };
        }
    }

    function parseNitterTimelineHtml(username, html, count) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Filter out reposts/retweets completely
        const allTimelineItems = Array.from(doc.querySelectorAll('.timeline-item'));

        const tweets = allTimelineItems
            .filter(tweet => {
                const hasRetweetHeader = tweet.querySelector('.retweet-header');
                const isRetweet = tweet.classList.contains('retweet');
                const content = tweet.querySelector('.tweet-content')?.innerText || '';
                const startsWithRT = content.trim().startsWith('RT @');
                return !(hasRetweetHeader || isRetweet || startsWithRT);
            })
            .slice(0, count);

        console.log('Found tweets (excluding reposts):', tweets.length, 'out of', allTimelineItems.length);

        const tweetData = tweets.map(tweet => {
            const content = tweet.querySelector('.tweet-content')?.innerText || '';
            const date = tweet.querySelector('span.tweet-date a')?.innerText || '';
            const imageNodes = tweet.querySelectorAll('.attachments img, .attachments .still-image, .attachments .attachment.image');
            const images = Array.from(imageNodes)
                .map(img => img.getAttribute('src') || img.getAttribute('data-src'))
                .filter(src => src && src !== 'null');
            const url = tweet.querySelector('.tweet-date a')?.getAttribute('href') || '';
            return { content, date, images, url, handle: username };
        });

        const showMore = doc.querySelector('.show-more a');
        let nextCursor = '';
        if (showMore) {
            const href = showMore.getAttribute('href');
            const match = href.match(/cursor=([^&]*)/);
            if (match) nextCursor = decodeURIComponent(match[1]);
        }

        return { tweets: tweetData, nextCursor };
    }

    function deduplicateTweets(tweets) {
        const seen = new Set();
        return tweets.filter(tweet => {
            const key = tweet.content.trim() + '|' + tweet.date.trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    async function updateNitterFeed(perPageOverride) {
        const loadingBar = document.getElementById('loading-bar');
        
        if (!newsGrid) {
            console.error("News grid container not found!");
            return;
        }
        const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];

        const handleToIndicator = {
            'pewpiece': 'One Piece α',
            'WorstGenHQ': 'One Piece β',
            'Mugiwara_23': 'One Piece γ',
            'daily_berserk': 'Berserk',
            'SchmurfiV1': 'Boruto',
            'PacemanOP': 'Black Clover'
        };

        if (savedSelections.length === 0) {
            newsGrid.innerHTML = '<p style="color: #999; text-align: center;">Select an anime to see the latest posts.</p>';
            if (loadingBar) loadingBar.style.width = '0%';
            return;
        }

        // Primary path: load the pre-scraped results from the repo.
        const siteData = await fetchSiteSpoilersJson();
        if (!siteData && FORCE_JSON_ONLY) {
            // Show a clear, actionable message when JSON isn't available.
            newsGrid.innerHTML = '<div style="color:#bbb; text-align:center; padding:16px;">\n                <div style="font-size:1.05em; margin-bottom:6px;">Offline mode: JSON unavailable</div>\n                <div style="color:#888; margin-bottom:10px;">Serve this repo with a local webserver and ensure <code>/data/latestSpoilers.json</code> exists.</div>\n                <div style="color:#777; font-size:0.95em;">Run: <code>cd &lt;repo-root&gt; ; python -m http.server 8000</code> or <code>npx http-server</code></div>\n                </div>';
            if (loadingBar) loadingBar.style.width = '0%';
            return;
        }

        if (siteData) {
            const selectedSet = new Set(savedSelections.map(s => (s || '').toString().toLowerCase()));

            // Map handle -> anime key based on current UI mapping
            const handleToAnime = {};
            Object.keys(animeNitterHandles).forEach(animeKey => {
                (animeNitterHandles[animeKey] || []).forEach(h => {
                    handleToAnime[(h || '').toString().toLowerCase()] = (animeKey || '').toString().toLowerCase();
                });
            });

            const knownHandles = new Set(
                Object.values(animeNitterHandles)
                    .flat()
                    .map(h => (h || '').toString().toLowerCase())
            );

            const anyHandleSelection = savedSelections.some(s => knownHandles.has((s || '').toString().toLowerCase()));

            let items = (siteData.items || []).map(it => {
                const handleLower = (it.handle || '').toString().toLowerCase();
                const animeKey = (it.anime || handleToAnime[handleLower] || '').toString().toLowerCase();
                // normalize URL: strip query and fragment (remove ?t=...)
                let outUrl = (it.url || '').toString();
                try {
                    if (outUrl) {
                        const u = outUrl.startsWith('http') ? new URL(outUrl) : new URL(outUrl, window.location.origin);
                        u.search = '';
                        u.hash = '';
                        outUrl = `${u.origin}${u.pathname}`;
                    }
                } catch (e) {
                    // leave as-is on parse failure
                }
                return {
                    content: it.title || it.text || '',
                    date: it.date || siteData.generatedAt || '',
                    images: it.attachments || [],
                    url: outUrl,
                    handle: it.handle || '',
                    anime: animeKey,
                    isSpoiler: Boolean(it.isSpoiler)
                };
            });

            items = items.filter(it => {
                if (anyHandleSelection) return selectedSet.has((it.handle || '').toString().toLowerCase());
                return selectedSet.has((it.anime || '').toString().toLowerCase());
            });

            // Replace current view with JSON-backed items
            window.allTweets = items;
            window.cursors = {};
            window.exhausted = {};
            newsGrid.innerHTML = '';
            renderTweets(items);

            if (loadingBar) loadingBar.style.width = '100%';
            setTimeout(() => { if (loadingBar) loadingBar.style.width = '0%'; }, 500);
            return;
        }

        let handles = [];
        if (savedSelections.some(s => ['pewpiece', 'WorstGenHQ', 'Mugiwara_23'].includes(s))) {
            // detailed mode, selections are handles
            handles = savedSelections;
        } else {
            // normal mode, selections are anime keys
            savedSelections.forEach(anime => {
                if (animeNitterHandles[anime]) {
                    handles = handles.concat(animeNitterHandles[anime]);
                }
            });
        }
        handles = handles.filter(h => h && h.trim());

        // Don't wipe the grid on each incremental fetch — we'll append new items
        if (!window.allTweets) window.allTweets = [];
        if (!window.cursors) window.cursors = {};
        if (!window.exhausted) window.exhausted = {};

        const perPage = typeof perPageOverride === 'number' ? perPageOverride : 20;
        const perHandle = Math.max(1, Math.ceil(perPage / Math.max(1, handles.length)));
        let newTweets = [];
        let errors = [];
        const maxRounds = 10; // safety cap to avoid too many requests
        let round = 0;
        
        // Reset loading bar
        if (loadingBar) loadingBar.style.width = '0%';
        
        while (newTweets.length < perPage && round < maxRounds) {
            let anyFetchedThisRound = false;
            for (let i = 0; i < handles.length; i++) {
                const handle = handles[i];
                if (window.exhausted[handle]) continue;
                const cursor = window.cursors[handle] || '';
                
                // Update loading bar based on progress
                const totalHandles = handles.length;
                const completedHandles = i;
                const progress = Math.min(100, ((completedHandles / totalHandles) * 100) + (round * 10));
                if (loadingBar) loadingBar.style.width = progress + '%';
                
                const { tweets, nextCursor, error } = await fetchNitterTweets(handle, perHandle, cursor);
                if (error) {
                    errors.push(`Error fetching from ${handle}: ${error}`);
                    // Don't treat network errors as exhaustion.
                    continue;
                }
                if (!tweets || tweets.length === 0) {
                    window.exhausted[handle] = true;
                    window.cursors[handle] = nextCursor || '';
                    continue;
                }
                anyFetchedThisRound = true;
                window.cursors[handle] = nextCursor || '';
                if (!nextCursor) window.exhausted[handle] = true;
                newTweets = newTweets.concat(tweets);
                if (newTweets.length >= perPage) break;
            }
            if (!anyFetchedThisRound) break;
            round++;
            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (newTweets.length === 0 && errors.length > 0) {
            const has520 = errors.some(e => e.includes('HTTP_520'));
            const hasBadHtml = errors.some(e => e.includes('BLOCKED_OR_BAD_HTML'));
            let hint = '';
            if (has520) {
                hint = 'The CORS proxy/Nitter instance looks down (HTTP 520). This is usually temporary.';
            } else if (hasBadHtml) {
                hint = 'Nitter is returning blocked/unexpected HTML (often Cloudflare/captcha).';
            } else {
                hint = 'The fetch failed (likely CORS/proxy instability).';
            }

            newsGrid.innerHTML =
                '<div style="color:#bbb; text-align:center; line-height:1.5; padding: 16px;">'
                + '<div style="font-size: 1.05em; margin-bottom: 6px;">Failed to load tweets</div>'
                + `<div style="color:#888; margin-bottom: 10px;">${hint}</div>`
                + '<div style="color:#777; font-size: 0.95em;">Try again in a few minutes, or switch to another Nitter mirror.</div>'
                + '<div style="margin-top:10px; color:#666; font-size: 0.85em; text-align:left; max-width: 720px; margin-left:auto; margin-right:auto;">'
                + errors.map(e => `• ${e}`).join('<br>')
                + '</div>'
                + '</div>';
            if (loadingBar) loadingBar.style.width = '0%';
            return;
        }
        
        // Set loading bar to 100% when done fetching
        if (loadingBar) loadingBar.style.width = '100%';

        // Normalize timestamps and sort
        function parseDate(dateStr) {
            let d = Date.parse(dateStr);
            if (!isNaN(d)) return d;
            if (/now/i.test(dateStr)) return Date.now();
            let match = (dateStr || '').match(/(\d+)([hm])/);
            if (match) {
                let val = parseInt(match[1]);
                if (match[2] === 'h') return Date.now() - val * 3600 * 1000;
                if (match[2] === 'm') return Date.now() - val * 60 * 1000;
            }
            return 0;
        }

        newTweets.forEach(t => { try { t._ts = parseDate(t.date); } catch (e) { t._ts = 0; } });
        newTweets = deduplicateTweets(newTweets);
        newTweets.sort((a, b) => (b._ts || 0) - (a._ts || 0));

        // Filter empty
        newTweets = newTweets.filter(t => {
            const textOk = t.content && t.content.trim().length > 0;
            const imgOk = Array.isArray(t.images) && t.images.length > 0;
            return textOk || imgOk || (t.date && t.date.trim());
        });

        // Take up to perPage
        let toAppend = newTweets.slice(0, perPage);

        // Deduplicate
        const existingKeys = new Set(window.allTweets.map(t => (t.content || '') + '||' + (t.date || '')));
        toAppend = toAppend.filter(t => {
            const key = (t.content || '') + '||' + (t.date || '');
            if (existingKeys.has(key)) return false;
            existingKeys.add(key);
            return true;
        });

        window.allTweets = window.allTweets.concat(toAppend);

        // Render appended tweets
        const maxCols = 3;
        let tweetGrid = '';
        const baseIndex = window.allTweets.length - toAppend.length;
        for (let idx = 0; idx < toAppend.length; idx++) {
            const t = toAppend[idx];
            const i = baseIndex + idx;
            let validImages = Array.isArray(t.images) ? t.images.filter(src => src && src !== 'null' && src !== '').map(src => src.startsWith('http') ? src : ('https://nitter.net' + src)) : [];
            let imgSize = 200;
            let imagesHtml = '';
            if (validImages.length > 0) {
                const imgsJson = JSON.stringify(validImages);
                if (validImages.length === 1) {
                    imagesHtml = `<div class="nitter-images"><img src="${validImages[0]}" class="nitter-img" data-images='${imgsJson}' data-idx="0" style="max-width:${imgSize}px;min-width:${imgSize}px;min-height:${imgSize}px;" /></div>`;
                } else {
                    imagesHtml = `<div class="nitter-images nitter-images-multi">`;
                    imagesHtml += `<div class="nitter-img-carousel">`;
                    imagesHtml += validImages.map((img, idx) => `<img src="${img}" class="nitter-img" data-idx="${idx}" data-images='${imgsJson}' style="display:${idx === 0 ? 'block' : 'none'};max-width:${imgSize}px;min-width:${imgSize}px;min-height:${imgSize}px;" />`).join('');
                    imagesHtml += `<button class="nitter-img-prev">&#8592;</button>`;
                    imagesHtml += `<button class="nitter-img-next">&#8594;</button>`;
                    imagesHtml += `</div></div>`;
                }
            }
            let dateNode = t.date;
            let localTime = '';
            if (typeof dateNode === 'string') {
                localTime = dateNode;
            } else if (dateNode && dateNode.textContent) {
                localTime = dateNode.textContent.trim();
            }
            const truncatedText = t.content && t.content.length > 320 ? t.content.substring(0, 320) + '...' : (t.content || '');
            const needsToggle = t.content && t.content.length > 320;
            let contentHtml = `<div class="nitter-content"><span class="text-part">${truncatedText}</span>${needsToggle ? " <button class='aufklappen-btn' type='button'>aufklappen</button>" : ''}</div><div class="nitter-content expanded" style="display:none;"><span class="text-part">${t.content}</span>${needsToggle ? " <button class='zuklappen-btn' type='button'>zuklappen</button>" : ''}</div>`;
            let tweetClass = 'nitter-tweet';
            if (!imagesHtml.trim()) tweetClass += ' no-image';
            const indicator = handleToIndicator[t.handle] || t.handle;
            
            // Determine anime source for border coloring
            let animeSource = 'unknown';
            let subSource = '';
            if (t.handle === 'pewpiece') {
                animeSource = 'onepiece';
                subSource = 'alpha';
            } else if (t.handle === 'WorstGenHQ') {
                animeSource = 'onepiece';
                subSource = 'beta';
            } else if (t.handle === 'Mugiwara_23') {
                animeSource = 'onepiece';
                subSource = 'gamma';
            } else if (t.handle === 'Abdul_S17') {
                animeSource = 'boruto';
            } else if (t.handle === 'BlackClover_EN') {
                animeSource = 'blackclover';
            } else if (t.handle === 'daily_berserk') {
                animeSource = 'berserk';
            }
            
            tweetGrid += `<div class="${tweetClass}" data-index="${i}" data-anime="${animeSource}" data-subsource="${subSource}">${imagesHtml}${contentHtml}<div class="nitter-tweet-date-row" style="text-align:center;margin-bottom:3px;font-size:1em;color:#0d6efd;">${localTime}</div><div class="source-indicator">${indicator}</div><button class="source-btn" onclick="window.open('https://nitter.net${t.url}')">Source</button><button class="translate-btn" onclick="translateText(this, decodeURIComponent('${encodeURIComponent(t.content)}'))">Translate</button></div>`;
        }

        if (tweetGrid.trim().length) newsGrid.insertAdjacentHTML('beforeend', tweetGrid);

        // Apply fading and attach interactions to newly appended items
        window.applyFading = function(content) {
            const textPart = content.querySelector('.text-part');
            if (textPart) {
                const text = textPart.textContent;
                const words = text.split(' ');
                let html = '';
                words.forEach((word, index) => {
                    let opacity = Math.max(0.15, 1 - index * 0.05);
                    html += `<span style="opacity: ${opacity};">${word} </span>`;
                });
                textPart.innerHTML = html;
            }
        };

        if (toAppend.length > 0) {
            const newlyInserted = Array.from(document.querySelectorAll('.nitter-tweet')).filter(t => parseInt(t.dataset.index, 10) >= baseIndex);
            newlyInserted.forEach(tweet => {
                const content = tweet.querySelector('.nitter-content');
                if (content && !tweet.classList.contains('expanded')) applyFading(content);
                const imgs = tweet.querySelectorAll('.nitter-img');
                imgs.forEach(img => {
                    // Handle image load errors
                    img.addEventListener('error', function() {
                        const parent = this.parentElement;
                        if (parent) {
                            parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;color:#999;font-style:italic;text-align:center;padding:20px;">Image was deleted by original author</div>';
                        }
                    });
                    
                    img.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const imagesData = img.getAttribute('data-images');
                        let imagesArr = [];
                        try { imagesArr = JSON.parse(imagesData || '[]'); } catch (e) { imagesArr = []; }
                        const idxAttr = img.getAttribute('data-idx') || img.getAttribute('data-index') || img.getAttribute('data-idx');
                        const idx = idxAttr ? parseInt(idxAttr, 10) : 0;
                        if (imagesArr.length === 0 && img.src) imagesArr = [img.src];
                        window.openImageModal(imagesArr[idx] || img.src, imagesArr);
                    });
                });

                const aufBtn = tweet.querySelector('.aufklappen-btn');
                const zukBtn = tweet.querySelector('.zuklappen-btn');
                if (aufBtn) {
                    aufBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const truncated = tweet.querySelector('.nitter-content:not(.expanded)');
                        const expanded = tweet.querySelector('.nitter-content.expanded');
                        if (truncated) truncated.style.display = 'none';
                        if (expanded) {
                            expanded.style.display = 'block';
                            // Increase font size by 2 units (from 1.1em to 1.5em)
                            expanded.style.fontSize = '1.5em';
                        }
                        tweet.classList.add('expanded');
                        tweet.style.gridColumn = 'span 3';
                        tweet.style.gridRow = 'span 1';
                        tweet.style.height = 'auto';
                    });
                }
                if (zukBtn) {
                    zukBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const truncated = tweet.querySelector('.nitter-content:not(.expanded)');
                        const expanded = tweet.querySelector('.nitter-content.expanded');
                        if (expanded) {
                            expanded.style.display = 'none';
                            // Reset font size
                            expanded.style.fontSize = '';
                        }
                        if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                        tweet.classList.remove('expanded');
                        tweet.style.gridColumn = '';
                        tweet.style.gridRow = '';
                        tweet.style.height = '';
                    });
                }
            });
        }

        if (toAppend.length > 0) {
            const newlyInserted = Array.from(document.querySelectorAll('.nitter-tweet')).filter(t => parseInt(t.dataset.index, 10) >= baseIndex);
            newlyInserted.forEach(tweet => {
                tweet.addEventListener('click', () => {
                    const isExpanded = tweet.classList.contains('expanded');
                    const index = parseInt(tweet.dataset.index, 10);
                    const row = Math.floor(index / 3);
                    if (isExpanded) {
                        document.querySelectorAll('.nitter-tweet').forEach((t, idx) => { if (Math.floor(idx / 3) === row) t.style.display = 'block'; });
                        tweet.classList.remove('expanded');
                        tweet.style.gridColumn = '';
                        tweet.style.gridRow = '';
                        const truncated = tweet.querySelector('.nitter-content:not(.expanded)');
                        if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                        const expanded = tweet.querySelector('.nitter-content.expanded');
                        if (expanded) {
                            expanded.style.display = 'none';
                            // Reset font size
                            expanded.style.fontSize = '';
                        }
                        tweet.style.height = '';
                    } else {
                        document.querySelectorAll('.nitter-tweet.expanded').forEach(t => {
                            const tIndex = parseInt(t.dataset.index, 10);
                            const tRow = Math.floor(tIndex / 3);
                            document.querySelectorAll('.nitter-tweet').forEach((tt, idx) => { if (Math.floor(idx / 3) === tRow) tt.style.display = 'block'; });
                            t.classList.remove('expanded');
                            t.style.gridColumn = ''; t.style.gridRow = '';
                            const truncated = t.querySelector('.nitter-content:not(.expanded)'); if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                            const expanded = t.querySelector('.nitter-content.expanded');
                            if (expanded) {
                                expanded.style.display = 'none';
                                // Reset font size
                                expanded.style.fontSize = '';
                            }
                            t.style.height = '';
                        });

                        document.querySelectorAll('.nitter-tweet').forEach((t, idx) => { if (Math.floor(idx / 3) === row && idx !== index) t.style.display = 'none'; });
                        tweet.classList.add('expanded');
                        tweet.style.gridColumn = 'span 3'; tweet.style.gridRow = 'span 1';
                        const truncatedContent = tweet.querySelector('.nitter-content:not(.expanded)');
                        if (truncatedContent) { truncatedContent.style.display = 'none'; const spans = truncatedContent.querySelectorAll('span'); spans.forEach(span => span.style.opacity = '1'); }
                        const expandedContent = tweet.querySelector('.nitter-content.expanded');
                        if (expandedContent) {
                            expandedContent.style.display = 'block';
                            // Increase font size by 2 units (from 1.1em to 1.5em)
                            expandedContent.style.fontSize = '1.5em';
                        }
                        tweet.style.height = 'auto';
                    }
                });
            });
        }
        
        // Reset loading bar after a short delay
        setTimeout(() => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) loadingBar.style.width = '0%';
        }, 500);
    }

    // Carousel navigation for multiple images
    function setupImageCarousels() {
        document.querySelectorAll('.nitter-img-carousel').forEach(carousel => {
            let images = carousel.querySelectorAll('.nitter-img');
            let current = 0;
            function showImage(idx) {
                images.forEach((img, i) => {
                    img.style.display = (i === idx) ? 'block' : 'none';
                });
            }
            showImage(current);
            let prevBtn = carousel.querySelector('.nitter-img-prev');
            let nextBtn = carousel.querySelector('.nitter-img-next');
            if (prevBtn) {
                prevBtn.onclick = function(e) {
                    e.stopPropagation();
                    current = (current - 1 + images.length) % images.length;
                    showImage(current);
                };
            }
            if (nextBtn) {
                nextBtn.onclick = function(e) {
                    e.stopPropagation();
                    current = (current + 1) % images.length;
                    showImage(current);
                };
            }
        });
    }

    // Call after tweets are rendered
    function updateNitterFeedWrapper() {
        return updateNitterFeed().then(() => {
            setupImageCarousels();
            // Avoid crashing if a global filter state isn't initialized.
            if (typeof window.currentFilter === 'undefined') {
                window.currentFilter = 'all';
            }
            if (typeof filterTweets === 'function') {
                filterTweets(window.currentFilter);
            }
        });
    }

    if(modalButton && modal && closeButton) {
        modalButton.onclick = function() {
          modal.style.display = "block";
        }
        closeButton.onclick = function() {
          modal.style.display = "none";
        }
        window.onclick = function(event) {
          if (event.target == modal) {
            modal.style.display = "none";
          }
        }
    }

    // Anime selection with checkboxes
    const animeSelection = document.getElementById('anime-selection');
    const toggleBtn = document.getElementById('toggle-anime-selection');
    const detailedMode = document.getElementById('detailed-mode');
    const onePieceSources = document.getElementById('one-piece-sources');
    const onePieceMain = document.querySelector('input[value="one-piece"]');
    let isExpanded = false;

    // Initially hide anime selection
    animeSelection.style.display = 'none';

    // Toggle button
    toggleBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        animeSelection.style.display = isExpanded ? 'block' : 'none';
        toggleBtn.textContent = isExpanded ? 'Select Anime ▲' : 'Select Anime ▼';
    });

    // Detailed mode toggle
    detailedMode.addEventListener('change', () => {
        if (detailedMode.checked) {
            if (onePieceMain.checked) {
                document.querySelectorAll('#one-piece-sources input').forEach(cb => cb.checked = true);
            }
            onePieceMain.style.display = 'none';
            onePieceSources.style.display = 'block';
        } else {
            const anySubChecked = Array.from(document.querySelectorAll('#one-piece-sources input')).some(cb => cb.checked);
            if (anySubChecked) {
                onePieceMain.checked = true;
            }
            document.querySelectorAll('#one-piece-sources input').forEach(cb => cb.checked = false);
            onePieceMain.style.display = 'block';
            onePieceSources.style.display = 'none';
        }
        // Trigger change to update selections
        updateSelections();
    });

    // Function to update selections
    function updateSelections() {
        const selectedValues = [];
        if (detailedMode.checked) {
            selectedValues.push(...Array.from(document.querySelectorAll('#one-piece-sources input:checked')).map(cb => cb.value));
        } else {
            const checkboxes = animeSelection.querySelectorAll('input[type="checkbox"]:not(#detailed-mode)');
            selectedValues.push(...Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value));
        }
        localStorage.setItem(selectedAnimeKey, JSON.stringify(selectedValues));
        // Reset caches and fetch
        window.cursors = {};
        window.allTweets = [];
        window.exhausted = {};
        newsGrid.innerHTML = '';
        updateNitterFeedWrapper();
    }

    // Load saved selections
    const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
    if (savedSelections.some(s => ['pewpiece', 'WorstGenHQ', 'Mugiwara_23'].includes(s))) {
        detailedMode.checked = true;
        onePieceMain.style.display = 'none';
        onePieceSources.style.display = 'block';
        document.querySelectorAll('#one-piece-sources input').forEach(cb => {
            if (savedSelections.includes(cb.value)) cb.checked = true;
        });
    } else {
        const checkboxes = animeSelection.querySelectorAll('input[type="checkbox"]:not(#detailed-mode)');
        checkboxes.forEach(checkbox => {
            if (savedSelections.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }

    // Change events
    animeSelection.addEventListener('change', (e) => {
        if (e.target === detailedMode) return; // handled separately
        updateSelections();
    });

    // Content type radio buttons
    const contentTypeRadios = document.querySelectorAll('input[name="content-type"]');
    let currentContentType = localStorage.getItem('contentType') || 'misc';
    
    // Set initial state
    contentTypeRadios.forEach(radio => {
        if (radio.value === currentContentType) {
            radio.checked = true;
        }
    });
    
    contentTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            currentContentType = radio.value;
            localStorage.setItem('contentType', currentContentType);
            
            // Reset and fetch based on content type
            window.cursors = {};
            window.allTweets = [];
            window.exhausted = {};
            newsGrid.innerHTML = '';
            
            if (currentContentType === 'spoilers') {
                // Fetch spoiler tweets only
                fetchSpoilerTweets(10);
            } else {
                // Fetch misc news (no spoilers)
                updateNitterFeed(20).then(() => {
                    setupImageCarousels();
                    filterTweets('no-spoilers');
                });
            }
        });
    });

    // Fetch button - Check for new content
    const fetchBtn = document.getElementById('fetch-btn');
    if (fetchBtn) {
        let isFetching = false;
        fetchBtn.addEventListener('click', async () => {
            if (isFetching) return;
            isFetching = true;
            fetchBtn.disabled = true;
            const originalText = fetchBtn.textContent;
            fetchBtn.textContent = 'Checking for new content...';
            
            const currentContentType = localStorage.getItem('contentType') || 'misc';
            
            if (currentContentType === 'spoilers') {
                // Check for new spoilers (refresh mode)
                await fetchSpoilerTweets(10, true);
            } else {
                // Check for new misc news
                const existingTweets = window.allTweets || [];
                const existingKeys = new Set(existingTweets.map(t => (t.content || '') + '||' + (t.date || '')));
                
                const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
                let handles = [];
                if (savedSelections.some(s => ['pewpiece', 'WorstGenHQ', 'Mugiwara_23'].includes(s))) {
                    handles = savedSelections;
                } else {
                    savedSelections.forEach(anime => {
                        if (animeNitterHandles[anime]) {
                            handles = handles.concat(animeNitterHandles[anime]);
                        }
                    });
                }
                handles = handles.filter(h => h && h.trim());
                
                let newTweets = [];
                for (let i = 0; i < handles.length; i++) {
                    const handle = handles[i];
                    const { tweets, nextCursor, error } = await fetchNitterTweets(handle, 20, '');
                    if (!error && tweets && tweets.length > 0) {
                        const nonSpoilers = tweets.filter(t => !detectSpoiler(t.content, undefined));
                        const newOnes = nonSpoilers.filter(t => {
                            const key = (t.content || '') + '||' + (t.date || '');
                            return !existingKeys.has(key);
                        });
                        newTweets = newTweets.concat(newOnes);
                    }
                }
                
                if (newTweets.length === 0) {
                    console.log('No new misc news found');
                } else {
                    console.log(`Found ${newTweets.length} new misc tweets`);
                    let allTweets = deduplicateTweets(newTweets.concat(existingTweets));
                    allTweets.forEach(t => { 
                        try { t._ts = parseDate(t.date); } catch (e) { t._ts = 0; } 
                    });
                    allTweets.sort((a, b) => (b._ts || 0) - (a._ts || 0));
                    allTweets = allTweets.slice(0, 20 + newTweets.length);
                    window.allTweets = allTweets;
                    renderTweets(allTweets);
                }
            }
            
            isFetching = false;
            fetchBtn.disabled = false;
            fetchBtn.textContent = originalText;
        });
    }

    // Reload button - Completely reload current view from scratch
    const reloadBtn = document.getElementById('reload-btn');
    if (reloadBtn) {
        let isReloading = false;
        reloadBtn.addEventListener('click', async () => {
            if (isReloading) return;
            isReloading = true;
            reloadBtn.disabled = true;
            reloadBtn.classList.add('loading');
            
            const savedAnime = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
            if (savedAnime.length === 0) {
                alert('Please select at least one anime first!');
                isReloading = false;
                reloadBtn.disabled = false;
                reloadBtn.classList.remove('loading');
                return;
            }
            
            // Reset everything
            window.allTweets = [];
            window.cursors = {};
            window.exhausted = {};
            newsGrid.innerHTML = '';
            
            const currentContentType = localStorage.getItem('contentType') || 'misc';
            
            if (currentContentType === 'spoilers') {
                // Reload spoilers from scratch
                await fetchSpoilerTweets(10, false);
            } else {
                // Reload misc news from scratch
                await updateNitterFeed(20);
                setupImageCarousels();
            }
            
            isReloading = false;
            reloadBtn.disabled = false;
            reloadBtn.classList.remove('loading');
        });
    }

    // More button: load more tweets by continuing iteration
    const moreBtn = document.getElementById('more-btn');
    let isLoadingMore = false;
    if (moreBtn) {
        moreBtn.addEventListener('click', async () => {
            if (isLoadingMore) return;
            isLoadingMore = true;
            moreBtn.disabled = true;
            moreBtn.classList.add('loading');
            let textSpan = moreBtn.querySelector('.more-btn-text');
            if (textSpan) textSpan.textContent = 'Loading...';
            
            const currentContentType = localStorage.getItem('contentType') || 'misc';
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) loadingBar.style.width = '0%';
            
            try {
                if (currentContentType === 'spoilers') {
                    // Continue iterating for more spoilers - WICHTIG: Nutze existierende Cursors!
                    const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
                    let handles = [];
                    if (savedSelections.some(s => ['pewpiece', 'WorstGenHQ', 'Mugiwara_23'].includes(s))) {
                        handles = savedSelections;
                    } else {
                        savedSelections.forEach(anime => {
                            if (animeNitterHandles[anime]) {
                                handles = handles.concat(animeNitterHandles[anime]);
                            }
                        });
                    }
                    handles = handles.filter(h => h && h.trim());
                    
                    // Initialize if not exists
                    if (!window.cursors) window.cursors = {};
                    if (!window.exhausted) window.exhausted = {};
                    
                    let moreSpoilers = [];
                    const targetCount = 10;
                    let round = 0;
                    const maxRounds = 50;
                    
                    console.log(`More button: Starting next iteration, current cursors:`, window.cursors);
                    
                    // MORE BUTTON MODUS: Ignoriere exhausted, versuche IMMER weiter zu fetchen
                    while (moreSpoilers.length < targetCount && round < maxRounds) {
                        let fetchedThisRound = false;
                        
                        for (let i = 0; i < handles.length; i++) {
                            const handle = handles[i];
                            const cursor = window.cursors[handle] || '';
                            const progress = Math.min(95, (moreSpoilers.length / targetCount) * 100);
                            if (loadingBar) loadingBar.style.width = progress + '%';
                            
                            console.log(`More button: Fetching from ${handle} with cursor: ${cursor ? 'YES' : 'NO'}`);
                            
                            const { tweets, nextCursor, error } = await fetchNitterTweets(handle, 20, cursor);
                            
                            if (error) {
                                console.log(`${handle} returned error: ${error}, trying next handle`);
                                continue;
                            }
                            
                            if (!tweets || tweets.length === 0) {
                                console.log(`${handle} returned no tweets, trying next handle`);
                                continue;
                            }
                            
                            fetchedThisRound = true;
                            console.log(`Fetched ${tweets.length} tweets from ${handle}, next cursor: ${nextCursor ? 'YES' : 'NO'}`);
                            
                            // Update cursor für nächste Iteration
                            window.cursors[handle] = nextCursor || '';
                            
                            const spoilers = tweets.filter(t => detectSpoiler(t.content, undefined));
                            console.log(`Found ${spoilers.length} spoilers from ${handle} in this batch`);
                            moreSpoilers = moreSpoilers.concat(spoilers);
                            
                            if (moreSpoilers.length >= targetCount) break;
                        }
                        
                        // Nur stoppen wenn NICHTS mehr gefetched wurde
                        if (!fetchedThisRound) {
                            console.log(`No tweets fetched this round, stopping`);
                            break;
                        }
                        
                        round++;
                        console.log(`Completed iteration ${round}, found ${moreSpoilers.length} spoilers so far`);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                    
                    // Add to existing tweets
                    moreSpoilers = deduplicateTweets(moreSpoilers);
                    const existingTweets = window.allTweets || [];
                    const existingKeys = new Set(existingTweets.map(t => (t.content || '') + '||' + (t.date || '')));
                    const newSpoilers = moreSpoilers.filter(t => {
                        const key = (t.content || '') + '||' + (t.date || '');
                        return !existingKeys.has(key);
                    });
                    
                    if (newSpoilers.length > 0) {
                        let allSpoilers = existingTweets.concat(newSpoilers);
                        allSpoilers.forEach(t => { 
                            try { t._ts = parseDate(t.date); } catch (e) { t._ts = 0; } 
                        });
                        allSpoilers.sort((a, b) => (b._ts || 0) - (a._ts || 0));
                        window.allTweets = allSpoilers;
                        renderTweets(allSpoilers);
                        console.log(`Added ${newSpoilers.length} more spoilers`);
                    } else {
                        console.log('No more spoilers found');
                    }
                    
                } else {
                    // Continue iteration for misc news
                    await updateNitterFeed(20);
                    setupImageCarousels();
                    filterTweets('no-spoilers');
                }
                
                if (loadingBar) loadingBar.style.width = '100%';
                setTimeout(() => { if (loadingBar) loadingBar.style.width = '0%'; }, 500);
                
            } catch (error) {
                console.error('More button error:', error);
            }
            
            isLoadingMore = false;
            moreBtn.disabled = false;
            moreBtn.classList.remove('loading');
            textSpan = moreBtn.querySelector('.more-btn-text');
            if (textSpan) textSpan.textContent = 'Load More';
        });
    }

    /**
     * Detect spoilers in content.
     * For the 'berserk' series we match the words CHAPTER ... OUT (case-insensitive).
     * Otherwise fallback to the simple 'spoil' substring.
     * @param {string} content
     * @param {string|string[]} anime Optional anime key or selected list to help determine special rules
     */
    function detectSpoiler(content, anime) {
        if (!content || typeof content !== 'string') return false;
        const text = content.toUpperCase();

        // Normalize anime parameter to a single key if array provided
        let aKey = '';
        if (Array.isArray(anime)) {
            // if multiple selected, prefer 'berserk' if present
            aKey = anime.find(x => x && x.toLowerCase() === 'berserk') || '';
        } else if (typeof anime === 'string') {
            aKey = anime;
        }
        aKey = (aKey || '').toLowerCase();

        // Special rule for Berserk: look for "CHAPTER" ... "OUT" pattern
        if (aKey === 'berserk' || text.includes('BERSERK')) {
            // Match CHAPTER followed somewhere later by OUT (words, not substrings)
            const chapterOut = /\bCHAPTER\b[\s\S]{0,120}?\bOUT\b/i; // allow up to ~120 chars between
            if (chapterOut.test(content)) return true;
        }

        // Generic fallback: look for 'spoil' substring
        return /spoil/i.test(content);
    }

    function filterTweets(filterType) {
        const tweets = document.querySelectorAll('.nitter-tweet');
        tweets.forEach(tweet => {
            const content = tweet.querySelector('.nitter-content').textContent;
            // Determine anime context if available on the element
            const animeAttr = tweet.getAttribute('data-anime') || null;
            const isSpoil = detectSpoiler(content, animeAttr);
            if (filterType === 'all') {
                tweet.style.display = 'block';
            } else if (filterType === 'spoilers') {
                tweet.style.display = isSpoil ? 'block' : 'none';
            } else if (filterType === 'no-spoilers') {
                tweet.style.display = !isSpoil ? 'block' : 'none';
            }
        });
    }

    async function fetchSpoilerTweets(targetCount = 10, isRefresh = false) {
        const loadingBar = document.getElementById('loading-bar');
        if (loadingBar) loadingBar.style.width = '0%';
        
        const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
        if (savedSelections.length === 0) {
            newsGrid.innerHTML = '<p style="color: #999; text-align: center;">Select an anime to see spoilers.</p>';
            return;
        }

        let handles = [];
        if (savedSelections.some(s => ['pewpiece', 'WorstGenHQ', 'Mugiwara_23'].includes(s))) {
            handles = savedSelections;
        } else {
            savedSelections.forEach(anime => {
                if (animeNitterHandles[anime]) {
                    handles = handles.concat(animeNitterHandles[anime]);
                }
            });
        }
        handles = handles.filter(h => h && h.trim());

        let allSpoilers = [];
        let round = 0;
        const maxTotalFetches = 200;
        let totalFetched = 0;

        console.log(`${isRefresh ? 'Refreshing' : 'Loading'} spoilers - target: ${targetCount}`);
        
        // If refresh mode, check for new tweets from beginning
        if (isRefresh) {
            // Save existing tweets
            const existingSpoilers = window.allTweets || [];
            const existingKeys = new Set(existingSpoilers.map(t => (t.content || '') + '||' + (t.date || '')));
            
            // Temporarily reset cursors to fetch from start
            const oldCursors = { ...window.cursors };
            window.cursors = {};
            
            let newSpoilersFound = [];
            
            // Fetch first page from each handle to check for new content
            for (let i = 0; i < handles.length; i++) {
                const handle = handles[i];
                const { tweets, nextCursor, error } = await fetchNitterTweets(handle, 20, '');
                
                if (!error && tweets && tweets.length > 0) {
                    // When fetching from handles, we can use the handle's associated anime key
                    // Try to map handle back to an anime key
                    const handleLower = (handle || '').toLowerCase();
                    let handleAnimeKey = '';
                    for (const key in animeNitterHandles) {
                        if (animeNitterHandles[key].map(h => h.toLowerCase()).includes(handleLower)) {
                            handleAnimeKey = key;
                            break;
                        }
                    }
                    const spoilers = tweets.filter(t => detectSpoiler(t.content, handleAnimeKey));
                    // Only add truly new spoilers
                    const newOnes = spoilers.filter(s => {
                        const key = (s.content || '') + '||' + (s.date || '');
                        return !existingKeys.has(key);
                    });
                    newSpoilersFound = newSpoilersFound.concat(newOnes);
                }
            }
            
            // Restore cursors
            window.cursors = oldCursors;
            
            if (newSpoilersFound.length === 0) {
                console.log('No new spoilers found');
                if (loadingBar) loadingBar.style.width = '0%';
                return;
            }
            
            console.log(`Found ${newSpoilersFound.length} new spoilers`);
            // Add new spoilers to existing ones
            allSpoilers = deduplicateTweets(newSpoilersFound.concat(existingSpoilers));
            allSpoilers.forEach(t => { 
                try { t._ts = parseDate(t.date); } catch (e) { t._ts = 0; } 
            });
            allSpoilers.sort((a, b) => (b._ts || 0) - (a._ts || 0));
            allSpoilers = allSpoilers.slice(0, targetCount + newSpoilersFound.length);
            window.allTweets = allSpoilers;
            renderTweets(allSpoilers);
            if (loadingBar) loadingBar.style.width = '100%';
            setTimeout(() => { if (loadingBar) loadingBar.style.width = '0%'; }, 500);
            return;
        }
        
        // Normal mode: Reset and fetch fresh
        window.cursors = {};
        window.allTweets = [];
        window.exhausted = {};
        newsGrid.innerHTML = '';

        console.log(`Starting spoiler search - target: ${targetCount} spoilers`);

        while (allSpoilers.length < targetCount && totalFetched < maxTotalFetches) {
            let fetchedThisRound = false;
            let allHandlesExhausted = true;
            
            for (let i = 0; i < handles.length; i++) {
                const handle = handles[i];
                
                if (window.exhausted[handle]) continue;
                
                allHandlesExhausted = false;
                const cursor = window.cursors[handle] || '';
                const progress = Math.min(95, (allSpoilers.length / targetCount) * 100);
                if (loadingBar) loadingBar.style.width = progress + '%';
                
                console.log(`Fetching from ${handle}, cursor: ${cursor ? 'yes' : 'no'}, spoilers found so far: ${allSpoilers.length}`);
                
                const { tweets, nextCursor, error } = await fetchNitterTweets(handle, 20, cursor);
                
                if (error) {
                    console.log(`Error from ${handle}: ${error}`);
                    // Don't mark as exhausted on error, might be temporary
                    continue;
                }
                
                if (!tweets || tweets.length === 0) {
                    console.log(`${handle} exhausted (no tweets)`);
                    window.exhausted[handle] = true;
                    continue;
                }
                
                fetchedThisRound = true;
                totalFetched += tweets.length;
                window.cursors[handle] = nextCursor || '';
                
                if (!nextCursor) {
                    console.log(`FETCH MODE: ${handle} has no more pages, marking as exhausted`);
                    window.exhausted[handle] = true;
                }
                
                // Filter for spoilers
                    const spoilers = tweets.filter(t => detectSpoiler(t.content, undefined));
                console.log(`Found ${spoilers.length} spoilers from ${handle} (${tweets.length} total tweets)`);
                allSpoilers = allSpoilers.concat(spoilers);
                
                if (allSpoilers.length >= targetCount) {
                    console.log(`Target reached! Found ${allSpoilers.length} spoilers`);
                    break;
                }
            }
            
            // If all handles are exhausted or no tweets fetched, stop
            if (allHandlesExhausted || !fetchedThisRound) {
                console.log(`FETCH MODE: Stopping search - All exhausted: ${allHandlesExhausted}, Fetched this round: ${fetchedThisRound}`);
                break;
            }
            
            round++;
            console.log(`Completed round ${round}, total spoilers: ${allSpoilers.length}, total fetched: ${totalFetched}`);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        console.log(`Search complete - Found ${allSpoilers.length} spoilers total, fetched ${totalFetched} tweets`);

        // Deduplicate and sort
        allSpoilers = deduplicateTweets(allSpoilers);
        allSpoilers.forEach(t => { 
            try { 
                t._ts = parseDate(t.date); 
            } catch (e) { 
                t._ts = 0; 
            } 
        });
        allSpoilers.sort((a, b) => (b._ts || 0) - (a._ts || 0));
        
        // Take top 9
        allSpoilers = allSpoilers.slice(0, targetCount);
        window.allTweets = allSpoilers;

        if (allSpoilers.length === 0) {
            newsGrid.innerHTML = '<p style="color: #999; text-align: center;">No spoilers found.</p>';
            if (loadingBar) loadingBar.style.width = '0%';
            return;
        }

        // Render
        renderTweets(allSpoilers);
        
        if (loadingBar) loadingBar.style.width = '100%';
        setTimeout(() => {
            if (loadingBar) loadingBar.style.width = '0%';
        }, 500);
    }

    function parseDate(dateStr) {
        let d = Date.parse(dateStr);
        if (!isNaN(d)) return d;
        if (/now/i.test(dateStr)) return Date.now();
        let match = (dateStr || '').match(/(\d+)([hm])/);
        if (match) {
            let val = parseInt(match[1]);
            if (match[2] === 'h') return Date.now() - val * 3600 * 1000;
            if (match[2] === 'm') return Date.now() - val * 60 * 1000;
        }
        return 0;
    }

    function renderTweets(tweets) {
        const handleToIndicator = {
            'pewpiece': 'One Piece α',
            'WorstGenHQ': 'One Piece β',
            'Mugiwara_23': 'One Piece γ'
        };

        let tweetGrid = '';
        for (let idx = 0; idx < tweets.length; idx++) {
            const t = tweets[idx];
            let validImages = Array.isArray(t.images) ? t.images.filter(src => src && src !== 'null' && src !== '').map(src => src.startsWith('http') ? src : ('https://nitter.net' + src)) : [];
            let imgSize = 200;
            let imagesHtml = '';
            if (validImages.length > 0) {
                const imgsJson = JSON.stringify(validImages);
                if (validImages.length === 1) {
                    imagesHtml = `<div class="nitter-images"><img src="${validImages[0]}" class="nitter-img" data-images='${imgsJson}' data-idx="0" style="max-width:${imgSize}px;min-width:${imgSize}px;min-height:${imgSize}px;" /></div>`;
                } else {
                    imagesHtml = `<div class="nitter-images nitter-images-multi"><div class="nitter-img-carousel">`;
                    imagesHtml += validImages.map((img, i) => `<img src="${img}" class="nitter-img" data-idx="${i}" data-images='${imgsJson}' style="display:${i === 0 ? 'block' : 'none'};max-width:${imgSize}px;min-width:${imgSize}px;min-height:${imgSize}px;" />`).join('');
                    imagesHtml += `<button class="nitter-img-prev">&#8592;</button><button class="nitter-img-next">&#8594;</button></div></div>`;
                }
            }
            const truncatedText = t.content && t.content.length > 320 ? t.content.substring(0, 320) + '...' : (t.content || '');
            const needsToggle = t.content && t.content.length > 320;
            let contentHtml = `<div class="nitter-content"><span class="text-part">${truncatedText}</span>${needsToggle ? " <button class='aufklappen-btn' type='button'>aufklappen</button>" : ''}</div><div class="nitter-content expanded" style="display:none;"><span class="text-part">${t.content}</span>${needsToggle ? " <button class='zuklappen-btn' type='button'>zuklappen</button>" : ''}</div>`;
            let tweetClass = 'nitter-tweet';
            if (!imagesHtml.trim()) tweetClass += ' no-image';
            const indicator = handleToIndicator[t.handle] || t.handle;
            
            // Determine anime source for border coloring
            let animeSource = 'unknown';
            let subSource = '';
            if (t.handle === 'pewpiece') {
                animeSource = 'onepiece';
                subSource = 'alpha';
            } else if (t.handle === 'WorstGenHQ') {
                animeSource = 'onepiece';
                subSource = 'beta';
            } else if (t.handle === 'Mugiwara_23') {
                animeSource = 'onepiece';
                subSource = 'gamma';
            } else if (t.handle === 'Abdul_S17') {
                animeSource = 'boruto';
            } else if (t.handle === 'BlackClover_EN') {
                animeSource = 'blackclover';
            }
            
            tweetGrid += `<div class="${tweetClass}" data-index="${idx}" data-anime="${animeSource}" data-subsource="${subSource}">${imagesHtml}${contentHtml}<div class="nitter-tweet-date-row" style="text-align:center;margin-bottom:3px;font-size:1em;color:#0d6efd;">${t.date}</div><div class="source-indicator">${indicator}</div><button class="source-btn" onclick="window.open('https://nitter.net${t.url}')">Source</button><button class="translate-btn" onclick="translateText(this, decodeURIComponent('${encodeURIComponent(t.content)}'))">Translate</button></div>`;
        }
        
        newsGrid.innerHTML = tweetGrid;
        setupImageCarousels();
        
        // Apply fading and image error handlers
        document.querySelectorAll('.nitter-tweet').forEach(tweet => {
            const content = tweet.querySelector('.nitter-content');
            if (content && !tweet.classList.contains('expanded')) {
                window.applyFading(content);
            }
            
            // Add error handlers to images
            const imgs = tweet.querySelectorAll('.nitter-img');
            imgs.forEach(img => {
                img.addEventListener('error', function() {
                    const parent = this.parentElement;
                    if (parent) {
                        parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;color:#999;font-style:italic;text-align:center;padding:20px;">Image was deleted by original author</div>';
                    }
                });
            });
            
            // Add expand/collapse button listeners with font size adjustment
            const aufBtn = tweet.querySelector('.aufklappen-btn');
            const zukBtn = tweet.querySelector('.zuklappen-btn');
            
            if (aufBtn) {
                aufBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const truncated = tweet.querySelector('.nitter-content:not(.expanded)');
                    const expanded = tweet.querySelector('.nitter-content.expanded');
                    if (truncated) truncated.style.display = 'none';
                    if (expanded) {
                        expanded.style.display = 'block';
                        // Increase font size by 2 units (from 1.1em to 1.5em)
                        expanded.style.fontSize = '1.5em';
                    }
                    tweet.classList.add('expanded');
                    tweet.style.gridColumn = 'span 3';
                    tweet.style.gridRow = 'span 1';
                    tweet.style.height = 'auto';
                });
            }
            
            if (zukBtn) {
                zukBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const truncated = tweet.querySelector('.nitter-content:not(.expanded)');
                    const expanded = tweet.querySelector('.nitter-content.expanded');
                    if (expanded) {
                        expanded.style.display = 'none';
                        // Reset font size
                        expanded.style.fontSize = '';
                    }
                    if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                    tweet.classList.remove('expanded');
                    tweet.style.gridColumn = '';
                    tweet.style.gridRow = '';
                    tweet.style.height = '';
                });
            }
            
            // Add click listener for tweet expansion
            tweet.addEventListener('click', () => {
                const isExpanded = tweet.classList.contains('expanded');
                const index = parseInt(tweet.dataset.index, 10);
                const row = Math.floor(index / 3);
                
                if (isExpanded) {
                    document.querySelectorAll('.nitter-tweet').forEach((t, idx) => { if (Math.floor(idx / 3) === row) t.style.display = 'block'; });
                    tweet.classList.remove('expanded');
                    tweet.style.gridColumn = '';
                    tweet.style.gridRow = '';
                    const truncated = tweet.querySelector('.nitter-content:not(.expanded)');
                    if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                    const expanded = tweet.querySelector('.nitter-content.expanded');
                    if (expanded) {
                        expanded.style.display = 'none';
                        // Reset font size
                        expanded.style.fontSize = '';
                    }
                    tweet.style.height = '';
                } else {
                    document.querySelectorAll('.nitter-tweet.expanded').forEach(t => {
                        const tIndex = parseInt(t.dataset.index, 10);
                        const tRow = Math.floor(tIndex / 3);
                        document.querySelectorAll('.nitter-tweet').forEach((tt, idx) => { if (Math.floor(idx / 3) === tRow) tt.style.display = 'block'; });
                        t.classList.remove('expanded');
                        t.style.gridColumn = ''; t.style.gridRow = '';
                        const truncated = t.querySelector('.nitter-content:not(.expanded)'); if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                        const expanded = t.querySelector('.nitter-content.expanded');
                        if (expanded) {
                            expanded.style.display = 'none';
                            // Reset font size
                            expanded.style.fontSize = '';
                        }
                        t.style.height = '';
                    });

                    document.querySelectorAll('.nitter-tweet').forEach((t, idx) => { if (Math.floor(idx / 3) === row && idx !== index) t.style.display = 'none'; });
                    tweet.classList.add('expanded');
                    tweet.style.gridColumn = 'span 3'; tweet.style.gridRow = 'span 1';
                    const truncatedContent = tweet.querySelector('.nitter-content:not(.expanded)');
                    if (truncatedContent) { truncatedContent.style.display = 'none'; const spans = truncatedContent.querySelectorAll('span'); spans.forEach(span => span.style.opacity = '1'); }
                    const expandedContent = tweet.querySelector('.nitter-content.expanded');
                    if (expandedContent) {
                        expandedContent.style.display = 'block';
                        // Increase font size by 2 units (from 1.1em to 1.5em)
                        expandedContent.style.fontSize = '1.5em';
                    }
                    tweet.style.height = 'auto';
                }
            });
        });
    }

    // Auto-reload on page load
    const savedAnime = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
    if (savedAnime.length > 0) {
        // Trigger reload button click
        setTimeout(() => {
            const reloadBtn = document.getElementById('reload-btn');
            if (reloadBtn) {
                reloadBtn.click();
            }
        }, 100);
    }

});