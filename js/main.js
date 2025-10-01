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
        if (Array.isArray(imagesArr) && imagesArr.length > 1) {
            modalImages = imagesArr;
            modalCurrentIdx = imagesArr.indexOf(src);
        } else {
            modalImages = [src];
            modalCurrentIdx = 0;
        }
        modalImage.src = modalImages[modalCurrentIdx];
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
        let isDragging = false;
        let dragStartX = 0, dragStartY = 0;
        let dragImgX = 0, dragImgY = 0;

        modalImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = modalImage.getBoundingClientRect();
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
        'boruto': [''],
        'black-clover': ['']
    };

    async function fetchNitterTweets(username, count = 9, cursor = '') {
        const proxyUrl = 'https://corsproxy.io/?';
        const nitterUrl = `https://nitter.net/${username}${cursor ? '?cursor=' + encodeURIComponent(cursor) : ''}`;
        try {
            const response = await fetch(proxyUrl + encodeURIComponent(nitterUrl));
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const tweets = Array.from(doc.querySelectorAll('.timeline-item')).slice(0, count);
            const tweetData = tweets.map(tweet => {
                const content = tweet.querySelector('.tweet-content')?.innerText || '';
                const date = tweet.querySelector('span.tweet-date a')?.innerText || '';
                // Get images (try .still-image, .attachment.image, src and data-src)
                // Try broader selector for images
                let imageNodes = tweet.querySelectorAll('.attachments img, .attachments .still-image, .attachments .attachment.image');
                let images = Array.from(imageNodes)
                    .map(img => {
                        let src = img.getAttribute('src') || img.getAttribute('data-src');
                        return src;
                    })
                    .filter(src => src && src !== 'null');
                return { content, date, images, url: tweet.querySelector('.tweet-date a')?.getAttribute('href') || '', handle: username };
            });
            const showMore = doc.querySelector('.show-more a');
            let nextCursor = '';
            if (showMore) {
                const href = showMore.getAttribute('href');
                const match = href.match(/cursor=([^&]*)/);
                if (match) nextCursor = decodeURIComponent(match[1]);
            }
            return { tweets: tweetData, nextCursor };
        } catch (err) {
            console.error('Fetch error:', err);
            return { tweets: [], nextCursor: '' };
        }
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
        if (!newsGrid) {
            console.error("News grid container not found!");
            return;
        }
        const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];

        const handleToIndicator = {
            'pewpiece': 'One Piece α',
            'WorstGenHQ': 'One Piece β',
            'Mugiwara_23': 'One Piece γ'
        };

        if (savedSelections.length === 0) {
            newsGrid.innerHTML = '<p style="color: #999; text-align: center;">Select an anime to see the latest posts.</p>';
            return;
        }

        let handles = [];
        savedSelections.forEach(anime => {
            if (animeNitterHandles[anime]) {
                handles = handles.concat(animeNitterHandles[anime]);
            }
        });

        // Don't wipe the grid on each incremental fetch — we'll append new items
        if (!window.allTweets) window.allTweets = [];
        if (!window.cursors) window.cursors = {};
        if (!window.exhausted) window.exhausted = {};

        const perPage = typeof perPageOverride === 'number' ? perPageOverride : 20;
        const perHandle = Math.max(1, Math.ceil(perPage / Math.max(1, handles.length)));
        let newTweets = [];
        const maxRounds = 10; // safety cap to avoid too many requests
        let round = 0;
        while (newTweets.length < perPage && round < maxRounds) {
            let anyFetchedThisRound = false;
            for (let i = 0; i < handles.length; i++) {
                const handle = handles[i];
                if (window.exhausted[handle]) continue;
                const cursor = window.cursors[handle] || '';
                const { tweets, nextCursor } = await fetchNitterTweets(handle, perHandle, cursor);
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
            tweetGrid += `<div class="${tweetClass}" data-index="${i}">${imagesHtml}${contentHtml}<div class="nitter-tweet-date-row" style="text-align:center;margin-bottom:3px;font-size:1em;color:#0d6efd;">${localTime}</div><div class="source-indicator">${indicator}</div><button class="source-btn" onclick="window.open('https://nitter.net${t.url}')">Source</button><button class="translate-btn" onclick="translateText(this, decodeURIComponent('${encodeURIComponent(t.content)}'))">Translate</button></div>`;
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
                        if (expanded) expanded.style.display = 'block';
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
                        if (expanded) expanded.style.display = 'none';
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
                        const expanded = tweet.querySelector('.nitter-content.expanded'); if (expanded) expanded.style.display = 'none';
                        tweet.style.height = '';
                    } else {
                        document.querySelectorAll('.nitter-tweet.expanded').forEach(t => {
                            const tIndex = parseInt(t.dataset.index, 10);
                            const tRow = Math.floor(tIndex / 3);
                            document.querySelectorAll('.nitter-tweet').forEach((tt, idx) => { if (Math.floor(idx / 3) === tRow) tt.style.display = 'block'; });
                            t.classList.remove('expanded');
                            t.style.gridColumn = ''; t.style.gridRow = '';
                            const truncated = t.querySelector('.nitter-content:not(.expanded)'); if (truncated) { truncated.style.display = 'block'; window.applyFading(truncated); }
                            const expanded = t.querySelector('.nitter-content.expanded'); if (expanded) expanded.style.display = 'none';
                            t.style.height = '';
                        });

                        document.querySelectorAll('.nitter-tweet').forEach((t, idx) => { if (Math.floor(idx / 3) === row && idx !== index) t.style.display = 'none'; });
                        tweet.classList.add('expanded');
                        tweet.style.gridColumn = 'span 3'; tweet.style.gridRow = 'span 1';
                        const truncatedContent = tweet.querySelector('.nitter-content:not(.expanded)');
                        if (truncatedContent) { truncatedContent.style.display = 'none'; const spans = truncatedContent.querySelectorAll('span'); spans.forEach(span => span.style.opacity = '1'); }
                        const expandedContent = tweet.querySelector('.nitter-content.expanded'); if (expandedContent) expandedContent.style.display = 'block';
                        tweet.style.height = 'auto';
                    }
                });
            });
        }
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
            filterTweets(currentFilter);
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
    if (animeSelection) {
        const checkboxes = animeSelection.querySelectorAll('input[type="checkbox"]');
        const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
        checkboxes.forEach(checkbox => {
            if (savedSelections.includes(checkbox.value)) {
                checkbox.checked = true;
            }
            checkbox.addEventListener('change', () => {
                const selectedValues = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                localStorage.setItem(selectedAnimeKey, JSON.stringify(selectedValues));
                // Reset pagination caches when selection changes so we start fresh
                window.cursors = {};
                window.allTweets = [];
                window.exhausted = {};
                newsGrid.innerHTML = '';
                updateNitterFeedWrapper();
            });
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentFilter = localStorage.getItem('currentFilter') || 'all';
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === currentFilter) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            localStorage.setItem('currentFilter', currentFilter);
            filterTweets(currentFilter);
        });
    });

    // Fetch button
    const fetchBtn = document.getElementById('fetch-btn');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', () => {
            // Manual fetch should reset caches and load fresh
            window.cursors = {};
            window.allTweets = [];
            window.exhausted = {};
            newsGrid.innerHTML = '';
            updateNitterFeedWrapper();
        });
    }

    // More button: load 6 more tweets when clicked (append)
    const moreBtn = document.getElementById('more-btn');
    let isLoadingMore = false;
    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            if (isLoadingMore) return;
            isLoadingMore = true;
            moreBtn.disabled = true;
            moreBtn.textContent = 'Loading...';
            // Do not reset caches; just request more (20)
            updateNitterFeed(20).then(() => {
                setupImageCarousels();
                filterTweets(currentFilter);
                isLoadingMore = false;
                moreBtn.disabled = false;
                moreBtn.textContent = 'More';
            }).catch(() => {
                isLoadingMore = false;
                moreBtn.disabled = false;
                moreBtn.textContent = 'More';
            });
        });
    }

    function isSpoiler(tweet) {
        return tweet.content.toLowerCase().includes('spoil');
    }

    function filterTweets(filterType) {
        const tweets = document.querySelectorAll('.nitter-tweet');
        tweets.forEach(tweet => {
            const content = tweet.querySelector('.nitter-content').textContent;
            const isSpoil = /spoil/i.test(content);
            if (filterType === 'all') {
                tweet.style.display = 'block';
            } else if (filterType === 'spoilers') {
                tweet.style.display = isSpoil ? 'block' : 'none';
            } else if (filterType === 'no-spoilers') {
                tweet.style.display = !isSpoil ? 'block' : 'none';
            }
        });
    }

    // Auto fetch if anime selected
    const savedAnime = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
    if (savedAnime.length > 0) {
        updateNitterFeed();
    }

});