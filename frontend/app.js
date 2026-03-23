const API = ""; 
console.log("API URL gesetzt auf: " + (API || "relativer Pfad"));

let cart = [];
let allProducts = [];
let currentUser = JSON.parse(localStorage.getItem("steelUser")) || null;

/** Prüft ob User eingeloggt ist, sonst Modal zeigen */
function checkAuth(requiredRole, callback) {
    if (!currentUser) {
        showLoginModal(`Diese Funktion erfordert einen Login (${requiredRole}).`);
        return;
    }
    
    // Admin darf alles, Staff nur Bestand erhöhen
    if (requiredRole === 'admin' && currentUser.role !== 'admin') {
        showToast("Nur Admins dürfen diese Aktion ausführen!", "error");
        return;
    }
    
    callback(); // Führe die eigentliche Funktion aus
}

function showLoginModal(msg) {
    document.getElementById("login-msg").innerText = msg;
    document.getElementById("login-modal").classList.remove("hidden");
}

function closeLogin() {
    document.getElementById("login-modal").classList.add("hidden");
}

function updateUI() {
    const userDisplay = document.getElementById("user-display");
    const logoutBtn = document.getElementById("logout-btn");
    const adminLockIcons = document.querySelectorAll(".admin-lock-icon");
    const staffLockIcons = document.querySelectorAll(".staff-lock-icon");

    if (currentUser) {
        userDisplay.innerText = `👤 ${currentUser.username.toUpperCase()} (${currentUser.role})`;
        userDisplay.classList.add("text-blue-400");
        logoutBtn.classList.remove("hidden");
        
        // Schlösser entfernen wenn berechtigt
        if (currentUser?.role == 'admin'){
            adminLockIcons.forEach(icon => icon.innerText = "🔓");
            staffLockIcons.forEach(icon => icon.innerText = "🔓");
            
        }else{
            staffLockIcons.forEach(icon => icon.innerText = "🔓");
        }
    }
}

async function performLogin() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    try {
        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("steelUser", JSON.stringify({ ...data, username }));
            location.reload();
        } else {
            const error = await response.json();
            let message = "Login fehlgeschlagen!";
            if (typeof error.detail === "string") {
                message = error.detail;
            } else if (Array.isArray(error.detail)) {
                // Nimmt die erste Fehlermeldung aus der Liste (z.B. "name: field required")
                message = error.detail.map(err => `${err.loc[1]}: ${err.msg}`).join(", ");
            }

            showToast("Fehler: " + message, "error");
        }  
    } catch (e) {
        showToast("Server nicht erreichbar", "error");
    } 
}

function logout() {
    localStorage.removeItem("steelUser");
    location.reload();
}

// Initialer UI-Check
updateUI();

/** Hilfsfunktion für Header-Authorization */
function getAuthHeader() {
    return currentUser ? { "Authorization": `Bearer ${currentUser.token}` } : {};
}

// Hilfsfunktion zum Markieren
function markInvalid(element) {
    element.classList.add("is-invalid");

    // Sobald der Nutzer wieder tippt, die rote Markierung entfernen
    element.addEventListener("input", () => {
        element.classList.remove("is-invalid");
    }, { once: true });
}

