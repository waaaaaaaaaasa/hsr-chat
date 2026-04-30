/* =====================================================
   HSR CHAT 完全版 script.js
   index.html / style.css はそのまま使用可能
===================================================== */

const PREFIX = "hsrchat_";

/* ===============================
   キャラクターデータ
=============================== */
const characters = [
  {
    name: "アナイクス",
    icon: "assets/img/icon/Anaxa.png",
    desc: "では、お聞きしますが‥‥‥"
  },
  {
    name: "ヒアンシー",
    icon: "assets/img/icon/Hyacine.png",
    desc: "昏光の庭は、ずっとあなたの傍にいるよ～"
  },
  {
    name: "キャストリス",
    icon: "assets/img/icon/Castorice.png",
    desc: "書いてる最中だよ"
  },
  {
    name: "ファイノン",
    icon: "assets/img/icon/Phainon.png",
    desc: "太陽を称えよ！"
  },
  {
    name: "アグライア",
    icon: "assets/img/icon/Aglaea.png",
    desc: "バルネアで会いましょう"
  },
  {
    name: "サフェル",
    icon: "assets/img/icon/Cipher.png",
    desc: "金運上昇！"
  },
  {
    name: "モーディス",
    icon: "assets/img/icon/Mydei.png",
    desc: "食事7割、運動3割"
  },
  {
    name: "トリビー",
    icon: "assets/img/icon/Tribbie.png",
    desc: "トリビー先生はいつでもいるよ～"
  }
];

/* ===============================
   状態管理
=============================== */
let currentChat = {
  name: "未保存",
  type: "solo",
  characters: [],
  subtitle: "",
  messages: []
};

let currentChatKey = null;

/* 新規作成時 / 追加時 一時保持 */
let selectedCharacters = [];
let newChatCharacters = [];

/* ===============================
   要素取得
=============================== */
const chatBox = document.getElementById("chatBox");
const chatList = document.getElementById("chatList");

const title = document.querySelector("header h2");
const subtitle = document.querySelector("header h3");

const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const groupSpeakerSelect = document.getElementById("groupSpeakerSelect");
const inputArea = document.querySelector(".input-area");

const pool = document.getElementById("characterPool");
const groupMembers = document.getElementById("groupMembers");
const selectedGroup = document.getElementById("selectedGroup");
const newChatGroup = selectedGroup;

const chatNameInput = document.getElementById("chatNameInput");
const newChatBtn = document.getElementById("newChatBtn");

const trashZone = document.getElementById("trashZone");
const dropArea = document.querySelector(".drop-area");

const moreCharsBtn = document.getElementById("moreCharsBtn");
const charModal = document.getElementById("charModal");
const closeCharModal = document.getElementById("closeCharModal");
const allCharacterPool = document.getElementById("allCharacterPool");
const charOverlay = document.querySelector(".char-overlay");

/* ===============================
   初期化
=============================== */
window.onload = () => {
  createSpeakerPreview();

  renderCharacterPool();
  renderChatList();
  loadFirstChat();
  updateUI();
  setupDropArea();
  setupTrashZone();
  setupCharModal();
};

/* ===============================
   共通
=============================== */
function getChar(name) {
  return characters.find(c => c.name === name);
}

function saveCurrentChat() {
  if (!currentChatKey) return;
  localStorage.setItem(currentChatKey, JSON.stringify(currentChat));
}

function showWarning(msg){
  alert(msg);
}

/* ===============================
   UI切替
=============================== */
function updateUI() {
  updateHeader();
  renderGroupMembers();
  renderNewChatGroup();

  if(currentChat.type === "solo"){
    groupMembers.classList.add("locked");
  }else{
    groupMembers.classList.remove("locked");
  }

  renderGroupSpeakerSelect();

  if(currentChat.type === "solo"){
    groupSpeakerSelect.style.display = "none";
    speakerPreview.style.display = "none";
  }else{
    groupSpeakerSelect.style.display = "block";
    speakerPreview.style.display = "flex";
  }

  updateSpeakerPreview();
}

/* ===============================
   ヘッダー
=============================== */
function updateHeader() {
  if (currentChat.type === "solo") {
    const char = getChar(currentChat.characters[0]);

    if (char) {
      title.textContent = char.name;
      subtitle.textContent = char.desc;
    } else {
      title.textContent = currentChat.name;
      subtitle.textContent = "";
    }

    subtitle.contentEditable = false;
  } else {
    title.textContent = currentChat.name;
    subtitle.textContent =
      currentChat.subtitle || "説明を入力";

    subtitle.contentEditable = true;
  }
}

