// Firebase Configuration (Same as App)
const firebaseConfig = {
    apiKey: "AIzaSyA8Cdcc03znEHPLER5m5a0eD0Yz1dXSoxY",
    authDomain: "tasks-earning-app-2.firebaseapp.com",
    databaseURL: "https://tasks-earning-app-2-default-rtdb.firebaseio.com",
    projectId: "tasks-earning-app-2"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Supabase Configuration (Use ONLY for Storage)
const supabaseUrl = 'https://bsrtnjogzdihvqimocew.supabase.co'; // Example: https://xyz.supabase.co
const supabaseKey = 'sb_publishable_3OV-DVgmyP9uUEc5Mk4kFg_SrzTqEFR';
let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("Supabase library not loaded. Storage features will be unavailable.");
    }
} catch (e) {
    console.error("Supabase Init Error:", e);
}

const BUCKET_NAME = 'Tasks earning app';

const ADMIN_PASSWORD = "admin"; // Set the desired admin password here
let advancedSettings = {};

document.addEventListener('DOMContentLoaded', () => {
    // Check if previously logged in
    if(localStorage.getItem('admin_logged_in') === 'true') {
        unlockAdmin();
    }
});

function checkAdminPassword() {
    const input = document.getElementById('admin-password').value.trim();
    const errorEl = document.getElementById('login-error');
    
    if(input === ADMIN_PASSWORD) {
        localStorage.setItem('admin_logged_in', 'true');
        unlockAdmin();
    } else {
        errorEl.style.display = 'block';
    }
}

function unlockAdmin() {
    console.log("Unlocking Admin Panel...");
    document.getElementById('admin-login-overlay').style.display = 'none';
    document.getElementById('admin-content-wrapper').style.display = 'block';
    document.body.style.overflow = 'auto';
    
    // Load data only after login
    try {
        loadUsers();
        loadRedeems();
        loadPromos();
        loadReferrals();
        loadSettings();
        loadFakeRankings();
        loadNotificationHistory();
        loadAnalytics();
        loadGlobalLogs();
        loadSupportMessages();
        loadUpdateSettings();
        loadWithdrawMethods();
        loadScratchSettings();
        loadRankingManager();
        loadDashboardRanking();
        loadTasksManager();
        loadOfferClicks();
    } catch (e) {
        console.error("Error loading admin data:", e);
    }
}

// UI Navigation
function switchTab(tabId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    
    const targetSec = document.getElementById('sec-' + tabId);
    if(targetSec) targetSec.classList.add('active');
    
    // Handle active state for nav links manually if event is missing
    const currentEvent = window.event;
    if (currentEvent) {
        let navBtn = currentEvent.currentTarget || currentEvent.target;
        if (navBtn && (navBtn.tagName === 'I' || navBtn.tagName === 'SPAN')) navBtn = navBtn.parentElement;
        if (navBtn && navBtn.classList.contains('nav-link')) navBtn.classList.add('active');
    }
}

// ---------------------- USERS MANAGEMENT ----------------------

function loadUsers() {
    db.ref('users').on('value', (snapshot) => {
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach((child) => {
            const uid = child.key;
            const data = child.val();
            const statusClass = data.status === 'blocked' ? 'badge-blocked' : 'badge-active';
            const statusText = data.status === 'blocked' ? 'Blocked' : 'Active';
            
            const blockBtn = data.status === 'blocked' 
                ? `<button class="btn btn-green" onclick="setUserStatus('${uid}', 'active')">Unblock</button>`
                : `<button class="btn btn-red" onclick="setUserStatus('${uid}', 'blocked')">Block</button>`;

            const userIdentifier = data.email || uid;
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${userIdentifier}</strong></td>
                    <td>${data.balance || 0}</td>
                    <td>${data.total_earned || 0}</td>
                    <td>${data.total_ads || 0}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td class="flex-row">
                        ${blockBtn}
                        <button class="btn ${data.hidden_from_ranking ? 'btn-green' : 'btn-orange'}" onclick="toggleUserRankVisibility('${uid}', ${data.hidden_from_ranking || false})">
                            ${data.hidden_from_ranking ? 'Show Rank' : 'Hide Rank'}
                        </button>
                        <button class="btn btn-blue" onclick="sendCoins('${uid}')">+ Add</button>
                        <button class="btn btn-red" onclick="deductCoinsAdmin('${uid}')">- Cut</button>
                        <button class="btn btn-gray" onclick="viewUserHistory('${uid}')"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
                    </td>
                </tr>
            `;
        });
    });
}

function setUserStatus(uid, status) {
    db.ref('users/' + uid).update({ status: status });
}

function toggleUserRankVisibility(uid, currentHidden) {
    db.ref('users/' + uid).update({ hidden_from_ranking: !currentHidden });
}

function sendCoins(uid) {
    const amountStr = prompt("Enter amount of coins to send:");
    if(!amountStr) return;
    const amount = parseInt(amountStr);
    if(isNaN(amount) || amount <= 0) {
        alert("Invalid amount");
        return;
    }
    
    db.ref('users/' + uid).once('value').then(snap => {
        const user = snap.val();
        if(user) {
            db.ref('users/' + uid).update({
                balance: (user.balance || 0) + amount,
                total_earned: (user.total_earned || 0) + amount
            });
            // Log history
            db.ref('users/' + uid + '/history').push({
                type: 'credit',
                amount: amount,
                reason: 'Added by Admin',
                timestamp: Date.now()
            });
            alert(`Successfully sent ${amount} coins to ${uid}`);
        }
    });
}

function deductCoinsAdmin(uid) {
    const amountStr = prompt("Enter amount of coins to deduct (Balance Cut):");
    if(!amountStr) return;
    const amount = parseInt(amountStr);
    if(isNaN(amount) || amount <= 0) return alert("Invalid amount");
    
    db.ref('users/' + uid).once('value').then(snap => {
        const user = snap.val();
        if(user) {
            const current = user.balance || 0;
            db.ref('users/' + uid).update({
                balance: Math.max(0, current - amount)
            });
            // Log history
            db.ref('users/' + uid + '/history').push({
                type: 'debit',
                amount: amount,
                reason: 'Deducted by Admin (Balance Cut)',
                timestamp: Date.now()
            });
            alert(`Successfully deducted ${amount} coins from ${uid}`);
        }
    });
}

// ---------------------- REDEEM MANAGEMENT ----------------------

function loadRedeems() {
    db.ref('redeem_requests').on('value', (snapshot) => {
        const tbody = document.querySelector('#redeem-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach((child) => {
            const reqId = child.key;
            const data = child.val();
            const uid = data.uid;
            
            // Fetch User Email for this request
            db.ref('users/' + uid + '/email').once('value').then(emailSnap => {
                const email = emailSnap.val() || uid;
                const date = new Date(data.timestamp).toLocaleDateString();
                const statusClass = data.status === 'completed' ? 'badge-active' : (data.status === 'rejected' ? 'badge-blocked' : 'badge-pending');
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${email}</td>
                    <td>${data.method || 'N/A'}</td>
                    <td>${data.amount}</td>
                    <td>${date}</td>
                    <td><span class="badge ${statusClass}">${data.status ? data.status.toUpperCase() : 'PENDING'}</span></td>
                    <td class="flex-row">
                        ${data.status === 'pending' ? `
                            <button class="btn btn-green" onclick="handleRedeem('${reqId}', 'completed')">Approve</button>
                            <button class="btn btn-red" onclick="handleRedeem('${reqId}', 'rejected')">Reject</button>
                        ` : '-'}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    });
}

function handleRedeem(reqId, status) {
    if(confirm(`Are you sure you want to mark as ${status}?`)) {
        db.ref('redeem_requests/' + reqId).update({ status: status, updated_at: Date.now() });
        loadAnalytics();
    }
}

// ---------------------- REFERRALS MANAGEMENT ----------------------

function loadReferrals() {
    db.ref('users').on('value', (snapshot) => {
        let totalSystemReferrals = 0;
        let totalSystemCommission = 0;
        let referrers = [];

        snapshot.forEach((child) => {
            const uid = child.key;
            const data = child.val();
            
            const refs = data.total_referrals || 0;
            const comms = data.referral_earnings || 0;

            if (refs > 0 || comms > 0) {
                totalSystemReferrals += refs;
                totalSystemCommission += comms;
                referrers.push({ uid, name: data.name || 'Unknown', refs, comms });
            }
        });

        // Update top metrics
        const totalRefEl = document.getElementById('admin-total-referrals');
        const totalCommEl = document.getElementById('admin-total-commission');
        if(totalRefEl) totalRefEl.innerText = totalSystemReferrals.toLocaleString();
        if(totalCommEl) totalCommEl.innerText = totalSystemCommission.toLocaleString();

        // Sort by referrals descending
        referrers.sort((a, b) => b.refs - a.refs);

        const tbody = document.getElementById('top-referrers-body');
        if(tbody) {
            tbody.innerHTML = '';
            referrers.slice(0, 100).forEach((user, index) => { // Top 100
                tbody.innerHTML += `
                    <tr>
                        <td><strong>#${index + 1}</strong></td>
                        <td>${user.uid}</td>
                        <td>${user.name}</td>
                        <td>${user.refs}</td>
                        <td style="color:#d946ef; font-weight:bold;">${user.comms.toLocaleString()} <i class="fa-solid fa-gem" style="font-size:12px;"></i></td>
                    </tr>
                `;
            });
            if(referrers.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No referrals yet.</td></tr>`;
            }
        }
    });
}