// Delete-Aufruf mit Token
async function deleteProduct(id) {
    if (currentUser?.role !== 'admin') return showToast("Nur Admins dürfen löschen", "error");
    if (!confirm("Produkt wirklich löschen?")) return;
    const res = await fetch(`${API}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
    });
    if (res.ok) {
        showToast("Produkt gelöscht", "info");
        loadProducts();
    }
}


/**
 * Liest das Formular aus und speichert ein neues Produkt 
 * oder aktualisiert ein bestehendes.
 */
async function saveProduct() {
    // Falls versteckte ID-Variable für "Edit" genutzt wird, holen wir sie hier ab
    const id = document.getElementById("product-id-hidden")?.value; 
    
    const productData = {
        name: document.getElementById("name"),
        short_sign: document.getElementById("short_sign").value,
        material: document.getElementById("material").value,
        norm: document.getElementById("norm").value,
        length: document.getElementById("length"),
        price: document.getElementById("price"),
        stock: document.getElementById("stock"),
        certificate: "3.1" // Standardwert oder neues Input-Feld
    };

    let isValid = true;

    // Validierungs-Logik
    if (!productData.name.value) { markInvalid(productData.name); isValid = false; }
    if (parseFloat(productData.price.value) <= 0 || isNaN(productData.price.value)) { markInvalid(productData.price); isValid = false; }
    if (parseInt(productData.stock.value) < 0 || isNaN(productData.stock.value)) { markInvalid(productData.stock); isValid = false; }
    if (parseFloat(productData.length.value) <= 0 || isNaN(productData.length.value)) { markInvalid(productData.length); isValid = false; }

    if (!isValid) {
        showToast("Bitte markierte Felder korrigieren!", "error");
        return; // Hier der wichtige Abbruch!
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/products/${id}` : `${API}/products/`;

    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
    });

    if (response.ok) {
        showToast(id ? "Produkt aktualisiert!" : "Produkt erstellt!", "success");
        clearProductForm();
        loadProducts(); // Liste neu laden
    } else {
        const error = await response.json();
        let message = "Unbekannter Fehler";
        if (typeof error.detail === "string") {
            message = error.detail;
        } else if (Array.isArray(error.detail)) {
            // Nimmt die erste Fehlermeldung aus der Liste (z.B. "name: field required")
            message = error.detail.map(err => `${err.loc[1]}: ${err.msg}`).join(", ");
        }

        showToast("Fehler: " + message, "error");
    }
}

/** Hilfsfunktion zum Leeren des Formulars */
function clearProductForm() {
    ["name", "short_sign", "material", "norm", "length", "price", "stock"].forEach(id => {
        document.getElementById(id).value = "";
    });
    if(document.getElementById("product-id-hidden")) {
        document.getElementById("product-id-hidden").value = "";
    }
}

/** Füllt das Formular für die Bearbeitung aus */
function fillEditForm(id) {
    const p = allProducts.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById("name").value = p.name;
    document.getElementById("short_sign").value = p.short_sign;
    document.getElementById("material").value = p.material;
    document.getElementById("norm").value = p.norm;
    document.getElementById("length").value = p.length;
    document.getElementById("price").value = p.price;
    document.getElementById("stock").value = p.stock;
    
    // Ein verstecktes Feld im HTML für die ID
    if (!document.getElementById("product-id-hidden")) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.id = "product-id-hidden";
        document.body.appendChild(hidden);
    }
    document.getElementById("product-id-hidden").value = p.id;
    
    // Scroll nach oben zum Formular
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


/** Lädt Produkte und füllt Katalog sowie Dropdowns */
async function loadProducts() {
    const res = await fetch(`${API}/products/`);
    allProducts = await res.json();
    
    renderCatalog();
    updateStockDropdown();
    renderCart();
}

/** Zeichnet die mittlere Spalte (Katalog) */
function renderCatalog() {
    const container = document.getElementById("products-container");
    container.innerHTML = allProducts.map(p => renderProductCard(p)).join("");
    document.getElementById("product-count").innerText = allProducts.length;
}

/** Die Ampel-Karte */
function renderProductCard(p) {
    const isOutOfStock = p.stock === 0;
    const red = p.stock === 0 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900 opacity-20';
    const yellow = (p.stock > 0 && p.stock < 50) ? 'bg-yellow-500 shadow-[0_0_10px_yellow]' : 'bg-yellow-900 opacity-20';
    const green = p.stock >= 50 ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-green-900 opacity-20';

    return `
    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center hover:border-slate-500 transition-all">
        <div class="flex-1">
            <div class="flex items-center gap-3">
                <h3 class="font-bold text-lg text-white">${p.name}</h3>
                <div class="flex gap-1 bg-black/30 p-1 rounded-full px-2">
                    <div class="w-2 h-2 rounded-full ${red}" title="Nicht verfügbar"></div>
                    <div class="w-2 h-2 rounded-full ${yellow}" title="Bestand gering"></div>
                    <div class="w-2 h-2 rounded-full ${green}" title="Bestand ausreichend"></div>
                </div>
            </div>
            <p class="text-[10px] text-slate-500 uppercase tracking-widest">${p.short_sign} | ${p.material} | Norm: ${p.norm}</p>
            <div class="flex gap-4 mt-2 items-center">
                <span class="text-blue-400 font-bold">€${p.price.toFixed(2)}</span>
                <span class="text-xs text-slate-400">Lager: <b class="${p.stock < 10 ? 'text-red-500' : 'text-slate-200'}">${p.stock}</b></span>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <button onclick="deleteProduct(${p.id})" class="p-2 hover:bg-red-700 rounded-lg text-xs">🗑️</button>
            <button onclick="fillEditForm(${p.id})" class="p-2 hover:bg-slate-700 rounded-lg text-xs">✏️</button>
            <button onclick="addToCart(${p.id})" ${isOutOfStock ? 'disabled' : ''} 
                class="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 p-2 px-3 rounded-lg transition-colors">
                🛒
            </button>
        </div>
    </div>`;
}

