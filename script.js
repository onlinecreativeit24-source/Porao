let userCoins = 1; // Default Free Coin
const unlockedNumbers = []; // Unlocked status

const defaultData = [
    { id: 1, name: "আরিফুর রহমান", role: "Teacher", area: "ধানমন্ডি, ঢাকা", details: "গণিত ও পদার্থবিজ্ঞান (Class 8 - 10)", phone: "01700000000" },
    { id: 2, name: "তানভীর আহমেদ", role: "Student", area: "জিইসি, চট্টগ্রাম", details: "ইংরেজি বিষয় টিউটর প্রয়োজন (Class 9)", phone: "01800000000" }
];

function updateCoinDisplay() {
    document.getElementById('userCoinCount').innerText = userCoins;
}

function renderDataList(filterArea = '') {
    const listContainer = document.getElementById('localDataList');
    if(!listContainer) return;
    listContainer.innerHTML = '';

    const filtered = defaultData.filter(p => p.area.toLowerCase().includes(filterArea.toLowerCase()));

    filtered.forEach(item => {
        const isUnlocked = unlockedNumbers.includes(item.id);
        const maskedPhone = item.phone.substring(0, 3) + "******" + item.phone.substring(9);
        
        const buttonHtml = isUnlocked 
            ? `<button class="res-btn primary" onclick="alert('যোগাযোগ নম্বর: ${item.phone}')">📞 Call (${item.phone})</button>`
            : `<button class="res-btn coin-btn" onclick="unlockWithCoin(${item.id})">🔓 Unlock (1 Coin)</button>`;

        listContainer.innerHTML += `
            <div class="person-card">
                <div class="person-info">
                    <h4>${item.name} <span class="badge">${item.role}</span></h4>
                    <p>📍 ${item.area}</p>
                    <p>📚 ${item.details}</p>
                    <p style="font-weight:bold; margin-top:4px; color:#777;">📱 ${isUnlocked ? item.phone : maskedPhone}</p>
                </div>
                <div style="width:130px;">${buttonHtml}</div>
            </div>
        `;
    });
}

function unlockWithCoin(id) {
    if (userCoins >= 1) {
        userCoins -= 1;
        unlockedNumbers.push(id);
        updateCoinDisplay();
        alert('১ টি MHR GOLD COIN ব্যবহার করে নম্বরটি সফলভাবে আনলক করা হয়েছে!');
        renderDataList();
    } else {
        alert('আপনার কাছে পর্যাপ্ত MHR GOLD COIN নেই! দয়া করে কয়েন রিচার্জ করুন।');
        showPage('buyCoins');
    }
}

function addCoins(amount) {
    userCoins += amount;
    updateCoinDisplay();
    alert(`অভিনন্দন! আপনার অ্যাকাউন্টে ${amount} টি MHR GOLD COIN যুক্ত হয়েছে।`);
    showPage('localSearch');
}

function searchLocalData() {
    const area = document.getElementById('searchLocation').value;
    renderDataList(area);
}

function showPage(pageName) {
    document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

    if(pageName === 'home') {
        document.getElementById('homePage').classList.add('active');
        document.getElementById('navHome').classList.add('active');
    } else if(pageName === 'localSearch') {
        document.getElementById('localSearchPage').classList.add('active');
        document.getElementById('navSearch').classList.add('active');
        renderDataList();
    } else if(pageName === 'buyCoins') {
        document.getElementById('buyCoinsPage').classList.add('active');
        document.getElementById('navCoin').classList.add('active');
    }
    window.scrollTo(0, 0);
}

// Initial Call
updateCoinDisplay();
renderDataList();
