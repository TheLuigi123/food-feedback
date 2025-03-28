// --- VERY BASIC CHECK ---
console.log("--- script.js started loading ---");

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM LOADED CHECK ---
    console.log("--- DOMContentLoaded event fired ---");

    // --- CONFIGURATION ---
    const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbw_PX8InYEZm1tc6uVLYYZpBSTYjVB4fXXHCj62nLsZr7n6N2nspr3wXLjoP68GgIdIsw/exec';
    const thankYouDuration = 1200; // Keep shorter duration
    const commentRequiredLength = 15;
    // ---------------------

    // --- AUDIO CONFIGURATION ---
    const sounds = {
        '1-4 Klasse': new Audio('1-4_klasse.wav'),
        '5-8 Klasse': new Audio('5-8_klasse.mp3'),
        '9-12 Klasse': new Audio('9-12_klasse.wav'),
        'rating-1': new Audio('green.mp3'),
        'rating-2': new Audio('okay.mp3'),
        'rating-3-success': new Audio('red.mp3'),
        'sent': new Audio('sent.wav'),
        'error': new Audio('error.wav')
    };
    // ---------------------

    console.log("Using Google Apps Script URL:", googleAppsScriptUrl);
    console.log("Google Apps Script URL is present.");

    // --- ELEMENT SELECTION ---
    console.log("Selecting DOM elements...");
    const feedbackScreen = document.getElementById('feedback-section');
    const thankYouScreen = document.getElementById('thank-you');
    if (!feedbackScreen) { console.error("CRITICAL STOP: #feedback-section not found."); return; }
    if (!thankYouScreen) { console.error("CRITICAL STOP: #thank-you not found."); return; }
    console.log("feedbackScreen and thankYouScreen found.");
    console.log("Selecting ALL group buttons...");
    const allGroupButtons = document.querySelectorAll('#feedback-section .group-button');
    console.log(`allGroupButtons Count: ${allGroupButtons.length}`);
    console.log("Selecting rating buttons...");
    const feedbackRatingButtons = feedbackScreen.querySelectorAll('.feedback-options .feedback-button');
    console.log(`feedbackRatingButtons Count: ${feedbackRatingButtons.length}`);
    const loadingIndicator = document.getElementById('loading-indicator');
    const commentInput = document.getElementById('comment');
    const commentError = document.getElementById('comment-error'); // The red text paragraph

    // --- Enhanced check for the error element ---
    if (!commentError) {
         console.error("CRITICAL WARNING: Element with ID 'comment-error' not found. Error messages will not be displayed in the designated area.");
    } else {
        console.log("Element #comment-error found successfully."); // Confirmation
    }
    // -------------------------------------------

    console.log("Essential elements selected.");

    // App State
    let selectedGroup = null;
    let selectedRating = null;
    let isSubmitting = false;
    let lastPlayedRatingSound = null;
    console.log("Initial App State set.");

    // --- Functions ---

    function playSound(soundKey) {
        console.log(`Attempt play sound: ${soundKey}`);
        const audio = sounds[soundKey];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(error => {
                console.error(`Error playing sound "${soundKey}":`, error);
            });
            if (soundKey.startsWith('rating-')) {
                return audio;
            }
        } else {
            console.warn(`Sound key "${soundKey}" not found in sounds object.`);
        }
        return null;
    }

    function showScreen(screenToShow) {
        console.log(`%cExecuting showScreen for: ${screenToShow.id}`, 'background-color: yellow; color: black;');
        if(!feedbackScreen||!thankYouScreen){console.error("ShowScreen Error: elements missing!");return;}
        feedbackScreen.classList.remove('active');
        thankYouScreen.classList.remove('active');
        screenToShow.classList.add('active');
        console.log(`%cFB active?:${feedbackScreen.classList.contains('active')}; TY active?:${thankYouScreen.classList.contains('active')}`, 'background-color: yellow; color: black;');
    }


    function formatTimestamp(date) {
        try{const d=String(date.getDate()).padStart(2,'0');const m=String(date.getMonth()+1).padStart(2,'0');const y=String(date.getFullYear()).slice(-2);const h=String(date.getHours()).padStart(2,'0');const min=String(date.getMinutes()).padStart(2,'0');return `${d}/${m}/${y} ${h}:${min}`;}catch(e){console.error("Timestamp error:",e);return new Date().toISOString();}
    }

    function deselectAllGroups() {
        console.log("--- Running deselectAllGroups ---");
        selectedGroup = null;
        feedbackScreen.classList.remove('group-selected');
        allGroupButtons.forEach(button => {
            button.classList.remove('selected');
        });
        console.log("Deselected all groups visually and reset selectedGroup variable.");
        console.log("--- Finished deselectAllGroups ---");
    }


    function resetApp() {
        console.log("Starting resetApp...");
        isSubmitting = false;
        commentInput.value = '';
        if (commentError) commentError.textContent = ''; // Clear error text
        deselectAllGroups();
        selectedRating = null;
        lastPlayedRatingSound = null;

        showScreen(feedbackScreen);
        console.log("Switched back to feedback screen.");
        loadingIndicator.style.display = 'none';

        feedbackRatingButtons.forEach(b => b.disabled = false);
        console.log("Rating buttons re-enabled.");

        allGroupButtons.forEach(btn => btn.style.pointerEvents = 'auto');
        console.log("Group buttons re-enabled (pointer-events set to 'auto').");

        console.log("App Reset Finished.");
    }


    function submitFeedback() {
        console.log("--- submitFeedback function started ---");
        if (!selectedGroup || !selectedRating || isSubmitting) {
            console.log(`Submit prevented: group=${selectedGroup}, rating=${selectedRating}, submitting=${isSubmitting}`);
            return;
        }

        const timestamp = formatTimestamp(new Date());
        const commentValue = commentInput.value.trim();
        const formData = new FormData();
        formData.append('timestamp', timestamp);
        formData.append('group', selectedGroup);
        formData.append('rating', selectedRating);
        formData.append('comment', commentValue);

        console.log("Attempting to submit:", { timestamp, group: selectedGroup, rating: selectedRating, comment: commentValue });
        isSubmitting = true;
        loadingIndicator.style.display = 'block';
        feedbackRatingButtons.forEach(btn => btn.disabled = true);
        allGroupButtons.forEach(btn => btn.style.pointerEvents = 'none');
        console.log("Rating and Group buttons disabled for submission.");

        console.log(`%cInitiating fetch to: ${googleAppsScriptUrl}`, 'color: purple;');

        fetch(googleAppsScriptUrl, { method: 'POST', body: formData })
            .then(response => {
                console.log(`%cFetch response received. Status: ${response.status}, OK: ${response.ok}`, 'color: purple;');
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error("%cFetch error response body:", 'color: red;', text);
                        throw new Error(`Fehler beim Senden (${response.status})`);
                    });
                }
                console.log("%cFetch response OK...", 'color: purple;');
                return response.text();
            })
            .then(data => {
                console.log('%cSubmit Success! Response Data:', 'color: green; font-weight: bold;', data);

                // Stop previous rating sound BEFORE playing 'sent'
                if (lastPlayedRatingSound && !lastPlayedRatingSound.paused) {
                    console.log("Stopping previous rating sound before playing 'sent'.");
                    lastPlayedRatingSound.pause();
                    lastPlayedRatingSound.currentTime = 0;
                }
                lastPlayedRatingSound = null;

                // Play 'sent.wav' sound
                playSound('sent');

                // Show Danke screen
                console.log('%c>>> BEFORE showScreen <<<', 'color: blue;');
                showScreen(thankYouScreen);
                console.log('%c<<< AFTER showScreen >>>', 'color: blue;');

                // Set timeout to reset the app
                console.log(`%cSetting timeout (${thankYouDuration}ms) for resetApp...`, 'color: green;');
                let timeoutId = setTimeout(() => {
                    console.log(`%cTimeout finished, calling resetApp. ID: ${timeoutId}`, 'color: blue;');
                    resetApp();
                }, thankYouDuration);
                console.log(`%cTimeout ID: ${timeoutId}`, 'color: blue;');
            })
            .catch((error) => {
                console.error('%cError in submitFeedback fetch/then chain:', 'color: red;', error);
                // --- STRICTLY use commentError paragraph for feedback ---
                if (commentError) {
                    // Use a generic message for fetch errors, or the specific one if available
                    commentError.textContent = error.message || 'Ein Fehler ist beim Senden aufgetreten. Bitte versuchen Sie es erneut.';
                } else {
                    console.error("Cannot display fetch error message to user: #comment-error element not found.");
                }
                // alert(error.message || 'Ein Fehler ist beim Senden aufgetreten. Bitte versuchen Sie es erneut.'); // <-- Double-check: DEFINITELY COMMENTED OUT/REMOVED
                // ---

                isSubmitting = false;
                loadingIndicator.style.display = 'none';
                feedbackRatingButtons.forEach(btn => btn.disabled = false);
                allGroupButtons.forEach(btn => btn.style.pointerEvents = 'auto');
                lastPlayedRatingSound = null;
                console.log("%cSubmit failed. UI reset (including group buttons).", 'color: red;');
            });
    }


    // --- EVENT LISTENER ATTACHMENT ---
    console.log("Attaching event listeners...");

    // Listener for ALL group buttons
    console.log("--- Attaching Group Button Listeners ---");
    if (allGroupButtons && allGroupButtons.length > 0) {
        allGroupButtons.forEach((button, index) => {
            const groupName = button.dataset.group;
            console.log(`Processing group button ${index}: ${groupName}.`);
            if (!button) { console.error(`Group button index ${index} invalid!`); return; }
            if (!groupName) { console.warn(`Button index ${index} is missing data-group attribute!`); return; }

            button.addEventListener('click', (event) => {
                console.log(`%c>>> GROUP CLICK HANDLER FIRED! Group: ${groupName} <<<`, "background: orange; color: black;");
                const clickedButton = event.currentTarget;
                const group = groupName;

                if (isSubmitting) { console.log("Exit: isSubmitting."); return; }

                const wasSelected = clickedButton.classList.contains('selected');
                console.log(`Was selected? ${wasSelected}`);

                if (wasSelected) {
                    console.log("%c>> DESELECT Path <<", "color:red;");
                    deselectAllGroups();
                } else {
                    console.log(">> SELECT/SWITCH Path <<");
                    selectedGroup = group;

                    if (group !== 'Lehrer') {
                        playSound(group);
                    } else {
                        console.log("Skipped playing sound for 'Lehrer'.");
                    }

                    feedbackScreen.classList.add('group-selected');
                    console.log(`Added 'group-selected' class to #feedback-section.`);

                    allGroupButtons.forEach(btn => {
                        if (btn === clickedButton) {
                            btn.classList.add('selected');
                            console.log(`Added 'selected' to CLICKED: ${btn.dataset.group}`);
                        } else {
                            btn.classList.remove('selected');
                        }
                    });
                }
                console.log(`New state: selectedGroup = ${selectedGroup}`);
            });
            console.log(`Listener attached to group button ${index} (${groupName}).`);
        });
        console.log("--- Finished attaching Group Button Listeners ---");
    } else { console.error("--- Could not attach group listeners - NodeList empty or buttons lack .group-button class. ---"); }


    // Listener for Feedback rating circles
    console.log("--- Attaching Rating Button Listeners ---");
    if (feedbackRatingButtons && feedbackRatingButtons.length > 0) {
        feedbackRatingButtons.forEach((button, index) => {
            const ratingValue = button.dataset.rating;
            console.log(`Processing rating button ${index}: Rating ${ratingValue}.`);
            if (!button) { console.error(`Rating button ${index} invalid!`); return; }

            button.addEventListener('click', (event) => {
                console.log(`%c>>> RATING CLICK HANDLER FIRED! Rating: ${ratingValue} <<<`, "background: lime; color: black;");
                const currentRating = ratingValue;
                const currentComment = commentInput.value.trim();

                if(commentError) commentError.textContent = ''; // Clear previous errors first

                if (isSubmitting) { console.log("Rating click ignored: isSubmitting."); return; }

                // --- Group Selection Check (Strictly NO alert) ---
                if (!selectedGroup) {
                    console.log("Rating click prevented: No group selected.");
                    if (commentError) {
                        commentError.textContent = 'Wähle zuerst deine Klasse'; // <-- UPDATED MESSAGE
                    } else {
                        console.error("Cannot display group selection error: #comment-error element not found.");
                    }
                    // alert('Bitte wähle zuerst deine Gruppe!'); // <-- DEFINITELY REMOVED
                    return; // Stop processing
                 }
                 // ---

                // --- Comment Validation Check (Strictly NO alert) ---
                if (currentRating === "3" && currentComment.length < commentRequiredLength) {
                    console.warn(`Validation failed: Rating 3, comment length ${currentComment.length}. Required: ${commentRequiredLength}`);
                    if (commentError) {
                        commentError.textContent = `Bei roter Bewertung ist ein Kommentar (mind. ${commentRequiredLength} Zeichen) erforderlich.`;
                    } else {
                        console.error("Cannot display comment validation error: #comment-error element not found.");
                    }
                    // alert(`Kommentar (mind. ${commentRequiredLength} Zeichen) für rot nötig.`); // <-- DEFINITELY REMOVED
                    commentInput.focus();
                    playSound('error');
                    return; // Stop processing
                }
                // ---

                // Play sound for the rating CLICK
                let soundKeyToPlay = `rating-${currentRating}`;
                if (currentRating === "3") {
                     soundKeyToPlay = 'rating-3-success';
                }
                lastPlayedRatingSound = playSound(soundKeyToPlay);

                // Set selected rating state
                selectedRating = currentRating;
                console.log('Rating variable set to:', selectedRating);

                // Call submit function
                console.log(">>> Calling submitFeedback() from rating click handler <<<");
                submitFeedback();
            });
            console.log(`Listener attached to rating button ${index}.`);
        });
         console.log("--- Finished attaching Rating Button Listeners ---");
    } else { console.error("--- Could not attach rating listeners - NodeList empty. ---"); }


    // --- Initial Setup ---
    console.log("Running Initial Setup checks...");
     deselectAllGroups();
     console.log("Initial group selection state cleaned.");
     thankYouScreen.classList.remove('active');
     feedbackScreen.classList.add('active');
     loadingIndicator.style.display = 'none';
     allGroupButtons.forEach(btn => btn.style.pointerEvents = 'auto');
     lastPlayedRatingSound = null;
     console.log("--- App Initialized ---");

});

console.log("--- script.js finished loading (sync part) ---");