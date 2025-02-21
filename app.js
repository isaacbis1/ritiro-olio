import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Sostituisci con i dati del tuo progetto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBZkCXioFje39FqmUFkM2GqEAcPvVo7csg",
  authDomain: "ritiro-olio.firebaseapp.com",
  projectId: "ritiro-olio",
  storageBucket: "ritiro-olio.firebasestorage.app",
  messagingSenderId: "1088319614799",
  appId: "1:1088319614799:web:e89cfc9c6a548b318c9f3a",
  measurementId: "G-Q0WCW8T0B1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Utility: converti username in email interna
function usernameToEmail(username) {
  return `${username}@ritiriolio.com`;
}

// DOM references
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const clienteSection = document.getElementById("cliente-section");
const logoutSection = document.getElementById("logout-section");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

// Admin: Crea nuovo cliente
const createClientBtn = document.getElementById("create-client-btn");
const newUsernameInput = document.getElementById("new-username");
const newPasswordInput = document.getElementById("new-password");

// Admin: Aggiungi Ritiro
const ritiroUsernameInput = document.getElementById("ritiro-username");
const ritiroDateInput = document.getElementById("ritiro-date");
const ritiroQuantitaInput = document.getElementById("ritiro-quantita");
const addRitiroBtn = document.getElementById("add-ritiro-btn");
const adminRitiriList = document.getElementById("admin-ritiri-list");

// Admin: Aggiungi Fattura
const fatturaUsernameInput = document.getElementById("fattura-username");
const fatturaDateInput = document.getElementById("fattura-date");
const fatturaImportoInput = document.getElementById("fattura-importo");
const fatturaFileInput = document.getElementById("fattura-file");
const addFatturaBtn = document.getElementById("add-fattura-btn");
const adminFattureList = document.getElementById("admin-fatture-list");

// Cliente: Prenota ritiro
const prenotaDateInput = document.getElementById("prenota-date");
const prenotaBtn = document.getElementById("prenota-btn");
// Cliente: Liste
const clienteRitiriList = document.getElementById("cliente-ritiri-list");
const clienteFattureList = document.getElementById("cliente-fatture-list");

// Variabili globali per utente corrente e ruolo
let currentUser = null;
let currentUserRole = null;

// Gestione dello stato di autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // Leggi il documento in "users/{uid}" per ottenere il ruolo
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      currentUserRole = userDocSnap.data().role;
    } else {
      // Se non esiste, crea il doc con ruolo predefinito "cliente"
      await setDoc(userDocRef, { email: user.email, role: "cliente" });
      currentUserRole = "cliente";
    }
    loginSection.classList.add("d-none");
    logoutSection.classList.remove("d-none");
    if (currentUserRole === "admin") {
      adminSection.classList.remove("d-none");
      clienteSection.classList.add("d-none");
      loadRitiriAdmin();
      loadFattureAdmin();
    } else {
      adminSection.classList.add("d-none");
      clienteSection.classList.remove("d-none");
      loadRitiriCliente();
      loadFattureCliente();
      loadPrenotazioni();
    }
  } else {
    currentUser = null;
    currentUserRole = null;
    loginSection.classList.remove("d-none");
    adminSection.classList.add("d-none");
    clienteSection.classList.add("d-none");
    logoutSection.classList.add("d-none");
  }
});

// LOGIN: Converte username in email e autentica
loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const email = usernameToEmail(username);
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Errore login: " + error.message);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ADMIN: Crea nuovo cliente
createClientBtn.addEventListener("click", async () => {
  const newUsername = newUsernameInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  if (!newUsername || !newPassword) {
    alert("Inserisci username e password");
    return;
  }
  const newEmail = usernameToEmail(newUsername);
  try {
    const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), { username: newUsername, role: "cliente" });
    alert(`Cliente ${newUsername} creato!`);
  } catch (error) {
    alert("Errore creazione cliente: " + error.message);
  }
});

// ADMIN: Aggiungi Ritiro per cliente
addRitiroBtn.addEventListener("click", async () => {
  const rUsername = ritiroUsernameInput.value.trim();
  const rDate = ritiroDateInput.value;
  const rQuantita = ritiroQuantitaInput.value.trim();
  if (!rUsername || !rDate || !rQuantita) {
    alert("Compila tutti i campi per il ritiro");
    return;
  }
  const clienteEmail = usernameToEmail(rUsername);
  try {
    await addDoc(collection(db, "ritiri"), {
      clienteEmail: clienteEmail,
      data: rDate,
      quantita: rQuantita,
      createdAt: new Date()
    });
    alert("Ritiro aggiunto!");
    ritiroUsernameInput.value = "";
    ritiroDateInput.value = "";
    ritiroQuantitaInput.value = "";
    loadRitiriAdmin();
  } catch (error) {
    alert("Errore aggiunta ritiro: " + error.message);
  }
});