/* subtitle保存 */
subtitle.addEventListener("input", () => {
  if (currentChat.type === "group") {
    currentChat.subtitle = subtitle.textContent;
    saveCurrentChat();
  }
});

/* ===============================
   キャラ選択
=============================== */

/* ===============================
   グループ発言者選択
=============================== */
function renderGroupSpeakerSelect() {

  groupSpeakerSelect.innerHTML = "";

  if(currentChat.type === "solo") return;

  currentChat.characters.forEach(name => {
    const op = document.createElement("option");
    op.value = name;
    op.textContent = name;
    groupSpeakerSelect.appendChild(op);
  });

}

/* ===============================
   左キャラプール
=============================== */
function renderCharacterPool() {
  pool.innerHTML = "";

  characters.forEach(char => {

    const wrap = document.createElement("div");
    wrap.className = "char-item";
    wrap.draggable = true;

    wrap.innerHTML = `
      <img src="${char.icon}" class="char-icon">
      <div class="char-name">${char.name}</div>
    `;

    wrap.addEventListener("dragstart", e => {
      e.dataTransfer.setData("charName", char.name);
    });

    pool.appendChild(wrap);
  });
}

/* ===============================
   ドロップ
=============================== */
function setupDropArea(){

  /* 共通演出 */
  [groupMembers, selectedGroup].forEach(box => {

    box.addEventListener("dragover", e => {
      e.preventDefault();
      box.classList.add("active-drop");
    });

    box.addEventListener("dragleave", () => {
      box.classList.remove("active-drop");
    });

    box.addEventListener("drop", e => {
      e.preventDefault();
      box.classList.remove("active-drop");
    });

  });

  /* 現在メンバーへ追加 */
  groupMembers.addEventListener("drop", e => {

  e.preventDefault();

  /* ソロチャットなら追加禁止 */
  if(currentChat.type === "solo"){
    showWarning("ソロチャットにはメンバー追加できません");
    return;
  }

  const name = e.dataTransfer.getData("charName");
  if(!name) return;

  if(!currentChat.characters.includes(name)){
    currentChat.characters.push(name);

    saveCurrentChat();
    renderGroupMembers();
    renderChatList();
    renderGroupSpeakerSelect();
  }

});

  /* 新規編成へ追加 */
  selectedGroup.addEventListener("drop", e => {

    const name = e.dataTransfer.getData("charName");
    if(!name) return;

    if(!newChatCharacters.includes(name)){
      newChatCharacters.push(name);
      renderNewChatGroup();
    }

  });

}

/* ===============================
   ドロップアウト（外へ出して削除）
=============================== */
document.body.addEventListener("dragover", e => {
  e.preventDefault();
});

document.body.addEventListener("drop", e => {
  const removeName = e.dataTransfer.getData("removeChar");

  if (!removeName) return;

  /* selectedGroup内に落とした場合は削除しない */
  if (selectedGroup.contains(e.target)) return;

  selectedCharacters =
    selectedCharacters.filter(name => name !== removeName);

  renderSelectedGroup();
});

/* ===============================
   追加予定表示
=============================== */
function renderSelectedGroup() {
  selectedGroup.innerHTML = "";

  if (selectedCharacters.length === 0) {
    selectedGroup.innerHTML = "<p>追加キャラをドロップ</p>";
    return;
  }

  selectedCharacters.forEach(name => {
    const char = getChar(name);

    const already =
        currentChat.type === "group" &&
        currentChat.characters.includes(name);

    const div = document.createElement("div");
    div.className = "char-card";

    if (already) {
        div.classList.add("already-member");
    }

    div.draggable = true;

    div.innerHTML = `
        <img src="${char.icon}">
        <span>${char.name}</span>
        ${already ? `<small>既存</small>` : ""}
    `;

    div.addEventListener("dragstart", e => {
        e.dataTransfer.setData("removeChar", name);
    });

    div.addEventListener("dragend", () => {
        trashZone.classList.remove("active");
    });

    selectedGroup.appendChild(div);
  });
}

/* ===============================
   現在メンバー表示
=============================== */
function renderGroupMembers() {
  groupMembers.innerHTML = "";

  if (!currentChat.characters) return;

  currentChat.characters.forEach(name => {
    const char = getChar(name);

    const div = document.createElement("div");
    
    div.className = "char-card";

    /* 掴めるようにする */
    div.draggable = true;

    div.innerHTML = `
      <img src="${char.icon}">
      <span>${char.name}</span>
    `;

    /* ドラッグ開始 */
    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("removeMember", name);
      trashZone.classList.add("show");
    });

    /* 終了 */
    div.addEventListener("dragend", () => {
      trashZone.classList.remove("show");
      trashZone.classList.remove("active");
    });

    groupMembers.appendChild(div);
  });
}

