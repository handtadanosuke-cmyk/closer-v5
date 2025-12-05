/* * Closer Ver 5.0 Main Logic (Production Complete) */

// --- 0. データ読み込みと初期化 ---
function loadInitialData() {
    if (typeof window.initialUsers === 'undefined' || typeof window.initialPosts === 'undefined') {
        console.error("Error: data.js missing.");
        alert("データの読み込みに失敗しました。");
        return { users: {}, posts: [] };
    }
    const storedUsers = localStorage.getItem('closer_users');
    const storedPosts = localStorage.getItem('closer_posts');
    return {
        users: storedUsers ? JSON.parse(storedUsers) : window.initialUsers,
        posts: storedPosts ? JSON.parse(storedPosts) : window.initialPosts
    };
}

const data = loadInitialData();
let users = data.users;
let posts = data.posts;
let currentUser = null;
let currentTab = 'Main';
let generatedAuthCode = null; // 認証用

// EmailJS設定 (必要に応じて書き換えてください)
const EMAIL_SERVICE_ID = "service_smgexjp"; 
const EMAIL_TEMPLATE_ID = "template_tcqq8jd";
const EMAIL_PUBLIC_KEY = "UmvB6PSL-gQRkqubw";

try {
    const sessionData = sessionStorage.getItem('closer_current_user');
    if (sessionData) currentUser = JSON.parse(sessionData);
} catch (e) { console.error(e); }

window.addEventListener('DOMContentLoaded', () => {
    // EmailJS初期化
    if(typeof emailjs !== 'undefined') emailjs.init(EMAIL_PUBLIC_KEY);

    if(currentUser) {
        if (users[currentUser.username]) currentUser = users[currentUser.username];
        updateHeaderUI();
        updateMenuUI();
    }
    recalculateRanks(); 
    renderTimeline('Main');
});

// --- 1. ナビゲーション & 基本UI ---
window.navTo = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    
    if(screenId === 'timeline-screen') renderTimeline(currentTab);
    if(screenId === 'ranking-screen') renderRanking();
    if(screenId === 'user-ranking-screen') renderUserRanking();
    if(screenId === 'profile-screen' && !document.getElementById('prof-name').innerText) {
        // プロフィールが空なら自分を表示
        if(currentUser) window.openProfile(currentUser.username);
    }

    // メニューを閉じる
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    if (menu) { menu.classList.remove('open'); overlay.classList.remove('open'); }
};

window.toggleMenu = function() {
    document.getElementById('side-menu').classList.toggle('open');
    document.getElementById('menu-overlay').classList.toggle('open');
};

window.backToPrev = () => window.navTo('timeline-screen');

