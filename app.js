// Game State
let gameState = {
	isActive: false,
	isStarted: false,
	mode: 'time',
	duration: 60,
	wordCount: 25,
	currentWordIndex: 0,
	currentCharIndex: 0,
	correctChars: 0,
	incorrectChars: 0,
	startTime: null,
	endTime: null,
	words: [],
	userInput: '',
	errors: [],
	wpmHistory: [],
	rawWpmHistory: [],
	timerInterval: null,
}

// Word lists
const commonWords = [
	'the',
	'of',
	'and',
	'in',
	'is',
	'you',
	'that',
	'it',
	'he',
	'was',
	'for',
	'on',
	'are',
	'as',
	'with',
	'his',
	'they',
	'this',
	'have',
	'from',
	'one',
	'had',
	'by',
	'word',
	'but',
	'not',
	'what',
	'all',
	'were',
	'we',
	'when',
	'your',
	'can',
	'said',
	'there',
	'each',
	'which',
	'she',
	'do',
	'how',
	'their',
	'if',
	'will',
	'up',
	'other',
	'about',
	'out',
	'many',
	'then',
	'them',
	'these',
	'so',
	'some',
	'her',
	'would',
	'make',
	'like',
	'into',
	'him',
	'has',
	'two',
	'more',
	'very',
	'after',
	'words',
	'first',
	'where',
	'much',
	'us',
	'than',
	'now',
	'look',
	'only',
	'come',
	'its',
	'over',
	'think',
	'also',
	'back',
	'use',
	'good',
	'new',
	'write',
	'our',
	'me',
	'man',
	'too',
	'any',
	'day',
	'get',
	'before',
	'old',
	'see',
	'way',
	'who',
	'oil',
	'sit',
	'find',
	'long',
	'down',
	'did',
	'may',
	'part',
	'end',
	'why',
	'ask',
	'went',
	'men',
	'read',
	'need',
	'land',
	'different',
	'home',
	'move',
	'try',
	'kind',
	'hand',
	'picture',
	'again',
	'change',
	'off',
	'play',
	'spell',
	'air',
	'away',
	'animal',
	'house',
	'point',
	'page',
	'letter',
	'mother',
	'answer',
	'found',
	'study',
	'still',
	'learn',
	'should',
	'American',
	'world',
	'high',
	'every',
	'near',
	'add',
	'food',
	'between',
	'own',
	'below',
	'country',
	'plant',
	'last',
	'school',
	'father',
	'keep',
	'tree',
	'never',
	'start',
	'city',
	'earth',
	'eye',
]

// Initialize the application
function init() {
	setupEventListeners()
	showStartScreen()
}

function setupEventListeners() {
	// Mode selection
	document.querySelectorAll('.mode-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			document
				.querySelectorAll('.mode-btn')
				.forEach((b) => b.classList.remove('active', 'btn-primary'))
			e.target.classList.add('active', 'btn-primary')

			gameState.mode = e.target.dataset.mode
			if (gameState.mode === 'time') {
				gameState.duration = parseInt(e.target.dataset.value)
			} else {
				gameState.wordCount = parseInt(e.target.dataset.value)
			}
		})
	})

	// Restart button
	document.getElementById('restartBtn').addEventListener('click', restartTest)

	// Hidden input for typing
	const hiddenInput = document.getElementById('hiddenInput')
	hiddenInput.addEventListener('input', handleInput)
	hiddenInput.addEventListener('keydown', handleKeydown)

	// Focus management
	document.getElementById('typingArea').addEventListener('click', () => {
		hiddenInput.focus()
	})

	// Keyboard shortcuts
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Tab') {
			e.preventDefault()
			restartTest()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			showStartScreen()
		}
	})
}

function generateWords() {
	const count = gameState.mode === 'time' ? 200 : gameState.wordCount
	gameState.words = []

	for (let i = 0; i < count; i++) {
		const randomWord =
			commonWords[Math.floor(Math.random() * commonWords.length)]
		gameState.words.push(randomWord)
	}
}