// ---------------------- BONUS CODES MANAGEMENT ----------------------

function createPromo() {
    const code = document.getElementById('promo-name').value.trim().toUpperCase();
    const reward = parseInt(document.getElementById('promo-reward').value);
    const max = parseInt(document.getElementById('promo-max').value);
    
    if(!code || isNaN(reward) || isNaN(max)) {
        alert("Please fill all fields correctly.");
        return;
    }
    
    db.ref('promo_codes/' + code).set({
        reward: reward,
        max_uses: max,
        current_uses: 0,
        status: 'active',
        created_at: Date.now()
    }).then(() => {
        alert("Bonus code created!");
        document.getElementById('promo-name').value = '';
        document.getElementById('promo-reward').value = '';
        document.getElementById('promo-max').value = '';
    });
}

function loadPromos() {
    db.ref('promo_codes').on('value', (snapshot) => {
        const tbody = document.querySelector('#promo-table tbody');
        tbody.innerHTML = '';
        
        snapshot.forEach(child => {
            const code = child.key;
            const data = child.val();
            const statusClass = data.status === 'active' ? 'badge-active' : 'badge-blocked';
            
            const disableBtn = data.status === 'active' 
                ? `<button class="btn btn-red" onclick="setPromoStatus('${code}', 'inactive')">Disable</button>`
                : `<button class="btn btn-green" onclick="setPromoStatus('${code}', 'active')">Enable</button>`;

            tbody.innerHTML += `
                <tr>
                    <td><strong>${code}</strong></td>
                    <td>${data.reward} Coins</td>
                    <td>${data.current_uses || 0} / ${data.max_uses}</td>
                    <td><span class="badge ${statusClass}">${data.status.toUpperCase()}</span></td>
                    <td>${disableBtn}</td>
                </tr>
            `;
        });
    });
}

function setPromoStatus(code, status) {
    db.ref('promo_codes/' + code).update({ status: status });
}

// ---------------------- NOTIFICATIONS MANAGEMENT ----------------------

function toggleUidInput() {
    const target = document.getElementById('notif-target').value;
    const uidInput = document.getElementById('notif-uid');
    if(target === 'specific') {
        uidInput.style.display = 'block';
    } else {
        uidInput.style.display = 'none';
        uidInput.value = '';
    }
}