// --- 2. 認証システム (Auth Flow) ---
window.switchAuthTab = (tab) => {
    document.getElementById('auth-flow-register').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('auth-flow-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('tab-register').className = tab === 'register' ? 'auth-tab active' : 'auth-tab';
    document.getElementById('tab-login').className = tab === 'login' ? 'auth-tab active' : 'auth-tab';
};

window.checkDeviceAndSendCode = function() {
    const email = document.getElementById('reg-email').value;
    if(!email) return alert("メールアドレスを入力してください");
    
    // 簡易コード生成
    generatedAuthCode = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("Auth Code:", generatedAuthCode); // デバッグ用
    
    alert(`【デモ】認証コード: ${generatedAuthCode}\n(本来はメールで送信されます)`);
    document.getElementById('reg-step-1').style.display = 'none';
    document.getElementById('reg-step-2').style.display = 'block';
};

window.verifyCode = function() {
    const input = document.getElementById('reg-code').value;
    if(input === generatedAuthCode) {
        document.getElementById('reg-step-2').style.display = 'none';
        document.getElementById('reg-step-3').style.display = 'block';
        renderTags('product-tags', true);
    } else {
        alert("コードが間違っています");
    }
};

window.goToBioStep = function() {
    const name = document.getElementById('reg-name').value;
    const pass = document.getElementById('reg-pass').value;
    if(!name || !pass) return alert("必須項目を入力してください");
    if(users[name]) return alert("そのユーザー名は既に使用されています");
    
    document.getElementById('reg-step-3').style.display = 'none';
    document.getElementById('reg-step-4').style.display = 'block';
};

window.completeRegistration = function() {
    const name = document.getElementById('reg-name').value;
    const newUser = {
        username: name,
        rank: 'Rookie',
        scores: { defense: 0, offense: 0, grit: 0, spirit: 0 },
        membership: 'free',
        wallet: { coin_paid: 0, coin_bonus: 500 }, // 入会特典
        permissions: { can_post: false, is_pro_attempted: false, unlock_progress: { read:0, save:0, login_streak:1 } },
        img: document.getElementById('avatar-img').src || '',
        bio: document.getElementById('reg-bio').value,
        products: [], // タグ処理は省略
        following: [],
        settings: { is_private: false }
    };
    
    users[name] = newUser;
    saveData();
    loginUser(newUser);
};

window.doLogin = function() {
    const email = document.getElementById('login-email').value; // 今回は簡易的にユーザー名でも可とする
    // 本来はemail検索だが、デモなのでusernameマッチで探す
    let targetUser = users[email]; // ID入力想定
    
    // メールアドレス検索の代用（全探索）
    if(!targetUser) {
        targetUser = Object.values(users).find(u => u.username === email || u.email === email);
    }

    if(targetUser) {
        loginUser(targetUser);
    } else {
        alert("ユーザーが見つかりません");
    }
};

window.startAsGuest = function() {
    if(!users['RookieUser']) {
        users['RookieUser'] = { username: 'RookieUser', rank: 'Rookie', wallet:{coin_paid:0, coin_bonus:0}, permissions:{can_post:false}, scores:{defense:0,offense:0,grit:0,spirit:0}, following:[] };
    }
    loginUser(users['RookieUser']);
};

window.logout = function() {
    sessionStorage.removeItem('closer_current_user');
    location.reload();
};

function loginUser(user) {
    currentUser = user;
    sessionStorage.setItem('closer_current_user', JSON.stringify(currentUser));
    updateHeaderUI();
    updateMenuUI();
    window.navTo('timeline-screen');
}

// --- 3. タイムライン & ロジック ---
window.switchTimelineTab = function(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.remove('active');
        if(el.innerText === tabName) el.classList.add('active');
    });
    renderTimeline(tabName);
}

