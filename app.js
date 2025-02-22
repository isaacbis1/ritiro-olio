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
  orderBy,
  deleteDoc,
  updateDoc,
  serverTimestamp
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

// Utility: converte username in email interna
function usernameToEmail(username) {
  return `${username}@ritiriolio.com`;
}

// DOM References
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const clienteSection = document.getElementById("cliente-section");
const logoutSection = document.getElementById("logout-section");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

// Admin: Creazione Cliente
const createClientBtn = document.getElementById("create-client-btn");
const newUsernameInput = document.getElementById("new-username");
const newPasswordInput = document.getElementById("new-password");

// Admin: Aggiungi Ritiro per Cliente
const ritiroUsernameInput = document.getElementById("ritiro-username");
const ritiroDateInput = document.getElementById("ritiro-date");
const ritiroQuantitaInput = document.getElementById("ritiro-quantita");
const addRitiroBtn = document.getElementById("add-ritiro-btn");
const adminRitiriList = document.getElementById("admin-ritiri-list");

// Admin: Aggiungi Fattura per Cliente
const fatturaUsernameInput = document.getElementById("fattura-username");
const fatturaDateInput = document.getElementById("fattura-date");
const fatturaImportoInput = document.getElementById("fattura-importo");
const fatturaFileInput = document.getElementById("fattura-file");
const addFatturaBtn = document.getElementById("add-fattura-btn");
const adminFattureList = document.getElementById("admin-fatture-list");

// Admin: Prenotazioni dei Clienti
const adminPrenotazioniList = document.getElementById("admin-prenotazioni-list");

// Cliente: Prenotazione e Visualizzazione
const prenotaDateInput = document.getElementById("prenota-date");
const prenotaBtn = document.getElementById("prenota-btn");
const clienteRitiriList = document.getElementById("cliente-ritiri-list");
const clienteFattureList = document.getElementById("cliente-fatture-list");
const clientePrenotazioniList = document.getElementById("cliente-prenotazioni-list");

let currentUser = null;
let currentUserRole = null;

