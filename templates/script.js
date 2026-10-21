
const socket = io();
const username = "{{ username|e }}";
const myColor = "{{ color|e }}";
const myDisplay = "{{ display|e }}";

// DOM refs
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const meName = document.getElementById('meName');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');
const chatInput = document.getElementById('chatInput');
const avatarPreview = document.getElementById('avatarPreview');
const searchInput = document.getElementById('userSearch');
const searchResults = document.getElementById('searchResults');

const name = myDisplay || username || 'User';
const color = myColor || '#00ffaa';
// --- Links dynamic UI ---


// --- Load current user data ---
async function loadProfile() {
const res = await fetch('/_whoami');
const data = await res.json();

document.getElementById('displayName').value = data.display || '';
document.getElementById('displayColor').value = data.color || '#00ffaa';
document.getElementById('displayBio').value = data.bio || '';

// populate links

}

// --- Save profile (with links) ---
async function saveProfile() {
const display = document.getElementById('displayName').value.trim();
const color = document.getElementById('displayColor').value;
const bio = document.getElementById('displayBio').value.trim();

// collect all link fields

const res = await fetch('/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ display, color, bio, links })
});

const data = await res.json();
if (data.ok) {
  alert('Profile updated!');
} else {
  alert('Error: ' + (data.error || 'unknown'));
}
}
// Panels
const panels = {
profile: document.getElementById('panel-profile'),
music: document.getElementById('panel-music'),
account: document.getElementById('panel-account'),
notes: document.getElementById('panel-notes'),
work: document.getElementById('panel-work'),
files: document.getElementById('panel-files'),
dm: document.getElementById('panel-dm')   // ✅ added for Direct Messages
};

// Initial UI
meName.innerText = myDisplay || username;
document.getElementById('displayName').value = myDisplay || username;
document.getElementById('displayColor').value = myColor || '#00ffaa';
avatarPreview.style.background = `linear-gradient(45deg, ${document.getElementById('displayColor').value}, #0077ff)`;

// Menu toggle
menuBtn.onclick = () => sidebar.classList.toggle('show');

// Panel switcher
function showPanel(name){
// Hide all right-side panels
Object.values(panels).forEach(p => p.style.display = 'none');

// Show chat only when "chat" is active
const chatPanel = document.getElementById('left');
if(name === 'chat' || !name){
  chatPanel.style.display = 'flex';
} else {
  chatPanel.style.display = 'none';
}

// Show right panel content if applicable
if(name && panels[name]) {
  panels[name].style.display = 'block';
  document.getElementById('right').style.display = 'block';
} else {
  document.getElementById('right').style.display = 'none';
}

sidebar.classList.remove('show');
}
showPanel('chat'); // start in chat mode
// Chat logic
sendBtn.onclick = sendChat;
chatInput.addEventListener('keypress', e => { if(e.key==='Enter') sendChat(); });
function sendChat(){
  const text = chatInput.value.trim();
  if(!text) return;
  socket.emit('send_chat', {text});
  chatInput.value = '';
}