async function getFCMAccessToken(serviceAccount) {
    try {
        const header = { alg: "RS256", typ: "JWT" };
        const now = Math.floor(Date.now() / 1000);
        const claims = {
            iss: serviceAccount.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: "https://oauth2.googleapis.com/token",
            exp: now + 3600,
            iat: now
        };

        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(claims);
        const privateKey = serviceAccount.private_key;

        if (!privateKey || !serviceAccount.client_email) {
            throw new Error("Missing private_key or client_email in Service Account JSON.");
        }

        const sJWT = KJUR.jws.JWS.sign("RS256", sHeader, sPayload, privateKey);

        const tokenUrl = "https://oauth2.googleapis.com/token";
        const body = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`;

        const proxies = [
            (url) => `https://cors-anywhere.herokuapp.com/${url}`,
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];

        let response = null;
        let lastError = null;
        let usedProxy = "";

        for(const getProxyUrl of proxies) {
            try {
                usedProxy = getProxyUrl(tokenUrl);
                console.log("Trying proxy for token:", usedProxy);
                response = await fetch(usedProxy, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: body
                });
                if(response.ok) break;
                else lastError = await response.text();
            } catch (e) {
                lastError = e.message;
            }
        }

        if(!response || !response.ok) {
            if(lastError && lastError.includes("Missing required request header. Must specify one of: origin,x-requested-with")) {
                alert("🔴 CORS BLOCK: Please visit https://cors-anywhere.herokuapp.com/corsdemo and click 'Request temporary access' to unblock your browser.");
            }
            throw new Error(`All proxies failed. Last used: ${usedProxy}. Error: ${lastError}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error("Google OAuth Error: " + (data.error_description || data.error));
        }
        return data.access_token;
    } catch (e) {
        console.error("Token Generation Error:", e);
        alert("CRITICAL Token Error: " + e.message);
        return null;
    }
}

async function sendNotification() {
    const title = document.getElementById('notif-title').value.trim();
    const message = document.getElementById('notif-msg').value.trim();
    const imageUrl = document.getElementById('notif-img').value.trim();
    const targetType = document.getElementById('notif-target').value;
    let targetUid = document.getElementById('notif-uid').value.trim();
    
    if(!title || !message) {
        alert("Please enter title and message.");
        return;
    }

    const doPush = document.getElementById('notif-send-push').checked;
    const doInApp = document.getElementById('notif-send-inapp').checked;

    if(!doPush && !doInApp) {
        alert("Please select at least one delivery method (Push or In-App).");
        return;
    }

    // Save to History (In-App) - DO THIS FIRST
    if(doInApp) {
        // Resolve specific UID if needed before saving
        let finalTarget = targetType;
        if(targetType === 'specific') {
            const usersSnap = await db.ref('users').orderByChild('email').equalTo(targetUid.trim().toLowerCase()).once('value');
            if(usersSnap.exists()) {
                usersSnap.forEach(c => { finalTarget = c.key; });
            }
        }
        db.ref('notifications').push({
            title, message, image: imageUrl || null, target: finalTarget, timestamp: Date.now()
        });
    }

    const btn = document.querySelector("#sec-notifs .btn-blue");
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        if(doPush) {
            const rawJson = (advancedSettings.fcm_json || '').trim();
            if (!rawJson) {
                alert("CRITICAL: Service Account JSON is empty! Go to Developer Settings and paste your Service Account JSON.");
                return;
            }

            if (rawJson.includes("apiKey")) {
                alert("ERROR: You pasted the wrong JSON (Firebase Config). Please paste 'Service Account JSON' from Firebase Console > Service Accounts.");
                return;
            }

            const serviceAccount = JSON.parse(rawJson);
            const accessToken = await getFCMAccessToken(serviceAccount);
            if(!accessToken) {
                alert("Failed to generate Google OAuth Access Token. Check console.");
                return;
            }

            const sendFCMv1 = async (target, isTopic = false) => {
                const baseUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
                const payload = {
                    message: {
                        notification: { title, body: message },
                        data: { title, message, image: imageUrl || "", screen: "home-screen" },
                        android: {
                            priority: "high",
                            notification: {
                                channel_id: "default",
                                icon: "ic_stat_name",
                                sound: "default"
                            }
                        },
                        apns: {
                            payload: {
                                aps: {
                                    alert: { title, body: message },
                                    sound: "default",
                                    badge: 1
                                }
                            }
                        }
                    }
                };
                if(imageUrl) payload.message.notification.image = imageUrl;
                if(isTopic) payload.message.topic = target;
                else payload.message.token = target;

                const proxies = [
                    (url) => `https://cors-anywhere.herokuapp.com/${url}`,
                    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
                    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
                ];

                let response = null;
                let lastError = null;

                for(const getProxyUrl of proxies) {
                    try {
                        const proxyUrl = getProxyUrl(baseUrl);
                        console.log("Trying proxy for FCM send:", proxyUrl);
                        response = await fetch(proxyUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
                            body: JSON.stringify(payload)
                        });
                        if(response.ok) break;
                        else lastError = await response.text();
                    } catch (e) {
                        lastError = e.message;
                    }
                }

                if (response && response.ok) {
                    return true;
                } else {
                    console.error("FCM Send Error across all proxies:", lastError);
                    alert("FCM Error: All proxies failed. Last error: " + lastError);
                    return false;
                }
            };

            if(targetType === 'all') {
                pushSent = await sendFCMv1('all_users', true);
            } else if(targetType === 'specific') {
                const searchVal = targetUid.trim().toLowerCase();
                let usersSnap = await db.ref('users').orderByChild('email').equalTo(searchVal).once('value');
                
                if(!usersSnap.exists()) {
                    usersSnap = await db.ref('users').orderByChild('name')
                        .startAt(targetUid.trim())
                        .endAt(targetUid.trim() + "\uf8ff")
                        .once('value');
                }

                if(usersSnap.exists()) {
                    let foundData = null;
                    usersSnap.forEach(c => { foundData = c.val(); });
                    if(foundData && foundData.fcm_token) {
                        pushSent = await sendFCMv1(foundData.fcm_token);
                    } else {
                        alert("User found but no FCM token registered for this user.");
                    }
                } else {
                    alert("User not found by email or name!");
                }
            }
        }

        let successMsg = "";
        if(pushSent) successMsg += "✅ Push Notification Sent\n";
        if(doInApp) successMsg += "📝 Saved to In-App History\n";
        
        if (successMsg) {
            alert("Success!\n" + successMsg);
            document.getElementById('notif-title').value = '';
            document.getElementById('notif-msg').value = '';
        } else if(doPush) {
            alert("Failed to send Push Notification. Check Developer Console for details.");
        }
    } catch (err) {
        console.error("Notification Flow Error:", err);
        alert("Notification Error: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function loadNotificationHistory() {
    db.ref('notifications').on('value', snap => {
        const tbody = document.getElementById('notif-history-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        let list = [];
        snap.forEach(child => {
            list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        list.forEach(n => {
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(n.timestamp).toLocaleDateString()}</td>
                    <td>${n.target}</td>
                    <td>${n.title}</td>
                    <td><button class="btn btn-red" onclick="deleteNotification('${n.id}')">Delete</button></td>
                </tr>
            `;
        });
    });
}

function deleteNotification(id) {
    if(confirm("Delete this notification? It will be removed for everyone.")) {
        db.ref('notifications/' + id).remove();
    }
}

function viewUserHistory(uid) {
    document.getElementById('history-modal').style.display = 'flex';
    const titleEl = document.getElementById('history-user-title');
    titleEl.innerText = "History for: " + uid;
    
    // Fetch email for better display
    db.ref('users/' + uid).once('value').then(snap => {
        const data = snap.val();
        if(data) {
            const today = new Date().toDateString();
            const todayAds = (data.ads_today && data.ads_today[today]) || 0;
            const totalAds = data.total_ads || 0;
            titleEl.innerHTML = `History for: ${data.email || uid}<br><small style="color:#6b7280;">Ads Watched: Today: <b>${todayAds}</b> | Total: <b>${totalAds}</b></small>`;
        }
    });

    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    db.ref('users/' + uid + '/history').once('value').then(snap => {
        tbody.innerHTML = '';
        if(!snap.exists()) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No history found.</td></tr>';
            return;
        }
        let logs = [];
        snap.forEach(child => { logs.push(child.val()); });
        logs.sort((a, b) => b.timestamp - a.timestamp);
        logs.forEach(l => {
            const date = new Date(l.timestamp).toLocaleString();
            const color = l.type === 'credit' ? '#10b981' : '#ef4444';
            tbody.innerHTML += `
                <tr>
                    <td><span style="color:${color}; font-weight:bold;">${l.type.toUpperCase()}</span></td>
                    <td>${l.amount}</td>
                    <td>${l.reason}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
    });
}

function closeHistoryModal() {
    document.getElementById('history-modal').style.display = 'none';
}

function unbanUser(uid) {
    if(confirm("Are you sure you want to UNBAN this user?")) {
        db.ref('users/' + uid).update({ banned: false }).then(() => {
            alert("User unbanned successfully.");
        });
    }
}

function banUser(uid) {
    if(confirm("Are you sure you want to BAN this user? They will be logged out immediately.")) {
        db.ref('users/' + uid).update({ banned: true }).then(() => {
            alert("User banned successfully.");
        });
    }
}

// ---------------------- SETTINGS MANAGEMENT ----------------------

function loadSettings() {
    db.ref('settings/social_links').once('value').then(snap => {
        const links = snap.val();
        if(links) {
            document.getElementById('set-facebook').value = links.facebook || '';
            document.getElementById('set-instagram').value = links.instagram || '';
            document.getElementById('set-telegram').value = links.telegram || '';
            document.getElementById('set-youtube').value = links.youtube || '';
            document.getElementById('set-rateus').value = links.rateus || '';
        }
    });

    db.ref('settings/spin_values').once('value').then(snap => {
        const values = snap.val();
        if(values && Array.isArray(values)) {
            values.forEach((v, i) => {
                const input = document.getElementById(`spin-${i}`);
                if(input) input.value = v;
            });
        }
    });

    db.ref('settings/spin_probabilities').once('value').then(snap => {
        const probs = snap.val();
        if(probs && Array.isArray(probs)) {
            probs.forEach((p, i) => {
                const input = document.getElementById(`prob-${i}`);
                if(input) input.value = p;
            });
        }
    });

    db.ref('settings/referral').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            document.getElementById('refer-reward-val').value = data.reward || 500;
            if(data.rules) {
                document.getElementById('refer-rules-text').value = data.rules.join('\n');
            }
            if(data.milestones) {
                const container = document.getElementById('milestones-container');
                container.innerHTML = '';
                data.milestones.forEach(m => {
                    const row = document.createElement('div');
                    row.className = 'form-group';
                    row.style.display = 'flex';
                    row.style.gap = '10px';
                    row.style.marginBottom = '10px';
                    row.innerHTML = `
                        <input type="number" placeholder="Tasks Required" class="mile-tasks" style="flex:1" value="${m.tasks}">
                        <input type="number" placeholder="Reward Coins" class="mile-reward" style="flex:1" value="${m.reward}">
                    `;
                    container.appendChild(row);
                });
            }
        }
    });

    db.ref('settings/streak_rewards').once('value').then(snap => {
        const values = snap.val();
        if(values && Array.isArray(values)) {
            values.forEach((v, i) => {
                const input = document.getElementById(`strew-${i}`);
                if(input) input.value = v;
            });
        }
    });

    db.ref('settings/app_content').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            document.getElementById('set-refer-text').value = data.refer_text || '';
            document.getElementById('img-avatar').value = data.img_avatar || '';
            document.getElementById('img-spin').value = data.img_spin || '';
            document.getElementById('img-invite').value = data.img_invite || '';
            document.getElementById('img-streak').value = data.img_streak || '';
        }
    });

    db.ref('settings/economy').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            document.getElementById('set-app-url').value = data.app_url || '';
            document.getElementById('set-coin-rate').value = data.coin_rate || '';
        }
    });

    db.ref('settings/contact').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            document.getElementById('set-support-email').value = data.email || '';
            document.getElementById('set-support-whatsapp').value = data.whatsapp || '';
            document.getElementById('set-support-phone').value = data.phone || '';
        }
    });

    db.ref('settings/daily_checkin').once('value').then(snap => {
        const data = snap.val();
        if(data && data.tiers) {
            data.tiers.forEach((t, i) => {
                const amtInput = document.getElementById(`checkin-amt-${i+1}`);
                const probInput = document.getElementById(`checkin-prob-${i+1}`);
                if(amtInput) amtInput.value = t.amount;
                if(probInput) probInput.value = t.chance;
            });
        }
    });


    db.ref('settings/advanced').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            advancedSettings = data; // FIX: Assign loaded data to global variable
            document.getElementById('set-maintenance').checked = data.maintenance_mode || false;
            document.getElementById('set-maintenance-msg').value = data.maintenance_msg || '';
            document.getElementById('set-ad-banner').value = data.ad_banner || '';
            document.getElementById('set-ad-inter').value = data.ad_inter || '';
            document.getElementById('set-ad-reward').value = data.ad_reward || '';
            document.getElementById('set-fcm-json').value = data.fcm_json || '';
            document.getElementById('set-privacy-url').value = data.privacy_url || '';
            
            // Super Offer Settings
            document.getElementById('set-offer-daily-limit').value = data.daily_limit || 10;
            document.getElementById('set-offer-cooldown-mins').value = data.cooldown_mins || 0;
            document.getElementById('set-offer-count').value = data.offer_count || 2;
            document.getElementById('set-offer-status').value = data.status || 'active';
            
            // Render Slot 1 Tiers
            const s1Container = document.getElementById('slot-1-tiers-container');
            if(s1Container) {
                s1Container.innerHTML = '';
                if(data.slot_1_tiers && Array.isArray(data.slot_1_tiers)) {
                    data.slot_1_tiers.forEach(t => addSuperOfferRow(1, t));
                } else {
                    addSuperOfferRow(1, { min_gems: 10, max_gems: 20, min_coins: 500, max_coins: 1000, chance: 100 });
                }
            }
            
            // Render Slot 2 Tiers
            const s2Container = document.getElementById('slot-2-tiers-container');
            if(s2Container) {
                s2Container.innerHTML = '';
                if(data.slot_2_tiers && Array.isArray(data.slot_2_tiers)) {
                    data.slot_2_tiers.forEach(t => addSuperOfferRow(2, t));
                } else {
                    addSuperOfferRow(2, { min_gems: 20, max_gems: 50, min_coins: 1000, max_coins: 2000, chance: 100 });
                }
            }
        }
    });
}

