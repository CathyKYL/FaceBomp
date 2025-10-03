// Shiba Bonk Game JavaScript
// This file contains all the game logic for the Whack-A-Mole style game

// Firebase Configuration and Initialization
// This connects our app to the Firebase Realtime Database
const firebaseConfig = {
    databaseURL: "https://facebomp-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase - this sets up the connection to our database
firebase.initializeApp(firebaseConfig);
const database = firebase.database(); // Get reference to the database

// Game state variables
let gameActive = false;           // Tracks if the game is currently running
let score = 0;                   // Player's current score
let timeLeft = 30;               // Time remaining in seconds
let gameTimer = null;            // Reference to the countdown timer
let faceTimer = null;            // Reference to the face appearance timer
let currentActiveFace = null;    // Currently visible face (null if none)
let currentView = 'game';        // Tracks current view: 'game' or 'leaderboard'
let selectedShibaImage = 'image/Shiba7.jpeg'; // Currently selected Shiba image (default is Shiba7)

// DOM element references - getting all the HTML elements we need to interact with
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const finalMessage = document.getElementById('final-message');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
// New elements for Firebase and leaderboard features
const leaderboardButton = document.getElementById('leaderboard-button');
const scorePopup = document.getElementById('score-popup');
const popupScore = document.getElementById('popup-score');
const playerNameInput = document.getElementById('player-name');
const submitScoreButton = document.getElementById('submit-score');
const skipSubmissionButton = document.getElementById('skip-submission');
const leaderboardView = document.getElementById('leaderboard-view');
const leaderboardList = document.getElementById('leaderboard-list');
const backToGameButton = document.getElementById('back-to-game');

// New elements for Shiba selection feature
const pickShibaButton = document.getElementById('pick-shiba-button');
const shibaModal = document.getElementById('shiba-modal');
const closeShibaModal = document.getElementById('close-shiba-modal');
// Audio element references
const whackSound = document.getElementById('whack-sound');
const gameEndSound = document.getElementById('game-end-sound');

// Get all hole elements and their face images
const holes = document.querySelectorAll('.hole');
const faceImages = document.querySelectorAll('.face-image');

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Shiba Bonk game loaded!');
    
    // Add click event listeners to all holes
    holes.forEach((hole, index) => {
        hole.addEventListener('click', function() {
            handleHoleClick(index);
        });
    });
    
    // Add click event listener to start/restart button
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Add event listeners for new Firebase and leaderboard features
    leaderboardButton.addEventListener('click', showLeaderboard);
    submitScoreButton.addEventListener('click', submitScore);
    skipSubmissionButton.addEventListener('click', hideScorePopup);
    backToGameButton.addEventListener('click', showGame);
    
    // Add event listeners for Shiba selection features
    pickShibaButton.addEventListener('click', showShibaModal);
    closeShibaModal.addEventListener('click', hideShibaModal);
    
    // Allow Enter key to submit score
    playerNameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            submitScore();
        }
    });
    
    // Close modal when clicking outside
    shibaModal.addEventListener('click', function(event) {
        if (event.target === shibaModal) {
            hideShibaModal();
        }
    });
    
    // Add keyboard support for Shiba selection
    document.addEventListener('keydown', function(event) {
        if (shibaModal.style.display === 'flex') {
            if (event.key === 'Escape') {
                hideShibaModal();
            }
        }
    });
    
    // Initially hide the final message and popup
    finalMessage.style.display = 'none';
    scorePopup.style.display = 'none';
    leaderboardView.style.display = 'none';
    shibaModal.style.display = 'none';
    
    // Initialize all face images with the default Shiba
    updateAllFaceImages(selectedShibaImage);
});

/**
 * Starts a new game
 * Resets all game variables and begins the countdown timer
 */
function startGame() {
    console.log('Starting new game...');
    
    // Reset game state
    gameActive = true;
    score = 0;
    timeLeft = 30;
    
    // Update display elements
    updateScore();
    updateTimer();
    
    // Hide final message and show game elements
    finalMessage.style.display = 'none';
    startButton.textContent = 'Game Running...';
    startButton.disabled = true;
    
    // Hide any currently visible faces
    hideAllFaces();
    
    // Start the countdown timer
    startCountdown();
    
    // Start showing faces at random intervals
    scheduleNextFace();
}

/**
 * Handles the countdown timer
 * Decreases timeLeft every second and updates the display
 */
