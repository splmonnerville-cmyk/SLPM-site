import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZLCs0_s0Tky6NXFxTGsBbQk3L8ce9zYk",
  authDomain: "slpm-1ca9b.firebaseapp.com",
  projectId: "slpm-1ca9b",
  storageBucket: "slpm-1ca9b.firebasestorage.app",
  messagingSenderId: "928771242176",
  appId: "1:928771242176:web:a4a1dbbe6d8549cb915525"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CODE_ADMIN = "SLPM-1936";

function estAdmin() {
    return sessionStorage.getItem('admin') === 'oui';
}

function mettreAJourUI() {
    const formAdmin = document.getElementById('formAdmin');
    const btnAdmin = document.getElementById('btnAdmin');
    if (estAdmin()) {
        formAdmin.style.display = 'block';
        btnAdmin.textContent = '🔓 Admin connecté';
        btnAdmin.style.backgroundColor = '#2a7a2a';
    } else {
        formAdmin.style.display = 'none';
        btnAdmin.textContent = '🔒 Admin';
        btnAdmin.style.backgroundColor = '';
    }
    chargerArticles();
}

document.getElementById('btnAdmin').addEventListener('click', function () {
    if (estAdmin()) {
        sessionStorage.removeItem('admin');
        mettreAJourUI();
        return;
    }
    const code = prompt('Entrez le code administrateur :');
    if (code === CODE_ADMIN) {
        sessionStorage.setItem('admin', 'oui');
        mettreAJourUI();
    } else if (code !== null) {
        alert('Code incorrect.');
    }
});

// Aperçu image
document.getElementById('image').addEventListener('change', function () {
    const fichier = this.files[0];
    const apercu = document.getElementById('apercu');
    const erreurImage = document.getElementById('erreurImage');

    if (!fichier) { apercu.style.display = 'none'; return; }

    if (fichier.size > 1 * 1024 * 1024) {
        erreurImage.style.display = 'block';
        apercu.style.display = 'none';
        this.value = '';
        return;
    }

    erreurImage.style.display = 'none';
    const lecteur = new FileReader();
    lecteur.onload = function (e) {
        apercu.src = e.target.result;
        apercu.style.display = 'block';
    };
    lecteur.readAsDataURL(fichier);
});

// Charge les articles depuis Firestore
async function chargerArticles() {
    const conteneur = document.getElementById('articles');
    conteneur.innerHTML = '<p><em>Chargement...</em></p>';

    const q = query(collection(db, 'actualites'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    conteneur.innerHTML = '';

    if (snapshot.empty) {
        conteneur.innerHTML = '<p><em>Aucun article publié pour le moment.</em></p>';
        return;
    }

    snapshot.forEach(function (docSnap) {
        const article = docSnap.data();
        const div = document.createElement('div');
        div.className = 'article';

        const imageHTML = article.image
            ? `<img src="${article.image}" alt="Image de l'article" style="max-width:100%; max-height:300px; border-radius:8px; margin-top:10px; display:block;">`
            : '';

        const deleteHTML = estAdmin()
            ? `<a class="delete" data-id="${docSnap.id}" style="cursor:pointer;">✕ Supprimer</a>`
            : '';

        div.innerHTML = `
            <h3>${article.titre}</h3>
            <small>${article.date}</small>
            <p>${article.contenu}</p>
            ${imageHTML}
            ${deleteHTML}
        `;

        if (estAdmin()) {
            div.querySelector('.delete').addEventListener('click', function () {
                supprimerArticle(this.dataset.id);
            });
        }

        conteneur.appendChild(div);
    });
}

async function ajouterArticle() {
    const titre = document.getElementById('titre').value.trim();
    const contenu = document.getElementById('contenu').value.trim();
    const erreur = document.getElementById('erreur');
    const erreurImage = document.getElementById('erreurImage');
    const fichierImage = document.getElementById('image').files[0];

    if (!titre || !contenu) { erreur.style.display = 'block'; return; }
    erreur.style.display = 'none';

    if (fichierImage) {
        if (fichierImage.size > 1 * 1024 * 1024) { erreurImage.style.display = 'block'; return; }
        const lecteur = new FileReader();
        lecteur.onload = async function (e) { await sauvegarderArticle(titre, contenu, e.target.result); };
        lecteur.readAsDataURL(fichierImage);
    } else {
        await sauvegarderArticle(titre, contenu, null);
    }
}

async function sauvegarderArticle(titre, contenu, imageBase64) {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
        await addDoc(collection(db, 'actualites'), {
            titre, contenu, date, image: imageBase64, timestamp: Date.now()
        });
    } catch (e) {
        alert("Erreur lors de la sauvegarde : " + e.message);
        return;
    }

    document.getElementById('titre').value = '';
    document.getElementById('contenu').value = '';
    document.getElementById('image').value = '';
    document.getElementById('apercu').style.display = 'none';
    chargerArticles();
}

async function supprimerArticle(id) {
    if (!confirm('Supprimer cet article ?')) return;
    await deleteDoc(doc(db, 'actualites', id));
    chargerArticles();
}

document.getElementById('btnPublier').addEventListener('click', ajouterArticle);
mettreAJourUI();