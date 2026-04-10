const API_URL = "TU_URL_DE_SHEETBEST_AQUI";
let allProducts = [];

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // Filtramos solo los locales en estado 'aprobado'
        allProducts = data.filter(item => item.estado === 'aprobado');
        displayNegocios(allProducts);
        document.getElementById("loading").style.display = "none";
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

function displayNegocios(items) {
    const container = document.getElementById("grid-negocios");
    container.innerHTML = "";

    items.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => abrirDetalleProducto(p);

        card.innerHTML = `
            <img src="${p.imagen}" alt="${p.nombre}">
            <div class="card-info">
                <span class="card-tag">${p.categoria}</span>
                <h3 style="margin:10px 0 5px 0;">${p.nombre}</h3>
                <small>📍 ${p.comuna}</small>
                <span class="price-tag">${p.precio || ''}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    
    const res = allProducts.filter(p => {
        const searchPool = `${p.nombre} ${p.categoria} ${p.tags || ''}`.toLowerCase();
        const matchesLoc = loc ? p.comuna === loc : true;
        const matchesTxt = searchPool.includes(txt);
        return matchesLoc && matchesTxt;
    });
    displayNegocios(res);
}

function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:250px; object-fit:cover;">
        <div style="padding:20px;">
            <h2 style="margin:0;">${p.nombre}</h2>
            <p style="color:#666;">${p.categoria} en ${p.comuna}</p>
            <hr>
            <p><strong>🏠 Dirección:</strong> ${p.direccion || 'No especificada'}</p>
            <p><strong>⏰ Horario:</strong> ${p.horario || 'Consultar'}</p>
            <p><strong>🏷️ Vende:</strong> ${p.tags || p.categoria}</p>
            <a href="https://wa.me/${p.telefono}" target="_blank" 
               style="display:block; background:#25d366; color:white; text-align:center; padding:12px; border-radius:10px; margin-top:20px; text-decoration:none; font-weight:bold;">
               WhatsApp del Local
            </a>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopup(e) {
    if(e.target.id === "productPopup") {
        document.getElementById("productPopup").style.display = "none";
    }
}

// Iniciar carga
fetchData();