socket.on('chat_history', arr => {
  messages.innerHTML = '';
  arr.forEach(addMessage);
  messages.scrollTop = messages.scrollHeight;
});
socket.on('chat_message', addMessage);
socket.on('system', s => {
  const div = document.createElement('div');
  div.className = 'sys';
  div.innerText = `[${s.time}] ${s.msg}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// single addMessage implementation
function addMessage(msg) {
const d = document.createElement('div');
d.className = 'msg';

const who = document.createElement('span');
who.className = 'who';
who.innerText = msg.user + ': ';
who.style.color = msg.color || '#fff';

const txt = document.createElement('span');

// ========== Handle HTML messages (stickers, etc.) ==========
if (msg.is_html) {
  txt.innerHTML = '<br>' + msg.msg;

  const anchors = txt.querySelectorAll('a');
  anchors.forEach(a => a.classList.add('file-link'));

  const imgs = txt.querySelectorAll('img');
  imgs.forEach(img => {
    img.style.width = '120px';
    img.style.height = 'auto';
    img.style.borderRadius = '10px';
    img.style.marginTop = '6px';
    img.style.display = 'block';
    img.style.transition = 'transform 0.2s ease';
    img.onmouseover = () => (img.style.transform = 'scale(1.1)');
    img.onmouseout = () => (img.style.transform = 'scale(1)');
  });
} else {
  // ========== Normal text messages ==========
  const myName = window.myUsername || '';
  let text = msg.msg || '';

  // Convert URLs to clickable links first
  text = text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="file-link">$1</a>'
  );

  // Highlight mentions
  text = text.replace(/(@\w+)/g, '<span class="mention-tag">$1</span>');

  txt.innerHTML = text;

  // Highlight your mentions
  if (myName && new RegExp(`@${myName}\\b`, 'i').test(msg.msg)) {
    d.classList.add('mention');
  }
}

// ========== Timestamp ==========
const ts = document.createElement('span');
ts.className = 'time';
ts.textContent = msg.time ? ` [${msg.time}]` : '';

// ========== Append message first ==========
d.appendChild(who);
d.appendChild(txt);
d.appendChild(ts);
messages.appendChild(d);

// ========== Smart link preview AFTER rendering ==========
const urlPattern = /(https?:\/\/[^\s]+)/g;
const found = msg.msg.match(urlPattern);
if (found) {
  found.forEach(url => {
    fetch(`/link_preview?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(meta => {
        if (!meta || !meta.title) return;
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
          ${meta.image ? `<img src="${meta.image}" alt="">` : ''}
          <div class="meta">
            <strong>${meta.title}</strong><br>
            <span>${meta.desc || ''}</span>
          </div>
        `;
        txt.appendChild(card);
      })
      .catch(() => {});
  });
}

// ========== Auto-scroll ==========
setTimeout(() => {
  messages.scrollTop = messages.scrollHeight;
}, 100);
}
// MUSIC


// PROFILE saving & avatar upload & delete account
function saveProfile(){
const display = document.getElementById('displayName').value;
const color = document.getElementById('displayColor').value;
const bio = document.getElementById('displayBio').value;
const meName = document.getElementById('meName');
const avatarPreview = document.getElementById('avatarPreview');

fetch('/profile', {
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body: JSON.stringify({display, color, bio})
})
.then(r=>r.json())
.then(j=>{
  if(j.ok){
    if (meName) meName.innerText = j.display || display;
    if (avatarPreview) avatarPreview.style.background =
      `linear-gradient(45deg, ${j.color || color}, #0077ff)`;
    alert('Profile saved');
  } else alert('Save failed');
})
.catch(e => alert('Error saving profile: ' + e.message));
}

function uploadAvatar(){
const input = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
if(!input.files.length) return alert('Pick an image');

const f = input.files[0];
const fd = new FormData();
fd.append('file', f);

fetch('/upload_profile_pic', {method:'POST', body: fd})
  .then(r=>r.json())
  .then(j=>{
    if(j.ok){
      if (avatarPreview)
        avatarPreview.style.background = `url(${j.profile_pic}?v=${Date.now()}) center/cover`;
      alert('Avatar uploaded');
    } else alert('Upload failed: ' + (j.error || 'unknown'));
  })
  .catch(e => alert('Error uploading avatar: ' + e.message));
}

function askDelete(){
  if(!confirm('Delete your account and all your notes/work/uploads? This cannot be undone.')) return;
  fetch('/delete_account', {method:'POST'}).then(r=>r.json()).then(j=>{
    if(j.ok){
      alert('Account deleted. Logging out.');
      window.location.href = '/';
    } else {
      alert('Failed to delete account');
    }
  });
}

// load profile on startup
function loadProfile() {
fetch('/_whoami')
  .then(r => r.json())
  .then(u => {
    if (!u || !u.username) return;

    // Elements (get them here to avoid accidental globals)
    const meNameEl = document.getElementById('meName');
    const displayNameEl = document.getElementById('displayName');
    const displayColorEl = document.getElementById('displayColor');
    const displayBioEl = document.getElementById('displayBio');
    const avatarPreview = document.getElementById('avatarPreview');

    // Make sure elements exist
    if (displayNameEl) displayNameEl.value = u.display || u.username;
    if (displayColorEl) displayColorEl.value = u.color || '#00ffaa';
    if (displayBioEl) displayBioEl.value = u.bio || '';
    if (meNameEl) meNameEl.innerText = u.display || u.username;

    // Avatar preview base CSS
    if (avatarPreview) {
      avatarPreview.style.background = ''; // reset
      avatarPreview.style.backgroundSize = 'cover';
      avatarPreview.style.backgroundPosition = 'center';
      avatarPreview.style.backgroundRepeat = 'no-repeat';

      if (u.profile_pic && u.profile_pic.trim() !== '') {
        // Preload image to detect load/404
        const img = new Image();
        img.onload = () => {
          // Put gradient on top and image behind it
          avatarPreview.style.background = `
            linear-gradient(45deg, ${u.color || '#00ffaa'}, #0077ff),
            url('${u.profile_pic}')
          `;
        };
        img.onerror = () => {
          console.warn('Image failed to load:', u.profile_pic);
          avatarPreview.style.background = `linear-gradient(45deg, ${u.color || '#00ffaa'}, #0077ff)`;
        };

        // Optional: add cache-buster during development if browser caches a broken image
        // img.src = u.profile_pic + '?v=' + Date.now();
        img.src = u.profile_pic;
      } else {
        // fallback gradient only
        avatarPreview.style.background = `linear-gradient(45deg, ${u.color || '#00ffaa'}, #0077ff)`;
      }
    }
  })
  .catch(err => console.error('Profile load failed:', err));
}

// call once (outside of function)
loadProfile();
// NOTES
function loadNotes(){
    fetch('/notes').then(r=>r.json()).then(arr=>{
      const list = document.getElementById('notesList'); list.innerHTML = '';
      (arr||[]).forEach(n=>{
        const li = document.createElement('li');
        li.innerHTML = `<div style="flex:1"><strong>${n.title}</strong><div style="font-size:12px;color:var(--muted)">${new Date(n.created).toLocaleString()}</div></div>
                        <div style="margin-left:8px"><button class="small-btn" onclick="deleteNote(${n.id})">del</button></div>`;
        list.appendChild(li);
      });
    });
  }
  function saveNote(){
    const title = document.getElementById('noteTitle').value;
    const body = document.getElementById('noteBody').value;
    fetch('/notes', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title, body})})
      .then(()=>{ document.getElementById('noteTitle').value=''; document.getElementById('noteBody').value=''; loadNotes(); });
  }
  function deleteNote(id){
    fetch('/notes', {method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id})})
      .then(()=>loadNotes());
  }

  // WORK
  function loadWorks(){
    fetch('/work').then(r=>r.json()).then(arr=>{
      const list = document.getElementById('workList'); list.innerHTML='';
      (arr||[]).forEach(w=>{
        const li = document.createElement('li');
        li.innerHTML = `<div style="flex:1"><strong>${w.title}</strong><div style="font-size:12px;color:var(--muted)">${w.status}</div></div>
                        <div style="margin-left:8px">
                          <button class="small-btn" onclick="toggleWork(${w.id},'done')">done</button>
                          <button class="small-btn" onclick="deleteWork(${w.id})">del</button>
                        </div>`;
        list.appendChild(li);
      });
    });
  }
  function addWork(){
    const title = document.getElementById('workTitle').value.trim();
    if(!title) return;
    fetch('/work', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title})}).then(()=>{ document.getElementById('workTitle').value=''; loadWorks(); });
  }
  function deleteWork(id){
    fetch('/work', {method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id})}).then(()=>loadWorks());
  }
  function toggleWork(id, status){
    fetch('/work', {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id, status})}).then(()=>loadWorks());
  }

  // File upload + listing
  function sendFile(){
    const input = document.getElementById('fileInput');
    if(!input.files.length) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    fetch('/upload', {method:'POST', body: formData})
      .then(r=>r.json())
      .then(j=>{
        if(j.ok){
          input.value='';
          loadFiles();
        } else alert('Upload failed: '+(j.error||'unknown'));
      });
  }
  function loadFiles(){
    fetch('/uploads').then(r=>r.json()).then(arr=>{
      const list = document.getElementById('filesList'); list.innerHTML='';
      (arr||[]).forEach(f=>{
        const li = document.createElement('li');
        const safe = encodeURIComponent(f);
        li.innerHTML = `<a href="/uploads/${safe}" download class="file-link">${f.replace(/^.*?_/,'')}</a>`;
        list.appendChild(li);
      });
    });
  }
  loadFiles();

  // SEARCH users
  let searchTimer = null;

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) {
    searchResults.innerHTML = '';
    return;
  }

  searchTimer = setTimeout(() => {
    fetch('/search_users?q=' + encodeURIComponent(q))
      .then(r => r.json())
      .then(arr => {
        searchResults.innerHTML = '';

        (arr || []).forEach(u => {
          // ✅ Ensure correct avatar path
          let avatar = '/static/default.png';
          if (u.profile_pic) {
            // handle either relative or full path safely
            avatar = u.profile_pic.startsWith('/uploads/')
              ? u.profile_pic
              : '/uploads/avatars/' + u.profile_pic;
          }

          const div = document.createElement('div');
          div.className = 'search-item';
          div.innerHTML = `
            <img class="avatar-sm"
                 src="${avatar}"
                 onerror="this.src='/static/default.png'; this.style.background='linear-gradient(45deg,var(--accent),#0077ff)'">
            <div style="flex:1">
              <strong>${u.display || u.username}</strong>
              <div style="font-size:12px;color:var(--muted)">${u.username}</div>
            </div>
          `;

          div.onclick = () => openProfile(u.username);
          searchResults.appendChild(div);
        });
      });
  }, 240);
});
  

