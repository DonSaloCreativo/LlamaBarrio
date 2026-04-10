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
    cargarProductosNegocios();
    cargarPicadasVecinos();
}

async function cargarPicadasVecinos() {
    try {
        const res = await fetch(CSV_VECINOS_URL);
        const csvText = await res.text();
        let filas = csvText.split(/\r?\n/).filter(f => f.trim() !== "").slice(1);
        const scroll = document.getElementById("cheap-scroll");
        
        if (filas.length > 0) {
            scroll.innerHTML = "";
            // Mezclamos las picadas de los vecinos al azar
            filas = filas.sort(() => 0.5 - Math.random());
        }

        filas.forEach(fila => {
            const cols = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (cols && cols.length >= 2) {
                const img = cols[0].replace(/"/g, "").trim();
                let nombre = cols[1].replace(/"/g, "").trim();
                
                if (nombre === "469") { 
                    nombre = "Esmeralda 469"; 
                }

                const desc = cols[2] ? cols[2].replace(/"/g, "").trim() : "";
                const precio = cols[3] ? cols[3].replace(/"/g, "").trim() : "Dato gratuito";
                const autor = cols[4] ? cols[4].replace(/"/g, "").trim() : "Vecino";

                const div = document.createElement("div");
                div.setAttribute("style", "text-align:center !important; flex:0 0 110px !important; width:110px !important; cursor:pointer !important; margin:5px !important;");
                
                div.onclick = () => abrirDetalleVecino(img, nombre, desc, precio, autor);
                
                div.innerHTML = `
                    <div style="width: 80px !important; height: 80px !important; margin: 0 auto !important; border-radius: 50% !important; overflow: hidden !important; border: 3px solid #00FF00 !important; box-shadow: 0 0 10px rgba(0,255,0,0.4) !important; background: #eee;">
                        <img src="${img}" style="width: 100% !important; height: 100% !important; object-fit: cover !important;" onerror="this.src='images/logo.png'">
                    </div>
                    <span style="display: block !important; font-size: 10px !important; font-weight: 800 !important; margin-top: 8px !important; color: #6c5ce7 !important; text-transform: uppercase !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; width: 100% !important; padding: 0 5px;">
                        ${nombre}
                    </span>
                `;
                scroll.appendChild(div);
            }
        });
    } catch (e) { console.error("Error:", e); }
}

function displayNegocios(products) {
    const list = document.getElementById("product-list");
    const comunaList = document.getElementById("comuna-list");

    // 1. Mostrar resultados (los filtrados o todos)
    if (list) {
        list.innerHTML = "";
        products.forEach(p => {
            const card = document.createElement("div");
            card.className = "res-card";
            card.onclick = () => abrirDetalleProducto(p);
            card.innerHTML = `<img src="${p.imagen}" class="res-thumb"><div class="res-info"><strong>${p.nombre}</strong><br><small>📍 ${p.comuna}</small><div style="color:#FF4500; font-weight:700; margin-top:5px;">$${Number(p.precio).toLocaleString('es-CL')}</div></div>`;
            list.appendChild(card);
        });
    }

    // 2. Lógica de "Picadas en tu comuna" (Muestra 3 al azar siempre)
    if (comunaList && allProducts.length > 0) {
        comunaList.innerHTML = "";
        const randomPicks = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 3);
        
        randomPicks.forEach(p => {
            const card = document.createElement("div");
            card.className = "res-card";
            card.onclick = () => abrirDetalleProducto(p);
            card.innerHTML = `<img src="${p.imagen}" class="res-thumb"><div class="res-info"><strong>${p.nombre}</strong><br><small>📍 ${p.comuna}</small><div style="color:#FF4500; font-weight:700; margin-top:5px;">$${Number(p.precio).toLocaleString('es-CL')}</div></div>`;
            comunaList.appendChild(card);
        });
    }
}

function cargarProductosNegocios() {
    fetch(API_URL).then(res => res.json()).then(data => {
        allProducts = data.filter(p => p.estado === "aprobado");
        displayNegocios(allProducts);
    });
}

function abrirDetalleVecino(img, titulo, desc, precio, autor) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${img}" style="width:100%; height:220px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2 style="color:#6c5ce7; text-transform:uppercase; margin-bottom:10px;">${titulo}</h2>
            <p style="font-size: 0.95rem; color: #444;">${desc}</p>
            <div style="background:#fdf2e3; padding:15px; border-radius:12px; margin:15px 0; text-align:left; border: 1px solid #eee;">
                <p style="margin: 5px 0;"><strong>💰 Precio:</strong> ${precio || 'Dato gratuito'}</p>
                <p style="margin: 5px 0;"><strong>👤 Por:</strong> ${autor || 'Vecino'}</p>
            </div>
            <button onclick="cerrarPopupProducto()" style="background:#6c5ce7; color:white; border:none; padding:14px; width:100%; border-radius:12px; font-weight:bold; cursor:pointer;">¡Genial!</button>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `<img src="${p.imagen}" style="width:100%; height:200px; object-fit:cover;"><div style="padding:20px; text-align:center;"><h2 style="color:#6c5ce7;">${p.nombre}</h2><p>${p.desc || ""}</p><h3 style="color:#FF4500;">$${Number(p.precio).toLocaleString('es-CL')}</h3><p>📍 ${p.comuna}</p><button onclick="cerrarPopupProducto()" style="background:#2ecc71; color:white; border:none; padding:12px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer; margin-top:10px;">Cerrar</button></div>`;
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