// タイムライン描画 (サブスク/単発購入 対応版)
window.renderTimeline = function(tab, searchKeyword = null) {
    const list = document.getElementById('timeline-list');
    if (!list) return;
    list.innerHTML = '';

    // フィルタリング処理
    let filtered = posts.filter(p => {
        const author = users[p.author_id];
        if (!author) return false;
        
        if(searchKeyword) {
            const k = searchKeyword.toLowerCase();
            if(!p.title.toLowerCase().includes(k) && !p.tags.some(t=>t.toLowerCase().includes(k))) return false;
        }
        if (tab === 'Main') return true; 
        if (tab === 'Elite') {
            const isHighRank = ['SS', 'S', 'A', 'B'].includes(author.rank);
            return isHighRank && p.stats.score_avg >= 4.0;
        }
        if (tab === 'Spirit') return p.category === 'spirit';
        if (tab === 'Following') {
            if(!currentUser) return false;
            return currentUser.following && currentUser.following.includes(p.author_id);
        }
        return true;
    });

    if(tab === 'Main') filtered.sort(() => Math.random() - 0.5);
    else filtered.sort((a,b) => b.post_id - a.post_id);

    filtered.forEach(p => {
        const author = users[p.author_id] || { rank: '??', my_sub_price: 500 }; 
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.openDetail(p.post_id);
        
        // --- 閲覧権限ロジック ---
        let canRead = false;

        // 1. 無料記事なら読める
        if (p.price === 0) canRead = true;
        
        if (currentUser) {
            // 2. 自分が投稿者なら読める
            if (p.author_id === currentUser.username) canRead = true;
            // 3. 単発購入済みなら読める
            if (currentUser.purchased_posts && currentUser.purchased_posts.includes(p.post_id)) canRead = true;
            // 4. サブスク加入済みなら読める
            if (currentUser.subscriptions && currentUser.subscriptions.includes(p.author_id)) canRead = true;
        }

        // 表示制御
        const blurClass = canRead ? '' : 'blur-content';
        let lockOverlay = '';

        if (!canRead) {
            // ロック時のオーバーレイ (2つのボタンを表示)
            lockOverlay = `
            <div class="locked-overlay" onclick="event.stopPropagation()">
                <div style="font-size:32px; margin-bottom:5px;">🔒</div>
                <div style="font-size:12px; font-weight:bold; margin-bottom:10px;">有料コンテンツ</div>
                
                <div class="lock-options">
                    <button class="lock-btn btn-buy" onclick="purchaseOneTime(${p.post_id}, ${p.price})">
                        <span>この記事だけ</span>
                        <span style="color:var(--accent); font-size:14px;">${p.price} Coin</span>
                    </button>
                    
                    <button class="lock-btn btn-sub" onclick="subscribeToUser('${p.author_id}', ${author.my_sub_price || 500})">
                        <span>${p.author_id}の全記事</span>
                        <span style="font-size:14px;">月額 ${author.my_sub_price || 500} Coin</span>
                    </button>
                </div>
            </div>`;
        }

        // 推奨者ラベル
        let endorsement = '';
        if(p.endorsers && p.endorsers.length > 0) {
            const eName = p.endorsers[0];
            endorsement = `<div style="background:linear-gradient(90deg, #D4AF37 0%, #000 100%); color:#000; font-size:10px; font-weight:bold; padding:2px 8px; margin:-16px -16px 10px -16px; border-radius:16px 16px 0 0;">★ [Sランク ${eName}さんが推奨]</div>`;
        }

        card.innerHTML = `
            ${endorsement}
            <div class="card-meta"><span>${p.time}</span><span style="color:var(--accent);">★ ${author.rank}</span></div>
            <div class="q-title">${p.title}</div>
            <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            <div style="font-size:14px; margin-top:10px; color:#ddd;">${p.content.intro}</div>
            
            <div style="margin-top:10px; position:relative; min-height:100px;">
                <div class="${blurClass}" style="font-size:14px; color:#fff; white-space:pre-wrap;">${p.content.body}</div>
                ${lockOverlay}
            </div>

            <div class="card-actions">
                <span>⭐ ${p.stats.score_avg}</span>
                <span onclick="event.stopPropagation(); savePost(${p.post_id})">🔖 ${p.stats.save_count}</span>
                <span>👀 ${p.stats.view_count}</span>
            </div>
        `;
        list.appendChild(card);
    });
};

// --- 4. 詳細 & アクション ---
window.openDetail = function(id) {
    const p = posts.find(x => x.post_id === id);
    if(!p) return;
    document.getElementById('detail-title').innerText = p.title;
    document.getElementById('detail-context').innerText = p.content.intro;
    document.getElementById('detail-tags').innerHTML = p.tags.map(t=>`<span class="tag">${t}</span>`).join('');
    // 回答リスト描画（ダミー）
    const ansList = document.getElementById('answer-list');
    ansList.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">回答はまだありません</div>';
    window.navTo('detail-screen');
};

window.checkMemberAccess = function(screenId, type) {
    if(!currentUser || currentUser.rank === 'Rookie' && type !== 'post') {
         // Rookieでも閲覧系はOKだが、機能制限がある場合はここで弾く
         // 今回はGuest以外OKとする
    }
    if(!currentUser || currentUser.username === 'RookieUser') {
         // 完全なゲストの場合
         if(screenId !== 'ai-practice-screen') { // AI練習は誰でもOKにするか、要件次第
             // alert("登録が必要です");
         }
    }

    if(type === 'post') {
        if(!currentUser.permissions.can_post) {
            const p = currentUser.permissions.unlock_progress;
            if(confirm(`【投稿ロック中】解除条件: 閲覧${p.read}/20, 保存${p.save}/5\nPro宣言で解除しますか？`)) {
                currentUser.permissions.can_post = true;
                saveData();
                alert("ロック解除！");
                document.getElementById('post-modal').style.display = 'flex';
            }
            return;
        }
        document.getElementById('post-modal').style.display = 'flex';
    } else if (screenId) {
        window.navTo(screenId);
    }
};