function renderWords() {
	const container = document.getElementById('wordsContainer')
	// Use DocumentFragment for better performance
	const fragment = document.createDocumentFragment()

	gameState.words.forEach((word, wordIndex) => {
		const wordEl = document.createElement('div')
		wordEl.className = 'word inline-block'
		wordEl.dataset.wordIndex = wordIndex

		// Create word content as single string then set innerHTML once
		let wordHTML = ''
		word.split('').forEach((char, charIndex) => {
			wordHTML += `<span class="char" data-char-index="${charIndex}">${char}</span>`
		})
		wordEl.innerHTML = wordHTML

		fragment.appendChild(wordEl)
	})

	container.innerHTML = ''
	container.appendChild(fragment)
	updateCaret()
}

function updateCaret() {
	const caret = document.getElementById('caret')
	const currentWord = document.querySelector(
		`[data-word-index="${gameState.currentWordIndex}"]`,
	)

	if (!currentWord) return

	const chars = currentWord.querySelectorAll('.char')
	let targetChar = chars[gameState.currentCharIndex]

	if (!targetChar && gameState.currentCharIndex >= chars.length) {
		// Caret should be at the end of the word
		targetChar = chars[chars.length - 1]
		const rect = targetChar.getBoundingClientRect()
		const containerRect = document
			.getElementById('typingArea')
			.getBoundingClientRect()
		caret.style.left = `${rect.right - containerRect.left}px`
		caret.style.top = `${rect.top - containerRect.top}px`
	} else if (targetChar) {
		const rect = targetChar.getBoundingClientRect()
		const containerRect = document
			.getElementById('typingArea')
			.getBoundingClientRect()
		caret.style.left = `${rect.left - containerRect.left}px`
		caret.style.top = `${rect.top - containerRect.top}px`
	}
}

// Throttled functions for performance
const throttledUpdateCaret = throttle(updateCaret, 16) // ~60fps
const throttledUpdateLiveStats = throttle(updateLiveStats, 100) // 10fps for stats

function handleInput(e) {
	if (!gameState.isActive) return

	const input = e.target.value
	const currentWord = gameState.words[gameState.currentWordIndex]

	if (!gameState.isStarted) {
		startTimer()
		gameState.isStarted = true
		document.getElementById('liveStats').classList.remove('opacity-0')
		document.getElementById('liveStats').classList.add('fade-in')
	}

	// Handle word completion
	if (input.endsWith(' ')) {
		if (input.trim() === currentWord) {
			markWordCorrect()
		} else {
			markWordIncorrect()
		}

		e.target.value = ''
		gameState.currentCharIndex = 0
		gameState.currentWordIndex++

		if (
			gameState.mode === 'words' &&
			gameState.currentWordIndex >= gameState.wordCount
		) {
			endTest()
			return
		}

		updateCurrentWord()
		throttledUpdateCaret()
	} else {
		// Handle character-by-character feedback
		gameState.currentCharIndex = input.length
		updateCharacterFeedbackOptimized(input, currentWord)
		throttledUpdateCaret()
	}

	throttledUpdateLiveStats()
}

function handleKeydown(e) {
	if (!gameState.isActive) return

	if (
		e.key === 'Backspace' &&
		e.target.value === '' &&
		gameState.currentWordIndex > 0
	) {
		// Go back to previous word
		e.preventDefault()
		gameState.currentWordIndex--
		const prevWord = gameState.words[gameState.currentWordIndex]
		e.target.value = prevWord
		gameState.currentCharIndex = prevWord.length
		updateCurrentWord()
		updateCharacterFeedbackOptimized(prevWord, prevWord)
		throttledUpdateCaret()
	}
}

