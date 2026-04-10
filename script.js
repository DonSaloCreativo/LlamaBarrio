const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxH1VvPvLKq9bxXD3bnP8owGzJVE0gmxScoWWY9smVlnO3TIPg554rTRdg34htBSDGysA/exec"; 
let allProducts = [];

const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

async function init() {
    // 1. Cargar selector de comunas
    const filter = document.getElementById("location-filter");
    if(filter){
        filter.innerHTML = '<option value="">Comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c; op.textContent = c;
            filter.appendChild(op);
        });
    }

    // 2. Obtener datos reales de Google Sheets
    try {
        const respuesta = await fetch(APPS_SCRIPT_URL);
        const data = await respuesta.json();
        
        // Filtramos solo los aprobados
        allProducts = data.filter(fila => 
            fila.estado && fila.estado.toString().toLowerCase().trim() === "aprobado"
        );
        
        displayProducts(allProducts);
        const loadingMsg = document.getElementById("loading");
        if(loadingMsg) loadingMsg.style.display = "none";

    } catch (error) {
        console.error("Error cargando locales:", error);
    }
}

function displayProducts(products) {
    const list = document.getElementById("product-list");
    const scroll = document.getElementById("cheap-scroll");
    const comunaList = document.getElementById("comuna-list");

    // Sección de Picadas (Círculos superiores)
    if(scroll){
        scroll.innerHTML = "";
        allProducts.slice(0, 10).forEach(p => {
            const div = document.createElement("div");
            div.className = "circle-item";
            div.onclick = () => abrirDetalleProducto(p);
            div.innerHTML = `
                <img src="${p.imagen || 'images/placeholder.jpg'}" class="circle-img">
                <p style="font-size:0.7rem; font-weight:600; margin-top:5px;">${p.nombre}</p>
            `;
            scroll.appendChild(div);
        });
    }

    // Sección de Resultados (Grilla principal)
    if(list){
        list.innerHTML = "";
        if(products.length === 0) {
            document.getElementById("no-results").style.display = "block";
        } else {
            document.getElementById("no-results").style.display = "none";
            products.forEach(p => {
                const card = document.createElement("div");
                card.className = "res-card";
                card.onclick = () => abrirDetalleProducto(p);
                card.innerHTML = `
                    <img src="${p.imagen || 'images/placeholder.jpg'}" class="res-thumb">
                    <div class="res-info">
                        <strong>${p.nombre}</strong><br>
                        <small>📍 ${p.comuna}</small>
                        <div style="color:#FF4500; font-weight:700; margin-top:5px;">${p.precio || ''}</div>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    }

    // Sección Recomendaciones (Fija o por comuna)
    if(comunaList) {
        comunaList.innerHTML = "";
        allProducts.slice(0, 3).forEach(p => {
            const card = document.createElement("div");
            card.className = "res-card";
            card.onclick = () => abrirDetalleProducto(p);
            card.innerHTML = `
                <img src="${p.imagen || 'images/placeholder.jpg'}" class="res-thumb">
                <div class="res-info">
                    <strong>${p.nombre}</strong><br>
                    <small>📍 ${p.comuna}</small>
                </div>
            `;
            comunaList.appendChild(card);
        });
    }
}

function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:180px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2>${p.nombre}</h2>
            <p>${p.tags || p.categoria || ''}</p>
            <h3 style="color:#FF4500;">${p.precio || ''}</h3>
            <p style="font-size:0.9rem; color:#666;">📍 ${p.direccion || ''}, ${p.comuna}</p>
            <a href="https://wa.me/${p.telefono}" target="_blank" style="display:block; background:#2ecc71; color:white; text-decoration:none; padding:12px; border-radius:10px; font-weight:bold; margin-top:10px;">
                Contactar WhatsApp
            </a>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    const res = allProducts.filter(p => 
        (loc ? p.comuna === loc : true) && 
        (p.nombre.toLowerCase().includes(txt) || (p.tags || "").toLowerCase().includes(txt))
    );
    displayProducts(res);
}

// Funciones de Interfaz del index.html original
function cerrarPopupProducto() { document.getElementById("productPopup").style.display = "none"; }
function abrirFormPromo() { document.getElementById("popupPromo").style.display = "flex"; }
function cerrarFormPromo() { document.getElementById("popupPromo").style.display = "none"; }
function abrirFormDato() { document.getElementById("popupDato").style.display = "flex"; }
function cerrarFormDato() { document.getElementById("popupDato").style.display = "none"; }

window.onclick = (e) => { if(e.target.className === 'popup-overlay') e.target.style.display = "none"; }

init();