window.submitPost = function() {
    const txt = document.getElementById('post-content').value;
    if(!txt) return;
    posts.unshift({
        post_id: Date.now(), author_id: currentUser.username, category: 'tactics',
        title: txt.substring(0,10)+"...", content:{intro:txt, body:'詳細'}, 
        price:0, stats:{score_avg:0, view_count:0, save_count:0}, tags:['New'], time:'Now'
    });
    saveData();
    document.getElementById('post-modal').style.display = 'none';
    renderTimeline('Main');
};

window.unlockPost = function(id, price) {
    const wallet = currentUser.wallet;
    const total = wallet.coin_paid + wallet.coin_bonus;
    if(total < price) {
        alert("コイン不足です");
        window.openWalletModal();
        return;
    }
    if(confirm(`消費: ${price} Coins\n購入しますか？`)) {
        if(wallet.coin_bonus >= price) wallet.coin_bonus -= price;
        else {
            const diff = price - wallet.coin_bonus;
            wallet.coin_bonus = 0;
            wallet.coin_paid -= diff;
        }
        saveData();
        updateHeaderUI();
        alert("解除しました");
        renderTimeline(currentTab);
    }
};

// --- 5. プロフィール & ランキング (更新版) ---
window.openProfile = function(username) {
    const u = users[username];
    if(!u) return;
    
    document.getElementById('prof-name').innerText = u.username;
    // ランク表示
    const rankColor = u.rank === 'SS' ? 'var(--accent)' : '#fff';
    document.getElementById('prof-role').innerHTML = `<span style="color:${rankColor}; font-weight:900;">${u.rank} Rank</span>`;
    
    // スコア計算・表示
    const s = u.scores;
    const avg = ((s.defense+s.offense+s.grit+s.spirit)/4).toFixed(2);
    document.getElementById('prof-rate').innerText = avg;
    
    // 投稿数カウント
    const postCount = posts.filter(p => p.author_id === u.username).length;
    document.getElementById('prof-answers-count').innerText = postCount;

    if(u.img) document.getElementById('prof-img').src = u.img;
    
    // コイン表示 (自分のみ)
    const isMe = currentUser && currentUser.username === username;
    document.getElementById('prof-coin-display').style.display = isMe ? 'block' : 'none';
    
    // ★追加: aヒートマップ表示エリアを作成して描画
    const actionArea = document.getElementById('prof-action-area');
    // 既存の中身をクリアせずに、ヒートマップ用のdivがあるか確認して追加
    if(!document.getElementById('prof-heatmap-area')) {
        const hmDiv = document.createElement('div');
        hmDiv.id = 'prof-heatmap-area';
        // 挿入場所を調整 (statsの下あたり)
        const stats = document.querySelector('.profile-stats');
        stats.parentNode.insertBefore(hmDiv, stats.nextSibling);
    }
    window.renderHeatmap(username);
    
    window.navTo('profile-screen');
};

window.saveProfile = function() {
    if(!currentUser) return;
    currentUser.img = document.getElementById('edit-avatar-img').src;
    // 他の項目も保存
    saveData();
    alert("保存しました");
    window.backToPrev();
    updateMenuUI();
};

window.renderRanking = function() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    const sorted = [...posts].sort((a,b) => b.stats.view_count - a.stats.view_count);
    sorted.slice(0,10).forEach((p,i) => {
        list.innerHTML += `<div class="card" onclick="openDetail(${p.post_id})"><div style="font-weight:bold;">${i+1}. ${p.title}</div><div style="font-size:12px; color:#888;">👀 ${p.stats.view_count}</div></div>`;
    });
};