// Optimized character feedback function
function updateCharacterFeedbackOptimized(input, targetWord) {
	const currentWord = document.querySelector(
		`[data-word-index="${gameState.currentWordIndex}"]`,
	)
	const chars = currentWord.querySelectorAll('.char')

	// Reset character counts for this update
	let correctCount = 0
	let incorrectCount = 0

	// Remove any extra character spans first
	const extraSpans = currentWord.querySelectorAll(
		'.char:not([data-char-index])',
	)
	extraSpans.forEach((span) => span.remove())

	chars.forEach((char, index) => {
		// Reset classes
		char.className = 'char'

		if (index < input.length) {
			if (input[index] === targetWord[index]) {
				char.classList.add('correct')
				correctCount++
			} else {
				char.classList.add('incorrect')
				incorrectCount++
			}
		}
	})

	// Handle extra characters efficiently
	if (input.length > targetWord.length) {
		const extraChars = input.slice(targetWord.length)
		const extraHTML = extraChars
			.split('')
			.map((char) => `<span class="char incorrect">${char}</span>`)
			.join('')

		currentWord.insertAdjacentHTML('beforeend', extraHTML)
		incorrectCount += extraChars.length
	}

	// Update global character counts
	gameState.correctChars = correctCount
	gameState.incorrectChars = incorrectCount

	// Count all previous completed words
	for (let i = 0; i < gameState.currentWordIndex; i++) {
		const word = document.querySelector(`[data-word-index="${i}"]`)
		if (word) {
			const correctChars = word.querySelectorAll('.char.correct').length
			const incorrectChars = word.querySelectorAll('.char.incorrect').length
			gameState.correctChars += correctChars
			gameState.incorrectChars += incorrectChars
		}
	}
}

function markWordCorrect() {
	const currentWord = document.querySelector(
		`[data-word-index="${gameState.currentWordIndex}"]`,
	)
	currentWord.classList.add('correct')
	currentWord.classList.remove('current')
}

function markWordIncorrect() {
	const currentWord = document.querySelector(
		`[data-word-index="${gameState.currentWordIndex}"]`,
	)
	currentWord.classList.add('incorrect')
	currentWord.classList.remove('current')
}

function updateCurrentWord() {
	// More efficient current word updating
	const prevCurrent = document.querySelector('.word.current')
	if (prevCurrent) {
		prevCurrent.classList.remove('current')
	}

	const currentWord = document.querySelector(
		`[data-word-index="${gameState.currentWordIndex}"]`,
	)
	if (currentWord) {
		currentWord.classList.add('current')
	}
}

function startTimer() {
	gameState.startTime = Date.now()

	// Clear any existing timer first
	if (gameState.timerInterval) {
		clearInterval(gameState.timerInterval)
	}

	if (gameState.mode === 'time') {
		gameState.timerInterval = setInterval(() => {
			if (!gameState.isActive) {
				clearInterval(gameState.timerInterval)
				gameState.timerInterval = null
				return
			}

			const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000)
			const remaining = gameState.duration - elapsed

			document.getElementById('liveTime').textContent = remaining
			updateProgress(elapsed / gameState.duration)

			if (remaining <= 0) {
				clearInterval(gameState.timerInterval)
				gameState.timerInterval = null
				endTest()
			}
		}, 100)
	} else {
		// For word mode, update the display immediately
		document.getElementById(
			'liveTime',
		).textContent = `${gameState.currentWordIndex}/${gameState.wordCount}`
	}
}

function updateProgress(ratio) {
	const progressBar = document.getElementById('progressBar')
	if (progressBar) {
		progressBar.style.width = `${Math.min(ratio * 100, 100)}%`
	}
}

function updateLiveStats() {
	if (!gameState.startTime || !gameState.isStarted) return

	const currentTime = Date.now()
	const elapsed = (currentTime - gameState.startTime) / 1000 / 60 // in minutes

	const totalChars = gameState.correctChars + gameState.incorrectChars
	const wpm = elapsed > 0 ? Math.round(gameState.correctChars / 5 / elapsed) : 0
	const rawWpm = elapsed > 0 ? Math.round(totalChars / 5 / elapsed) : 0
	const accuracy =
		totalChars > 0
			? Math.round((gameState.correctChars / totalChars) * 100)
			: 100

	// Store for chart (less frequently to improve performance)
	const elapsedSeconds = elapsed * 60
	if (
		gameState.wpmHistory.length === 0 ||
		elapsedSeconds -
			gameState.wpmHistory[gameState.wpmHistory.length - 1].time >=
			1
	) {
		gameState.wpmHistory.push({ time: elapsedSeconds, wpm: wpm })
		gameState.rawWpmHistory.push({ time: elapsedSeconds, rawWpm: rawWpm })
	}

	// Update display
	const wpmElement = document.getElementById('liveWpm')
	const accElement = document.getElementById('liveAccuracy')
	const charsElement = document.getElementById('liveChars')

	if (wpmElement) {
		wpmElement.textContent = wpm
		wpmElement.classList.add('stats-animate')
		setTimeout(() => wpmElement.classList.remove('stats-animate'), 300)
	}

	if (accElement) accElement.textContent = `${accuracy}%`
	if (charsElement)
		charsElement.textContent = `${gameState.correctChars}/${totalChars}`

	if (gameState.mode === 'words') {
		const progress = gameState.currentWordIndex / gameState.wordCount
		updateProgress(progress)
		const timeElement = document.getElementById('liveTime')
		if (timeElement) {
			timeElement.textContent = `${gameState.currentWordIndex}/${gameState.wordCount}`
		}
	}
}

