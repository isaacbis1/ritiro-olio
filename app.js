import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
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

// Sostituisci i seguenti valori con quelli del tuo progetto Firebase
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

// Elementi DOM
const loginSection    = document.getElementById("login-section");
const adminSection    = document.getElementById("admin-section");
const clienteSection  = document.getElementById("cliente-section");
const logoutSection   = document.getElementById("logout-section");

const loginBtn        = document.getElementById("login-btn");
const logoutBtn       = document.getElementById("logout-btn");
const creaClientiBtn  = document.getElementById("crea-clienti-btn");

// Login input
const emailInput      = document.getElementById("email");
const passwordInput   = document.getElementById("password");

// ADMIN: Ritiri
const ritiroEmailInput    = document.getElementById("ritiro-email");
const ritiroDataInput     = document.getElementById("ritiro-data");
const ritiroQuantitaInput = document.getElementById("ritiro-quantita");
const aggiungiRitiroBtn   = document.getElementById("aggiungi-ritiro");
const listaRitiri         = document.getElementById("lista-ritiri");

// ADMIN: Fatture
const fatturaEmailInput   = document.getElementById("fattura-email");
const fatturaDataInput    = document.getElementById("fattura-data");
const fatturaImportoInput = document.getElementById("fattura-importo");
const fatturaFileInput    = document.getElementById("fattura-file");
const aggiungiFatturaBtn  = document.getElementById("aggiungi-fattura");
const listaFatture        = document.getElementById("lista-fatture");

// CLIENTE: Ritiri & Prenotazioni
const storicoRitiriCliente = document.getElementById("storico-ritiri-cliente");
const prenotaDataInput     = document.getElementById("prenota-data");
const prenotaBtn           = document.getElementById("prenota-btn");
const listaPrenotazioni    = document.getElementById("lista-prenotazioni");
const listaFattureCliente  = document.getElementById("lista-fatture-cliente");

// Utente corrente e ruolo
let currentUser = null;
let currentUserRole = null;

// Controlla stato autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // Leggi il documento in Firestore in "users/{uid}" per ottenere il ruolo
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      currentUserRole = userDocSnap.data().role;
    } else {
      // Se non esiste, crea un documento di default come "cliente"
      await setDoc(userDocRef, { email: user.email, role: "cliente" });
      currentUserRole = "cliente";
    }
    // Mostra le sezioni appropriate
    loginSection.classList.add("d-none");
    logoutSection.classList.remove("d-none");
    if (currentUserRole === "admin") {
      adminSection.classList.remove("d-none");
      clienteSection.classList.add("d-none");
      loadRitiri();
      loadFatture();
    } else {
      adminSection.classList.add("d-none");
      clienteSection.classList.remove("d-none");
      loadRitiriCliente();
      loadPrenotazioni();
      loadFattureCliente();
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

// LOGIN
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
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

// ADMIN: Crea 10 Clienti (automatico dal front-end)
if (document.getElementById("crea-clienti-btn")) {
  creaClientiBtn.addEventListener("click", async () => {
    const emails = [
      "cliente1@olio.com",
      "cliente2@olio.com",
      "cliente3@olio.com",
      "cliente4@olio.com",
      "cliente5@olio.com",
      "cliente6@olio.com",
      "cliente7@olio.com",
      "cliente8@olio.com",
      "cliente9@olio.com",
      "cliente10@olio.com"
    ];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const password = "pass123";
      try {
        // Crea l'utente in Firebase Auth
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        // Salva il ruolo su Firestore
        await setDoc(doc(db, "users", uid), {
          email: email,
          role: "cliente"
        });
        console.log(`Creato: ${email} (UID: ${uid})`);
      } catch (err) {
        console.error("Errore creazione utente: ", email, err.message);
      }
    }
    alert("Creazione multipla utenti completata!");
  });
}

// ADMIN: Aggiungi Ritiro
aggiungiRitiroBtn.addEventListener("click", async () => {
  if (currentUserRole !== "admin") {
    alert("Non sei admin!");
    return;
  }
  const emailCliente = ritiroEmailInput.value.trim();
  const dataR = ritiroDataInput.value;
  const quantita = ritiroQuantitaInput.value.trim();
  if (!emailCliente || !dataR || !quantita) {
    alert("Compila tutti i campi per il ritiro.");
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
    ritiroEmailInput.value = "";
    ritiroDataInput.value = "";
    ritiroQuantitaInput.value = "";
    loadRitiri();
  } catch (error) {
    alert("Errore aggiunta ritiro: " + error.message);
  }
});

// ADMIN: Aggiungi Fattura (salva file in Base64)
aggiungiFatturaBtn.addEventListener("click", async () => {
  if (currentUserRole !== "admin") {
    alert("Non sei admin!");
    return;
  }
  const emailCliente = fatturaEmailInput.value.trim();
  const dataF = fatturaDataInput.value;
  const importo = fatturaImportoInput.value.trim();
  const file = fatturaFileInput.files[0];
  if (!emailCliente || !dataF || !importo || !file) {
    alert("Compila tutti i campi e seleziona un file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = async function (e) {
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
      fatturaEmailInput.value = "";
      fatturaDataInput.value = "";
      fatturaImportoInput.value = "";
      fatturaFileInput.value = "";
      loadFatture();
    } catch (err) {
      alert("Errore aggiunta fattura: " + err.message);
    }
  };
  reader.readAsDataURL(file);
});

// ADMIN: Carica tutti i ritiri
async function loadRitiri() {
  listaRitiri.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "ritiri"), orderBy("createdAt", "desc"));
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

// ADMIN: Carica tutte le fatture
async function loadFatture() {
  listaFatture.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(collection(db, "fatture"), orderBy("createdAt", "desc"));
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
      li.innerHTML = `<div><strong>${f.clienteEmail}</strong> | Data: ${f.data} | €${f.importo}</div>`;
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

// CLIENTE: Carica ritiri relativi all'utente loggato
async function loadRitiriCliente() {
  storicoRitiriCliente.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(
      collection(db, "ritiri"),
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

// CLIENTE: Prenotazione ritiro
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

// CLIENTE: Carica prenotazioni dell'utente loggato
async function loadPrenotazioni() {
  listaPrenotazioni.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(
      collection(db, "prenotazioni"),
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

// CLIENTE: Carica le fatture relative all'utente loggato
async function loadFattureCliente() {
  listaFattureCliente.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const q = query(
      collection(db, "fatture"),
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
      li.innerHTML = `Data: ${f.data} | €${f.importo}`;
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

// Funzione per visualizzare la fattura (file Base64) in una nuova finestra
function viewFatturaBase64(base64Data) {
  const newWin = window.open();
  newWin.document.write(`<img src="${base64Data}" style="max-width:100%;">`);
}