// Gestione dello stato di autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    console.log("Utente autenticato:", user.email);
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      currentUserRole = userDocSnap.data().role;
      console.log("Ruolo:", currentUserRole);
    } else {
      await setDoc(userDocRef, { email: user.email, role: "cliente" });
      currentUserRole = "cliente";
      console.log("Creato doc utente con ruolo 'cliente'");
    }
    loginSection.classList.add("d-none");
    logoutSection.classList.remove("d-none");
    if (currentUserRole === "admin") {
      adminSection.classList.remove("d-none");
      clienteSection.classList.add("d-none");
      loadRitiriAdmin();
      loadFattureAdmin();
      loadPrenotazioniAdmin();
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

// LOGIN: converte username in email e autentica
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
    alert("Inserisci username e password per il nuovo cliente");
    return;
  }
  const newEmail = usernameToEmail(newUsername);
  try {
    // Nota: createUserWithEmailAndPassword cambia l'utente loggato!
    const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), { username: newUsername, role: "cliente" });
    alert(`Cliente ${newUsername} creato! Ricorda di rientrare come admin.`);
    newUsernameInput.value = "";
    newPasswordInput.value = "";
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
  const clientEmail = usernameToEmail(rUsername);
  try {
    // Aggiunge il ritiro con serverTimestamp per "createdAt"
    await addDoc(collection(db, "ritiri"), {
      clienteEmail: clientEmail,
      data: rDate,
      quantita: rQuantita,
      createdAt: serverTimestamp()
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

// ADMIN: Modifica Ritiro (funzione di esempio: modifica quantità e data)
async function modificaRitiro(docId) {
  const newData = prompt("Inserisci la nuova data (YYYY-MM-DD):");
  const newQuantita = prompt("Inserisci la nuova quantità (litri):");
  if (!newData || !newQuantita) {
    alert("Campi non validi per la modifica.");
    return;
  }
  try {
    const docRef = doc(db, "ritiri", docId);
    await updateDoc(docRef, {
      data: newData,
      quantita: newQuantita
    });
    alert("Ritiro modificato!");
    loadRitiriAdmin();
  } catch (error) {
    alert("Errore modifica ritiro: " + error.message);
  }
}

// ADMIN: Aggiungi Fattura per cliente (file letto in Base64 senza compressione)
addFatturaBtn.addEventListener("click", async () => {
  const fUsername = fatturaUsernameInput.value.trim();
  const fDate = fatturaDateInput.value;
  const fImporto = fatturaImportoInput.value.trim();
  const fFile = fatturaFileInput.files[0];
  if (!fUsername || !fDate || !fImporto || !fFile) {
    alert("Compila tutti i campi per la fattura");
    return;
  }
  const clientEmail = usernameToEmail(fUsername);
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target.result;
      await addDoc(collection(db, "fatture"), {
        clienteEmail: clientEmail,
        data: fDate,
        importo: fImporto,
        fileBase64: fileData,
        createdAt: serverTimestamp()
      });
      alert("Fattura aggiunta!");
      fatturaUsernameInput.value = "";
      fatturaDateInput.value = "";
      fatturaImportoInput.value = "";
      fatturaFileInput.value = "";
      loadFattureAdmin();
    };
    reader.readAsDataURL(fFile);
  } catch (error) {
    alert("Errore aggiunta fattura: " + error.message);
  }
});

// CLIENTE: Prenota ritiro
prenotaBtn.addEventListener("click", async () => {
  const pDate = prenotaDateInput.value;
  if (!pDate) {
    alert("Seleziona una data per prenotare");
    return;
  }
  try {
    await addDoc(collection(db, "prenotazioni"), {
      userEmail: currentUser.email,
      data: pDate,
      createdAt: serverTimestamp()
    });
    alert("Prenotazione effettuata!");
    prenotaDateInput.value = "";
    loadPrenotazioni();
  } catch (error) {
    alert("Errore prenotazione: " + error.message);
  }
});

// ADMIN: Carica tutti i ritiri (Admin) con opzioni di modifica e cancellazione
async function loadRitiriAdmin() {
  adminRitiriList.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "ritiri"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      adminRitiriList.innerHTML = "<li class='list-group-item'>Nessun ritiro trovato.</li>";
      return;
    }
    adminRitiriList.innerHTML = "";
    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `<div>Cliente: ${r.clienteEmail} | Data: ${r.data} | Quantità: ${r.quantita} L</div>`;
      
      // Pulsante Modifica
      const btnModifica = document.createElement("button");
      btnModifica.className = "btn btn-sm btn-info ms-2";
      btnModifica.textContent = "Modifica";
      btnModifica.addEventListener("click", () => modificaRitiro(docSnap.id));
      
      // Pulsante Cancella
      const btnCancella = document.createElement("button");
      btnCancella.className = "btn btn-sm btn-danger ms-2";
      btnCancella.textContent = "Cancella";
      btnCancella.addEventListener("click", async () => {
        if (confirm("Confermi la cancellazione di questo ritiro?")) {
          await deleteDoc(doc(db, "ritiri", docSnap.id));
          alert("Ritiro cancellato!");
          loadRitiriAdmin();
        }
      });
      
      li.appendChild(btnModifica);
      li.appendChild(btnCancella);
      adminRitiriList.appendChild(li);
    });
  } catch (error) {
    adminRitiriList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// ADMIN: Carica tutte le fatture (Admin) con opzione di cancellazione
async function loadFattureAdmin() {
  adminFattureList.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "fatture"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      adminFattureList.innerHTML = "<li class='list-group-item'>Nessuna fattura trovata.</li>";
      return;
    }
    adminFattureList.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `<div>Cliente: ${f.clienteEmail} | Data: ${f.data} | €${f.importo}</div>`;
      const btnVedi = document.createElement("button");
      btnVedi.className = "btn btn-sm btn-outline-secondary";
      btnVedi.textContent = "Vedi & Scarica";
      btnVedi.addEventListener("click", () =>
        downloadFattura(f.fileBase64, `fattura_${f.clienteEmail}_${f.data}.pdf`)
      );
      const btnCancella = document.createElement("button");
      btnCancella.className = "btn btn-sm btn-danger ms-2";
      btnCancella.textContent = "Cancella";
      btnCancella.addEventListener("click", async () => {
        if (confirm("Confermi la cancellazione di questa fattura?")) {
          await deleteDoc(doc(db, "fatture", docSnap.id));
          alert("Fattura cancellata!");
          loadFattureAdmin();
        }
      });
      li.appendChild(btnVedi);
      li.appendChild(btnCancella);
      adminFattureList.appendChild(li);
    });
  } catch (error) {
    adminFattureList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// CLIENTE: Carica i ritiri del cliente
async function loadRitiriCliente() {
  clienteRitiriList.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(
      collection(db, "ritiri"),
      where("clienteEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      clienteRitiriList.innerHTML = "<li class='list-group-item'>Nessun ritiro per il tuo account.</li>";
      return;
    }
    clienteRitiriList.innerHTML = "";
    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Data: ${r.data} | Quantità: ${r.quantita} L`;
      clienteRitiriList.appendChild(li);
    });
  } catch (error) {
    clienteRitiriList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// CLIENTE: Carica le fatture del cliente
async function loadFattureCliente() {
  clienteFattureList.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(
      collection(db, "fatture"),
      where("clienteEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      clienteFattureList.innerHTML = "<li class='list-group-item'>Nessuna fattura per il tuo account.</li>";
      return;
    }
    clienteFattureList.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `Data: ${f.data} | €${f.importo}`;
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-secondary";
      btn.textContent = "Vedi & Scarica";
      btn.addEventListener("click", () =>
        downloadFattura(f.fileBase64, `fattura_${f.clienteEmail}_${f.data}.pdf`)
      );
      li.appendChild(btn);
      clienteFattureList.appendChild(li);
    });
  } catch (error) {
    clienteFattureList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// ADMIN: Carica tutte le prenotazioni dei clienti
async function loadPrenotazioniAdmin() {
  adminPrenotazioniList.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "prenotazioni"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      adminPrenotazioniList.innerHTML = "<li class='list-group-item'>Nessuna prenotazione trovata.</li>";
      return;
    }
    adminPrenotazioniList.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `Utente: ${p.userEmail} | Data: ${p.data}`;
      const btnCancella = document.createElement("button");
      btnCancella.className = "btn btn-sm btn-danger";
      btnCancella.textContent = "Cancella";
      btnCancella.addEventListener("click", async () => {
        if (confirm("Confermi la cancellazione di questa prenotazione?")) {
          await deleteDoc(doc(db, "prenotazioni", docSnap.id));
          alert("Prenotazione cancellata!");
          loadPrenotazioniAdmin();
        }
      });
      li.appendChild(btnCancella);
      adminPrenotazioniList.appendChild(li);
    });
  } catch (error) {
    adminPrenotazioniList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// CLIENTE: Carica le prenotazioni del cliente
async function loadPrenotazioni() {
  clientePrenotazioniList.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(
      collection(db, "prenotazioni"),
      where("userEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      clientePrenotazioniList.innerHTML = "<li class='list-group-item'>Nessuna prenotazione trovata.</li>";
      return;
    }
    clientePrenotazioniList.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = `Data: ${p.data}`;
      const btnCancella = document.createElement("button");
      btnCancella.className = "btn btn-sm btn-danger";
      btnCancella.textContent = "Cancella";
      btnCancella.addEventListener("click", async () => {
        if (confirm("Confermi la cancellazione di questa prenotazione?")) {
          await deleteDoc(doc(db, "prenotazioni", docSnap.id));
          alert("Prenotazione cancellata!");
          loadPrenotazioni();
        }
      });
      li.appendChild(btnCancella);
      clientePrenotazioniList.appendChild(li);
    });
  } catch (error) {
    clientePrenotazioniList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// Utility: Scarica la fattura (file Base64) come file
function downloadFattura(base64Data, filename) {
  const a = document.createElement("a");
  a.href = base64Data;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