function endTest() {
	gameState.isActive = false
	gameState.endTime = Date.now()

	// Clear timer
	if (gameState.timerInterval) {
		clearInterval(gameState.timerInterval)
		gameState.timerInterval = null
	}

	const elapsed = (gameState.endTime - gameState.startTime) / 1000
	const totalChars = gameState.correctChars + gameState.incorrectChars
	const wpm = Math.round(gameState.correctChars / 5 / (elapsed / 60))
	const rawWpm = Math.round(totalChars / 5 / (elapsed / 60))
	const accuracy = Math.round((gameState.correctChars / totalChars) * 100)

	// Calculate consistency
	const wpmValues = gameState.wpmHistory.map((h) => h.wpm).filter((w) => w > 0)
	let consistency = 0
	if (wpmValues.length > 1) {
		const avgWpm = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length
		const variance =
			wpmValues.reduce((sum, wpm) => sum + Math.pow(wpm - avgWpm, 2), 0) /
			wpmValues.length
		const cv = Math.sqrt(variance) / avgWpm
		consistency = Math.max(0, Math.round((1 - cv) * 100))
	}

	// Update results
	document.getElementById('finalWpm').textContent = wpm
	document.getElementById('finalRawWpm').textContent = `Raw: ${rawWpm}`
	document.getElementById('finalAccuracy').textContent = `${accuracy}%`
	document.getElementById(
		'finalChars',
	).textContent = `${gameState.correctChars}/${totalChars}`
	document.getElementById('finalConsistency').textContent = `${consistency}%`
	document.getElementById('finalTime').textContent = `${Math.round(elapsed)}s`
	document.getElementById('testMode').textContent =
		gameState.mode === 'time'
			? `${gameState.duration} second test`
			: `${gameState.wordCount} word test`

	showResults()
	drawChart()
}

function showResults() {
	document.getElementById('typingArea').parentElement.classList.add('hidden')
	document.getElementById('liveStats').classList.add('hidden')
	document.getElementById('startScreen').classList.add('hidden')
	document.getElementById('resultsScreen').classList.remove('hidden')
}