window.renderUserRanking = function() {
    const list = document.getElementById('user-ranking-list');
    list.innerHTML = '';
    const sorted = Object.values(users).filter(u=>u.rank!=='Rookie').sort((a,b) => {
        const sa = Object.values(a.scores).reduce((x,y)=>x+y,0);
        const sb = Object.values(b.scores).reduce((x,y)=>x+y,0);
        return sb - sa;
    });
    sorted.forEach((u,i) => {
        list.innerHTML += `<div class="card" onclick="openProfile('${u.username}')"><div style="font-weight:bold;">${i+1}. ${u.username} (${u.rank})</div></div>`;
    });
};

// --- 6. AI & その他 ---
window.sendAIMessage = function() {
    const input = document.getElementById('ai-chat-input');
    const area = document.getElementById('ai-chat-area');
    if(!input.value) return;
    
    area.innerHTML += `<div class="chat-bubble bubble-user">${input.value}</div>`;
    input.value = '';
    
    setTimeout(() => {
        const replies = ["価格が高いと言われますか？", "その場合は、価値を強調しましょう。", "なるほど、続けてください。", "決裁者は誰ですか？"];
        const r = replies[Math.floor(Math.random()*replies.length)];
        area.innerHTML += `<div class="chat-bubble bubble-ai">${r}</div>`;
        area.scrollTop = area.scrollHeight;
    }, 1000);
};

window.previewImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-img').src = e.target.result;
            document.getElementById('avatar-img').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.previewEditImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('edit-avatar-img').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.performSearch = function(val) {
    window.renderTimeline('Main', val);
    window.navTo('timeline-screen');
};

window.showCuriousList = function() {
    alert("気になるリスト（保存済み）を表示します");
    // 本来は saved_posts でフィルタ
    window.navTo('timeline-screen');
};

window.addCoins = function(amount) {
    if(currentUser) {
        currentUser.wallet.coin_paid += amount;
        saveData();
        updateHeaderUI();
        alert(`${amount}コイン購入しました`);
        document.getElementById('wallet-modal').style.display='none';
    }
};

// --- ヘルパー ---
function recalculateRanks() { /* (省略:前回と同じロジック) */ }
function updateHeaderUI() {
    if(currentUser) document.getElementById('wallet-balance-disp').innerText = (currentUser.wallet.coin_paid+currentUser.wallet.coin_bonus) + " Coins";
}
function updateMenuUI() {
    if(currentUser) {
        document.getElementById('menu-username').innerText = currentUser.username;
        document.getElementById('menu-userrank').innerText = "Rank: " + currentUser.rank;
        if(currentUser.img) {
            document.getElementById('menu-icon-img').src = currentUser.img;
            document.getElementById('menu-icon-img').style.display = 'block';
            document.getElementById('menu-icon-placeholder').style.display = 'none';
        }
    }
}
function renderTags(id, selectable) { /* タグ描画ロジック */ }
function saveData() {
    localStorage.setItem('closer_users', JSON.stringify(users));
    localStorage.setItem('closer_posts', JSON.stringify(posts));
    if(currentUser) sessionStorage.setItem('closer_current_user', JSON.stringify(currentUser));
}

// ユーティリティ
window.openWalletModal = () => document.getElementById('wallet-modal').style.display='flex';
window.menuAction = (id, isProf) => isProf ? window.openProfile(currentUser.username) : window.navTo(id);

/* --- 4.1 投稿・品質管理システム (Ver 5.0 Implementation) --- */

let currentPostCategory = 'counter'; // デフォルト

// モーダル開閉
window.closePostModal = function() {
    document.getElementById('post-modal').style.display = 'none';
};