function startCountdown() {
    gameTimer = setInterval(function() {
        timeLeft--;
        updateTimer();
        
        // Check if time is up
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000); // Run every 1000ms (1 second)
}

/**
 * Updates the timer display on the page
 */
function updateTimer() {
    timerDisplay.textContent = timeLeft;
}

/**
 * Updates the score display on the page
 */
function updateScore() {
    scoreDisplay.textContent = score;
}

/**
 * Schedules the next face to appear at a random interval
 * This creates the unpredictable timing of face appearances
 */
function scheduleNextFace() {
    if (!gameActive) return; // Don't schedule if game is over
    
    // Random interval between 500ms and 2000ms (0.5 to 2 seconds)
    const randomDelay = Math.random() * 1500 + 500;
    
    faceTimer = setTimeout(function() {
        if (gameActive) {
            showRandomFace();
            scheduleNextFace(); // Schedule the next one
        }
    }, randomDelay);
}

/**
 * Shows a face in a random hole
 * Only shows one face at a time
 */
function showRandomFace() {
    if (!gameActive) return;
    
    // Hide any currently visible face first
    hideAllFaces();
    
    // Pick a random hole (0 to 5)
    const randomHoleIndex = Math.floor(Math.random() * holes.length);
    const faceImage = faceImages[randomHoleIndex];
    
    // Show the face with pop-in animation
    faceImage.style.display = 'block';
    faceImage.classList.remove('pop-out');
    faceImage.classList.add('pop-in');
    
    // Remember which face is currently active
    currentActiveFace = randomHoleIndex;
    
    // Auto-hide the face after 1.5 seconds if not clicked
    setTimeout(function() {
        if (currentActiveFace === randomHoleIndex) {
            hideFace(randomHoleIndex);
        }
    }, 1500);
}

/**
 * Hides a specific face with pop-out animation
 * @param {number} holeIndex - The index of the hole to hide the face in
 */
function hideFace(holeIndex) {
    const faceImage = faceImages[holeIndex];
    
    if (faceImage.style.display !== 'none') {
        faceImage.classList.remove('pop-in');
        faceImage.classList.add('pop-out');
        
        // Hide the image after animation completes
        setTimeout(function() {
            faceImage.style.display = 'none';
            faceImage.classList.remove('pop-out');
        }, 300); // Match the CSS animation duration
    }
    
    // Clear the current active face if this was it
    if (currentActiveFace === holeIndex) {
        currentActiveFace = null;
    }
}

/**
 * Hides all faces immediately
 * Used when starting a new game or ending the current game
 */
function hideAllFaces() {
    faceImages.forEach(function(faceImage, index) {
        faceImage.style.display = 'none';
        faceImage.classList.remove('pop-in', 'pop-out');
    });
    currentActiveFace = null;
}

/**
 * Handles when a player clicks on a hole
 * @param {number} holeIndex - The index of the clicked hole
 */
function handleHoleClick(holeIndex) {
    if (!gameActive) return; // Don't respond if game isn't running
    
    const faceImage = faceImages[holeIndex];
    
    // Check if there's a face in this hole
    if (faceImage.style.display !== 'none' && currentActiveFace === holeIndex) {
        // Player hit the face! Increase score
        score++;
        updateScore();
        
        // Play whack sound effect
        playWhackSound();
        
        // Apply whack effect to the image
        applyWhackEffect(faceImage);
        
        // Hide the face after whack effect
        setTimeout(function() {
            hideFace(holeIndex);
        }, 200); // Delay to show the whack effect
        
        console.log('Face hit! Score:', score);
    }
}

/**
 * Applies a visual "whack" effect to a face image
 * @param {HTMLElement} faceImage - The image element to apply the effect to
 */
function applyWhackEffect(faceImage) {
    // Add whack effect classes
    faceImage.classList.add('whacked');
    
    // Apply immediate visual changes
    faceImage.style.transform = 'scale(1.3) rotate(15deg)';
    faceImage.style.filter = 'brightness(1.5) contrast(1.2)';
    faceImage.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.8)';
    
    // Reset the effect after animation
    setTimeout(function() {
        faceImage.style.transform = 'scale(1) rotate(0deg)';
        faceImage.style.filter = 'brightness(1) contrast(1)';
        faceImage.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        faceImage.classList.remove('whacked');
    }, 200);
}

/**
 * Ends the current game
 * Stops all timers and shows the final results
 */
function endGame() {
    console.log('Game ended! Final score:', score);
    
    // Stop the game
    gameActive = false;
    
    // Clear all timers
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    if (faceTimer) {
        clearTimeout(faceTimer);
        faceTimer = null;
    }
    
    // Hide all faces
    hideAllFaces();
    
    // Play game end sound
    playGameEndSound();
    
    // Show final message with witty comment
    showFinalMessage();
    
    // Show score submission popup after a short delay
    setTimeout(function() {
        showScorePopup();
    }, 2000); // Wait 2 seconds after game ends
    
    // Reset the start button
    startButton.textContent = 'Start Game';
    startButton.disabled = false;
}