function addSuperOfferRow(slotNum, data = {}) {
    const container = document.getElementById(`slot-${slotNum}-tiers-container`);
    if(!container) return;
    
    const row = document.createElement('div');
    row.className = 'super-offer-tier-row';
    row.innerHTML = `
        <div><label>Min Gems</label><input type="number" class="t-min-gems" value="${data.min_gems || 0}"></div>
        <div><label>Max Gems</label><input type="number" class="t-max-gems" value="${data.max_gems || 0}"></div>
        <div><label>Min Coins</label><input type="number" class="t-min-coins" value="${data.min_coins || 0}"></div>
        <div><label>Max Coins</label><input type="number" class="t-max-coins" value="${data.max_coins || 0}"></div>
        <div><label>Chance %</label><input type="number" class="t-chance" value="${data.chance || 0}"></div>
        <button class="btn btn-red" style="padding:8px; width:40px;" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function saveAdvancedSettings() {
    const getTiers = (slotNum) => {
        const tiers = [];
        const rows = document.querySelectorAll(`#slot-${slotNum}-tiers-container .super-offer-tier-row`);
        rows.forEach(row => {
            tiers.push({
                min_gems: parseInt(row.querySelector('.t-min-gems').value) || 0,
                max_gems: parseInt(row.querySelector('.t-max-gems').value) || 0,
                min_coins: parseInt(row.querySelector('.t-min-coins').value) || 0,
                max_coins: parseInt(row.querySelector('.t-max-coins').value) || 0,
                chance: parseInt(row.querySelector('.t-chance').value) || 0
            });
        });
        return tiers;
    };

    const s1Tiers = getTiers(1);
    const s2Tiers = getTiers(2);

    const data = {
        maintenance_mode: document.getElementById('set-maintenance').checked,
        maintenance_msg: document.getElementById('set-maintenance-msg').value.trim(),
        ad_banner: document.getElementById('set-ad-banner').value.trim(),
        ad_inter: document.getElementById('set-ad-inter').value.trim(),
        ad_reward: document.getElementById('set-ad-reward').value.trim(),
        fcm_json: document.getElementById('set-fcm-json').value.trim(),
        privacy_url: document.getElementById('set-privacy-url').value.trim(),
        min_withdraw: parseInt(document.getElementById('set-min-withdraw').value) || 0,
        spin_limit: parseInt(document.getElementById('set-spin-limit').value) || 0,
        math_reward: parseInt(document.getElementById('set-math-reward').value) || 0,
        announcement: document.getElementById('set-announcement').value.trim(),
        startup_notice: document.getElementById('set-startup-notice').value.trim(),
        signup_bonus: parseInt(document.getElementById('set-signup-bonus').value) || 500,
        daily_limit: parseInt(document.getElementById('set-offer-daily-limit').value) || 10,
        cooldown_mins: parseInt(document.getElementById('set-offer-cooldown-mins').value) || 0,
        offer_count: parseInt(document.getElementById('set-offer-count').value) || 2,
        status: document.getElementById('set-offer-status').value,
        slot_1_tiers: s1Tiers,
        slot_2_tiers: s2Tiers
    };

    db.ref('settings/advanced').update(data).then(() => {
        alert("Advanced settings saved successfully!");
        loadSettings(); // Refresh UI
    }).catch(err => {
        alert("Error saving settings: " + err.message);
    });
}

// Analytics and Dashboard Logic

let performanceChart = null;

