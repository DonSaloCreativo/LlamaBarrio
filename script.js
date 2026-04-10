const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

let allProducts = [];

// URL DE TU GOOGLE APPS SCRIPT
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5kgFCQU9hn_Ih1Mfo9HENhk7LJL0Zb5QAaU-jad7SIjamxSC8T0fVqZe-xYRc3xPrkg/exec';

async function cargarDatosDeSheet() {
    try {
        console.log('🔄 Cargando datos del Sheet...');
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor: ' + response.status);
        }
        
        const datos = await response.json();
        console.log('✅ Datos cargados:', datos);
        
        allProducts = datos.map(row => ({
            nombre: row.nombre || '',
            imagen: row.imagen || 'images/placeholder.jpg',
            categoria: row.categoria || '',
            precio: row.precio || 0,
            comuna: row.comuna || '',
            telefono: row.telefono || '',
            tags: Array.isArray(row.tags) ? row.tags : (row.tags ? row.tags.split(',').map(t => t.trim()) : []),
            direccion: row.direccion || '',
            horario: row.horario || '',
            estado: row.estado || ''
        }));
        
        // Filtrar solo aprobados
        allProducts = allProducts.filter(p => p.estado.toLowerCase() === "aprobado");
        
        console.log('📊 Productos aprobados encontrados:', allProducts.length);
        init();
        
    } catch (error) {
        console.error('❌ Error cargando datos de Sheet:', error);
        alert('⚠️ Error al cargar los datos. Por favor recarga la página.');
    }
}

function init() {
    const filter = document.getElementById("location-filter");
    const formSelectDato = document.getElementById("dato-Comuna");
    const formSelectPromo = document.getElementById("promo-comuna");
    
    if(filter){
        filter.innerHTML = '<option value="">Comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c; 
            op.textContent = c;
            filter.appendChild(op);
        });
    }

    if(formSelectDato) {
        formSelectDato.innerHTML = '<option value="">Selecciona una comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c; 
            op.textContent = c;
            formSelectDato.appendChild(op);
        });
    }

    if(formSelectPromo) {
        formSelectPromo.innerHTML = '<option value="">Selecciona una comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c; 
            op.textContent = c;
            formSelectPromo.appendChild(op);
        });
    }

    displayProducts(allProducts);
}

function displayProducts(products) {
    const list = document.getElementById("product-list");
    const scroll = document.getElementById("cheap-scroll");
    const comunaList = document.getElementById("comuna-list");

    if(scroll){
        scroll.innerHTML = "";
        allProducts.forEach(p => {
            const div = document.createElement("div");
            div.className = "circle-item";
            div.role = "button";
            div.tabIndex = 0;
            div.onclick = () => abrirDetalleProducto(p);
            div.onkeypress = (e) => { if(e.key === 'Enter') abrirDetalleProducto(p); };
            div.innerHTML = `<img src="${p.imagen}" class="circle-img" loading="lazy" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'"><p style="font-size:0.7rem; font-weight:600; margin-top:5px;">${p.nombre}</p>`;
            scroll.appendChild(div);
        });
    }

    if(list){
        list.innerHTML = "";
        if(products.length === 0) {
            document.getElementById("no-results").style.display = "block";
        } else {
            document.getElementById("no-results").style.display = "none";
            products.forEach(p => {
                list.appendChild(createProductCard(p));
            });
        }
    }

    if(comunaList) {
        comunaList.innerHTML = "";
        allProducts.slice(0, 3).forEach(p => {
            comunaList.appendChild(createProductCard(p));
        });
    }
}

