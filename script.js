const CONFIG = {
    PROXY_URL: 'https://script.google.com/macros/s/AKfycbx3eTprAjyYooIep7S2w_Q9kIUCCvknoWHORhyglVlOHWKWZ8ononv6-FvpDrXyC7OPfw/exec',
    CACHE_KEY: 'llamabarrio_data',
    CACHE_TIME: 5 * 60 * 1000
};

let allProducts = [];
let allPicadas = [];

/* 🚀 CARGA CON CACHE */
async function cargarTodo() {

    const cache = localStorage.getItem(CONFIG.CACHE_KEY);

    if (cache) {
        const parsed = JSON.parse(cache);
        if (Date.now() - parsed.time < CONFIG.CACHE_TIME) {
            allProducts = parsed.products;
            allPicadas = parsed.picadas;
            renderBase();
            return;
        }
    }

    try {
        const [db, tally] = await Promise.all([
            fetchSheet('Hoja 1'),
            fetchSheet('Tally')
        ]);

        allProducts = db.values.slice(1).map(r => ({
            nombre: r[0],
            imagen: r[1],
            categoria: r[2],
            precio: r[3],
            comuna: r[4],
            telefono: r[5],
            direccion: r[7],
            estado: r[9]
        })).filter(p => p.estado?.toLowerCase() === 'aprobado');

        allPicadas = tally.values.slice(1).map(r => ({
            nombre: r[7],
            comuna: r[4],
            contacto: r[6],
            descripcion: r[5],
            imagen: r[3],
            estado: r[8]
        })).filter(p => p.estado?.toLowerCase() === 'aprobado');

        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
            time: Date.now(),
            products: allProducts,
            picadas: allPicadas
        }));

        renderBase();

    } catch (e) {
        console.error("Error:", e);
    }
}

async function fetchSheet(name) {
    const r = await fetch(`${CONFIG.PROXY_URL}?hoja=${name}`);
    return await r.json();
}

/* 🎯 RENDER */
function renderBase() {
    const scroll = document.getElementById("cheap-scroll");

    scroll.innerHTML = allPicadas.map(p => `
        <div onclick='abrirDetallePicada(${JSON.stringify(p)})'>
            <img src="${p.imagen}" loading="lazy"
                style="width:70px;height:70px;border-radius:50%">
        </div>
    `).join('');

    buscar();
}

/* 🔍 BUSCAR */
function buscar() {
    const txt = document.getElementById("main-search").value?.toLowerCase() || "";

    const filtered = allProducts.filter(p =>
        p.nombre.toLowerCase().includes(txt)
    );

    document.getElementById("product-list").innerHTML =
        filtered.map(createCardHTML).join('');
}

/* 🧱 CARD */
function createCardHTML(p) {
    return `
        <div class="res-card" onclick='abrirDetalleProducto(${JSON.stringify(p)})'>
            <img src="${p.imagen}" loading="lazy">
            <div style="padding:10px">
                <strong>${p.nombre}</strong>
                <div>$${p.precio}</div>
            </div>
        </div>
    `;
}

/* 🪟 POPUPS */
function abrirDetalleProducto(p) {
    document.getElementById("popup-body").innerHTML = `
        <img src="${p.imagen}">
        <h3>${p.nombre}</h3>
        <a href="https://wa.me/${p.telefono}">WhatsApp</a>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function abrirDetallePicada(p) {
    abrirDetalleProducto(p);
}

function cerrarPopupProducto() {
    document.getElementById("productPopup").style.display = "none";
}

/* INIT */
window.onload = cargarTodo;