async function loadAnalytics() {
    const period = document.getElementById('analytics-period') ? document.getElementById('analytics-period').value : 'all';
    const now = new Date();
    const todayStr = now.toDateString();
    const oneDay = 24 * 60 * 60 * 1000;

    db.ref('users').once('value').then(async snap => {
        let totalUsers = 0;
        let totalAdsLifetime = 0;
        let users = [];
        
        let topEarner = { name: 'None', val: 0 };
        let topAds = { name: 'None', val: 0 };
        let topRefs = { name: 'None', val: 0 };
        let mostActive = { name: 'None', val: 0 };

        snap.forEach(child => {
            const u = child.val();
            const uid = child.key;
            totalUsers++;
            lifetimeAds = (u.total_ads || 0);
            totalAdsLifetime += lifetimeAds;
            
            const name = u.name || u.email || uid.substring(0, 8);
            
            let currentVal_Earned = u.total_earned || 0;
            let currentVal_Ads = u.total_ads || 0;
            let currentVal_Refs = u.total_referrals || 0;
            let currentVal_Active = (u.offers_completed || 0) + (u.total_ads || 0);

            // Period Filtering Logic
            if (period !== 'all') {
                // If period is not 'all', we need to check if the user was active or earned in that period
                // For Ads, we have users/{uid}/ads_today/{date}
                // For simplicity in this large loop, we'll use 'total' if period is 'all'
                // and approximate or use specific nodes for other periods.
                
                if (period === 'today') {
                    currentVal_Ads = (u.ads_today && u.ads_today[todayStr]) ? u.ads_today[todayStr] : 0;
                    // For earned/refs today, we'd need history. For now we use 0 or approximate.
                    currentVal_Earned = 0; 
                    currentVal_Refs = 0;
                    currentVal_Active = currentVal_Ads;
                } else if (period === '48h') {
                    const yesterday = new Date(now.getTime() - oneDay).toDateString();
                    currentVal_Ads = ((u.ads_today && u.ads_today[todayStr]) ? u.ads_today[todayStr] : 0) + 
                                     ((u.ads_today && u.ads_today[yesterday]) ? u.ads_today[yesterday] : 0);
                    currentVal_Active = currentVal_Ads;
                }
                // Month/Year would require more complex history traversal
            }

            // Track Top Stats
            if(currentVal_Earned >= topEarner.val) topEarner = { name: name, val: currentVal_Earned };
            if(currentVal_Ads >= topAds.val) topAds = { name: name, val: currentVal_Ads };
            if(currentVal_Refs >= topRefs.val) topRefs = { name: name, val: currentVal_Refs };
            if(currentVal_Active >= mostActive.val) mostActive = { name: name, val: currentVal_Active };

            users.push({
                uid: uid,
                name: name,
                earned: u.total_earned || 0,
                balance: u.balance || 0,
                email: u.email || 'N/A'
            });
        });

        // Update Dashboard Cards
        if(document.getElementById('stat-total-users')) document.getElementById('stat-total-users').innerText = totalUsers.toLocaleString();
        if(document.getElementById('stat-total-ads')) document.getElementById('stat-total-ads').innerText = totalAdsLifetime.toLocaleString();
        if(document.getElementById('stat-total-ads-2')) document.getElementById('stat-total-ads-2').innerText = totalAdsLifetime.toLocaleString();
        
        document.getElementById('stat-top-earner-name').innerText = topEarner.name;
        document.getElementById('stat-top-earner-val').innerText = topEarner.val.toLocaleString();
        
        document.getElementById('stat-top-ads-name').innerText = topAds.name;
        document.getElementById('stat-top-ads-val').innerText = topAds.val.toLocaleString();
        
        document.getElementById('stat-top-referrer-name').innerText = topRefs.name;
        document.getElementById('stat-top-referrer-val').innerText = topRefs.val.toLocaleString();
        
        document.getElementById('stat-most-active-name').innerText = mostActive.name;
        document.getElementById('stat-most-active-val').innerText = mostActive.val.toLocaleString();

        // Populate Top Earners Table (Always show top 10 all time)
        users.sort((a, b) => b.earned - a.earned);
        const earnerBody = document.getElementById('top-earners-body');
        if(earnerBody) {
            earnerBody.innerHTML = '';
            users.slice(0, 10).forEach(u => {
                earnerBody.innerHTML += `
                    <tr>
                        <td><strong>${u.email}</strong><br><small style="color:#64748b;">${u.name}</small></td>
                        <td style="font-weight:700; color:#10b981;">${u.earned.toLocaleString()}</td>
                        <td>${u.balance.toLocaleString()}</td>
                        <td><button class="btn btn-gray" onclick="viewUserHistory('${u.uid}')">View</button></td>
                    </tr>
                `;
            });
        }
    });

    // Handle today's counters
    db.ref('analytics/ads_today/' + todayStr).on('value', snap => {
        const val = snap.val() || 0;
        if(document.getElementById('stat-ads-today')) document.getElementById('stat-ads-today').innerText = val.toLocaleString();
        if(document.getElementById('stat-ads-today-2')) document.getElementById('stat-ads-today-2').innerText = val.toLocaleString();
    });

    db.ref('analytics/signups_today/' + todayStr).on('value', snap => {
        const val = snap.val() || 0;
        if(document.getElementById('stat-new-users-today')) document.getElementById('stat-new-users-today').innerText = val.toLocaleString();
        if(document.getElementById('stat-new-users-today-2')) document.getElementById('stat-new-users-today-2').innerText = val.toLocaleString();
    });

    db.ref('redeem_requests').once('value').then(snap => {
        let totalPaid = 0; let pendingAmount = 0; let pendingCount = 0;
        snap.forEach(child => {
            const req = child.val();
            if(req.status === 'completed') totalPaid += (req.amount || 0);
            if(req.status === 'pending') { pendingAmount += (req.amount || 0); pendingCount++; }
        });
        if(document.getElementById('stat-total-paid')) document.getElementById('stat-total-paid').innerText = totalPaid.toLocaleString();
        if(document.getElementById('stat-total-pending-amount')) document.getElementById('stat-total-pending-amount').innerText = pendingAmount.toLocaleString();
        if(document.getElementById('stat-pending-redeem')) document.getElementById('stat-pending-redeem').innerText = pendingCount.toLocaleString();
    });

    initAnalyticsChart();
}

async function initAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    if(!ctx) return;

    // Get last 7 days
    const dates = [];
    const labels = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toDateString());
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    }

    // Fetch data for each date
    const adData = [];
    const signupData = [];
    for(const date of dates) {
        const adSnap = await db.ref('analytics/ads_today/' + date).once('value');
        const signSnap = await db.ref('analytics/signups_today/' + date).once('value');
        adData.push(adSnap.val() || 0);
        signupData.push(signSnap.val() || 0);
    }

    if(performanceChart) performanceChart.destroy();

    const adGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    adGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    adGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
    adGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const signGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    signGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    signGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
    signGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ad Impressions',
                    data: adData,
                    borderColor: '#3b82f6',
                    borderWidth: 4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#3b82f6',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    backgroundColor: adGradient,
                    tension: 0.45
                },
                {
                    label: 'New Signups',
                    data: signupData,
                    borderColor: '#10b981',
                    borderWidth: 4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    backgroundColor: signGradient,
                    tension: 0.45
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: { 
                        usePointStyle: true, 
                        boxWidth: 10,
                        padding: 20,
                        font: { family: 'Outfit', size: 12, weight: '700' },
                        color: '#64748b'
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
                    bodyFont: { family: 'Outfit', size: 13 },
                    padding: 15,
                    cornerRadius: 12,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += context.parsed.y.toLocaleString();
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9', drawBorder: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { family: 'Outfit', size: 11, weight: '600' },
                        padding: 10,
                        callback: function(value) { return value.toLocaleString(); }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { family: 'Outfit', size: 11, weight: '600' },
                        padding: 10
                    }
                }
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear',
                    from: 1,
                    to: 0.45,
                    loop: false
                }
            }
        }
    });
}

db.ref('settings/advanced').on('value', snap => {
    advancedSettings = snap.val() || {};
    const data = advancedSettings;
    if(data) {
        document.getElementById('set-min-withdraw').value = data.min_withdraw || '';
        document.getElementById('set-spin-limit').value = data.spin_limit || '';
        document.getElementById('set-math-reward').value = data.math_reward || '';
        document.getElementById('set-announcement').value = data.announcement || '';
        document.getElementById('set-startup-notice').value = data.startup_notice || '';
        document.getElementById('set-signup-bonus').value = data.signup_bonus || 500;
        document.getElementById('set-bonus-coins').value = data.bonus_coins || 517;
        document.getElementById('set-bonus-gems').value = data.bonus_gems || 19;
        document.getElementById('set-mega-coins').value = data.mega_coins || 2500;
        document.getElementById('set-mega-gems').value = data.mega_gems || 80;
        document.getElementById('set-privacy-url').value = data.privacy_url || '';
    }
});

function saveSocialLinks() {
    const links = {
        facebook: document.getElementById('set-facebook').value.trim(),
        instagram: document.getElementById('set-instagram').value.trim(),
        telegram: document.getElementById('set-telegram').value.trim(),
        youtube: document.getElementById('set-youtube').value.trim(),
        rateus: document.getElementById('set-rateus').value.trim()
    };
    
    db.ref('settings/social_links').set(links).then(() => {
        alert("Social links saved successfully!");
    });
}

function saveSpinSettings() {
    const values = [];
    const probs = [];
    let totalProb = 0;

    for(let i=0; i<8; i++) {
        const val = parseInt(document.getElementById(`spin-${i}`).value) || 0;
        const prob = parseFloat(document.getElementById(`prob-${i}`).value) || 0;
        values.push(val);
        probs.push(prob);
        totalProb += prob;
    }
    
    if(totalProb !== 100) {
        alert("CRITICAL ERROR: Total probability must be exactly 100%. Currently it is " + totalProb + "%. Please adjust and try again.");
        return;
    }

    Promise.all([
        db.ref('settings/spin_values').set(values),
        db.ref('settings/spin_probabilities').set(probs)
    ]).then(() => {
        alert("SUCCESS: Spin values and winning chances updated successfully!");
    }).catch(err => {
        alert("Error saving settings: " + err.message);
    });
}

