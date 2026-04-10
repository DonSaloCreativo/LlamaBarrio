const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

let allProducts = [];

const SHEET_ID = '1nNCBbxa0H-0zH8FaT-rLNM1JihseIHnSqYTzxKZAih0';

async function cargarDatosDeSheet() {
    try {
        console.log('🔄 Cargando datos del Sheet...');
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/RedBarrio_Base?key=AIzaSyDvwwB6zY2b5c3d4e5f6g7h8i9j0k1l2m3n`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📊 Datos:', data);
        
        if (!data.values || data.values.length < 2) {
            console.warn('⚠️ No hay datos');
            allProducts = [];
            init();
            return;
        }
        
        const rows = data.values;
        
        allProducts = rows.slice(1).map((row, idx) => {
            if (!row[0]) return null;
            
            return {
                nombre: row[0] || '',
                imagen: row[1] || 'images/placeholder.jpg',
                categoria: row[2] || '',
                precio: parseInt(row[3]) || 0,
                comuna: row[4] || '',
                telefono: row[5] || '',
                tags: row[6] ? row[6].toString().split(',').map(t => t.trim()) : [],
                direccion: row[7] || '',
                horario: row[8] || '',
                estado: row[9] || ''
            };
        }).filter(p => p !== null && p.estado.toLowerCase().trim() === 'aprobado');
        
        console.log('✅ Productos cargados:', allProducts.length);
        console.log('Productos:', allProducts);
        
        init();
        displayProducts(allProducts);
        
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

function init() {
    const filter = document.getElementById("location-filter");
    const formSelectDato = document.getElementById("dato-Comuna");
    const formSelectPromo = document.getElementById("promo-comuna");
    
    [filter, formSelectDato, formSelectPromo].forEach(element => {
        if(element) {
            element.innerHTML = '<option value="">Selecciona una comuna</option>';
            comunas.sort().forEach(c => {
                const op = document.createElement("option");
                op.value = c;
                op.textContent = c;
                element.appendChild(op);
            });
        }
    });

    displayProducts(allProducts);
}

function displayProducts(products) {
    const list = document.getElementById("product-list");
    const scroll = document.getElementById("cheap-scroll");
    const comunaList = document.getElementById("comuna-list");

    if(scroll) {
        scroll.innerHTML = "";
        allProducts.forEach(p => {
            const div = document.createElement("div");
            div.className = "circle-item";
            div.onclick = () => abrirDetalleProducto(p);
            div.innerHTML = `<img src="${p.imagen}" class="circle-img" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'"><p style="font-size:0.7rem; font-weight:600;">${p.nombre}</p>`;
            scroll.appendChild(div);
        });
    }

    if(list) {
        list.innerHTML = "";
        if(products.length === 0) {
            document.getElementById("no-results").style.display = "block";
        } else {
            document.getElementById("no-results").style.display = "none";
            products.forEach(p => list.appendChild(createProductCard(p)));
        }
    }

    if(comunaList) {
        comunaList.innerHTML = "";
        allProducts.slice(0, 3).forEach(p => comunaList.appendChild(createProductCard(p)));
    }
}

function createProductCard(p) {
    const card = document.createElement("div");
    card.className = "res-card";
    card.onclick = () => abrirDetalleProducto(p);
    
    let tagsHTML = p.tags?.length > 0 ? `<div style="margin-top:8px; display:flex; gap:5px; flex-wrap:wrap;">
        ${p.tags.slice(0, 2).map(tag => `<span style="background:#FFE4CC; color:#FF4500; font-size:0.7rem; padding:3px 8px; border-radius:12px; font-weight:600;">${tag}</span>`).join('')}
    </div>` : '';
    
    card.innerHTML = `
        <img src="${p.imagen}" class="res-thumb" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'">
        <div class="res-info">
            <strong>${p.nombre}</strong><br>
            <small>📍 ${p.comuna}</small>
            ${tagsHTML}
            <div style="color:#FF4500; font-weight:800; margin-top:5px;">$${p.precio.toLocaleString('es-CL')}</div>
        </div>`;
    return card;
}

function abrirDetalleProducto(p) {
    const whatsappNumber = p.telefono.replace(/\s+/g, '').replace('+', '');
    let tagsHTML = p.tags?.length > 0 ? `<div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:10px 0;">
        ${p.tags.map(tag => `<span style="background:#FFE4CC; color:#FF4500; padding:5px 12px; border-radius:15px; font-weight:600;">${tag}</span>`).join('')}
    </div>` : '';
    
    document.getElementById("popup-body").innerHTML = `
        <div style="width:100%; height:200px; overflow:hidden;">
            <img src="${p.imagen}" style="width:100%; height:100%; object-fit:cover;" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'">
        </div>
        <div style="padding:20px; text-align:center;">
            <h2 style="margin:0;">${p.nombre}</h2>
            <p style="color:#999;">📁 ${p.categoria}</p>
            <p style="color:#666;">📍 ${p.direccion}</p>
            <p style="color:#666;">🕐 ${p.horario}</p>
            ${tagsHTML}
            <h3 style="color:#FF4500;">$${p.precio.toLocaleString('es-CL')}</h3>
            <a href="https://wa.me/${whatsappNumber}" target="_blank" style="display:block; background:#25D366; color:white; padding:12px; border-radius:12px; text-decoration:none; font-weight:bold; margin:10px 0;">Contactar</a>
            <button onclick="cerrarPopupProducto()" style="background:#eee; border:none; padding:10px; border-radius:10px; cursor:pointer; width:100%;">Volver</button>
        </div>`;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() { document.getElementById("productPopup").style.display = "none"; }
function abrirFormPromo() { document.getElementById("popupPromo").style.display = "flex"; }
function cerrarFormPromo() { document.getElementById("popupPromo").style.display = "none"; }
function abrirFormDato() { document.getElementById("popupDato").style.display = "flex"; }
function cerrarFormDato() { document.getElementById("popupDato").style.display = "none"; }

function enviarDato(event) {
    event.preventDefault();
    alert('✅ ¡Gracias!');
    cerrarFormDato();
    document.getElementById("formDato").reset();
}

function enviarPromo(event) {
    event.preventDefault();
    alert('✅ ¡Gracias!');
    cerrarFormPromo();
    document.getElementById("formPromo").reset();
}

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    
    const res = allProducts.filter(p => {
        const cumpleComuna = !loc || p.comuna === loc;
        const cumpleBusca = !txt || p.nombre.toLowerCase().includes(txt) || 
            (p.tags && p.tags.some(t => t.toLowerCase().includes(txt))) ||
            p.categoria.toLowerCase().includes(txt);
        return cumpleComuna && cumpleBusca;
    });
    
    displayProducts(res);
}

setInterval(cargarDatosDeSheet, 10000);
window.onclick = (e) => { if(e.target.className === 'popup-overlay') e.target.style.display = "none"; }

cargarDatosDeSheet();