// ADMIN: Aggiungi Fattura per cliente
addFatturaBtn.addEventListener("click", async () => {
  const fUsername = fatturaUsernameInput.value.trim();
  const fDate = fatturaDateInput.value;
  const fImporto = fatturaImportoInput.value.trim();
  const fFile = fatturaFileInput.files[0];
  if (!fUsername || !fDate || !fImporto || !fFile) {
    alert("Compila tutti i campi per la fattura");
    return;
  }
  const clienteEmail = usernameToEmail(fUsername);
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64File = e.target.result;
    try {
      await addDoc(collection(db, "fatture"), {
        clienteEmail: clienteEmail,
        data: fDate,
        importo: fImporto,
        fileBase64: base64File,
        createdAt: new Date()
      });
      alert("Fattura aggiunta!");
      fatturaUsernameInput.value = "";
      fatturaDateInput.value = "";
      fatturaImportoInput.value = "";
      fatturaFileInput.value = "";
      loadFattureAdmin();
    } catch (error) {
      alert("Errore aggiunta fattura: " + error.message);
    }
  };
  reader.readAsDataURL(fFile);
});

// CLIENTE: Prenota ritiro (il cliente sceglie il giorno in cui vuole che venga effettuato il ritiro)
document.getElementById("prenota-btn").addEventListener("click", async () => {
  const pDate = prenotaDateInput.value;
  if (!pDate) {
    alert("Seleziona una data per prenotare");
    return;
  }
  try {
    await addDoc(collection(db, "prenotazioni"), {
      userEmail: currentUser.email,
      data: pDate,
      createdAt: new Date()
    });
    alert("Prenotazione effettuata!");
    prenotaDateInput.value = "";
    loadPrenotazioni();
  } catch (error) {
    alert("Errore prenotazione: " + error.message);
  }
});

// ADMIN: Carica tutti i ritiri (per admin)
async function loadRitiriAdmin() {
  const list = document.getElementById("admin-ritiri-list");
  list.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "ritiri"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = "<li class='list-group-item'>Nessun ritiro trovato.</li>";
      return;
    }
    list.innerHTML = "";
    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Cliente: ${r.clienteEmail} | Data: ${r.data} | Quantità: ${r.quantita} L`;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// ADMIN: Carica tutte le fatture (per admin)
async function loadFattureAdmin() {
  const list = document.getElementById("admin-fatture-list");
  list.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "fatture"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = "<li class='list-group-item'>Nessuna fattura trovata.</li>";
      return;
    }
    list.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `<div>Cliente: ${f.clienteEmail} | Data: ${f.data} | €${f.importo}</div>`;
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-secondary";
      btn.textContent = "Vedi";
      btn.addEventListener("click", () => viewFatturaBase64(f.fileBase64));
      li.appendChild(btn);
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// CLIENTE: Carica i ritiri del cliente
async function loadRitiriCliente() {
  const list = document.getElementById("cliente-ritiri-list");
  list.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "ritiri"), where("clienteEmail", "==", currentUser.email), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = "<li class='list-group-item'>Nessun ritiro per il tuo account.</li>";
      return;
    }
    list.innerHTML = "";
    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Data: ${r.data} | Quantità: ${r.quantita} L`;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// CLIENTE: Carica le fatture del cliente
async function loadFattureCliente() {
  const list = document.getElementById("cliente-fatture-list");
  list.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "fatture"), where("clienteEmail", "==", currentUser.email), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = "<li class='list-group-item'>Nessuna fattura per il tuo account.</li>";
      return;
    }
    list.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `Data: ${f.data} | €${f.importo}`;
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-secondary";
      btn.textContent = "Vedi";
      btn.addEventListener("click", () => viewFatturaBase64(f.fileBase64));
      li.appendChild(btn);
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// CLIENTE: Carica prenotazioni
async function loadPrenotazioni() {
  const list = document.getElementById("lista-prenotazioni");
  list.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "prenotazioni"), where("userEmail", "==", currentUser.email), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = "<li class='list-group-item'>Nessuna prenotazione trovata.</li>";
      return;
    }
    list.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Data: ${p.data}`;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// Funzione per visualizzare la fattura in Base64 in una nuova finestra
function viewFatturaBase64(base64Data) {
  const newWin = window.open();
  newWin.document.write(`<img src="${base64Data}" style="max-width:100%;">`);
}