function renderNewChatGroup() {
  selectedGroup.innerHTML = "";

  if(newChatCharacters.length === 0){
    newChatGroup.innerHTML = "<p>ここへドロップ</p>";
    return;
  }

  newChatCharacters.forEach(name=>{

    const char = getChar(name);

    const div = document.createElement("div");
    div.className = "char-card";
    div.draggable = true;

    div.innerHTML = `
      <img src="${char.icon}">
      <span>${char.name}</span>
    `;

    div.addEventListener("dragstart",e=>{
      e.dataTransfer.setData("removeNew",name);
    });

    selectedGroup.appendChild(div);

  });

}

/* ===============================
   新規チャット作成
=============================== */
newChatBtn.onclick = () => {
  const name = chatNameInput.value.trim();

  if (!name) {
    showWarning("チャット名を入力してください");
    return;
  }

  if (newChatCharacters.length === 0) {
    showWarning("キャラを追加してください");
    return;
  }

  const type =
    newChatCharacters.length === 1
      ? "solo"
      : "group";

  currentChat = {
    name,
    type,
    characters: [...newChatCharacters],
    subtitle: "",
    messages: []
  };

  currentChatKey = PREFIX + name;

  saveCurrentChat();

  newChatCharacters = [];
  chatNameInput.value = "";

  renderChatList();
  updateUI();
  chatBox.innerHTML = "";

  newChatCharacters = [];
  renderNewChatGroup();

  document.getElementById("charModal").classList.add("hidden");
};

/* ===============================
   メンバー追加
=============================== */

/* ===============================
   メッセージ送信
=============================== */
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  let speaker;

  if (currentChat.type === "solo") {
    speaker = getChar(currentChat.characters[0]);
  } else {
    const name = groupSpeakerSelect.value;

    if (!currentChat.characters.includes(name)) {
      speaker = getChar(currentChat.characters[0]);
    } else {
      speaker = getChar(name);
    }
  }

  if (!speaker) return;

  const msg = {
    name: speaker.name,
    icon: speaker.icon,
    text
  };

  currentChat.messages.push(msg);

  renderMessage(msg);
  saveCurrentChat();

  input.value = "";
}

