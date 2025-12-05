/* * Closer Ver 5.0 Data Schema (Strict PDF Compliance) */

// ユーザーデータ (Firestore: users collection 準拠)
// ユーザーデータ (Firestore: users collection 準拠)
window.initialUsers = {
    'Fafa': {
        uid: 'user_001',
        username: 'Fafa',
        rank: 'SS', 
        scores: { defense: 4.8, offense: 4.9, grit: 5.0, spirit: 4.5 },
        membership: 'premium',
        wallet: { coin_paid: 1500, coin_bonus: 300 },
        permissions: { 
            can_post: true, 
            is_pro_attempted: false,
            unlock_progress: { read: 100, save: 50, login_streak: 365 }
        },
        img: '', 
        bio: '営業は確率論ではなく、技術です。',
        products: ['通信', 'SaaS'],
        following: ['Sato'],
        learning_heatmap: { '2025-12-01': 15, '2025-12-02': 10, '2025-12-05': 20 },
        settings: { is_private: false, allow_scout: true },
        // ▼ 追加項目 ▼
        subscriptions: [], 
        purchased_posts: [], 
        my_sub_price: 500 
    },
    'Sato': {
        uid: 'user_002',
        username: 'Sato',
        rank: 'S', 
        scores: { defense: 4.2, offense: 3.8, grit: 4.5, spirit: 3.0 },
        membership: 'standard',
        wallet: { coin_paid: 0, coin_bonus: 100 },
        permissions: { 
            can_post: true, 
            is_pro_attempted: false,
            unlock_progress: { read: 50, save: 20, login_streak: 100 }
        },
        img: '',
        bio: '現場叩き上げ。不動産営業。',
        products: ['不動産'],
        following: [],
        learning_heatmap: { '2025-12-04': 5, '2025-12-05': 5 },
        settings: { is_private: false, allow_scout: true },
        // ▼ 追加項目 ▼
        subscriptions: [], 
        purchased_posts: [], 
        my_sub_price: 300 
    },
    'Tanaka': { 
        uid: 'user_003',
        username: 'Tanaka',
        rank: 'A',
        scores: { defense: 3.8, offense: 3.5, grit: 4.0, spirit: 3.5 },
        membership: 'free',
        wallet: { coin_paid: 0, coin_bonus: 0 },
        permissions: { can_post: true, unlock_progress: { read: 30, save: 10, login_streak: 10 } },
        img: '', bio: 'Aランク目指してます', products: ['人材'], following: ['Fafa'], learning_heatmap: {},
        settings: { is_private: false, allow_scout: true },
        // ▼ 追加項目 ▼
        subscriptions: [], 
        purchased_posts: [], 
        my_sub_price: 0 
    },
    'RookieUser': { 
        uid: 'user_999',
        username: 'RookieUser',
        rank: 'Rookie', 
        scores: { defense: 0, offense: 0, grit: 0, spirit: 0 },
        membership: 'free',
        wallet: { coin_paid: 0, coin_bonus: 500 }, 
        permissions: { 
            can_post: false, 
            is_pro_attempted: false,
            unlock_progress: { read: 5, save: 1, login_streak: 1 } 
        },
        img: '',
        bio: '勉強用アカウントです。',
        products: ['OA機器'],
        following: ['Fafa'],
        learning_heatmap: { '2025-12-05': 1 },
        settings: { is_private: false, allow_scout: false },
        // ▼ 追加項目 ▼
        subscriptions: [], 
        purchased_posts: [], 
        my_sub_price: 0 
    }
};

// 投稿データ (Firestore: posts collection 準拠)
window.initialPosts = [
    {
        post_id: 101,
        author_id: 'Fafa',
        category: 'tactics',
        tactics_type: 'counter', // 守り
        title: 'VS「資料だけ送って」', // Trigger (Input form)
        content: {
            intro: 'テレアポで最も多い断り文句。これを真に受けて資料を送っても読まれません。',
            body: '「承知いたしました。ただ、資料が用途別に3種類ございまして、御社の状況ですとAかBか判断したいため、1点だけ伺ってもよろしいでしょうか？」と二者択一で引き止めます。'
        },
        price: 0, // Free
        is_paid: false,
        stats: { score_avg: 4.8, view_count: 1250, save_count: 300 },
        tags: ['通信', 'テレアポ', 'Counter'],
        endorsers: ['Sato'], // Sランク推奨者
        time: '10分前'
    },
    {
        post_id: 102,
        author_id: 'Sato',
        category: 'spirit', // マインド
        tactics_type: null,
        title: '断られてからが営業',
        content: {
            intro: '100件かけて1件取れるかどうかの世界。',
            body: 'いちいち傷ついていたら持ちません。断られた数＝成長の糧と考えましょう。'
        },
        price: 0,
        is_paid: false,
        stats: { score_avg: 3.2, view_count: 500, save_count: 45 }, // 4.0未満なのでEliteには出ない
        tags: ['マインド', 'Spirit'],
        endorsers: [],
        time: '1時間前'
    },
    {
        post_id: 103,
        author_id: 'Fafa',
        category: 'tactics',
        tactics_type: 'hearing', // 攻め
        title: '【有料級】決裁者を見抜く質問',
        content: {
            intro: '担当者といくら話しても契約にはなりません。早い段階で決裁フローを把握する必要があります。',
            body: '「このプロジェクトの最終的なGOサインを出されるのは、〇〇部長でしょうか？それとも社長ご自身でしょうか？」と、あえて具体名を挙げて聞きます。役職を間違えることで訂正を誘うのがコツです。' // Paid part
        },
        price: 500, // Paid
        is_paid: true,
        stats: { score_avg: 4.9, view_count: 2000, save_count: 600 },
        tags: ['全般', 'クロージング', 'Hearing'],
        endorsers: ['Sato', 'Tanaka'], 
        time: '3時間前'
    }
];