function drawChart() {
	const canvas = document.getElementById('wpmChart')
	if (!canvas) return

	const ctx = canvas.getContext('2d')

	// Set canvas size
	canvas.width = canvas.offsetWidth * 2
	canvas.height = canvas.offsetHeight * 2
	ctx.scale(2, 2)

	const width = canvas.offsetWidth
	const height = canvas.offsetHeight

	// Clear canvas
	ctx.fillStyle =
		getComputedStyle(document.body).getPropertyValue('background-color') ||
		'#1f2937'
	ctx.fillRect(0, 0, width, height)

	if (gameState.wpmHistory.length < 2) return

	const maxWpm = Math.max(
		...gameState.wpmHistory.map((h) => h.wpm),
		...gameState.rawWpmHistory.map((h) => h.rawWpm),
		10, // Minimum scale
	)
	const maxTime = Math.max(...gameState.wpmHistory.map((h) => h.time))

	// Draw grid lines
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
	ctx.lineWidth = 1

	// Horizontal lines
	for (let i = 0; i <= 5; i++) {
		const y = ((height - 40) * i) / 5 + 20
		ctx.beginPath()
		ctx.moveTo(40, y)
		ctx.lineTo(width - 20, y)
		ctx.stroke()
	}

	// Draw WPM line
	if (gameState.wpmHistory.length > 1) {
		ctx.strokeStyle = '#10b981'
		ctx.lineWidth = 3
		ctx.beginPath()

		gameState.wpmHistory.forEach((point, index) => {
			const x = 40 + (point.time / maxTime) * (width - 60)
			const y = height - 20 - (point.wpm / maxWpm) * (height - 40)

			if (index === 0) {
				ctx.moveTo(x, y)
			} else {
				ctx.lineTo(x, y)
			}
		})
		ctx.stroke()
	}

	// Draw Raw WPM line
	if (gameState.rawWpmHistory.length > 1) {
		ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'
		ctx.lineWidth = 2
		ctx.beginPath()

		gameState.rawWpmHistory.forEach((point, index) => {
			const x = 40 + (point.time / maxTime) * (width - 60)
			const y = height - 20 - (point.rawWpm / maxWpm) * (height - 40)

			if (index === 0) {
				ctx.moveTo(x, y)
			} else {
				ctx.lineTo(x, y)
			}
		})
		ctx.stroke()
	}

	// Draw labels
	ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
	ctx.font = '12px JetBrains Mono'
	ctx.fillText('WPM', 10, height - 25)
	ctx.fillText('0', 10, height - 10)
	ctx.fillText(maxWpm.toString(), 10, 25)
}

function startTest() {
	resetGame()
	generateWords()
	renderWords()

	gameState.isActive = true

	document.getElementById('startScreen').classList.add('hidden')
	document.getElementById('resultsScreen').classList.add('hidden')
	document.getElementById('typingArea').parentElement.classList.remove('hidden')
	document.getElementById('liveStats').classList.remove('hidden')

	updateCurrentWord()
	document.getElementById('hiddenInput').focus()

	// Reset live stats
	document.getElementById('liveWpm').textContent = '0'
	document.getElementById('liveAccuracy').textContent = '100%'
	document.getElementById('liveTime').textContent =
		gameState.mode === 'time' ? gameState.duration : `0/${gameState.wordCount}`
	document.getElementById('liveChars').textContent = '0/0'

	updateProgress(0)
}

function restartTest() {
	if (
		gameState.isActive ||
		!document.getElementById('resultsScreen').classList.contains('hidden')
	) {
		startTest()
	} else {
		showStartScreen()
	}
}

function resetGame() {
	// Clear any existing timer
	if (gameState.timerInterval) {
		clearInterval(gameState.timerInterval)
		gameState.timerInterval = null
	}

	gameState = {
		...gameState,
		isActive: false,
		isStarted: false,
		currentWordIndex: 0,
		currentCharIndex: 0,
		correctChars: 0,
		incorrectChars: 0,
		startTime: null,
		endTime: null,
		words: [],
		userInput: '',
		errors: [],
		wpmHistory: [],
		rawWpmHistory: [],
		timerInterval: null,
	}

	document.getElementById('hiddenInput').value = ''
}

function showStartScreen() {
	// Clear timer when going back to start
	if (gameState.timerInterval) {
		clearInterval(gameState.timerInterval)
		gameState.timerInterval = null
	}

	document.getElementById('startScreen').classList.remove('hidden')
	document.getElementById('resultsScreen').classList.add('hidden')
	document.getElementById('typingArea').parentElement.classList.add('hidden')
	document.getElementById('liveStats').classList.add('hidden')
	resetGame()
}

function changeTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme)
}

// Utility functions
function calculateWPM(chars, timeInMinutes) {
	return Math.round(chars / 5 / timeInMinutes)
}

function calculateAccuracy(correct, total) {
	return total > 0 ? Math.round((correct / total) * 100) : 100
}

// Improved throttle function
function throttle(func, limit) {
	let inThrottle
	return function (...args) {
		if (!inThrottle) {
			func.apply(this, args)
			inThrottle = true
			setTimeout(() => (inThrottle = false), limit)
		}
	}
}