/* ===============================
   メッセージ表示
=============================== */
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  div.innerHTML = `
    <img src="${msg.icon}" class="avatar">
    <div class="chat-content">
      <b class="name">${msg.name}</b>
      <div class="bubble">${msg.text}</div>
    </div>
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ===============================
   チャット一覧
=============================== */
function renderChatList() {
  chatList.innerHTML = "";

  Object.keys(localStorage)
    .filter(key => key.startsWith(PREFIX))
    .forEach(key => {
      const data = JSON.parse(localStorage.getItem(key));

      const name = data.name || key.replace(PREFIX, "");
      const count = data.messages ? data.messages.length : 0;
      const chars = data.characters || [];
      let iconHTML = "";

      /* 1人ならソロ扱い（groupでも1人なら大アイコン） */
      if (chars.length === 1) {
        const char = getChar(chars[0]);

        if (char) {
          iconHTML = `
            <div class="chat-icons solo-icon">
              <img src="${char.icon}">
            </div>
          `;
        }
      }

      /* 2人以上ならグループ表示 */
      else if (chars.length >= 2) {
        const char1 = getChar(chars[0]);
        const char2 = getChar(chars[1]);
        const extra = chars.length - 2;

        iconHTML = `
          <div class="chat-icons">
            ${char1 ? `<img src="${char1.icon}" class="icon-front">` : ""}
            ${char2 ? `<img src="${char2.icon}" class="icon-back">` : ""}
            ${extra > 0 ? `<div class="chat-more">+${extra}</div>` : ""}
          </div>
        `;
      }
      const div = document.createElement("div");
      div.className = "chat-item";

      div.innerHTML = `
        <div class="chat-title-wrap">
          ${iconHTML}

          <div>
            <div class="chat-title">${name}</div>
            <div class="chat-meta">
              <span class="chat-type ${data.type === 'group' ? 'group' : 'solo'}">
                ${data.type === 'group' ? 'グループ' : 'ソロ'}
              </span>
              <span>${count} メッセージ</span>
            </div>
          </div>
        </div>

        <button class="delete-btn">×</button>
      `;

      div.onclick = () => loadChat(name);

      div.querySelector(".delete-btn").onclick = (e) => {
        e.stopPropagation();

        localStorage.removeItem(key);

        if (currentChatKey === key) {
          currentChatKey = null;
          chatBox.innerHTML = "";
        }

        renderChatList();
      };

      chatList.appendChild(div);
    });
}

/* ===============================
   読み込み
=============================== */
function loadChat(name) {
  currentChatKey = PREFIX + name;

  currentChat =
    JSON.parse(localStorage.getItem(currentChatKey));

  selectedCharacters = [];

  chatBox.innerHTML = "";

  currentChat.messages.forEach(msg => {
    renderMessage(msg);
  });

  updateUI();
}

/* ===============================
   初回読み込み
=============================== */
function loadFirstChat() {
  const first = Object.keys(localStorage)
    .find(k => k.startsWith(PREFIX));

  if (!first) return;

  loadChat(first.replace(PREFIX, ""));
}

/* ===============================
   ゴミ箱削除
=============================== */

trashZone.addEventListener("drop", e => {
  e.preventDefault();

  const reserve = e.dataTransfer.getData("removeChar");
  const member = e.dataTransfer.getData("removeMember");

  /* 追加予定から削除 */
  if (reserve) {
    selectedCharacters =
      selectedCharacters.filter(n => n !== reserve);
  }

  /* 現在メンバーから削除 */
  if (member) {
    currentChat.characters =
      currentChat.characters.filter(n => n !== member);

    saveCurrentChat();
  }

  renderSelectedGroup();
  renderGroupMembers();
  renderChatList();
  updateUI();

  trashZone.classList.remove("show");
  trashZone.classList.remove("active");
});

function setupTrashZone(){

  trashZone.addEventListener("dragover", e=>{
    e.preventDefault();
    trashZone.classList.add("active");
  });

  trashZone.addEventListener("dragleave", ()=>{
    trashZone.classList.remove("active");
  });

  trashZone.addEventListener("drop", e=>{
    e.preventDefault();

    const member = e.dataTransfer.getData("removeMember");
    const reserve = e.dataTransfer.getData("removeNew");

    if(member){
      currentChat.characters =
        currentChat.characters.filter(n=>n!==member);

      saveCurrentChat();
      renderGroupMembers();
      renderChatList();
    }

    if(reserve){
      newChatCharacters =
        newChatCharacters.filter(n=>n!==reserve);

      renderNewChatGroup();
    }

    trashZone.classList.remove("active");
  });

}

document.body.addEventListener("dragover",e=>{
  e.preventDefault();
});

document.body.addEventListener("drop",e=>{

  const remove1 = e.dataTransfer.getData("removeChar");
  const remove2 = e.dataTransfer.getData("removeNew");

  if(remove1){
    currentChat.characters =
      currentChat.characters.filter(n=>n!==remove1);

    saveCurrentChat();
    renderGroupMembers();
  }

  if(remove2){
    newChatCharacters =
      newChatCharacters.filter(n=>n!==remove2);

    renderNewChatGroup();
  }

});

/* ===============================
   キャラ一覧モーダル
=============================== */
function setupCharModal(){

  moreCharsBtn.onclick = () => {
    renderAllCharacterPool();
    charModal.classList.remove("hidden");
    adjustCharWindow();
    document.body.classList.add("modal-open");
  };

  closeCharModal.onclick = () => {
    charModal.classList.add("hidden");
  };

  charOverlay.onclick = () => {
    charModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  };
}

/* 一覧描画 */
function renderAllCharacterPool(){

  allCharacterPool.innerHTML = "";

  characters.forEach(char => {

    const div = document.createElement("div");
    div.className = "all-char-card";
    div.draggable = true;

    div.innerHTML = `
      <img src="${char.icon}">
      <p>${char.name}</p>
    `;

    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("charName", char.name);
    });

    allCharacterPool.appendChild(div);

  });

}

/* ===============================
   もっとみる横幅 自動調整
=============================== */
function adjustCharWindow(){

  const modalWindow = document.querySelector(".char-window");
  const rightPanel  = document.querySelector(".sidebar-right");

  if(!modalWindow || !rightPanel) return;

  const rect = rightPanel.getBoundingClientRect();

  modalWindow.style.width = rect.left + "px";
}

window.addEventListener("resize", adjustCharWindow);

function createSpeakerPreview(){

  const preview = document.createElement("div");
  preview.id = "speakerPreview";

  preview.innerHTML = `
    <img id="speakerIcon">
    <span id="speakerName"></span>
  `;

  inputArea.insertBefore(preview, groupSpeakerSelect);
}

function updateSpeakerPreview(){
  const name = groupSpeakerSelect.value;
  const char = getChar(name);

  if(!char) return;

  speakerPreview.innerHTML = `
    <img src="${char.icon}">
  `;
}

groupSpeakerSelect.addEventListener("change", updateSpeakerPreview);
