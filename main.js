document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const profileForm = document.getElementById('profile-form');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const exerciseFrequencySelect = document.getElementById('exercise-frequency');
    const fitnessGoalSelect = document.getElementById('fitness-goal');

    const foodForm = document.getElementById('food-form');
    const mealTypeSelect = document.getElementById('meal-type');
    const foodNameInput = document.getElementById('food-name');
    const quantityInput = document.getElementById('quantity');

    const mealLists = {
        breakfast: document.getElementById('breakfast-list'),
        lunch: document.getElementById('lunch-list'),
        dinner: document.getElementById('dinner-list'),
        snack: document.getElementById('snack-list'),
    };

    const totalCaloriesEl = document.getElementById('total-calories');
    const getFeedbackBtn = document.getElementById('get-feedback-btn');
    const feedbackResultEl = document.getElementById('feedback-result');
    const themeToggleBtn = document.getElementById('theme-toggle');

    const contactForm = document.getElementById('contact-form');
    const contactStatus = document.getElementById('contact-status');

    // --- Theme (Dark/Light Mode) Functions ---
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    function loadTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) {
            applyTheme(saved);
        } else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
    }

    // --- Data from localStorage ---
    let foods = JSON.parse(localStorage.getItem('foods')) || [];
    let nextId = localStorage.getItem('nextId') ? parseInt(localStorage.getItem('nextId'), 10) : 1;

    // --- Initializer Function ---
    function init() {
        loadTheme();
        loadProfile();
        Object.values(mealLists).forEach(list => list.innerHTML = '');
        foods.forEach(food => addFoodToListDOM(food));
        updateTotalCalories();
    }

    // --- AI Simulation Functions ---
    async function estimateCalories(foodName, quantity) {
        const foodDatabase = {
            '떡볶이': { '1인분': 500, 'g': 2.5 },
            '김밥': { '1줄': 480, 'g': 2.2 },
            '라면': { '1개': 550, '1봉지': 550 },
            '순대': { '1인분': 300, 'g': 2.8 },
            '튀김': { '1인분': 400, '5개': 400, '1개': 80 },
            '닭가슴살': { '100g': 165, 'g': 1.65 },
            '계란': { '1개': 80, '1알': 80, 'g': 1.55 },
            '밥': { '1공기': 310, 'g': 1.3 },
            '사과': { '1개': 100, 'g': 0.52 },
            '바나나': { '1개': 110, 'g': 0.89 },
            '고구마': { '1개': 130, 'g': 0.86 },
        };

        feedbackResultEl.textContent = 'AI가 칼로리를 계산하고 있습니다...';
        await new Promise(resolve => setTimeout(resolve, 500));

        const quantityLower = quantity.toLowerCase();
        const quantityNumMatch = quantityLower.match(/^\d+/);
        const quantityNum = quantityNumMatch ? parseInt(quantityNumMatch[0], 10) : 1;
        
        const foodKey = Object.keys(foodDatabase).find(key => foodName.includes(key));

        if (foodKey) {
            const foodData = foodDatabase[foodKey];
            let unitKey = Object.keys(foodData).find(u => quantityLower.includes(u));
            
            if (unitKey) { 
                 let baseCalories = foodData[unitKey];
                 let calculatedCalories = baseCalories * quantityNum;
                 feedbackResultEl.textContent = `'${foodName} ${quantity}'의 칼로리를 약 ${Math.round(calculatedCalories)}kcal로 계산했습니다.`;
                 return Math.round(calculatedCalories);
            } 
        }

        feedbackResultEl.textContent = `'${foodName}'에 대한 정확한 칼로리 정보를 찾지 못해, 일반적인 식사를 기준으로 350kcal로 우선 기록합니다.`;
        return 350; 
    }

    // --- Profile Functions ---
    function saveProfile(e) {
        e.preventDefault();
        const profile = {
            height: heightInput.value,
            weight: weightInput.value,
            exerciseFrequency: exerciseFrequencySelect.value,
            fitnessGoal: fitnessGoalSelect.value
        };
        localStorage.setItem('userProfile', JSON.stringify(profile));
        alert('내 정보가 저장되었습니다.');
    }

    function loadProfile() {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (profile) {
            heightInput.value = profile.height;
            weightInput.value = profile.weight;
            exerciseFrequencySelect.value = profile.exerciseFrequency;
            fitnessGoalSelect.value = profile.fitnessGoal;
        }
    }

    // --- Food Log Functions ---
    async function handleFoodFormSubmit(e) {
        e.preventDefault();
        const mealType = mealTypeSelect.value;
        const foodName = foodNameInput.value.trim();
        const quantity = quantityInput.value.trim();

        if (foodName && quantity) {
            const calories = await estimateCalories(foodName, quantity);
            const food = { id: nextId++, meal: mealType, name: foodName, quantity: quantity, calories: calories };
            foods.push(food);
            addFoodToListDOM(food);
            updateAndSave();
            foodNameInput.value = '';
            quantityInput.value = '';
            foodNameInput.focus();
        } else {
            alert('음식 이름과 섭취량을 모두 입력해주세요.');
        }
    }

    function addFoodToListDOM(food) {
        const list = mealLists[food.meal];
        if (!list) return; // Exit if meal type is invalid

        const li = document.createElement('li');
        li.setAttribute('data-id', food.id);
        li.innerHTML = `
            <span class="food-name">${food.name} (${food.quantity})</span>
            <div class="food-details">
                <span class="food-calories">${food.calories}</span>
                <span>kcal</span>
                <button class="delete-btn" data-id="${food.id}">X</button>
            </div>
        `;
        list.appendChild(li);
    }
    
    function handleListClick(e) {
        if (e.target.classList.contains('delete-btn')) {
            const foodId = parseInt(e.target.dataset.id, 10);
            foods = foods.filter(food => food.id !== foodId);
            updateAndSave();
            init(); // Re-render all lists
        }
    }

    function updateTotalCalories() {
        const total = foods.reduce((sum, food) => sum + food.calories, 0);
        totalCaloriesEl.textContent = total;
    }

    function saveToLocalStorage() {
        localStorage.setItem('foods', JSON.stringify(foods));
        localStorage.setItem('nextId', nextId.toString());
    }

    function updateAndSave() {
        updateTotalCalories();
        saveToLocalStorage();
    }

    // --- AI Feedback Function ---
    function getAIFeedback() {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (!profile || !profile.height || !profile.weight) {
            alert('AI 피드백을 받으려면 먼저 내 정보(키, 몸무게)를 저장해주세요.');
            return;
        }

        if (foods.length === 0) {
            alert('피드백을 받을 식단을 먼저 추가해주세요.');
            return;
        }

        feedbackResultEl.innerHTML = 'AI 트레이너가 식단을 분석하고 있습니다... 잠시만 기다려주세요.';

        setTimeout(() => {
            const feedback = generateFeedback(profile, foods);
            feedbackResultEl.innerHTML = `<p style="white-space: pre-wrap;">${feedback}</p>`;
        }, 1500);
    }

    function generateFeedback(profile, foodLog) {
        const totalCalories = foodLog.reduce((sum, food) => sum + food.calories, 0);
        const goalMap = { 'weight-loss': '체중 감량', 'lean-mass-up': '린매스업', 'bulk-up': '벌크업', 'maintenance': '체중 유지' };
        const goal = goalMap[profile.fitnessGoal] || '목표 없음';

        // Meal-specific analysis
        const caloriesByMeal = foodLog.reduce((acc, food) => {
            acc[food.meal] = (acc[food.meal] || 0) + food.calories;
            return acc;
        }, {});

        let feedbackText = `AI 트레이너 피드백:\n\n`;
        feedbackText += `현재 목표: ${goal}\n`;
        feedbackText += `오늘 섭취한 총 칼로리: ${totalCalories} kcal\n\n`;
        
        feedbackText += `[식사별 칼로리 분석]\n`;
        feedbackText += `아침: ${caloriesByMeal.breakfast || 0} kcal\n`;
        feedbackText += `점심: ${caloriesByMeal.lunch || 0} kcal\n`;
        feedbackText += `저녁: ${caloriesByMeal.dinner || 0} kcal\n`;
        feedbackText += `간식: ${caloriesByMeal.snack || 0} kcal\n\n`;

        const bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * 30);
        const tdee = bmr * ({ none: 1.2, low: 1.375, medium: 1.55, high: 1.725 }[profile.exerciseFrequency] || 1.2);
        let recommendedCalories = tdee;
        if (goal === '체중 감량') recommendedCalories -= 500;
        if (goal === '린매스업') recommendedCalories += 300;
        if (goal === '벌크업') recommendedCalories += 500;

        feedbackText += `회원님의 정보를 바탕으로 계산한 하루 권장 섭취 칼로리는 약 ${Math.round(recommendedCalories)} kcal 입니다.\n\n`;

        if (totalCalories < recommendedCalories - 200) {
            feedbackText += `[총평] 현재 섭취량이 목표보다 다소 부족합니다. 에너지가 부족하면 활력에 영향을 줄 수 있으니, 다음 식사에는 양질의 영양소를 보충해보세요.`;
        } else if (totalCalories > recommendedCalories + 200) {
            feedbackText += `[총평] 현재 섭취량이 목표를 초과했습니다. 특히 저녁이나 간식의 양을 조절하여 목표 칼로리를 맞춰보는 것을 추천합니다.`;
        } else {
            feedbackText += `[총평] 아주 좋습니다! 목표 칼로리 범위에 맞게 잘 섭취하고 계십니다.`;
        }

        return feedbackText;
    }

    // --- Contact (Partnership Inquiry) Function ---
    async function handleContactSubmit(e) {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        contactStatus.className = '';
        contactStatus.textContent = '전송 중입니다...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                contactForm.reset();
                contactStatus.className = 'success';
                contactStatus.textContent = '문의가 정상적으로 접수되었습니다. 감사합니다! 🙌';
            } else {
                const data = await response.json().catch(() => ({}));
                const message = data.errors ? data.errors.map(err => err.message).join(', ') : '전송에 실패했습니다.';
                contactStatus.className = 'error';
                contactStatus.textContent = `오류: ${message} 잠시 후 다시 시도해주세요.`;
            }
        } catch (err) {
            contactStatus.className = 'error';
            contactStatus.textContent = '네트워크 오류로 전송에 실패했습니다. 연결을 확인해주세요.';
        } finally {
            submitBtn.disabled = false;
        }
    }

    // --- Event Listeners ---
    profileForm.addEventListener('submit', saveProfile);
    foodForm.addEventListener('submit', handleFoodFormSubmit);
    Object.values(mealLists).forEach(list => list.addEventListener('click', handleListClick));
    getFeedbackBtn.addEventListener('click', getAIFeedback);
    themeToggleBtn.addEventListener('click', toggleTheme);
    contactForm.addEventListener('submit', handleContactSubmit);

    // --- Initialize The App ---
    init();
});
