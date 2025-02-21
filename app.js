import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
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

/* Sostituisci con i dati del tuo progetto */
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

// Riferimenti DOM
// Sezioni
const loginSection   = document.getElementById("login-section");
const adminSection   = document.getElementById("admin-section");
const clienteSection = document.getElementById("cliente-section");
const logoutSection  = document.getElementById("logout-section");

// Login/Logout
const loginBtn  = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

// Admin: Ritiri
const ritiroEmailInput   = document.getElementById("ritiro-email");
const ritiroDataInput    = document.getElementById("ritiro-data");
const ritiroQuantitaInput= document.getElementById("ritiro-quantita");
const aggiungiRitiroBtn  = document.getElementById("aggiungi-ritiro");
const listaRitiri        = document.getElementById("lista-ritiri");

// Admin: Fatture
const fatturaEmailInput   = document.getElementById("fattura-email");
const fatturaDataInput    = document.getElementById("fattura-data");
const fatturaImportoInput = document.getElementById("fattura-importo");
const fatturaFileInput    = document.getElementById("fattura-file");
const aggiungiFatturaBtn  = document.getElementById("aggiungi-fattura");
const listaFatture        = document.getElementById("lista-fatture");

// Cliente: Ritiri
const storicoRitiriCliente = document.getElementById("storico-ritiri-cliente");
const prenotaDataInput     = document.getElementById("prenota-data");
const prenotaBtn           = document.getElementById("prenota-btn");
const listaPrenotazioni    = document.getElementById("lista-prenotazioni");
const listaFattureCliente  = document.getElementById("lista-fatture-cliente");

// Utente corrente
let currentUser      = null;
let currentUserRole  = null;

// Verifica stato di autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // C'è un utente loggato
    currentUser = user;
    console.log("Utente loggato:", user.email, user.uid);

    // Carica doc in `users/{uid}` per scoprire il ruolo
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      currentUserRole = docSnap.data().role;
      console.log("Ruolo:", currentUserRole);
      loginSection.classList.add("d-none");
      logoutSection.classList.remove("d-none");

      if (currentUserRole === "admin") {
        adminSection.classList.remove("d-none");
        clienteSection.classList.add("d-none");
        loadRitiri();       // Carica tutti i ritiri
        loadFatture();      // Carica tutte le fatture
      } else {
        adminSection.classList.add("d-none");
        clienteSection.classList.remove("d-none");
        loadRitiriCliente();   // Carica ritiri di questo utente
        loadPrenotazioni();    // Carica prenotazioni di questo utente
        loadFattureCliente();  // Carica fatture di questo utente
      }
    } else {
      // Non esiste doc in "users/{uid}"
      // Crealo come default "cliente"
      await setDoc(docRef, { email: user.email, role: "cliente" });
      currentUserRole = "cliente";
      alert("Il tuo account non era in 'users'. Ora sei impostato come 'cliente'. Ricarica la pagina.");
    }

  } else {
    // Nessun utente loggato
    console.log("Nessun utente loggato");
    currentUser      = null;
    currentUserRole  = null;
    loginSection.classList.remove("d-none");
    adminSection.classList.add("d-none");
    clienteSection.classList.add("d-none");
    logoutSection.classList.add("d-none");
  }
});

/* LOGIN */
loginBtn.addEventListener("click", async () => {
  const email    = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Errore login: " + error.message);
  }
});

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

/* ========== ADMIN: Ritiri ========== */
aggiungiRitiroBtn.addEventListener("click", async () => {
  if (currentUserRole !== "admin") {
    alert("Non sei admin!");
    return;
  }
  const emailCliente = ritiroEmailInput.value.trim();
  const dataR        = ritiroDataInput.value;
  const quantita     = ritiroQuantitaInput.value.trim();

  if (!emailCliente || !dataR || !quantita) {
    alert("Compila tutti i campi del Ritiro.");
    return;
  }

  try {
    await addDoc(collection(db, "ritiri"), {
      clienteEmail: emailCliente,
      data: dataR,
      quantita: quantita,
      createdAt: new Date()
    });
    alert("Ritiro aggiunto con successo!");
    // Svuota input
    ritiroEmailInput.value = "";
    ritiroDataInput.value  = "";
    ritiroQuantitaInput.value = "";
    loadRitiri();
  } catch (error) {
    alert("Errore aggiunta ritiro: " + error.message);
  }
});