// =============== DM SYSTEM ===================
const dmList = document.getElementById('dm-list');
const dmChat = document.getElementById('dm-chat');
const dmMessages = document.getElementById('dmMessages');
const dmUserName = document.getElementById('dmUserName');
const dmUserPic = document.getElementById('dmUserPic');
const dmInput = document.getElementById('dmInput');
const dmSendBtn = document.getElementById('dmSendBtn');
const dmBackBtn = document.getElementById('dmBackBtn');
let currentDM = null;

// --- BACK BUTTON ---
dmBackBtn.onclick = () => {
  dmChat.style.display = 'none';
  dmList.style.display = 'block';
  currentDM = null;
};

// --- LOAD DM LIST ---
async function loadDMList() {
  const res = await fetch('/dm/list');
  if (!res.ok) return;
  const users = await res.json();
  dmList.innerHTML = '';

  if (!users.length) {
    dmList.innerHTML = `<div style="font-size:13px;color:var(--muted)">No conversations yet</div>`;
    return;
  }

  users.forEach(u => {
    const row = document.createElement('div');
    row.className = 'search-item';
    const pic = u.profile_pic ? `/avatars/${u.profile_pic}` : '/static/default.png';
    row.innerHTML = `
      <img class="avatar-sm" src="${pic}" onerror="this.src='/static/default.png'">
      <div style="flex:1">
        <strong>${u.display || u.username}</strong>
        <div style="font-size:12px;color:var(--muted)">${u.username}</div>
      </div>
    `;
    row.onclick = () => openDM(u);
    dmList.appendChild(row);
  });
}

