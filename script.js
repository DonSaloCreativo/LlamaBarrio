const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxH1VvPvLKq9bxXD3bnP8owGzJVE0gmxScoWWY9smVlnO3TIPg554rTRdg34htBSDGysA/exec"; 
let allProducts = [];

const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

async function init() {
    const filter = document.getElementById("location-filter");
    if(filter){
        filter.innerHTML = '<option value="">Comuna</option>' + comunas.sort().map(c => `<option value="${c}">${c}</option>`).join('');
    }

    try {
        const res = await fetch(APPS_SCRIPT_URL);
        const data = await res.json();
        allProducts = data.filter(f => f.estado?.toString().toLowerCase().trim() === "aprobado");
        displayProducts(allProducts);
    } catch (e) { console.error("Error:", e); }
}

function displayProducts(products) {
    const list = document.getElementById("product-list");
    const scroll = document.getElementById("cheap-scroll");

    if(scroll) {
        scroll.innerHTML = allProducts.slice(0, 10).map(p => `
            <div class="circle-item" onclick="abrirPop('${p.nombre}')">
                <img src="${p.imagen || 'images/logo.png'}" class="circle-img">
                <p style="font-size:0.7rem; font-weight:600; margin-top:5px;">${p.nombre}</p>
            </div>
        `).join('');
    }

    if(list) {
        list.innerHTML = products.map(p => `
            <div class="res-card" onclick="abrirPop('${p.nombre}')">
                <img src="${p.imagen || 'images/logo.png'}" class="res-thumb">
                <div class="res-info">
                    <strong>${p.nombre}</strong><br>
                    <small>📍 ${p.comuna}</small>
                    <div style="color:#FF4500; font-weight:700; margin-top:5px;">${p.precio || ''}</div>
                </div>
            </div>
        `).join('');
    }
}

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    const filtered = allProducts.filter(p => 
        (loc ? p.comuna === loc : true) && 
        (p.nombre.toLowerCase().includes(txt) || (p.tags || "").toLowerCase().includes(txt))
    );
    displayProducts(filtered);
}

function abrirPop(nombre) {
    const p = allProducts.find(x => x.nombre === nombre);
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:200px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2>${p.nombre}</h2>
            <p>${p.tags || ''}</p>
            <h3 style="color:#FF4500;">${p.precio || ''}</h3>
            <a href="https://wa.me/${p.telefono}" target="_blank" style="display:block; background:#2ecc71; color:white; padding:12px; border-radius:10px; text-decoration:none; font-weight:bold;">WhatsApp</a>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() { document.getElementById("productPopup").style.display = "none"; }
init();