/**
 * Shows the final game results with a witty message based on score
 */
function showFinalMessage() {
    // Update the final score display
    finalScore.textContent = score;
    
    // Generate a witty message based on the score
    let wittyMessage = '';
    
    if (score === 0) {
        wittyMessage = "Ouch! Maybe try opening your eyes next time? 😅";
    } else if (score <= 5) {
        wittyMessage = "Not bad for a beginner! Keep practicing! 🎯";
    } else if (score <= 10) {
        wittyMessage = "Pretty good! You're getting the hang of it! 👍";
    } else if (score <= 15) {
        wittyMessage = "Excellent work! You've got some serious skills! 🏆";
    } else if (score <= 20) {
        wittyMessage = "Wow! You're a Shiba Bonk master! Incredible! 🌟";
    } else {
        wittyMessage = "LEGENDARY! You're the Shiba Bonk champion! 🥇👑";
    }
    
    // Update the final message (we'll need to add this element to HTML)
    const messageElement = finalMessage.querySelector('p:last-of-type');
    if (messageElement) {
        messageElement.textContent = wittyMessage;
    }
    
    // Show the final message
    finalMessage.style.display = 'block';
}

// Optional: Add keyboard support for accessibility
document.addEventListener('keydown', function(event) {
    // Press spacebar to start/restart game
    if (event.code === 'Space' && !gameActive) {
        event.preventDefault();
        startGame();
    }
});

/**
 * Plays the whack sound effect when hitting a face
 */
function playWhackSound() {
    if (whackSound) {
        whackSound.currentTime = 0; // Reset to beginning
        whackSound.play().catch(function(error) {
            console.log('Could not play whack sound:', error);
        });
    }
}

/**
 * Plays the game end sound effect (clapping/cheering)
 */
function playGameEndSound() {
    if (gameEndSound) {
        gameEndSound.currentTime = 0; // Reset to beginning
        gameEndSound.play().catch(function(error) {
            console.log('Could not play game end sound:', error);
        });
    }
}

// ========================================
// FIREBASE AND LEADERBOARD FUNCTIONS
// ========================================

/**
 * Shows the score submission popup after game ends
 * This asks the player if they want to save their score to the leaderboard
 */
function showScorePopup() {
    // Update the popup with the current score
    popupScore.textContent = score;
    
    // Clear the name input field
    playerNameInput.value = '';
    
    // Show the popup
    scorePopup.style.display = 'flex';
    
    // Focus on the name input for better user experience
    setTimeout(function() {
        playerNameInput.focus();
    }, 100);
}

/**
 * Hides the score submission popup
 * Called when player clicks "Skip" or after successful submission
 */
function hideScorePopup() {
    scorePopup.style.display = 'none';
}

/**
 * Submits the player's score to Firebase
 * Handles duplicate names by only updating if new score is higher
 */
