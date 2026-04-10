const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

const API_URL = "https://api.sheetbest.com/sheets/caf4ae8d-2b11-42a4-bf34-c2b68a0b921a";
const CSV_VECINOS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRWzx7f1vqDJI0loZSkE0nMI9ZNc65LU9VU3Dejgj1eByfSAFHu3Nea8XsMlWwQgYoCJFjCA8UpU2ui/pub?gid=1515086148&single=true&output=csv";

let allProducts = [];

function init() {
    const filter = document.getElementById("location-filter");
    if (filter) {
        filter.innerHTML = '<option value="">Comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c;
            op.textContent = c;
            filter.appendChild(op);
        });
    }
    cargarProductosNegocios(); // Carga la grilla de abajo (API)
    cargarPicadasVecinos();   // Carga los círculos de arriba (CSV)
}

// 1. CARGAR NEGOCIOS (API SHEETBEST) -> Grilla de resultados
function cargarProductosNegocios() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            allProducts = data.filter(p => p.estado === "aprobado");
            displayNegocios(allProducts);
        });
}

// 2. CARGAR VECINOS (CSV TALLY) -> Círculos pequeños forzados
async function cargarPicadasVecinos() {
    try {
        const res = await fetch(CSV_VECINOS_URL);
        const csvText = await res.text();
        const filas = csvText.split("\n").slice(1);
        const scroll = document.getElementById("cheap-scroll");
        
        if (filas.length > 0) scroll.innerHTML = "";

        filas.forEach(fila => {
            const cols = fila.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (cols && cols.length >= 2) {
                const img = cols[0].replace(/"/g, "").trim();
                const nombre = cols[1].replace(/"/g, "").trim();
                const desc = cols[2] ? cols[2].replace(/"/g, "").trim() : "";
                const precio = cols[3] ? cols[3].replace(/"/g, "").trim() : "Dato gratuito";
                const autor = cols[4] ? cols[4].replace(/"/g, "").trim() : "Vecino";

                const div = document.createElement("div");
                // Estilos para mantener el tamaño pequeño y evitar que crezcan
                div.style.textAlign = "center";
                div.style.flex = "0 0 auto";
                div.style.width = "100px"; 
                div.style.cursor = "pointer";
                
                div.onclick = () => abrirDetalleVecino(img, nombre, desc, precio, autor);
                
                div.innerHTML = `
                    <div style="width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; overflow: hidden; border: 3px solid #00FF00; box-shadow: 0 0 10px rgba(0,255,0,0.3);">
                        <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/logo.png'">
                    </div>
                    <span style="display: block; font-size: 11px; font-weight: bold; margin-top: 8px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${nombre}
                    </span>
                `;
                scroll.appendChild(div);
            }
        });
    } catch (e) { console.error("Error vecinos:", e); }
}

// RENDERIZAR SOLO LA GRILLA DE ABAJO
function displayNegocios(products) {
    const list = document.getElementById("product-list");
    const comunaList = document.getElementById("comuna-list");

    if (list) {
        list.innerHTML = "";
        if (products.length === 0) {
            document.getElementById("no-results").style.display = "block";
        } else {
            document.getElementById("no-results").style.display = "none";
            products.forEach(p => {
                const card = document.createElement("div");
                card.className = "res-card";
                card.onclick = () => abrirDetalleProducto(p);
                card.innerHTML = `
                    <img src="${p.imagen}" class="res-thumb">
                    <div class="res-info">
                        <strong>${p.nombre}</strong><br>
                        <small>📍 ${p.comuna}</small>
                        <div style="color:#FF4500; font-weight:700; margin-top:5px;">
                            $${Number(p.precio).toLocaleString('es-CL')}
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    }

    if (comunaList) {
        comunaList.innerHTML = "";
        allProducts.slice(0, 3).forEach(p => {
            const card = document.createElement("div");
            card.className = "res-card";
            card.onclick = () => abrirDetalleProducto(p);
            card.innerHTML = `
                <img src="${p.imagen}" class="res-thumb">
                <div class="res-info">
                    <strong>${p.nombre}</strong><br>
                    <small>📍 ${p.comuna}</small>
                    <div style="color:#FF4500; font-weight:700; margin-top:5px;">
                        $${Number(p.precio).toLocaleString('es-CL')}
                    </div>
                </div>
            `;
            comunaList.appendChild(card);
        });
    }
}

// POPUPS
function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:200px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2 style="color:var(--morado);">${p.nombre}</h2>
            <p>${p.desc || ""}</p>
            <h3 style="color:#FF4500;">$${Number(p.precio).toLocaleString('es-CL')}</h3>
            <p>📍 ${p.comuna}</p>
            <button onclick="cerrarPopupProducto()" style="background:#2ecc71; color:white; border:none; padding:12px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer; margin-top:10px;">Cerrar</button>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function abrirDetalleVecino(img, titulo, desc, precio, autor) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${img}" style="width:100%; height:200px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2 style="color:var(--morado); text-transform:uppercase;">${titulo}</h2>
            <p style="margin:10px 0;">${desc}</p>
            <div style="background:var(--bg-light); padding:10px; border-radius:10px; margin-top:10px; text-align:left;">
                <p><strong>💰 Precio:</strong> ${precio}</p>
                <p><strong>👤 Por:</strong> ${autor}</p>
            </div>
            <button onclick="cerrarPopupProducto()" style="background:var(--morado); color:white; border:none; padding:12px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer; margin-top:15px;">Genial!</button>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() { document.getElementById("productPopup").style.display = "none"; }
function abrirFormPromo() { document.getElementById("popupPromo").style.display = "flex"; }
function cerrarFormPromo() { document.getElementById("popupPromo").style.display = "none"; }
function abrirFormDato() { document.getElementById("popupDato").style.display = "flex"; }
function cerrarFormDato() { document.getElementById("popupDato").style.display = "none"; }

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    const res = allProducts.filter(p => (loc ? p.comuna === loc : true) && p.nombre.toLowerCase().includes(txt));
    displayNegocios(res);
}

window.onclick = (e) => { if (e.target.className === 'popup-overlay') e.target.style.display = "none"; };

init();