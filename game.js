// Prevent page refresh on mobile (pull-to-refresh)
if ('ontouchstart' in window || navigator.maxTouchPoints) {
    window.addEventListener('touchmove', function(event) {
        event.preventDefault(); // Disable pull-to-refresh behavior
    }, { passive: false });
}

// Game setup
const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

// Set base grid size (normal size without scaling)
const baseGridSize = 20;

// Define initial game speed (in milliseconds)
const initialGameSpeed = 150; // Initial speed for the game loop
let gameSpeed = initialGameSpeed; // Initial game speed

// Calculate canvas size based on screen size
const calculateCanvasSize = () => {
    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.5;
    
    // Set canvas size with a maximum limit, maintaining the square aspect ratio
    const canvasSize = Math.min(maxWidth, maxHeight);
    
    // Set the canvas width and height
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Adjust grid size based on the canvas size
    return Math.floor(canvasSize / 20);
};

let gridSize = calculateCanvasSize();  // Initial grid size calculation based on screen

let score = 1;
let gameOver = false;  // Flag to check if the game is over
let gameStarted = false;  // Add this line
let gameLoopID = null;    // Add this line to track the game loop

// Snake initial position and body (start slightly above the bottom)
let snake = [{ 
  x: Math.floor(canvas.width / 2 / gridSize) * gridSize, 
  y: Math.floor(canvas.height * 0.7 / gridSize) * gridSize // Start 70% down the canvas
}];
let direction = { x: 0, y: -gridSize };  // Initial movement direction is UP

// Food position
let food = { x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize, y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize };

// Load the snake and food images
const snakeImage = new Image();
snakeImage.src = "snake.png";

// Single food image
const foodImage = new Image();
foodImage.src = "food.png";

// Variables for touch tracking
let touchX = 0;
let touchY = 0;

// Touch control variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Sound effects setup
const sounds = {
    eat: new Audio('eat.mp3'),
    gameOver: new Audio('gameover.mp3'),
    background: new Audio('background.mp3')
};

// Set volume for each sound
sounds.eat.volume = 0.3;
sounds.gameOver.volume = 0.4;
sounds.background.volume = 0.2;

// Loop background music
sounds.background.loop = true;

// Function to play sounds
function playSound(soundName) {
    try {
        sounds[soundName].currentTime = 0; // Reset sound to start
        sounds[soundName].play();
    } catch (error) {
        console.log("Error playing sound:", error);
    }
}

// Move the game loop initialization to a start game function
function startGame() {
    // Reset game state
    gameOver = false;
    gameStarted = true;
    score = 1;
    
    // Reset snake position
    snake = [{ 
        x: Math.floor(canvas.width / 2 / gridSize) * gridSize, 
        y: Math.floor(canvas.height * 0.7 / gridSize) * gridSize
    }];
    direction = { x: 0, y: -gridSize };
    
    // Generate initial food
    generateNewFood();
    
    // Clear any existing game loop
    if (gameLoopID) {
        clearTimeout(gameLoopID);
    }
    
    // Draw initial state
    draw();
    
    // Start the game loop
    gameLoop();
    
    // Update display
    document.getElementById("controls-message").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
    document.getElementById("game-container").style.display = "block";
}

// Update the start button event listener
document.getElementById("start-game-button").addEventListener("click", function() {
    playSound('background');
    startGame();
});

// Remove any automatic game start calls
// Make sure these lines are not present outside of startGame:
// generateFood();
// gameLoop();

// Game functions
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Make sure snake exists before drawing
    if (snake && snake.length > 0) {
        // Draw the snake
        for (let i = 0; i < snake.length; i++) {
            ctx.drawImage(snakeImage, snake[i].x, snake[i].y, gridSize, gridSize);
        }
    }

    // Draw food if it exists
    if (food) {
        ctx.drawImage(foodImage, food.x, food.y, gridSize, gridSize);
    }

    // Update score
    document.getElementById("score").textContent = `Perv points: ${score}`;
}

