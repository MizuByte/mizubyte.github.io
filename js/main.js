document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for Anime Cards button
    const openCardsBtn = document.getElementById('open-cards');
    if (openCardsBtn) {
        openCardsBtn.onclick = function() {
            window.location.href = 'cards/card.html';
        };
    }
    // Modal for full image view
    let modalPrevBtn2, modalNextBtn2;
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const imageModalClose = document.getElementById('imageModalClose');

    // Modal carousel state
    let modalImages = [];
    let modalCurrentIdx = 0;

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
        updateModalNavButtons();
    }
    function closeImageModal() {
        imageModal.style.display = 'none';
        modalImage.src = '';
        modalImages = [];
        modalCurrentIdx = 0;
        updateModalNavButtons();
    }

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

        // Add two more buttons for each side
        if (!modalPrevBtn2) {
            window.modalPrevBtn2 = document.createElement('button');
            modalPrevBtn2.className = 'modal-img-prev';
            modalPrevBtn2.innerHTML = '&#8592;';
            modalPrevBtn2.style.position = 'fixed';
            modalPrevBtn2.style.left = '120px';
            modalPrevBtn2.style.top = '50%';
            modalPrevBtn2.style.transform = 'translateY(-50%)';
            modalPrevBtn2.style.zIndex = '200';
            modalPrevBtn2.onclick = function(e) {
                e.stopPropagation();
                if (modalImages.length > 1) {
                    modalCurrentIdx = (modalCurrentIdx - 1 + modalImages.length) % modalImages.length;
                    modalImage.src = modalImages[modalCurrentIdx];
                    updateModalNavButtons();
                }
            };
        }
        if (!modalNextBtn2) {
            window.modalNextBtn2 = document.createElement('button');
            modalNextBtn2.className = 'modal-img-next';
            modalNextBtn2.innerHTML = '&#8594;';
            modalNextBtn2.style.position = 'fixed';
            modalNextBtn2.style.right = '120px';
            modalNextBtn2.style.top = '50%';
            modalNextBtn2.style.transform = 'translateY(-50%)';
            modalNextBtn2.style.zIndex = '200';
            modalNextBtn2.onclick = function(e) {
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
            if (!imageModal.contains(window.modalPrevBtn2)) imageModal.appendChild(window.modalPrevBtn2);
            if (!imageModal.contains(window.modalNextBtn2)) imageModal.appendChild(window.modalNextBtn2);
        } else {
            if (modalPrevBtn && imageModal.contains(modalPrevBtn)) imageModal.removeChild(modalPrevBtn);
            if (modalNextBtn && imageModal.contains(modalNextBtn)) imageModal.removeChild(modalNextBtn);
            if (window.modalPrevBtn2 && imageModal.contains(window.modalPrevBtn2)) imageModal.removeChild(window.modalPrevBtn2);
            if (window.modalNextBtn2 && imageModal.contains(window.modalNextBtn2)) imageModal.removeChild(window.modalNextBtn2);
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
    const animeSelectionContainer = document.getElementById('anime-selection');
    const twitterFeed = document.getElementById('twitter-feed');
    const selectedAnimeKey = 'selectedAnime';
    const modal = document.getElementById("myModal");
    const modalButton = document.getElementById("modal-open-button");
    const closeButton = document.getElementsByClassName("close-button")[0];

    // Map anime to Nitter usernames
    const animeNitterHandles = {
        'one-piece': ['pewpiece'],
        'boruto': ['BorutoExplorer'],
        'black-clover': ['BCspoiler']
    };

    async function fetchNitterTweets(username, count = 5) {
        const proxyUrl = 'https://corsproxy.io/?';
        const nitterUrl = `https://nitter.net/${username}`;
        try {
            const response = await fetch(proxyUrl + encodeURIComponent(nitterUrl));
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const tweets = Array.from(doc.querySelectorAll('.timeline-item')).slice(0, count);
            return tweets.map(tweet => {
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
                if (images.length > 0) {
                    console.log('Images for tweet:', images);
                }
                return { content, date, images };
            });
        } catch (err) {
            return [{ content: 'Failed to load tweets.', date: '' }];
        }
    }

    async function updateNitterFeed() {
        if (!twitterFeed) {
            console.error("Twitter feed container not found!");
            return;
        }
        twitterFeed.innerHTML = '';
        const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];

        if (savedSelections.length === 0) {
            twitterFeed.innerHTML = '<p style="color: #999; text-align: center;">Select an anime to see the latest posts.</p>';
            return;
        }

        let handles = [];
        savedSelections.forEach(anime => {
            if (animeNitterHandles[anime]) {
                handles = handles.concat(animeNitterHandles[anime]);
            }
        });

        twitterFeed.innerHTML = '<p>Loading tweets...</p>';
        let allTweets = [];
        for (const handle of handles) {
            const tweets = await fetchNitterTweets(handle, 8);
            // Add handle info to each tweet for sorting
            tweets.forEach(t => {
                t._handle = handle;
            });
            allTweets = allTweets.concat(tweets);
        }
        // Sort allTweets by date (newest first)
        function parseDate(dateStr) {
            // Try to parse date string, fallback to 0
            let d = Date.parse(dateStr);
            if (!isNaN(d)) return d;
            // Try to parse formats like '1h', '2m', 'now', etc.
            if (/now/i.test(dateStr)) return Date.now();
            let match = dateStr.match(/(\d+)([hm])/);
            if (match) {
                let val = parseInt(match[1]);
                if (match[2] === 'h') return Date.now() - val * 3600 * 1000;
                if (match[2] === 'm') return Date.now() - val * 60 * 1000;
            }
            return 0;
        }
        // Quicksort implementation
        function quickSort(arr) {
            if (arr.length <= 1) return arr;
            let pivot = arr[Math.floor(arr.length / 2)];
            let pivotDate = parseDate(pivot.date);
            let left = arr.filter(t => parseDate(t.date) > pivotDate);
            let right = arr.filter(t => parseDate(t.date) < pivotDate);
            let equal = arr.filter(t => parseDate(t.date) === pivotDate);
            return quickSort(left).concat(equal, quickSort(right));
        }
        allTweets = quickSort(allTweets);
        // Render as a single grid
        const maxCols = 2;
        let tweetGrid = '<div class="nitter-tweet-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">';
        for (let i = 0; i < allTweets.length; i++) {
            const t = allTweets[i];
            let validImages = Array.isArray(t.images) ? t.images.filter(src => src && src !== 'null' && src !== '').map(src => src.startsWith('http') ? src : ('https://nitter.net' + src)) : [];
            let imgSize = 220;
            if (t.content && t.content.length > 320) imgSize = 120;
            else if (t.content && t.content.length < 80) imgSize = 300;
            let imagesHtml = '';
            if (validImages.length > 0) {
                if (validImages.length === 1) {
                    imagesHtml = `<div class="nitter-images"><img src="${validImages[0]}" class="nitter-img" style="max-width:${imgSize}px;min-width:${imgSize}px;min-height:${imgSize}px;" onclick="openImageModal('${validImages[0]}', ['${validImages[0]}'])" /></div>`;
                } else {
                    imagesHtml = `<div class="nitter-images nitter-images-multi">`;
                    imagesHtml += `<div class="nitter-img-carousel">`;
                    imagesHtml += validImages.map((img, idx) => `<img src="${img}" class="nitter-img" data-idx="${idx}" style="display:${idx === 0 ? 'block' : 'none'};max-width:${imgSize}px;min-width:${imgSize}px;min-height:${imgSize}px;" onclick="openImageModal('${img}', [${validImages.map(i => `'${i}'`).join(',')}])" />`).join('');
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
            let contentHtml = `<div class="nitter-content">${t.content}</div>`;
            if (t.content && t.content.length > 320) {
                contentHtml = `<div class="nitter-content">${t.content.substring(0, 320)}... <button class='aufklappen-btn' onclick='this.parentElement.classList.add("expanded");this.style.display="none";this.parentElement.parentElement.parentElement.style.height="auto";'>aufklappen</button></div><div class="nitter-content expanded" style="display:none;">${t.content} <button class='aufklappen-btn' onclick='this.parentElement.style.display="none";this.parentElement.previousElementSibling.classList.remove("expanded");this.parentElement.previousElementSibling.querySelector(".aufklappen-btn").style.display="block";this.parentElement.parentElement.parentElement.style.height="";'>zuklappen</button></div>`;
            }
            tweetGrid += `<div class="nitter-tweet">${imagesHtml}${contentHtml}<div class="nitter-tweet-date-row" style="text-align:center;margin-bottom:30px;font-size:1em;color:#0d6efd;">${localTime}</div></div>`;
        }
        tweetGrid += '</div>';
        twitterFeed.innerHTML = tweetGrid;
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
        updateNitterFeed().then(() => {
            setupImageCarousels();
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

    const savedSelections = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
    if (animeSelectionContainer) {
        savedSelections.forEach(value => {
            const box = animeSelectionContainer.querySelector(`.anime-box[data-value="${value}"]`);
            if (box) {
                box.classList.add('selected');
            }
        });

        animeSelectionContainer.addEventListener('click', async (event) => {
            const target = event.target;
            if (target.classList.contains('anime-box')) {
                target.classList.toggle('selected');
                const selectedBoxes = animeSelectionContainer.querySelectorAll('.anime-box.selected');
                const selectedValues = Array.from(selectedBoxes).map(box => box.getAttribute('data-value'));
                localStorage.setItem(selectedAnimeKey, JSON.stringify(selectedValues));
                await updateNitterFeedWrapper();
            }
        });
    }
    updateNitterFeedWrapper();

    // Enhance modal for zoom and navigation
    if (modalImage) {
        modalImage.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (!window.modalZoomLevel) window.modalZoomLevel = 1;
            let delta = e.deltaY < 0 ? 0.1 : -0.1;
            window.modalZoomLevel = Math.max(0.5, Math.min(3, window.modalZoomLevel + delta));
            modalImage.style.transform = `scale(${window.modalZoomLevel})`;
        });
        let isDragging = false, startX = 0, startY = 0, imgX = 0, imgY = 0;
        modalImage.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX - imgX;
            startY = e.clientY - imgY;
            modalImage.style.cursor = 'grab';
        });
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                imgX = e.clientX - startX;
                imgY = e.clientY - startY;
                modalImage.style.transform = `scale(${window.modalZoomLevel}) translate(${imgX}px,${imgY}px)`;
            }
        });
        document.addEventListener('mouseup', function(e) {
            isDragging = false;
            modalImage.style.cursor = 'pointer';
        });
        modalImage.addEventListener('dblclick', function(e) {
            window.modalZoomLevel = 1;
            imgX = 0; imgY = 0;
            modalImage.style.transform = 'scale(1)';
        });
    }
        // --- Cards toggle logic ---
        const toggleBtn = document.getElementById('toggle-cards');
        const mainContent = document.getElementById('main-content');
        const cardsContent = document.getElementById('cards-content');

        if (toggleBtn && mainContent && cardsContent) {
            const paper = document.querySelector('.paper');
            toggleBtn.onclick = function() {
                if (mainContent.style.display !== 'none') {
                    mainContent.style.display = 'none';
                    cardsContent.style.display = 'block';
                    toggleBtn.textContent = 'Back';
                    if (paper) paper.classList.add('cards-active');
                } else {
                    mainContent.style.display = '';
                    cardsContent.style.display = 'none';
                    toggleBtn.textContent = 'Show Cards';
                    if (paper) paper.classList.remove('cards-active');
                }
            };
        }

        // --- Card selection logic ---
        const cardElems = document.querySelectorAll('#cards-content .card');
        function getAnimeFromCard(card) {
            const text = card.querySelector('.card-figure-text')?.textContent?.trim().toLowerCase();
            if (text === 'one piece') return 'one-piece';
            if (text === 'boruto') return 'boruto';
            if (text === 'black clover') return 'black-clover';
            return null;
        }
        function updateSelectedAnime() {
            const selected = [];
            cardElems.forEach(card => {
                if (card.classList.contains('greyed')) {
                    const anime = getAnimeFromCard(card);
                    if (anime) selected.push(anime);
                }
            });
            localStorage.setItem(selectedAnimeKey, JSON.stringify(selected));
            updateNitterFeedWrapper();
        }
        cardElems.forEach(card => {
            card.addEventListener('click', function() {
                card.classList.toggle('greyed');
                updateSelectedAnime();
            });
        });
        // On page load, restore selection
        const savedSelectionsCards = JSON.parse(localStorage.getItem(selectedAnimeKey)) || [];
        cardElems.forEach(card => {
            const anime = getAnimeFromCard(card);
            if (anime && savedSelectionsCards.includes(anime)) {
                card.classList.add('greyed');
            } else {
                card.classList.remove('greyed');
            }
        });
});