// Focus management improvements
function maintainFocus() {
	const hiddenInput = document.getElementById('hiddenInput')

	// Refocus if user clicks away during test
	document.addEventListener('click', (e) => {
		if (gameState.isActive && !e.target.closest('.dropdown')) {
			setTimeout(() => hiddenInput.focus(), 10)
		}
	})

	// Handle window focus/blur
	window.addEventListener('blur', () => {
		if (gameState.isActive) {
			// Pause functionality could be added here
		}
	})

	window.addEventListener('focus', () => {
		if (gameState.isActive) {
			hiddenInput.focus()
		}
	})
}

// Enhanced keyboard handling
function handleSpecialKeys() {
	document.addEventListener('keydown', (e) => {
		if (!gameState.isActive) return

		// Handle special typing scenarios
		if (e.ctrlKey || e.altKey || e.metaKey) {
			e.preventDefault()
			return false
		}

		// Focus hidden input if typing starts anywhere
		if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
			document.getElementById('hiddenInput').focus()
		}
	})
}

// Smooth scrolling for long tests
function smoothScrolling() {
	const typingArea = document.getElementById('typingArea')
	const currentWord = document.querySelector(
		`[data-word-index="${gameState.currentWordIndex}"]`,
	)

	if (currentWord && typingArea) {
		const wordRect = currentWord.getBoundingClientRect()
		const containerRect = typingArea.getBoundingClientRect()

		if (wordRect.bottom > containerRect.bottom - 50) {
			typingArea.scrollTo({
				top: typingArea.scrollTop + 60,
				behavior: 'smooth',
			})
		}
	}
}

// Mobile support
function handleMobileInput() {
	if ('ontouchstart' in window) {
		const typingArea = document.getElementById('typingArea')
		if (typingArea) {
			typingArea.addEventListener('touchstart', (e) => {
				e.preventDefault()
				document.getElementById('hiddenInput').focus()
			})
		}
	}
}

// Configuration system
const config = {
	smoothCaret: true,
	soundOnClick: false,
	soundOnError: false,
	showLiveWpm: true,
	showLiveAccuracy: true,
	fontSize: '1.5rem',
	theme: 'dark',
}

function applyConfig() {
	const typingArea = document.querySelector('.typing-area')
	if (typingArea) {
		typingArea.style.fontSize = config.fontSize
	}
	document.documentElement.setAttribute('data-theme', config.theme)
}

// Add enhanced CSS for performance
const style = document.createElement('style')
style.textContent = `
	@keyframes floatUp {
		0% { opacity: 1; transform: translateY(0); }
		100% { opacity: 0; transform: translateY(-20px); }
	}

	.typing-area {
		position: relative;
		min-height: 200px;
		will-change: transform;
	}

	.word {
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
	}

	.char {
		transition: color 0.1s ease;
	}

	.progress {
		height: 4px;
		border-radius: 2px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.1);
	}

	.stat {
		transition: all 0.3s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.navbar {
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.typing-container {
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	.typing-container:focus-within {
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.result-card {
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn {
		transition: all 0.2s ease;
	}

	.mode-btn.active {
		background: rgb(59, 130, 246);
		color: white;
	}

	/* Performance optimizations */
	.word, .char {
		contain: layout style;
	}

	.stats-animate {
		animation: statsPulse 0.3s ease;
	}

	@keyframes statsPulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	.fade-in {
		animation: fadeIn 0.5s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
`
document.head.appendChild(style)

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
	init()
	handleSpecialKeys()
	handleMobileInput()
	maintainFocus()
	applyConfig()

	console.log('TypingTest - Performance Optimized!')
	console.log('Use Tab to restart, Esc to go back')
})

// Export functionality (memory-based)
function exportResults() {
	const data = {
		wpm: document.getElementById('finalWpm').textContent,
		accuracy: document.getElementById('finalAccuracy').textContent,
		testMode: document.getElementById('testMode').textContent,
		timestamp: new Date().toISOString(),
	}

	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: 'application/json',
	})
	const url = URL.createObjectURL(blob)
	const a = document.createElement()
	a.href = url
	a.download = `typing-test-${Date.now()}.json`
	a.click()
	URL.revokeObjectURL(url)
}