// --- OPEN DM CHAT ---
async function openDM(u) {
  currentDM = u.username;
  dmUserName.textContent = u.display || u.username;
  dmUserPic.src = u.profile_pic ? `/avatars/${u.profile_pic}` : '/static/default.png';

  dmList.style.display = 'none';
  dmChat.style.display = 'block';
  await loadDMHistory(u.username);
}

// --- LOAD DM HISTORY ---
async function loadDMHistory(username) {
  const res = await fetch('/dm/history/' + encodeURIComponent(username));
  if (!res.ok) return;
  const msgs = await res.json();

  dmMessages.innerHTML = '';
  msgs.forEach(m => addDMMessage({
    from: m.sender_name || username,
    msg: m.msg,
    time: new Date(m.time).toLocaleTimeString(),
    pic: m.sender_pic ? `/avatars/${m.sender_pic}` : '/static/default.png'
  }));
}

// --- RENDER A MESSAGE ---
function addDMMessage(m) {
  const div = document.createElement('div');
  div.style.marginBottom = '6px';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;">
      <img src="${m.pic}" width="26" height="26" style="border-radius:6px;object-fit:cover;background:rgba(255,255,255,0.05)">
      <strong style="color:var(--accent);font-size:13px;">${m.from}</strong>
      <span style="font-size:11px;color:var(--muted)">${m.time}</span>
    </div>
    <div style="margin-left:32px;margin-top:2px;">${m.msg}</div>
  `;
  dmMessages.appendChild(div);
  dmMessages.scrollTop = dmMessages.scrollHeight;
}

// --- SEND DM MESSAGE ---
dmSendBtn.onclick = sendDM;
dmInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendDM(); });

function sendDM() {
  const msg = dmInput.value.trim();
  if (!msg || !currentDM) return;
  dmInput.value = '';

  // instant preview
  addDMMessage({
  from: 'You',
  msg,
  time: new Date().toLocaleTimeString(),
  pic: window.myProfile?.profile_pic ? `/avatars/${window.myProfile.profile_pic}` : '/static/default.png'
});

  socket.emit('send_dm', { to: currentDM, msg });
}

socket.on("dm_message", (m) => {
  if (currentDM === m.from || currentDM === m.to) {
    addDMMessage({
      from: m.from === username ? "You" : m.from,
      msg: m.msg,
      time: m.time,
      pic: m.sender_pic || '/static/default.png'
    });
  } else {
    console.log("New DM from", m.from);
  }
});
// --- INTEGRATE WITH PANEL SYSTEM ---
const originalShowPanel = showPanel;
showPanel = function(name) {
  originalShowPanel(name);
  if (name === 'dm') loadDMList();
};

  // open profile panel
function openProfile(usernameToOpen) {
  fetch('/user/' + encodeURIComponent(usernameToOpen))
    .then(r => r.json())
    .then(u => {
      if (u.error) { alert('Not found'); return; }

      const container = document.getElementById('profileView');
      container.innerHTML = '';

      const pic = u.profile_pic
        ? `<img class="profile-pic-large" src="${u.profile_pic}" />`
        : `<div class="profile-pic-large"></div>`;

      // --- profile header ---
      let html = `
        <div style="display:flex;gap:12px;align-items:center;">
          ${pic}
          <div>
            <h3 style="margin:0">${u.display || u.username}</h3>
            <div style="font-size:13px;color:var(--muted)">${u.username}</div>
            <div style="margin-top:8px;color:var(--muted)">${u.bio || ''}</div>
            <div style="margin-top:8px;font-size:12px;color:var(--muted)">Joined: ${new Date(u.created).toLocaleDateString()}</div>
          </div>
        </div>
      `;

      // --- social / custom links ---
      if (u.links && u.links.length) {
        html += `<div style="margin-top:14px; display:flex; flex-wrap:wrap; gap:10px;">`;
        for (const link of u.links) {
          const url = link.url || '';
          const label = link.name || '';

          // choose icon based on link name / domain
          let icon = 'link';
          const lower = url.toLowerCase();
          if (lower.includes('github')) icon = 'github-logo';
          else if (lower.includes('reddit')) icon = 'reddit-logo';
          else if (lower.includes('twitter') || lower.includes('x.com')) icon = 'twitter-logo';
          else if (lower.includes('instagram')) icon = 'instagram-logo';
          else if (lower.includes('youtube')) icon = 'youtube-logo';
          else if (lower.includes('tiktok')) icon = 'tiktok-logo';
          else if (lower.includes('facebook')) icon = 'facebook-logo';
          else if (lower.includes('linkedin')) icon = 'linkedin-logo';

          html += `
            <a href="${url}" target="_blank" class="profile-link-btn">
              <i class="ph ph-${icon}"></i>
              ${label || 'Link'}
            </a>`;
        }
        html += `</div>`;
      }

      container.innerHTML = html;

      // ✅ DM button (only if not your own profile)
      if (u.username !== window.myUsername) {
        const msgBtn = document.createElement('button');
        msgBtn.className = 'dm-btn';
        msgBtn.style.marginTop = '12px';
        msgBtn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> DM <p class="gray"> (UNSTABLE)</p>';
        msgBtn.onclick = () => {
          showPanel('dm');
          openDM(u);
        };
        container.appendChild(msgBtn);
      }

      showPanel('profile');
    });
}

  // initial loads
  loadNotes();
  loadWorks();

  // try to get profile data periodically (in case routes start later)
  setTimeout(loadProfile, 500);
  const stickerBtn = document.getElementById('stickerBtn');
const stickerPopup = document.getElementById('stickerPopup');
const closeSticker = document.getElementById('closeSticker');
const stickerGrid = document.getElementById('stickerGrid');
const addStickerBtn = document.getElementById('addStickerBtn');
const addStickerInput = document.getElementById('addStickerInput');

stickerBtn.onclick = () => {
  stickerPopup.style.display = 'block';
};
closeSticker.onclick = () => {
  stickerPopup.style.display = 'none';
};
addStickerBtn.onclick = () => addStickerInput.click();

addStickerInput.onchange = async () => {
  if (!addStickerInput.files.length) return;
  const f = addStickerInput.files[0];
  const fd = new FormData();
  fd.append('file', f);
  const res = await fetch('/upload_sticker', { method: 'POST', body: fd });
  const j = await res.json();
  if (j.ok) {
    loadStickers();
  } else alert('Sticker upload failed: ' + (j.error || 'unknown'));
};

async function loadStickers() {
  const res = await fetch('/stickers');
  const arr = await res.json();
  stickerGrid.innerHTML = '';
  (arr||[]).forEach(s=>{
    const img = document.createElement('img');
    img.src = s.url;
    img.style.width='60px';
    img.style.height='60px';
    img.style.borderRadius='8px';
    img.style.cursor='pointer';
    img.onclick = ()=>{
      socket.emit('send_chat', {
  text: `<img src='${s.url}' width='80' height='80' style='border-radius:8px;'>`,
  html: true  // ✅ add this
});
      stickerPopup.style.display='none';
    };
    stickerGrid.appendChild(img);
  });
}
loadStickers();
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = async () => {
  if (!fileInput.files.length) return;

  const file = fileInput.files[0];
  const fd = new FormData();
  fd.append('file', file);

  try {
    const res = await fetch('/upload', { method: 'POST', body: fd });
    const data = await res.json();

    if (!data.ok) {
      alert('Upload failed: ' + (data.error || 'unknown'));
    } else {
      console.log('File uploaded:', data.url);

      // ✅ refresh your existing file list so download links appear
      if (typeof loadFiles === 'function') {
        loadFiles();
      }

      // ✅ also add it manually to the list (instant feedback)
      const list = document.getElementById('filesList');
      if (list) {
        const li = document.createElement('li');
        const safe = encodeURIComponent(file.name);
        li.innerHTML = `<a href="${data.url}" download class="file-link">${file.name.replace(/^.*?_/,'')}</a>`;
        list.prepend(li);
      }
    }
  } catch (err) {
    alert('Upload error: ' + err.message);
  }

  fileInput.value = ''; // reset input
};
const audio = document.getElementById('audioPlayer');
  const npTitle = document.getElementById('npTitle');
  const npBy = document.getElementById('npBy');
  const queueList = document.getElementById('queueList');

  async function playMusic(){
    const q = document.getElementById('musicQuery').value.trim();
    if(!q) return;
    await fetch('/music/play', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({query: q})});
    document.getElementById('musicQuery').value = '';
  }
  async function skipMusic(){ await fetch('/music/skip', {method:'POST'}); }

  socket.on('now_playing', track => {
    if(!track){ npTitle.innerText='Nothing'; npBy.innerText=''; audio.src=''; return; }
    npTitle.innerText = track.title;
    npBy.innerText = 'requested by ' + (track.requested_by || 'unknown');
    audio.src = track.url;
    audio.play().catch(()=>{});
  });
  socket.on('queue_update', queue => {
    queueList.innerHTML = '';
    (queue||[]).forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<div style="flex:1"><strong>${t.title}</strong><div style="font-size:12px;color:var(--muted)">by ${t.requested_by || 'unknown'}</div></div>
                      <div style="margin-left:8px"><button class="small-btn" onclick="removeQueue(${t.id})"><i class="ph ph-fast-forward" style="color:white;"></i></button></div>`;
      queueList.appendChild(li);
    });
  });
  function removeQueue(id){ skipMusic(); }
  audio.addEventListener('ended', ()=> fetch('/music/skip', {method:'POST'}));
  
  // AERO Player UI control logic
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
let isPlaying = false;

playPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.innerHTML = '<i class="ph ph-pause"></i>';
    isPlaying = true;
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="ph ph-play"></i>';
    isPlaying = false;
  }
});

audio.addEventListener('timeupdate', () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = percent + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('click', e => {
  const rect = progressBar.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pos * audio.duration;
});

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

document.getElementById('nextBtn').addEventListener('click', skipMusic);
document.getElementById('prevBtn').addEventListener('click', () => {
  audio.currentTime = 0;
});
// known link icons (you can adjust Phosphor icon names)
const linkIcons = {
  github: 'ph-github-logo',
  reddit: 'ph-reddit-logo',
  twitter: 'ph-twitter-logo',
  website: 'ph-globe',
  portfolio: 'ph-briefcase',
  youtube: 'ph-youtube-logo'
};

// --- build link input rows ---
function renderLinksEditor(links) {
  const container = document.getElementById('linksContainer');
  container.innerHTML = '';
  Object.entries(links || {}).forEach(([name, url]) => {
    const div = document.createElement('div');
    div.className = 'link-item';
    div.innerHTML = `
      <input type="text" class="link-name" value="${name}" placeholder="name (e.g. github)">
      <input type="url" class="link-url" value="${url}" placeholder="https://example.com">
      <button class="remove-link">×</button>
    `;
    div.querySelector('.remove-link').onclick = () => div.remove();
    container.appendChild(div);
  });
}

// --- add new link ---
document.getElementById('addLinkBtn').onclick = () => {
  const container = document.getElementById('linksContainer');
  const div = document.createElement('div');
  div.className = 'link-item';
  div.innerHTML = `
    <input type="text" class="link-name" placeholder="name (e.g. github)">
    <input type="url" class="link-url" placeholder="https://example.com">
    <button class="remove-link">×</button>
  `;
  div.querySelector('.remove-link').onclick = () => div.remove();
  container.appendChild(div);
};

// --- load profile including links ---
async function loadProfile() {
  const res = await fetch('/_whoami');
  const data = await res.json();
  if (!data.username) return;

  document.getElementById('displayName').value = data.display || '';
  document.getElementById('displayColor').value = data.color || '#00ffaa';
  document.getElementById('displayBio').value = data.bio || '';
  renderLinksEditor(data.links || {});
}

// --- save profile with links ---
async function saveProfile() {
  const links = {};
  document.querySelectorAll('#linksContainer .link-item').forEach(div => {
    const name = div.querySelector('.link-name').value.trim();
    const url = div.querySelector('.link-url').value.trim();
    if (name && url) links[name] = url;
  });

  const body = {
    display: document.getElementById('displayName').value,
    color: document.getElementById('displayColor').value,
    bio: document.getElementById('displayBio').value,
    links: links
  };

  const res = await fetch('/profile', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.ok) alert('Profile updated!');
  else alert('Error: ' + (data.error || 'unknown'));
}

loadProfile();

let deferredPrompt;
const installBtn = document.getElementById("installBtn");

// Hide button initially
installBtn.style.display = "none";

window.addEventListener("beforeinstallprompt", (e) => {
  // Stop Chrome from showing the default mini-infobar
  e.preventDefault();
  deferredPrompt = e;
  // Show your custom install button
  installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  // Show install prompt
  deferredPrompt.prompt();

  // Wait for user's response
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install: ${outcome}`);

  // Hide the button after response
  deferredPrompt = null;
  installBtn.style.display = "none";
});

window.addEventListener("appinstalled", () => {
  console.log("✅ App installed successfully!");
  installBtn.style.display = "none";
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg))
      .catch(err => console.error("SW registration failed:", err));
  });
}
const typingIndicator = document.getElementById('typingIndicator');
const typingUsers = new Set();

socket.on('user_typing', data => {
  typingUsers.add(data.user);
  updateTypingDisplay();
});

socket.on('user_stop_typing', data => {
  typingUsers.delete(data.user);
  updateTypingDisplay();
});

function updateTypingDisplay() {
  if (typingUsers.size > 0) {
    const names = Array.from(typingUsers).join(', ');
    typingIndicator.innerText = `${names} typing...`;
    typingIndicator.style.opacity = '1';
  } else {
    typingIndicator.style.opacity = '0';
  }
}