function addMilestoneRow() {
    const container = document.getElementById('milestones-container');
    const row = document.createElement('div');
    row.className = 'form-group';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';
    row.innerHTML = `
        <input type="number" placeholder="Tasks Required" class="mile-tasks" style="flex:1">
        <input type="number" placeholder="Reward Coins" class="mile-reward" style="flex:1">
    `;
    container.appendChild(row);
}

function saveReferSettings() {
    const reward = parseInt(document.getElementById('refer-reward-val').value) || 500;
    const rulesRaw = document.getElementById('refer-rules-text').value;
    const rules = rulesRaw.split('\n').map(r => r.trim()).filter(r => r !== '');
    
    const milestones = [];
    const tasksInputs = document.querySelectorAll('.mile-tasks');
    const rewardsInputs = document.querySelectorAll('.mile-reward');
    
    tasksInputs.forEach((inp, i) => {
        const tasks = parseInt(inp.value);
        const rew = parseInt(rewardsInputs[i].value);
        if(tasks && rew) milestones.push({ tasks, reward: rew });
    });
    
    db.ref('settings/referral').set({ reward, milestones, rules }).then(() => {
        alert("Referral settings saved!");
    });
}

function saveStreakRewards() {
    const values = [];
    for(let i=0; i<7; i++) {
        const val = parseInt(document.getElementById(`strew-${i}`).value) || 0;
        values.push(val);
    }
    
    db.ref('settings/streak_rewards').set(values).then(() => {
        alert("Streak rewards saved!");
    });
}

// ---------------------- FAKE RANKINGS ----------------------