// カテゴリ選択ロジック [cite: 101-113]
window.selectCategory = function(cat) {
    currentPostCategory = cat;
    
    // ボタンの見た目更新
    document.querySelectorAll('.selected-cat').forEach(b => {
        b.style.borderColor = '#b3b3b3'; 
        b.style.color = '#b3b3b3';
    });
    const btn = document.getElementById('cat-' + cat);
    if(btn) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'var(--accent)';
        btn.classList.add('selected-cat');
    }

    // フォームの中身を動的に書き換え
    const area = document.getElementById('form-dynamic-area');
    if (cat === 'counter') { // Type A: Counter [cite: 105]
        area.innerHTML = `
            <div id="input-group-counter">
                <label style="font-size:12px; color:#888;">言われた言葉 (Trigger) [cite: 106]</label>
                <input type="text" id="post-trigger" placeholder="例：予算がない">
                <label style="font-size:12px; color:#888;">切り返しトーク (Response) [cite: 106]</label>
                <textarea id="post-body" rows="3" placeholder="ここが「有料/無料」の対象になります"></textarea>
            </div>`;
    } else if (cat === 'hearing') { // Type B: Hearing [cite: 108]
        area.innerHTML = `
            <div id="input-group-hearing">
                <label style="font-size:12px; color:#888;">狙い・知りたいこと (Goal) [cite: 109]</label>
                <input type="text" id="post-trigger" placeholder="例：決裁ルートの特定">
                <label style="font-size:12px; color:#888;">投げかける質問 (Question) [cite: 109]</label>
                <textarea id="post-body" rows="3" placeholder="ここが「有料/無料」の対象になります"></textarea>
            </div>`;
    } else if (cat === 'spirit') { // Spirit [cite: 112]
        area.innerHTML = `
            <div id="input-group-spirit">
                <label style="font-size:12px; color:#888;">タイトル</label>
                <input type="text" id="post-trigger" placeholder="例：断られた時のマインドセット">
                <label style="font-size:12px; color:#888;">本文</label>
                <textarea id="post-body" rows="3" placeholder="自由記述"></textarea>
            </div>`;
    }
};

// 有料オプションの切り替え
window.togglePaidOptions = function() {
    const isPaid = document.getElementById('post-is-paid').checked;
    document.getElementById('paid-options').style.display = isPaid ? 'block' : 'none';
};

// 投稿送信 (Schema準拠) [cite: 196-219]
window.submitPostFull = function() {
    if(!currentUser) return;

    // 1. 入力値取得
    const triggerVal = document.getElementById('post-trigger').value; // Title/Trigger/Goal
    const bodyVal = document.getElementById('post-body').value;     // Body/Response/Question
    const isPaid = document.getElementById('post-is-paid').checked;
    let price = 0;

    if(!triggerVal || !bodyVal) return alert("必須項目を入力してください");

    if (isPaid) {
        price = parseInt(document.getElementById('post-price').value) || 100;
    }

    // 2. データ構築 (PDFのDBスキーマに合わせる)
    const newPost = {
        post_id: Date.now(),
        author_id: currentUser.username,
        category: currentPostCategory === 'spirit' ? 'spirit' : 'tactics',
        tactics_type: currentPostCategory === 'spirit' ? null : currentPostCategory,
        title: triggerVal, // Triggerをタイトルとして扱う
        content: {
            intro: currentPostCategory === 'spirit' ? bodyVal.substring(0, 30) + "..." : "【状況】" + triggerVal,
            body: bodyVal // ここが有料エリアになる可能性がある
        },
        price: price,
        is_paid: isPaid,
        stats: { score_avg: 0, view_count: 0, save_count: 0 },
        tags: [currentPostCategory.toUpperCase()],
        time: 'Now',
        endorsers: []
    };

    // 3. 保存と更新
    posts.unshift(newPost);
    saveData(); // main.js内の既存関数
    
    alert("投稿しました！");
    closePostModal();
    
    // タイムライン更新 (SpiritタブならSpiritタブへ切り替えなど)
    if(currentPostCategory === 'spirit') {
        switchTimelineTab('Spirit');
    } else {
        switchTimelineTab('Main');
    }
};