/** Warenkorb Logik */
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        if (existing.quantity < product.stock) existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const container = document.getElementById("cart-items");
    let total = 0;
    
    container.innerHTML = cart.map((item, index) => {
        total += item.price * item.quantity;
        return `
        <div class="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-700">
            <div>
                <p class="font-bold text-xs">${item.name}</p>
                <p class="text-[10px] text-slate-500">${item.quantity} x €${item.price}</p>
            </div>
            <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-300">✕</button>
        </div>`;
    }).join("");

    document.getElementById("cart-total").innerText = `€ ${total.toFixed(2)}`;
    document.getElementById("cart-count").innerText = cart.length;
}

/** Lagerstand nur erhöhen (für Admin/Staff) */
async function increaseStock() {
    const productId = document.getElementById("stock-product-select").value;
    const amount = parseInt(document.getElementById("stock-increase").value);
    if (!productId || isNaN(amount)){
        if(!productId){
            alert("bitte product auswählen")
        }
        if(isNaN(amount)){
            alert("Lagerstand muss > 0 sein")
        }

        return;
    }


    // Ein Patch/Put Request an das Backend
    await fetch(`${API}/products/${productId}/increase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount })
    });
    
    document.getElementById("stock-increase").value = "";
    loadProducts();
}

function updateStockDropdown() {
    const select = document.getElementById("stock-product-select");
    select.innerHTML = '<option value="">Produkt wählen...</option>' + 
        allProducts.map(p => `<option value="${p.id}">${p.name} (${p.short_sign})</option>`).join("");
}


async function checkout() {
    if (cart.length === 0) {
        showToast("Warenkorb ist leer!", "info");
        return;
    }

    // Send checkout request to backend
    const response = await fetch(`${API}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart) // Sendet das gesamte Array
    });

    if (response.ok) {
        showToast("Bestellung erfolgreich!", "success");
        cart = []; // Warenkorb leeren
        renderCart();
        loadProducts(); // Lagerzahlen live aktualisieren
    }else {
        const error = await response.json();
        let message = "Login fehlgeschlagen!";
        if (typeof error.detail === "string") {
            message = error.detail;
        } else if (Array.isArray(error.detail)) {
            // Nimmt die erste Fehlermeldung aus der Liste (z.B. "name: field required")
            message = error.detail.map(err => `${err.loc[1]}: ${err.msg}`).join(", ");
        }

        showToast("Fehler: " + message, "error");
    }
}

/**
 * Zeigt eine moderne Benachrichtigung an.
 * @param {string} message - Der Text der Nachricht
 * @param {string} type - "success", "error" oder "info"
 */
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");

    // Farben basierend auf Typ
    const colors = {
        success: "bg-green-600 border-green-400",
        error: "bg-red-600 border-red-400",
        info: "bg-blue-600 border-blue-400"
    };
    toast.className = `${colors[type]} text-white px-6 py-3 rounded-xl shadow-2xl border-l-4 
                       transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-3`;
    
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span class="font-medium">${message}</span>`;

    container.appendChild(toast);

    // Einblenden
    setTimeout(() => {
        toast.classList.remove("translate-y-10", "opacity-0");
    }, 10);

    // Ausblenden und Entfernen nach 3 Sekunden
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-x-10");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialer Start
loadProducts();