// Carica TUTTI i ritiri (admin)
async function loadRitiri() {
  listaRitiri.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const ritiriRef = collection(db, "ritiri");
    const q = query(ritiriRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      listaRitiri.innerHTML = "<li class='list-group-item'>Nessun ritiro trovato.</li>";
      return;
    }
    listaRitiri.innerHTML = "";
    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Cliente: ${r.clienteEmail} | Data: ${r.data} | Quantità: ${r.quantita} L`;
      listaRitiri.appendChild(li);
    });
  } catch (error) {
    listaRitiri.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

/* ========== ADMIN: Fatture ========== */
aggiungiFatturaBtn.addEventListener("click", async () => {
  if (currentUserRole !== "admin") {
    alert("Non sei admin!");
    return;
  }
  const emailCliente = fatturaEmailInput.value.trim();
  const dataF        = fatturaDataInput.value;
  const importo      = fatturaImportoInput.value.trim();
  const file         = fatturaFileInput.files[0];

  if (!emailCliente || !dataF || !importo || !file) {
    alert("Compila tutti i campi e seleziona un file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64File = e.target.result;
    try {
      await addDoc(collection(db, "fatture"), {
        clienteEmail: emailCliente,
        data: dataF,
        importo: importo,
        fileBase64: base64File,
        createdAt: new Date()
      });
      alert("Fattura aggiunta!");
      fatturaEmailInput.value   = "";
      fatturaDataInput.value    = "";
      fatturaImportoInput.value = "";
      fatturaFileInput.value    = "";
      loadFatture();
    } catch (err) {
      alert("Errore aggiunta fattura: " + err.message);
    }
  };
  reader.readAsDataURL(file);
});

// Carica TUTTE le fatture (admin)
async function loadFatture() {
  listaFatture.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const fattureRef = collection(db, "fatture");
    const q = query(fattureRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      listaFatture.innerHTML = "<li class='list-group-item'>Nessuna fattura trovata.</li>";
      return;
    }
    listaFatture.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>${f.clienteEmail}</strong> | Data: ${f.data} | €${f.importo}
        </div>
      `;
      const btnVedi = document.createElement("button");
      btnVedi.className = "btn btn-sm btn-outline-secondary";
      btnVedi.textContent = "Vedi";
      btnVedi.addEventListener("click", () => viewFatturaBase64(f.fileBase64));
      li.appendChild(btnVedi);

      listaFatture.appendChild(li);
    });
  } catch (error) {
    listaFatture.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

/* ========== CLIENTE: RITIRI E PRENOTAZIONI ========== */

// Carica SOLO i ritiri del cliente loggato
async function loadRitiriCliente() {
  storicoRitiriCliente.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const ritiriRef = collection(db, "ritiri");
    const q = query(
      ritiriRef,
      where("clienteEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      storicoRitiriCliente.innerHTML = "<li class='list-group-item'>Nessun ritiro per il tuo account.</li>";
      return;
    }
    storicoRitiriCliente.innerHTML = "";
    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Data: ${r.data} | Quantità: ${r.quantita} L`;
      storicoRitiriCliente.appendChild(li);
    });
  } catch (error) {
    storicoRitiriCliente.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

// Prenota un ritiro
prenotaBtn.addEventListener("click", async () => {
  if (currentUserRole !== "cliente") {
    alert("Solo i clienti possono prenotare!");
    return;
  }
  const dataP = prenotaDataInput.value;
  if (!dataP) {
    alert("Seleziona una data!");
    return;
  }
  try {
    await addDoc(collection(db, "prenotazioni"), {
      userEmail: currentUser.email,
      data: dataP,
      createdAt: new Date()
    });
    alert("Prenotazione effettuata!");
    prenotaDataInput.value = "";
    loadPrenotazioni();
  } catch (error) {
    alert("Errore prenotazione: " + error.message);
  }
});

// Carica le prenotazioni del cliente
async function loadPrenotazioni() {
  listaPrenotazioni.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const prenRef = collection(db, "prenotazioni");
    const q = query(
      prenRef,
      where("userEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      listaPrenotazioni.innerHTML = "<li class='list-group-item'>Nessuna prenotazione.</li>";
      return;
    }
    listaPrenotazioni.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `Data: ${p.data}`;
      listaPrenotazioni.appendChild(li);
    });
  } catch (error) {
    listaPrenotazioni.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

/* ========== CLIENTE: FATTURE ========== */
async function loadFattureCliente() {
  listaFattureCliente.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const fattRef = collection(db, "fatture");
    const q = query(
      fattRef,
      where("clienteEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      listaFattureCliente.innerHTML = "<li class='list-group-item'>Nessuna fattura trovata per te.</li>";
      return;
    }
    listaFattureCliente.innerHTML = "";
    snap.forEach((docSnap) => {
      const f = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `Data: ${f.data} | Importo: €${f.importo}`;
      // Bottone "Vedi"
      const btnVedi = document.createElement("button");
      btnVedi.className = "btn btn-sm btn-outline-secondary";
      btnVedi.textContent = "Vedi";
      btnVedi.addEventListener("click", () => viewFatturaBase64(f.fileBase64));
      li.appendChild(btnVedi);

      listaFattureCliente.appendChild(li);
    });
  } catch (error) {
    listaFattureCliente.innerHTML = `<li class='list-group-item'>Errore: ${error.message}</li>`;
  }
}

/* Visualizza l'immagine Fattura in una nuova finestra */
function viewFatturaBase64(base64) {
  const w = window.open();
  w.document.write(`<img src="${base64}" style="max-width:100%">`);
}