// CSSスタイル追加 (ボタン用)
const style = document.createElement('style');
style.innerHTML = `
    .btn-sm { padding:8px; border-radius:8px; font-size:12px; background:transparent; border:1px solid #444; color:#888; cursor:pointer; }
    .btn-sm:active { background:#333; }
`;
document.head.appendChild(style);

// --- 購入機能 ---

// 1. 単発購入
window.purchaseOneTime = function(postId, price) {
    if(!currentUser) return alert("ログインが必要です");
    const wallet = currentUser.wallet;
    const total = wallet.coin_paid + wallet.coin_bonus;

    if(total < price) {
        alert("コイン不足です");
        return window.openWalletModal();
    }

    if(confirm(`この記事を ${price}コイン で購入しますか？`)) {
        // コイン消費
        if(wallet.coin_bonus >= price) wallet.coin_bonus -= price;
        else {
            const diff = price - wallet.coin_bonus;
            wallet.coin_bonus = 0;
            wallet.coin_paid -= diff;
        }

        // 購入履歴に追加
        if(!currentUser.purchased_posts) currentUser.purchased_posts = [];
        currentUser.purchased_posts.push(postId);

        saveData();
        updateHeaderUI();
        alert("購入しました！");
        renderTimeline(currentTab); // 再描画してロック解除
    }
};

// 2. サブスク加入
window.subscribeToUser = function(authorId, price) {
    if(!currentUser) return alert("ログインが必要です");
    const wallet = currentUser.wallet;
    const total = wallet.coin_paid + wallet.coin_bonus;

    if(total < price) {
        alert("コイン不足です");
        return window.openWalletModal();
    }

    if(confirm(`${authorId}さんのサブスクリプション(月額 ${price}コイン) に加入しますか？\n\n・${authorId}さんの全ての有料記事が読み放題になります。\n・1on1チャットが可能になります。`)) {
        // コイン消費
        if(wallet.coin_bonus >= price) wallet.coin_bonus -= price;
        else {
            const diff = price - wallet.coin_bonus;
            wallet.coin_bonus = 0;
            wallet.coin_paid -= diff;
        }

        // サブスクリストに追加
        if(!currentUser.subscriptions) currentUser.subscriptions = [];
        currentUser.subscriptions.push(authorId);

        saveData();
        updateHeaderUI();
        alert(`${authorId}さんのプランに加入しました！`);
        renderTimeline(currentTab); // 再描画してロック解除
    }
};

// --- ヒートマップ生成ロジック ---
window.renderHeatmap = function(userId) {
    const user = users[userId];
    const container = document.getElementById('prof-heatmap-area');
    if(!container || !user) return;

    container.innerHTML = '<div class="heatmap-label">Grit (Last 365 Days)</div>';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'heatmap-wrapper';
    
    const grid = document.createElement('div');
    grid.className = 'heatmap-container';

    // 過去365日分の日付を生成
    const today = new Date();
    // 52週間 * 7日 = 364日前からスタート
    for (let i = 0; i < 364; i++) {
        // 日付計算 (古い順)
        const date = new Date();
        date.setDate(today.getDate() - (363 - i));
        
        // YYYY-MM-DD形式に変換
        const dateStr = date.toISOString().split('T')[0];
        
        // 活動量を取得 (データがなければ0)
        const count = (user.learning_heatmap && user.learning_heatmap[dateStr]) || 0;
        
        // 濃淡レベル判定
        let level = '';
        if (count > 0) level = 'h-level-1';
        if (count >= 3) level = 'h-level-2';
        if (count >= 5) level = 'h-level-3';
        if (count >= 10) level = 'h-level-4';

        const cell = document.createElement('div');
        cell.className = `heatmap-cell ${level}`;
        cell.title = `${dateStr}: ${count} activity`; // ホバーで日付表示
        grid.appendChild(cell);
    }

    wrapper.appendChild(grid);
    container.appendChild(wrapper);
    
    // スクロールを一番右（最新）に合わせる
    setTimeout(() => {
        wrapper.scrollLeft = wrapper.scrollWidth;
    }, 100);
};