function moveSnake() {
    if (gameOver || !gameStarted) return;

    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check for collision with walls
    if (head.x < 0 || head.x + gridSize > canvas.width || head.y < 0 || head.y + gridSize > canvas.height) {
        endGame();
        return;
    }

    // Check for collision with itself
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Check if the snake has eaten the food
    if (head.x === food.x && head.y === food.y) {
        score += 1;
        playSound('eat');
        
        // Animate score
        const scoreContainer = document.getElementById("score-container");
        scoreContainer.classList.remove('score-pop');
        void scoreContainer.offsetWidth;
        scoreContainer.classList.add('score-pop');
        
        // Generate new food
        generateNewFood();
    } else {
        snake.pop();
    }
}

// Separate function for generating new food
function generateNewFood() {
    const maxX = Math.floor((canvas.width - gridSize) / gridSize);
    const maxY = Math.floor((canvas.height - gridSize) / gridSize);
    
    let newFood;
    let validPosition = false;
    
    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * maxX) * gridSize,
            y: Math.floor(Math.random() * maxY) * gridSize
        };
        
        validPosition = true;
        
        // Check if new food position overlaps with snake
        for (let segment of snake) {
            if (newFood.x === segment.x && newFood.y === segment.y) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            food = newFood;
            break;
        }
    }
}

function endGame() {
  if (gameOver) return;
  
  gameOver = true;
  gameStarted = false;
  
  // Clear any existing game loop immediately
  if (gameLoopID) {
    clearTimeout(gameLoopID);
    gameLoopID = null;
  }
  
  // Stop and reset sounds
  sounds.background.pause();
  sounds.background.currentTime = 0;
  playSound('gameOver');
  
  // Show game over screen
  const gameOverContainer = document.getElementById("game-over-container");
  if (gameOverContainer) {
    gameOverContainer.style.display = "block";
  }
}

// Add touch event listeners
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, false);

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
}, false);

// Handle swipe direction
function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Minimum swipe distance (in pixels)
    const minSwipeDistance = 30;
    
    // Determine swipe direction based on which delta is larger
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && direction.x === 0) {
                direction = { x: gridSize, y: 0 }; // Right
            } else if (deltaX < 0 && direction.x === 0) {
                direction = { x: -gridSize, y: 0 }; // Left
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && direction.y === 0) {
                direction = { x: 0, y: gridSize }; // Down
            } else if (deltaY < 0 && direction.y === 0) {
                direction = { x: 0, y: -gridSize }; // Up
            }
        }
    }
}

// Prevent default touch behavior to avoid scrolling
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Reset the game
function resetGame() {
    // Stop any existing game loop
    if (gameLoopID) {
        clearTimeout(gameLoopID);
    }
    
    // Reset and start a new game
    startGame();
    
    // Restart background music
    sounds.background.currentTime = 0;
    sounds.background.play();
}

// Game loop function
function gameLoop() {
    if (!gameOver && gameStarted) {
        moveSnake();
        draw();
        gameLoopID = setTimeout(gameLoop, gameSpeed);
    }
}

// Add this to ensure that the game starts properly when the window is resized
window.addEventListener('resize', () => {
  gridSize = calculateCanvasSize(); // Recalculate grid size on resize
  // Ensure snake and food positions are updated with new grid size
  snake = snake.map(segment => ({
    x: Math.floor(segment.x / gridSize) * gridSize,
    y: Math.floor(segment.y / gridSize) * gridSize
  }));
  food = {
    x: Math.floor(food.x / gridSize) * gridSize,
    y: Math.floor(food.y / gridSize) * gridSize
  };
});

// Ensure the "Play Again" button calls the resetGame function
document.getElementById("reset-button").onclick = resetGame; // Add an event listener to the button

// ... existing code ...

// Add keyboard controls
document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'ArrowUp':
            if (direction.y === 0) { // Prevent moving directly opposite to current direction
                direction = { x: 0, y: -gridSize };
            }
            break;
        case 'ArrowDown':
            if (direction.y === 0) {
                direction = { x: 0, y: gridSize };
            }
            break;
        case 'ArrowLeft':
            if (direction.x === 0) {
                direction = { x: -gridSize, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (direction.x === 0) {
                direction = { x: gridSize, y: 0 };
            }
            break;
    }
});
