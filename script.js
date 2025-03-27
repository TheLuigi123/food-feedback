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
    // Ensure these filenames exactly match your files in the same folder as index.html
    const sounds = {
        '1-4 Klasse': new Audio('1-4_klasse.wav'),
        '5-8 Klasse': new Audio('5-8_klasse.mp3'),
        '9-12 Klasse': new Audio('9-12_klasse.wav'),
        'Lehrer': new Audio('lehrer.mp3'),
        'rating-1': new Audio('green.mp3'),        // Green clicked
        'rating-2': new Audio('okay.mp3'),         // Yellow/Okay clicked
        'rating-3-success': new Audio('red.mp3'),  // Red clicked AND VALIDATION PASSED
        'sent': new Audio('sent.wav'),             // Submission successful (before DANKE)
        'error': new Audio('error.wav')            // Validation Error
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
    console.log("Selecting group buttons...");
    const allGroupButtons = feedbackScreen.querySelectorAll('.group-button');
    console.log(`allGroupButtons Count: ${allGroupButtons.length}`);
    console.log("Selecting rating buttons...");
    const feedbackRatingButtons = feedbackScreen.querySelectorAll('.feedback-options .feedback-button');
    console.log(`feedbackRatingButtons Count: ${feedbackRatingButtons.length}`);
    const loadingIndicator = document.getElementById('loading-indicator');
    const commentInput = document.getElementById('comment');
    const commentError = document.getElementById('comment-error');
    if (allGroupButtons.length === 0) { console.error("CRITICAL STOP: 0 group buttons found."); return; }
    if (feedbackRatingButtons.length === 0) { console.error("CRITICAL STOP: 0 rating buttons found."); return; }
    if (!commentError) { console.warn("Warning: commentError element (#comment-error) not found."); }
    console.log("Essential elements selected.");

    // App State
    let selectedGroup = null;
    let selectedRating = null;
    let isSubmitting = false;
    console.log("Initial App State set.");

    // --- Functions ---

    function playSound(soundKey) {
        console.log(`Attempt play sound: ${soundKey}`);
        const audio = sounds[soundKey];
        if (audio) {
            audio.currentTime = 0; // Rewind
            audio.play().catch(error => {
                console.error(`Error playing "${soundKey}":`, error); // Log specific errors
            });
        } else {
            console.warn(`Sound key "${soundKey}" not found.`);
        }
    }

    function showScreen(screenToShow) {
        console.log(`%cExecuting showScreen for: ${screenToShow.id}`, 'background-color: yellow; color: black;');
        if(!feedbackScreen||!thankYouScreen){console.error("ShowScreen Error: elements missing!");return;}
        // Optional: Log styles before
        // try{const fb=window.getComputedStyle(feedbackScreen); const ty=window.getComputedStyle(thankYouScreen); console.log(`Styles BEFORE: FB display=${fb.display}; TY display=${ty.display}`);}catch(e){}
        feedbackScreen.classList.remove('active');
        screenToShow.classList.add('active');
        // Optional: Log styles after (in timeout)
        // setTimeout(()=>{try{const fb=window.getComputedStyle(feedbackScreen); const ty=window.getComputedStyle(thankYouScreen); console.log(`%cStyles AFTER: FB display=${fb.display}; TY display=${ty.display}`,'font-weight: bold;');}catch(e){}},0);
        console.log(`%cFB active?:${feedbackScreen.classList.contains('active')}; ${screenToShow.id} active?:${screenToShow.classList.contains('active')}`, 'background-color: yellow; color: black;');
    }

    function formatTimestamp(date) {
        try{const d=String(date.getDate()).padStart(2,'0');const m=String(date.getMonth()+1).padStart(2,'0');const y=String(date.getFullYear()).slice(-2);const h=String(date.getHours()).padStart(2,'0');const min=String(date.getMinutes()).padStart(2,'0');return `${d}/${m}/${y} ${h}:${min}`;}catch(e){console.error("Timestamp error:",e);return new Date().toISOString();}
    }

    function deselectAllGroups() {
        console.log("--- Running deselectAllGroups ---");
        const a=feedbackScreen.classList.contains('group-selected');selectedGroup=null;feedbackScreen.classList.remove('group-selected');allGroupButtons.forEach(b=>{b.classList.remove('selected')});console.log(`Removed 'group-selected' (was ${a}). Removed 'selected' from buttons.`);console.log("--- Finished deselectAllGroups ---");
    }

    function resetApp() {
        console.log("Starting resetApp...");
        isSubmitting=false;commentInput.value='';if(commentError) commentError.textContent='';deselectAllGroups();selectedRating=null;thankYouScreen.classList.remove('active');feedbackScreen.classList.add('active');console.log("Switched back to feedback screen.");loadingIndicator.style.display='none';feedbackRatingButtons.forEach(b=>b.disabled=false);console.log("Rating buttons re-enabled.");console.log("App Reset Finished.");
    }

    function submitFeedback() {
        console.log("--- submitFeedback function started ---");
        if(!selectedGroup || !selectedRating || isSubmitting) {
             console.log(`Submit prevented: group=${selectedGroup}, rating=${selectedRating}, submitting=${isSubmitting}`);
             return;
        }
        const timestamp=formatTimestamp(new Date());const commentValue=commentInput.value.trim();const formData=new FormData();formData.append('timestamp',timestamp);formData.append('group',selectedGroup);formData.append('rating',selectedRating);formData.append('comment',commentValue);console.log("Attempting to submit:",{timestamp,group:selectedGroup,rating:selectedRating,comment:commentValue});isSubmitting=true;console.log("Setting loadingIndicator display to 'block'");loadingIndicator.style.display='block';feedbackRatingButtons.forEach(btn=>btn.disabled=true);console.log("UI disabled for submission.");console.log(`%cInitiating fetch to: ${googleAppsScriptUrl}`,'color: purple;');
        fetch(googleAppsScriptUrl,{method:'POST',body:formData,})
            .then(response=>{console.log(`%cFetch response received. Status: ${response.status}, OK: ${response.ok}`,'color: purple;');if(!response.ok){return response.text().then(text=>{console.error("%cFetch error response body:",'color: red;',text);throw new Error(`Fehler (${response.status})`);});}console.log("%cFetch response OK...",'color: purple;');return response.text();})
            .then(data=>{console.log('%cSubmit Success! Data:','color: green; font-weight: bold;',data);console.log("Setting loadingIndicator display to 'none'");loadingIndicator.style.display='none';
                playSound('sent'); // Play sent sound
                console.log('%c>>> BEFORE showScreen <<<','color: blue;');showScreen(thankYouScreen);console.log('%c<<< AFTER showScreen >>>','color: blue;');console.log(`%cSetting timeout (${thankYouDuration}ms)...`,'color: green;');let timeoutId=setTimeout(()=>{console.log(`%cTimeout finished, calling resetApp. ID: ${timeoutId}`,'color: blue;');resetApp();},thankYouDuration);console.log(`%cTimeout ID: ${timeoutId}`,'color: blue;');
            })
            .catch((error)=>{console.error('%cError in submitFeedback:','color: red;',error);alert(error.message||'Fehler beim Senden.');isSubmitting=false;loadingIndicator.style.display='none';feedbackRatingButtons.forEach(btn=>btn.disabled=false);deselectAllGroups();console.log("%cSubmit failed. UI reset.",'color: red;');
            });
    }


    // --- EVENT LISTENER ATTACHMENT ---
    console.log("Attaching event listeners...");

    // Listener for ALL group buttons
    console.log("--- Attaching Group Button Listeners ---");
    if (allGroupButtons && allGroupButtons.length > 0) {
        allGroupButtons.forEach((button, index) => {
            const groupName = button.dataset.group || 'Teacher';
            console.log(`Processing group button ${index}: ${groupName}. Disabled? ${button.disabled}`);
            if (!button) { console.error(`Group button index ${index} invalid!`); return; }

            button.addEventListener('click', (event) => {
                console.log(`%c>>> GROUP CLICK HANDLER FIRED! Group: ${event.currentTarget.dataset.group || 'Teacher'} <<<`, "background: orange; color: black;");
                const clickedButton = event.currentTarget; const group = clickedButton.dataset.group;
                if (isSubmitting) { console.log("Exit: isSubmitting."); return; }
                const wasSelected = clickedButton.classList.contains('selected'); console.log(`Was selected? ${wasSelected}`);

                if (wasSelected) {
                    console.log("%c>> DESELECT Path <<", "color:red;");
                    deselectAllGroups();
                    // No sound on deselect
                } else {
                    console.log(">> SELECT/SWITCH Path <<");
                    selectedGroup = group;
                    playSound(group); // Play sound for newly selected group
                    if (!feedbackScreen.classList.contains('group-selected')){ feedbackScreen.classList.add('group-selected'); console.log(`Added 'group-selected'.`); }
                    allGroupButtons.forEach(btn => { if (btn === clickedButton) { if (!btn.classList.contains('selected')) { btn.classList.add('selected'); console.log(`Added 'selected' to CLICKED: ${btn.dataset.group || 'Teacher'}`); } } else { if (btn.classList.contains('selected')) { btn.classList.remove('selected'); console.log(`Removed 'selected' from OTHER: ${btn.dataset.group || 'Teacher'}`); } } });
                }
                console.log(`New state: ${selectedGroup}`);
            });
             console.log(`Listener attached to group button ${index}.`);
        });
        console.log("--- Finished attaching Group Button Listeners ---");
    } else { console.error("--- Could not attach group listeners - NodeList empty. ---"); }


    // Listener for Feedback rating circles
    console.log("--- Attaching Rating Button Listeners ---");
    if (feedbackRatingButtons && feedbackRatingButtons.length > 0) {
        feedbackRatingButtons.forEach((button, index) => {
            console.log(`Processing rating button ${index}: Rating ${button.dataset.rating}. Disabled? ${button.disabled}`);
            if (!button) {console.error(`Rating button ${index} invalid!`); return;}

            button.addEventListener('click', (event) => {
                console.log(`%c>>> RATING CLICK HANDLER FIRED! Rating: ${event.currentTarget.dataset.rating} <<<`, "background: lime; color: black;");
                const currentRating = event.currentTarget.dataset.rating;
                const currentComment = commentInput.value.trim();
                if(commentError) commentError.textContent = ''; // Clear error first
                if (isSubmitting) { console.log("Rating click ignored: isSubmitting."); return; }
                if (!selectedGroup) { alert('Bitte wähle zuerst deine Gruppe!'); console.log("Rating click prevented: No group selected."); return; }

                // Validation for red button
                if (currentRating === "3" && currentComment.length < commentRequiredLength) {
                    console.warn(`Validation failed: Rating 3, comment length ${currentComment.length}.`);
                    if(commentError) commentError.textContent = `Bitte schreibe einen Kommentar (mind. ${commentRequiredLength} Zeichen) bevor du rot drückst.`;
                    else alert(`Kommentar (mind. ${commentRequiredLength} Zeichen) für rot nötig.`);
                    commentInput.focus();
                    playSound('error'); // Play error sound
                    return; // Stop
                }

                // Play success sound (AFTER validation passed or wasn't needed)
                let soundKeyToPlay = `rating-${currentRating}`;
                if (currentRating === "3") {
                     soundKeyToPlay = 'rating-3-success'; // Use specific key for red success
                }
                playSound(soundKeyToPlay);

                // Proceed if validation passed
                selectedRating = currentRating;
                console.log('Rating variable set to:', selectedRating);
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
     console.log("Initial state classes cleaned using deselectAllGroups.");
     console.log("--- App Initialized ---");

});

console.log("--- script.js finished loading (sync part) ---");