function createProductCard(p) {
    const card = document.createElement("div");
    card.className = "res-card";
    card.role = "button";
    card.tabIndex = 0;
    card.onclick = () => abrirDetalleProducto(p);
    card.onkeypress = (e) => { if(e.key === 'Enter') abrirDetalleProducto(p); };
    
    // Mostrar tags si existen
    let tagsHTML = '';
    if(p.tags && p.tags.length > 0) {
        tagsHTML = `<div style="margin-top:8px; display:flex; gap:5px; flex-wrap:wrap;">
            ${p.tags.slice(0, 2).map(tag => `<span style="background:#FFE4CC; color:#FF4500; font-size:0.7rem; padding:3px 8px; border-radius:12px; font-weight:600;">${tag}</span>`).join('')}
        </div>`;
    }
    
    card.innerHTML = `
        <img src="${p.imagen}" class="res-thumb" loading="lazy" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'">
        <div class="res-info">
            <strong>${p.nombre}</strong><br>
            <small>📍 ${p.comuna}</small>
            ${tagsHTML}
            <div style="color:#FF4500; font-weight:800; margin-top:5px; font-size:1.1rem;">
                $${p.precio.toLocaleString('es-CL')}
            </div>
        </div>`;
    return card;
}

function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");
    const whatsappNumber = p.telefono.replace(/\s+/g, '').replace('+', '');
    
    // Mostrar tags en el popup
    let tagsHTML = '';
    if(p.tags && p.tags.length > 0) {
        tagsHTML = `<div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:10px 0;">
            ${p.tags.map(tag => `<span style="background:#FFE4CC; color:#FF4500; font-size:0.85rem; padding:5px 12px; border-radius:15px; font-weight:600;">${tag}</span>`).join('')}
        </div>`;
    }
    
    body.innerHTML = `
        <div style="width:100%; height:200px; overflow:hidden;">
            <img src="${p.imagen}" style="width:100%; height:100%; object-fit:cover;" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'">
        </div>
        <div style="padding:20px; text-align:center; display:flex; flex-direction:column; gap:10px;">
            <h2 style="margin:0; font-size:1.4rem;">${p.nombre}</h2>
            <p style="color:#999; font-size:0.8rem;">📁 ${p.categoria}</p>
            <p style="color:#666; font-size:0.9rem; margin:5px 0;">📍 ${p.direccion}</p>
            <p style="color:#666; font-size:0.85rem;">🕐 ${p.horario}</p>
            ${tagsHTML}
            <h3 style="color:#FF4500; margin:8px 0;">$${p.precio.toLocaleString('es-CL')}</h3>
            <a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener noreferrer"
               style="background:#25D366; color:white; text-decoration:none; padding:12px; border-radius:12px; font-weight:bold; font-size:0.9rem;">
               Contactar por WhatsApp
            </a>
            <button onclick="cerrarPopupProducto()" 
                style="background:#eee; border:none; padding:10px; border-radius:10px; cursor:pointer; font-weight:600; color:#333;">
                Volver
            </button>
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
    alert('✅ ¡Gracias por compartir tu picada! Nos pondremos en contacto pronto.');
    cerrarFormDato();
    document.getElementById("formDato").reset();
}

function enviarPromo(event) {
    event.preventDefault();
    alert('✅ ¡Gracias por registrarte! Pronto tu negocio estará visible en LlamaBarrio.');
    cerrarFormPromo();
    document.getElementById("formPromo").reset();
}

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase().trim();
    
    // Filtrar solo por estado "aprobado"
    const res = allProducts.filter(p => {
        const cumpleComuna = loc ? p.comuna === loc : true;
        
        // Buscar en nombre
        const cumpleNombre = p.nombre.toLowerCase().includes(txt);
        
        // Buscar en tags
        const cumpletags = p.tags && p.tags.some(tag => tag.toLowerCase().includes(txt));
        
        // Buscar en categoría
        const cumpleCategoria = p.categoria.toLowerCase().includes(txt);
        
        return cumpleComuna && (cumpleNombre || cumpletags || cumpleCategoria);
    });
    
    displayProducts(res);
}

// Recargar datos cada 30 segundos para ver cambios nuevos en el Sheet
setInterval(() => {
    console.log('🔄 Actualizando datos...');
    cargarDatosDeSheet();
}, 30000);

window.onclick = (e) => { 
    if(e.target.className === 'popup-overlay') {
        e.target.style.display = "none"; 
    }
}

// Cargar datos al iniciar
cargarDatosDeSheet();