function submitScore() {
    const playerName = playerNameInput.value.trim();
    
    // Validate that a name was entered
    if (!playerName) {
        alert('Please enter your name!');
        playerNameInput.focus();
        return;
    }
    
    // Disable the submit button to prevent double submissions
    submitScoreButton.disabled = true;
    submitScoreButton.textContent = 'Submitting...';
    
    // Check if this name already exists in the database
    const scoresRef = database.ref('scores');
    
    // Query the database to find if this name already exists
    scoresRef.orderByChild('name').equalTo(playerName).once('value')
        .then(function(snapshot) {
            if (snapshot.exists()) {
                // Name exists, check if new score is higher
                const existingData = snapshot.val();
                const existingScore = Object.values(existingData)[0].score;
                
                if (score > existingScore) {
                    // New score is higher, update it
                    const key = Object.keys(existingData)[0];
                    return scoresRef.child(key).update({
                        name: playerName,
                        score: score,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });
                } else {
                    // New score is not higher, don't update
                    console.log('Score not updated - existing score is higher');
                    return Promise.resolve();
                }
            } else {
                // Name doesn't exist, add new entry
                return scoresRef.push({
                    name: playerName,
                    score: score,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
        })
        .then(function() {
            // Success! Hide the popup and show success message
            hideScorePopup();
            alert('Score saved successfully! 🎉');
        })
        .catch(function(error) {
            // Handle any errors
            console.error('Error saving score:', error);
            alert('Sorry, there was an error saving your score. Please try again.');
        })
        .finally(function() {
            // Re-enable the submit button
            submitScoreButton.disabled = false;
            submitScoreButton.textContent = 'Submit';
        });
}

/**
 * Shows the leaderboard view
 * Fetches and displays all scores from Firebase
 */
function showLeaderboard() {
    // Switch to leaderboard view
    currentView = 'leaderboard';
    
    // Hide game elements and show leaderboard
    document.querySelector('.game-info').style.display = 'none';
    document.querySelector('.game-board').style.display = 'none';
    finalMessage.style.display = 'none';
    leaderboardView.style.display = 'block';
    
    // Load and display the leaderboard
    loadLeaderboard();
}

/**
 * Shows the game view (hides leaderboard)
 */
function showGame() {
    // Switch to game view
    currentView = 'game';
    
    // Show game elements and hide leaderboard
    document.querySelector('.game-info').style.display = 'flex';
    document.querySelector('.game-board').style.display = 'grid';
    leaderboardView.style.display = 'none';
}

/**
 * Loads scores from Firebase and displays them in the leaderboard
 * Sorts scores from highest to lowest
 */
function loadLeaderboard() {
    // Show loading message
    leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px; color: #EFC482;">Loading leaderboard...</div>';
    
    // Get reference to the scores in the database
    const scoresRef = database.ref('scores');
    
    // Fetch all scores from Firebase
    scoresRef.once('value')
        .then(function(snapshot) {
            const scores = [];
            
            // Convert Firebase data to an array
            if (snapshot.exists()) {
                snapshot.forEach(function(childSnapshot) {
                    const data = childSnapshot.val();
                    scores.push({
                        name: data.name,
                        score: data.score,
                        timestamp: data.timestamp
                    });
                });
            }
            
            // Sort scores from highest to lowest
            scores.sort(function(a, b) {
                return b.score - a.score;
            });
            
            // Display the leaderboard
            displayLeaderboard(scores);
        })
        .catch(function(error) {
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b;">Error loading leaderboard. Please try again.</div>';
        });
}

/**
 * Displays the leaderboard entries in the HTML
 * @param {Array} scores - Array of score objects sorted by score (highest first)
 */
function displayLeaderboard(scores) {
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px; color: #EFC482;">No scores yet! Be the first to play!</div>';
        return;
    }
    
    let html = '';
    
    // Create HTML for each leaderboard entry
    scores.forEach(function(scoreData, index) {
        const rank = index + 1;
        let rankClass = '';
        
        // Add special styling for top 3 players
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        html += `
            <div class="leaderboard-entry ${rankClass}">
                <div class="rank-number">#${rank}</div>
                <div class="player-name">${scoreData.name}</div>
                <div class="player-score">${scoreData.score}</div>
            </div>
        `;
    });
    
    // Update the leaderboard HTML
    leaderboardList.innerHTML = html;
}

// ========================================
// SHIBA SELECTION FUNCTIONS
// ========================================

/**
 * Shows the Shiba selection modal
 * Displays all 7 available Shiba Inu images
 */
function showShibaModal() {
    shibaModal.style.display = 'flex';
    
    // Add click event listeners to all Shiba options (only if not already added)
    const shibaOptions = document.querySelectorAll('.shiba-option');
    shibaOptions.forEach(function(option) {
        // Remove existing listener to prevent duplicates
        option.removeEventListener('click', handleShibaOptionClick);
        // Add new listener
        option.addEventListener('click', handleShibaOptionClick);
    });
}

/**
 * Handles Shiba option click events
 * @param {Event} event - The click event
 */
function handleShibaOptionClick(event) {
    const shibaImage = event.currentTarget.dataset.shiba;
    selectShibaImage(shibaImage);
}

/**
 * Hides the Shiba selection modal
 */
function hideShibaModal() {
    shibaModal.style.display = 'none';
}

/**
 * Selects a Shiba image and updates all face images in the game
 * @param {string} shibaImage - The filename of the selected Shiba image
 */
function selectShibaImage(shibaImage) {
    // Update the selected Shiba image
    selectedShibaImage = 'image/' + shibaImage;
    
    // Update all face images in the game to use the new Shiba
    updateAllFaceImages(selectedShibaImage);
    
    // Update the visual selection in the modal
    const shibaOptions = document.querySelectorAll('.shiba-option');
    shibaOptions.forEach(function(option) {
        option.classList.remove('selected');
        if (option.dataset.shiba === shibaImage) {
            option.classList.add('selected');
        }
    });
    
    // Hide the modal
    hideShibaModal();
    
    console.log('Shiba image selected:', selectedShibaImage);
}

/**
 * Updates all face images in the game to use the selected Shiba image
 * @param {string} imageUrl - The URL of the Shiba image to use
 */
function updateAllFaceImages(imageUrl) {
    faceImages.forEach(function(faceImage) {
        // Add error handling for image loading
        faceImage.onerror = function() {
            console.error('Failed to load Shiba image:', imageUrl);
            // Fallback to default Shiba
            faceImage.src = 'image/Shiba7.jpeg';
        };
        faceImage.src = imageUrl;
    });
}