function loadFakeRankings() {
    db.ref('settings/fake_rankings').on('value', snap => {
        const tbody = document.getElementById('fake-rankings-body');
        tbody.innerHTML = '';
        snap.forEach(child => {
            const id = child.key;
            const data = child.val();
            tbody.innerHTML += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.balance}</td>
                    <td><button class="btn btn-red" onclick="deleteFakeRanking('${id}')">Delete</button></td>
                </tr>
            `;
        });
    });
}

function addFakeRanking() {
    const name = document.getElementById('fake-name').value;
    const balance = parseInt(document.getElementById('fake-balance').value);
    
    if(!name || isNaN(balance)) return alert("Fill all fields!");
    
    db.ref('settings/fake_rankings').push({ name, balance }).then(() => {
        document.getElementById('fake-name').value = '';
        document.getElementById('fake-balance').value = '';
    });
}

function deleteFakeRanking(id) {
    db.ref('settings/fake_rankings/' + id).remove();
}

function saveAppContent() {
    const data = {
        refer_text: document.getElementById('set-refer-text').value,
        img_avatar: document.getElementById('img-avatar').value,
        img_spin: document.getElementById('img-spin').value,
        img_invite: document.getElementById('img-invite').value,
        img_streak: document.getElementById('img-streak').value
    };
    
    db.ref('settings/app_content').set(data).then(() => {
        alert("App content saved!");
    });
}

// SCRATCH CARD SETTINGS
function loadScratchSettings() {
    db.ref('settings/scratch_card').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            document.getElementById('set-scratch-enabled').checked = data.enabled || false;
            document.getElementById('set-scratch-limit').value = data.limit || 5;
            document.getElementById('set-scratch-min').value = data.reward_min || 10;
            document.getElementById('set-scratch-max').value = data.reward_max || 100;
        }
    });
}

function saveScratchSettings() {
    const data = {
        enabled: document.getElementById('set-scratch-enabled').checked,
        limit: parseInt(document.getElementById('set-scratch-limit').value) || 5,
        reward_min: parseInt(document.getElementById('set-scratch-min').value) || 10,
        reward_max: parseInt(document.getElementById('set-scratch-max').value) || 100
    };
    
    db.ref('settings/scratch_card').set(data).then(() => {
        alert("Scratch Card settings saved!");
    });
}

function saveEconomySettings() {
    const data = {
        app_url: document.getElementById('set-app-url').value,
        coin_rate: parseInt(document.getElementById('set-coin-rate').value)
    };
    db.ref('settings/economy').set(data).then(() => {
        alert("Economy settings saved!");
    });
}

function saveContactSettings() {
    const data = {
        email: document.getElementById('set-support-email').value,
        whatsapp: document.getElementById('set-support-whatsapp').value,
        phone: document.getElementById('set-support-phone').value
    };
    db.ref('settings/contact').set(data).then(() => {
        alert("Contact settings saved!");
    });
}


// ---------------------- ADVANCED FEATURES ----------------------

function filterUsersTable() {
    const input = document.getElementById('user-search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tbody tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

function loadGlobalLogs() {
    const tbody = document.getElementById('global-logs-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading collective history...</td></tr>';
    
    db.ref('users').once('value').then(snap => {
        let allLogs = [];
        snap.forEach(userSnap => {
            const uid = userSnap.key;
            const data = userSnap.val();
            const history = data.history;
            if(history) {
                Object.values(history).forEach(log => {
                    allLogs.push({ ...log, user: data.email || uid });
                });
            }
        });
        
        allLogs.sort((a, b) => b.timestamp - a.timestamp);
        tbody.innerHTML = '';
        
        allLogs.slice(0, 100).forEach(log => {
            const date = new Date(log.timestamp).toLocaleString();
            const color = log.type === 'credit' ? '#10b981' : '#ef4444';
            tbody.innerHTML += `
                <tr>
                    <td><strong>${log.user}</strong></td>
                    <td><span style="color:${color}; font-weight:bold;">${log.type.toUpperCase()}</span></td>
                    <td>${log.amount}</td>
                    <td>${log.reason}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
        
        if(allLogs.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No logs found.</td></tr>';
    });
}

function loadSupportMessages() {
    db.ref('support_messages').on('value', snap => {
        const tbody = document.getElementById('support-body');
        tbody.innerHTML = '';
        if(!snap.exists()) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Inbox is empty.</td></tr>';
            return;
        }
        
        let msgs = [];
        snap.forEach(child => { msgs.push({ id: child.key, ...child.val() }); });
        msgs.sort((a, b) => b.timestamp - a.timestamp);
        
        msgs.forEach(m => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${m.uid}</strong><br><small>${m.email || ''}</small></td>
                    <td>${m.message}</td>
                    <td>${new Date(m.timestamp).toLocaleString()}</td>
                    <td><button class="btn btn-red" onclick="deleteSupportMessage('${m.id}')">Delete</button></td>
                </tr>
            `;
        });
    });
}

function deleteSupportMessage(id) {
    if(confirm("Delete this message?")) {
        db.ref('support_messages/' + id).remove();
    }
}

function loadUpdateSettings() {
    db.ref('settings/updates').once('value').then(snap => {
        const data = snap.val();
        if(data) {
            document.getElementById('update-version').value = data.version_code || '';
            document.getElementById('update-name').value = data.version_name || '';
            document.getElementById('update-url').value = data.update_url || '';
            document.getElementById('update-force').checked = data.force_update || false;
        }
    });
}

function saveUpdateSettings() {
    const data = {
        version_code: parseInt(document.getElementById('update-version').value),
        version_name: document.getElementById('update-name').value.trim(),
        update_url: document.getElementById('update-url').value.trim(),
        force_update: document.getElementById('update-force').checked,
        timestamp: Date.now()
    };
    
    db.ref('settings/updates').set(data).then(() => {
        alert("Update settings pushed to all users!");
    });
}

function giveBulkBonus() {
    const amount = parseInt(document.getElementById('bulk-bonus-amount').value);
    const reason = document.getElementById('bulk-bonus-reason').value.trim() || 'Festive Bonus';
    
    if(isNaN(amount) || amount <= 0) return alert("Enter valid amount!");
    
    if(confirm(`WARNING: This will give ${amount} coins to EVERY user. Continue?`)) {
        db.ref('users').once('value').then(snap => {
            let updates = {};
            snap.forEach(child => {
                const uid = child.key;
                const user = child.val();
                updates[`users/${uid}/balance`] = (user.balance || 0) + amount;
                updates[`users/${uid}/total_earned`] = (user.total_earned || 0) + amount;
                
                // Also add history for each
                const historyRef = db.ref(`users/${uid}/history`).push();
                updates[`users/${uid}/history/${historyRef.key}`] = {
                    type: 'credit',
                    amount: amount,
                    reason: reason,
                    timestamp: Date.now()
                };
            });
            
            db.ref().update(updates).then(() => {
                alert(`Successfully distributed coins to all users!`);
                document.getElementById('bulk-bonus-amount').value = '';
            });
        });
    }
}

function clearAllLogs() {
    if(confirm("CRITICAL WARNING: This will permanently delete ALL transaction history for ALL users. This cannot be undone. Proceed?")) {
        db.ref('users').once('value').then(snap => {
            let updates = {};
            snap.forEach(child => {
                updates[`users/${child.key}/history`] = null;
            });
            db.ref().update(updates).then(() => {
                alert("All transaction histories have been wiped.");
            });
        });
    }
}
function loadWithdrawMethods() {
    db.ref('settings/withdraw_methods').on('value', snap => {
        const tbody = document.getElementById('withdraw-methods-body');
        tbody.innerHTML = '';
        if(!snap.exists()) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 40px;">
                        <p style="color: #666; margin-bottom: 15px;">No withdrawal methods found in database.</p>
                        <button class="btn btn-blue" onclick="restoreDefaultMethods()">Click here to Restore Defaults (Google, Amazon, UPI)</button>
                    </td>
                </tr>`;
            return;
        }

        
        // Store methods globally for easy access during edit
        window.allWithdrawMethods = snap.val() || {};

        snap.forEach(child => {
            const id = child.key;
            const data = child.val();
            tbody.innerHTML += `
                <tr>
                    <td><img src="${data.logo}" width="30" style="border-radius:4px; max-height: 30px; object-fit: contain;"></td>
                    <td><strong>${data.name}</strong></td>
                    <td>${data.label}</td>
                    <td>${data.subs || '-'}</td>
                    <td>${(data.amounts || []).join(', ')}</td>
                    <td class="flex-row">
                        <button class="btn btn-blue" onclick="editWithdrawMethod('${id}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button class="btn btn-red" onclick="deleteWithdrawMethod('${id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    });
}

function addWithdrawMethod() {
    const editId = document.getElementById('edit-method-id').value;
    const name = document.getElementById('new-method-name').value.trim();
    const logo = document.getElementById('new-method-logo').value.trim();
    const label = document.getElementById('new-method-label').value.trim();
    const subs = document.getElementById('new-method-subs').value.trim();
    const amountsStr = document.getElementById('new-method-amounts').value.trim();
    
    if(!name || !logo || !label || !amountsStr) return alert("Fill Name, Logo, Label, and Amounts!");
    
    const amounts = amountsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    
    const methodData = {
        name, logo, label, subs, amounts,
        timestamp: Date.now()
    };

    if(editId) {
        db.ref('settings/withdraw_methods/' + editId).update(methodData).then(() => {
            alert("Method updated successfully!");
            cancelEditMethod();
        });
    } else {
        db.ref('settings/withdraw_methods').push(methodData).then(() => {
            alert("Method added successfully!");
            clearMethodForm();
        });
    }
}

function editWithdrawMethod(id) {
    const data = window.allWithdrawMethods[id];
    if(!data) return;

    document.getElementById('edit-method-id').value = id;
    document.getElementById('new-method-name').value = data.name;
    document.getElementById('new-method-logo').value = data.logo;
    const logoPrev = document.getElementById('logo-preview');
    if(logoPrev) {
        logoPrev.src = data.logo;
        logoPrev.style.display = 'block';
    }
    document.getElementById('new-method-label').value = data.label;
    document.getElementById('new-method-subs').value = data.subs || '';
    document.getElementById('new-method-amounts').value = (data.amounts || []).join(', ');
    
    document.getElementById('method-form-title').innerText = "Edit Method: " + data.name;
    document.getElementById('btn-add-method').innerText = "Update Payment Method";
    document.getElementById('btn-cancel-edit').style.display = 'block';
    
    // Scroll to form
    document.getElementById('method-form-title').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditMethod() {
    clearMethodForm();
    document.getElementById('edit-method-id').value = '';
    document.getElementById('method-form-title').innerText = "Add New Method";
    document.getElementById('btn-add-method').innerText = "+ Add Payment Method";
    document.getElementById('btn-cancel-edit').style.display = 'none';
}

function clearMethodForm() {
    document.getElementById('new-method-name').value = '';
    document.getElementById('new-method-logo').value = '';
    document.getElementById('new-method-label').value = '';
    document.getElementById('new-method-subs').value = '';
    document.getElementById('new-method-amounts').value = '';
}

function deleteWithdrawMethod(id) {
    if(confirm("Delete this withdrawal method?")) {
        db.ref('settings/withdraw_methods/' + id).remove();
    }
}

async function restoreDefaultMethods() {
    const defaults = {
        "google": { name: "Google Play (IN)", logo: "https://img.icons8.com/color/96/google-play.png", label: "Email", subs: "", amounts: [15, 30, 50], timestamp: Date.now() },
        "amazon": { name: "Amazon (IN)", logo: "https://img.icons8.com/color/96/amazon.png", label: "Email", subs: "", amounts: [15, 30], timestamp: Date.now() },
        "upi": { name: "UPI (IN)", logo: "https://img.icons8.com/color/96/phone-pe.png", label: "UPI ID", subs: "", amounts: [15, 30], timestamp: Date.now() }
    };
    
    if(confirm("Restore default payment methods (Google Play, Amazon, UPI) to the database?")) {
        await db.ref('settings/withdraw_methods').update(defaults);
        alert("Default methods restored successfully!");
    }
}

async function handleFileUpload(input, targetId) {
    const file = input.files[0];
    if(!file) return;

    if (!supabaseClient) {
        alert("Supabase is not connected. Please check your configuration.");
        return;
    }

    const targetInput = document.getElementById(targetId);
    const originalText = targetInput.placeholder;
    targetInput.value = "Uploading...";
    targetInput.disabled = true;

    try {
        const fileName = Date.now() + "_" + file.name.replace(/\s/g, '_');
        const { data, error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload('assets/' + fileName, file);

        if (error) throw error;

        const { data: urlData } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl('assets/' + fileName);

        targetInput.value = urlData.publicUrl;
        targetInput.disabled = false;
        alert("File uploaded successfully!");
    } catch (err) {
        console.error("Upload Error:", err);
        alert("Upload failed: " + err.message);
        targetInput.value = "";
        targetInput.disabled = false;
    }
}


function uploadApkFile() {
    const fileInput = document.getElementById('apk-file-input');
    const file = fileInput.files[0];
    if(!file) return alert("Please select an APK file first!");
    
    // Check if it's an APK
    if(!file.name.toLowerCase().endsWith('.apk')) return alert("Only .apk files are allowed!");

    const btn = document.getElementById('upload-apk-btn');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status');
    const urlInput = document.getElementById('update-url');

    btn.disabled = true;
    btn.innerText = "Uploading to Supabase... Please wait";
    progressContainer.style.display = 'block';

    // Unique filename to prevent overwriting
    const fileName = Date.now() + "_" + file.name;
    
    // Supabase Upload
    const uploadFile = async () => {
        try {
            // Upload the file
            const { data, error } = await supabaseClient.storage
                .from(BUCKET_NAME)
                .upload('updates/' + fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get Public URL
            const { data: urlData } = supabaseClient.storage
                .from(BUCKET_NAME)
                .getPublicUrl('updates/' + fileName);

            const downloadURL = urlData.publicUrl;
            
            urlInput.value = downloadURL;
            alert("APK uploaded successfully to Supabase! The download URL has been automatically filled.");
            
            btn.disabled = false;
            btn.innerText = "Upload New File";
            statusText.innerText = "Upload Complete!";
            progressBar.style.width = '100%';
            progressBar.style.background = "#10b981";

        } catch (err) {
            console.error("Supabase Upload Error:", err);
            alert("Upload failed: " + err.message + "\nMake sure the bucket '" + BUCKET_NAME + "' exists and is public in Supabase.");
            btn.disabled = false;
            btn.innerText = "Start Upload";
            progressContainer.style.display = 'none';
        }
    };

    uploadFile();
}

// ---------------------- RANKING MANAGER ----------------------

function loadRankingManager() {
    const tbody = document.getElementById('ranking-manager-body');
    if(!tbody) return;

    // Listen to Fake Rankings
    db.ref('settings/fake_rankings').on('value', fakeSnap => {
        // Listen to Real Users (Top Daily)
        db.ref('users').orderByChild('daily_balance').limitToLast(30).on('value', realSnap => {
            tbody.innerHTML = '';
            
            // 1. Add Fake Users
            fakeSnap.forEach(child => {
                const id = child.key;
                const data = child.val();
                tbody.innerHTML += `
                    <tr>
                        <td><span class="badge badge-pending">FAKE</span></td>
                        <td><strong>${data.name}</strong></td>
                        <td>${data.balance}</td>
                        <td><button class="btn btn-red" onclick="deleteFakeRankingV2('${id}')">Delete</button></td>
                    </tr>
                `;
            });

            // 2. Add Real Users
            const realList = [];
            realSnap.forEach(child => {
                realList.push({ uid: child.key, ...child.val() });
            });
            realList.sort((a, b) => (b.daily_balance || 0) - (a.daily_balance || 0));

            realList.forEach(user => {
                const statusLabel = user.hidden_from_ranking ? '<span class="badge badge-blocked">HIDDEN</span>' : '<span class="badge badge-active">REAL</span>';
                tbody.innerHTML += `
                    <tr>
                        <td>${statusLabel}</td>
                        <td><strong>${user.email || user.name || user.uid}</strong></td>
                        <td>${user.daily_balance || 0}</td>
                        <td>
                            <button class="btn ${user.hidden_from_ranking ? 'btn-green' : 'btn-orange'}" onclick="toggleUserRankVisibility('${user.uid}', ${user.hidden_from_ranking || false})">
                                ${user.hidden_from_ranking ? 'Show' : 'Hide'}
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
    });
}

function addFakeRankingV2() {
    const name = document.getElementById('rank-fake-name').value.trim();
    const balance = parseInt(document.getElementById('rank-fake-balance').value);
    
    if(!name || isNaN(balance)) return alert("Fill all fields!");
    
    db.ref('settings/fake_rankings').push({ name, balance }).then(() => {
        document.getElementById('rank-fake-name').value = '';
        document.getElementById('rank-fake-balance').value = '';
    });
}

function deleteFakeRankingV2(id) {
    if(confirm("Delete this fake player?")) {
        db.ref('settings/fake_rankings/' + id).remove();
    }
}

function loadDashboardRanking() {
    const tbody = document.getElementById('top-earners-body');
    if(!tbody) return;

    db.ref('users').orderByChild('daily_balance').limitToLast(10).on('value', snap => {
        tbody.innerHTML = '';
        const list = [];
        snap.forEach(child => {
            list.push({ uid: child.key, ...child.val() });
        });
        list.sort((a, b) => (b.daily_balance || 0) - (a.daily_balance || 0));

        list.forEach(user => {
            tbody.innerHTML += `
                <tr>
                    <td>${user.email || user.uid}</td>
                    <td>${user.daily_balance || 0}</td>
                    <td>${user.balance || 0}</td>
                    <td><button class="btn btn-gray" onclick="viewUserHistory('${user.uid}')">View</button></td>
                </tr>
            `;
        });
    });
}

// ---------------------- TASK OFFERS MANAGER ----------------------

function loadTasksManager() {
    db.ref('settings/tasks').on('value', snap => {
        const tbody = document.getElementById('tasks-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        if(!snap.exists()) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No tasks found.</td></tr>';
            return;
        }

        window.allTasks = snap.val() || {};

        snap.forEach(child => {
            const id = child.key;
            const data = child.val();
            tbody.innerHTML += `
                <tr>
                    <td><img src="${data.logo}" width="40" style="border-radius:8px;"></td>
                    <td><strong>${data.title}</strong></td>
                    <td>${data.reward} Coins</td>
                    <td>${data.description}</td>
                    <td>
                        <button class="btn btn-red" onclick="deleteTask('${id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    });
}

function addTask() {
    const title = document.getElementById('new-task-title').value.trim();
    const reward = parseInt(document.getElementById('new-task-reward').value);
    const description = document.getElementById('new-task-description').value.trim();
    const logo = document.getElementById('new-task-logo').value.trim();
    const steps = document.getElementById('new-task-steps').value.trim();
    const link = document.getElementById('new-task-link').value.trim();

    if(!title || isNaN(reward) || !description || !logo || !steps || !link) {
        return alert("Please fill all fields!");
    }

    const taskData = {
        title, reward, description, logo, steps, link,
        timestamp: Date.now()
    };

    db.ref('settings/tasks').push(taskData).then(() => {
        alert("Task offer saved successfully!");
        document.getElementById('new-task-title').value = '';
        document.getElementById('new-task-reward').value = '';
        document.getElementById('new-task-description').value = '';
        document.getElementById('new-task-logo').value = '';
        document.getElementById('new-task-steps').value = '';
        document.getElementById('new-task-link').value = '';
    });
}

function deleteTask(id) {
    if(confirm("Delete this task offer?")) {
        db.ref('settings/tasks/' + id).remove();
    }
}

// ---------------------- OFFER CLICKS TRACKING ----------------------

function loadOfferClicks() {
    db.ref('task_offer_clicks').on('value', snap => {
        const tbody = document.getElementById('offer-clicks-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        if(!snap.exists()) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No clicks tracked yet.</td></tr>';
            return;
        }

        let clicks = [];
        snap.forEach(child => {
            clicks.push({ id: child.key, ...child.val() });
        });

        // Sort by newest first
        clicks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        clicks.forEach(c => {
            const date = c.date || new Date(c.timestamp).toLocaleString();
            tbody.innerHTML += `
                <tr>
                    <td><strong>${c.userName || 'Unknown'}</strong></td>
                    <td><small>${c.userEmail || 'No Email'}<br>${c.uid || ''}</small></td>
                    <td><span style="color:#f97316; font-weight:bold;">${c.taskTitle || 'Task'}</span></td>
                    <td>${c.taskReward || 0} Coins</td>
                    <td>${date}</td>
                </tr>
            `;
        });
    });
}
function viewUserHistory(uid) {
    // Navigate to users tab and search for this UID
    switchTab('users');
    const searchInput = document.getElementById('user-search-input');
    if(searchInput) {
        searchInput.value = uid;
        filterUsersTable();
    }
}

function toggleUserRankVisibility(uid, currentStatus) {
    const newStatus = !currentStatus;
    db.ref(`users/${uid}/hidden_from_ranking`).set(newStatus).then(() => {
        alert(newStatus ? "User hidden from ranking." : "User now visible in ranking.");
    });
}

function restoreDefaultMethods() {
    if(confirm("Restore default withdrawal methods (Google, Amazon, UPI)?")) {
        const defaults = {
            'google_default': { name: 'Google Play (IN)', logo: 'https://img.icons8.com/color/96/google-play.png', label: 'Email', amounts: [15, 30, 50], type: 'default' },
            'amazon_default': { name: 'Amazon (IN)', logo: 'https://img.icons8.com/color/96/amazon.png', label: 'Email', amounts: [15, 30], type: 'default' },
            'upi_default': { name: 'UPI (IN)', logo: 'https://img.icons8.com/color/96/phone-pe.png', label: 'UPI ID', amounts: [15, 30], type: 'default' }
        };
        db.ref('settings/withdraw_methods').update(defaults);
    }
}

console.log("Admin Dashboard Script Fully Initialized.");
