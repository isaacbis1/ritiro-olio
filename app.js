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
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { PDFDocument } from "https://unpkg.com/pdf-lib/dist/pdf-lib.min.js";

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

// Funzione per comprimere immagini usando un canvas
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function(e) {
      img.src = e.target.result;
    };
    reader.onerror = reject;
    img.onload = function() {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Funzione per comprimere PDF usando pdf-lib
async function compressPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const compressedBytes = await pdfDoc.save();
  let binary = "";
  const bytes = new Uint8Array(compressedBytes);
  bytes.forEach(b => binary += String.fromCharCode(b));
  const base64String = window.btoa(binary);
  return `data:application/pdf;base64,${base64String}`;
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

// Variabili globali per utente corrente e ruolo
let currentUser = null;
let currentUserRole = null;

// Gestione dello stato di autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      currentUserRole = userDocSnap.data().role;
    } else {
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
    await addDoc(collection(db, "ritiri"), {
      clienteEmail: clientEmail,
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
  const clientEmail = usernameToEmail(fUsername);
  try {
    let fileData;
    if (fFile.type === "application/pdf") {
      fileData = await compressPDF(fFile);
    } else {
      fileData = await compressImage(fFile, 800, 800, 0.7);
    }
    await addDoc(collection(db, "fatture"), {
      clienteEmail: clientEmail,
      data: fDate,
      importo: fImporto,
      fileBase64: fileData,
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
      createdAt: new Date()
    });
    alert("Prenotazione effettuata!");
    prenotaDateInput.value = "";
    loadPrenotazioni();
  } catch (error) {
    alert("Errore prenotazione: " + error.message);
  }
});

// ADMIN: Carica tutti i ritiri (Admin)
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
      li.className = "list-group-item";
      li.textContent = `Cliente: ${r.clienteEmail} | Data: ${r.data} | Quantità: ${r.quantita} L`;
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
      btnVedi.addEventListener("click", () => downloadFattura(f.fileBase64, `fattura_${f.clienteEmail}_${f.data}.pdf`));
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
      btn.addEventListener("click", () => downloadFattura(f.fileBase64, `fattura_${f.clienteEmail}_${f.data}.pdf`));
      li.appendChild(btn);
      clienteFattureList.appendChild(li);
    });
  } catch (error) {
    clienteFattureList.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// ADMIN: Carica tutte le prenotazioni (Clienti)
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
      li.className = "list-group-item";
      li.textContent = `Utente: ${p.userEmail} | Data: ${p.data}`;
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
      li.className = "list-group-item";
      li.textContent = `Data: ${p.data}`;
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
