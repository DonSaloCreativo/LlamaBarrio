const CONFIG = {
    PROXY_URL: 'https://script.google.com/macros/s/AKfycbx3eTprAjyYooIep7S2w_Q9kIUCCvknoWHORhyglVlOHWKWZ8ononv6-FvpDrXyC7OPfw/exec', 
    RELOAD_INTERVAL_MS: 5 * 60 * 1000
};

let allProducts = [];
let allPicadas = [];

async function cargarTodo() {
    try {
        const [db, tally] = await Promise.all([ fetchSheet('Hoja 1'), fetchSheet('Tally') ]);
        if (db.values) {
            allProducts = db.values.slice(1).map(r => ({
                nombre: r[0], imagen: r[1], categoria: r[2], precio: r[3],
                comuna: r[4], telefono: r[5], direccion: r[7], horario: r[8], estado: r[9]
            })).filter(p => p.estado?.toLowerCase().trim() === 'aprobado');
        }
        if (tally.values) {
            allPicadas = tally.values.slice(1).map(r => ({
                nombre: r[7] || 'Picada', comuna: r[4], contacto: r[6] || 'No especificado',
                descripcion: r[5], imagen: r[3], estado: r[8]
            })).filter(p => p.estado?.toLowerCase().trim() === 'aprobado');
        }
        renderBase();
    } catch (e) { console.error("Error en carga:", e); }
}

async function fetchSheet(name) {
    const r = await fetch(`${CONFIG.PROXY_URL}?hoja=${encodeURIComponent(name)}`);
    return await r.json();
}

function renderBase() {
    const scroll = document.getElementById("cheap-scroll");
    if (scroll) scroll.innerHTML = allPicadas.map(p => `
        <div class="circle-item" style="text-align: center; flex-shrink: 0; width: 95px; cursor: pointer;" onclick='abrirDetallePicada(${JSON.stringify(p)})'>
            <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #FF4500; overflow: hidden; margin: 0 auto;"><img src="${p.imagen}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/placeholder.jpg'"></div>
            <p style="font-size:0.7rem; font-weight:800; color:#333; margin-top:8px;">${p.nombre}</p>
        </div>
    `).join('');
    buscar();
}

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    const filtered = allProducts.filter(p => (!loc || p.comuna === loc) && (!txt || p.nombre.toLowerCase().includes(txt)));
    
    document.getElementById("product-list").innerHTML = filtered.map(p => createCardHTML(p)).join('');
    
    const recs = loc ? allProducts.filter(p => p.comuna === loc) : allProducts;
    document.getElementById("comuna-list").innerHTML = recs.slice(0, 3).map(p => createCardHTML(p)).join('');
}

function createCardHTML(p) {
    return `
        <div class="res-card" style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer;" onclick='abrirDetalleProducto(${JSON.stringify(p)})'>
            <img src="${p.imagen}" style="width: 100%; height: 160px; object-fit: cover;" onerror="this.src='images/placeholder.jpg'">
            <div style="padding: 12px;">
                <h4 style="margin: 0; font-size: 0.95rem;">${p.nombre}</h4>
                <small style="color: #777;">📍 ${p.comuna}</small>
                <div style="margin-top: 8px; color: #FF4500; font-weight: 800;">$${p.precio}</div>
            </div>
        </div>
    `;
}

function abrirDetalleProducto(p) {
    document.getElementById("popup-body").innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:180px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2 style="margin:0 0 10px 0;">${p.nombre}</h2>
            <p style="font-size: 0.85rem; color: #666;">📍 ${p.direccion || p.comuna}</p>
            <div style="background:#fff0eb; padding:12px; border-radius:12px; margin:15px 0;"><h3 style="color:#FF4500; margin:0;">$${p.precio}</h3></div>
            <a href="https://wa.me/${p.telefono?.toString().replace(/\D/g,'')}" target="_blank" style="background:#25D366; color:white; padding:10px 25px; border-radius:30px; text-decoration:none; font-weight:bold; display:inline-block;">WhatsApp</a>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function abrirDetallePicada(p) {
    document.getElementById("popup-body").innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:180px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <span style="color:#6c5ce7; font-weight:bold; font-size:0.75rem;">🔥 PICADA VECINAL</span>
            <h2 style="margin:10px 0;">${p.nombre}</h2>
            <p style="font-size:0.85rem; color:#555;">${p.descripcion}</p>
            <div style="background:#f0f7ff; padding:10px; border-radius:12px; margin:15px 0; border:1px solid #cce5ff;"><p style="margin:0; font-size:0.7rem;">Contacto:</p><strong style="color:#007bff;">${p.contacto}</strong></div>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() { document.getElementById("productPopup").style.display = "none"; }
function cerrarFormDato() { document.getElementById("popupDato").style.display = "none"; }
function cerrarFormPromo() { document.getElementById("popupPromo").style.display = "none"; }
function abrirFormDato() { document.getElementById("popupDato").style.display = "flex"; }
function abrirFormPromo() { document.getElementById("popupPromo").style.display = "flex"; }

window.onload = () => {
    const f = document.getElementById("location-filter");
    const cNames = ["Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Bernardo","San Joaquín","San Miguel","San Ramón","Santiago","Vitacura"];
    cNames.sort().forEach(c => f.innerHTML += `<option value="${c}">${c}</option>`);
    cargarTodo();
};