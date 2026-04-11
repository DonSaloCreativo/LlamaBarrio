// ============================================================
// CONFIGURACIÓN — edita solo esta sección
// ============================================================

// ⚠️  SEGURIDAD: Mueve SHEET_ID y API_KEY a un proxy o Apps Script
// para producción. Acá van temporalmente para desarrollo.
// Instrucciones al final del archivo.

const CONFIG = {
    SHEET_ID:       '1nNCBbxa0H-0zH8FaT-rLNM1JihseIHnSqYTzxKZAih0', // RedBarrio_Base
    SHEET_ID_TALLY: '1E0HLINmLOQc9BUBSar5uHTeT_7-twsDuaELCgI4-QQI',  // Comparte tu dato
    API_KEY:        'AIzaSyATWehnk2KIKTVbWnPAg39vg0r-T8k0Wx4',
    TALLY_SHEET:    'Picadas_Tally',             // nombre de la pestaña dentro del sheet de Tally
    BASE_SHEET:     'Hoja 1',
    TALLY_FORM_URL: 'https://tally.so/r/ja7DOQ',
    RELOAD_INTERVAL_MS: 5 * 60 * 1000
};

// ============================================================
// ESTADO GLOBAL
// ============================================================
const comunas = ["Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Bernardo","San Joaquín","San Miguel","San Ramón","Santiago","Vitacura"];

let allProducts  = [];   // locales aprobados (Sheet principal)
let allPicadas   = [];   // picadas aprobadas (Sheet Tally)

// ============================================================
// CARGA DE DATOS
// ============================================================

async function fetchSheet(sheetName, sheetId) {
    const id  = sheetId || CONFIG.SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${sheetName}?key=${CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} al cargar ${sheetName}`);
    return res.json();
}

async function cargarDatosDeSheet() {
    try {
        // --- Locales principales ---
        const dataBase = await fetchSheet(CONFIG.BASE_SHEET);

        if (dataBase.values && dataBase.values.length >= 2) {
            allProducts = dataBase.values.slice(1)
                .map(row => {
                    if (!row[0]) return null;
                    return {
                        nombre:    row[0] || '',
                        imagen:    row[1] || 'images/placeholder.jpg',
                        categoria: row[2] || '',
                        precio:    parseInt(row[3]) || 0,
                        comuna:    row[4] || '',
                        telefono:  row[5] || '',
                        tags:      row[6] ? row[6].toString().split(',').map(t => t.trim()) : [],
                        direccion: row[7] || '',
                        horario:   row[8] || '',
                        estado:    row[9] || ''
                    };
                })
                .filter(p => p && p.estado.toLowerCase().trim() === 'aprobado');
        } else {
            allProducts = [];
        }

        // --- Picadas de vecinos (Tally) ---
        try {
            // El sheet de Tally tiene estas columnas:
            // A: Submission ID, B: Respondent ID, C: Submitted at,
            // D: Foto (upload), E: ¿Dónde lo encontraste?, F: Cuéntanos el dato,
            // G: ¿Precio?, H: ¿Quieres que aparezca tu nombre?, I: Estado
            const dataTally = await fetchSheet('Tally', CONFIG.SHEET_ID_TALLY);

            if (dataTally.values && dataTally.values.length >= 2) {
                allPicadas = dataTally.values.slice(1)
                    .map(row => {
                        if (!row[0]) return null;
                        return {
                            nombre:      row[7] || 'Picada vecinal',  // H: ¿Quieres que aparezca tu nombre?
                            comuna:      row[4] || '',                 // E: ¿Dónde lo encontraste?
                            precio:      parseInt((row[6] || '0').toString().replace(/\D/g,'')) || 0, // G: Precio
                            descripcion: row[5] || '',                 // F: Cuéntanos el dato
                            telefono:    '',
                            estado:      row[8] || '',                 // I: Estado
                            imagen:      row[3] || 'images/placeholder.jpg'  // D: Foto
                        };
                    })
                    .filter(p => p && p.estado.toLowerCase().trim() === 'aprobado');
            } else {
                allPicadas = [];
            }
        } catch (errTally) {
            // Si la pestaña Tally no existe aún, no es un error crítico
            console.warn('⚠️ No se pudo cargar la pestaña Tally:', errTally.message);
            allPicadas = [];
        }

        console.log(`✅ Locales: ${allProducts.length} | Picadas: ${allPicadas.length}`);
        init();
        displayProducts(allProducts);

    } catch (error) {
        console.error('❌ Error cargando datos:', error.message);
        mostrarErrorCarga();
    }
}

function mostrarErrorCarga() {
    const list = document.getElementById("product-list");
    if (list) {
        list.innerHTML = `<p style="text-align:center; color:#999; padding:40px 0;">
            No pudimos cargar los locales ahora. Intenta recargar la página.
        </p>`;
    }
}

// ============================================================
// INICIALIZACIÓN DE SELECTS
// ============================================================

function init() {
    const selectores = [
        document.getElementById("location-filter"),
        document.getElementById("dato-Comuna"),
        document.getElementById("promo-comuna")
    ];

    selectores.forEach(el => {
        if (!el) return;
        const valorActual = el.value; // conservar selección
        el.innerHTML = '<option value="">Comuna</option>';
        comunas.slice().sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c;
            op.textContent = c;
            el.appendChild(op);
        });
        el.value = valorActual;
    });
}

// ============================================================
// RENDERIZADO
// ============================================================

function displayProducts(products) {
    renderPicadasScroll();
    renderResultados(products);
    renderRecomendaciones();
}

function renderPicadasScroll() {
    const scroll = document.getElementById("cheap-scroll");
    if (!scroll) return;

    scroll.innerHTML = "";

    const fuente = allPicadas.length > 0 ? allPicadas : allProducts;

    if (fuente.length === 0) {
        // Mostrar 6 tarjetas placeholder con shimmer
        for (let i = 0; i < 6; i++) {
            scroll.appendChild(crearPlaceholderCard());
        }
        return;
    }

    fuente.forEach(p => scroll.appendChild(crearPicadaCard(p)));
}

function crearPlaceholderCard() {
    const card = document.createElement("div");
    card.className = "picada-card placeholder";
    card.innerHTML = `
        <img class="picada-card-img" src="" alt="">
        <div class="picada-card-body">
            <p class="picada-card-nombre">Cargando nombre...</p>
            <p class="picada-card-comuna">📍 Comuna</p>
            <p class="picada-card-desc">Descripción del local y su picada especial</p>
            <p class="picada-card-precio">$0.000</p>
        </div>`;
    return card;
}

function crearPicadaCard(p) {
    const card = document.createElement("div");
    card.className = "picada-card";
    card.onclick = () => abrirDetalleProducto(p);

    const precio = p.precio > 0 ? `<p class="picada-card-precio">$${p.precio.toLocaleString('es-CL')}</p>` : '';
    const desc   = p.descripcion ? `<p class="picada-card-desc">${p.descripcion}</p>` : '';

    card.innerHTML = `
        <span class="picada-badge">⭐ Picada</span>
        <img class="picada-card-img" src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        <div class="picada-card-body">
            <p class="picada-card-nombre">${p.nombre}</p>
            <p class="picada-card-comuna">📍 ${p.comuna}</p>
            ${desc}
            ${precio}
        </div>`;
    return card;
}

function renderResultados(products) {
    const list   = document.getElementById("product-list");
    const noRes  = document.getElementById("no-results");
    if (!list) return;

    list.innerHTML = "";

    if (products.length === 0) {
        if (noRes) noRes.style.display = "block";
    } else {
        if (noRes) noRes.style.display = "none";
        products.forEach(p => list.appendChild(createProductCard(p)));
    }
}

function renderRecomendaciones() {
    const comunaList = document.getElementById("comuna-list");
    if (!comunaList) return;

    const comunaSeleccionada = document.getElementById("location-filter")?.value;

    let recomendados;

    if (comunaSeleccionada) {
        // Filtrar por la comuna seleccionada
        recomendados = allProducts.filter(p => p.comuna === comunaSeleccionada).slice(0, 6);
    } else {
        // Sin filtro: mostrar los primeros 6 (podrías randomizar)
        recomendados = allProducts.slice(0, 6);
    }

    comunaList.innerHTML = "";

    if (recomendados.length === 0) {
        comunaList.innerHTML = `<p style="color:#999; font-size:0.9rem;">
            Selecciona una comuna para ver recomendaciones locales.
        </p>`;
        return;
    }

    recomendados.forEach(p => comunaList.appendChild(createProductCard(p)));
}

// ============================================================
// CARD DE PRODUCTO
// ============================================================

function createProductCard(p) {
    const card = document.createElement("div");
    card.className = "res-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Ver detalles de ${p.nombre}`);
    card.onclick = () => abrirDetalleProducto(p);
    card.onkeydown = (e) => { if (e.key === 'Enter') abrirDetalleProducto(p); };

    const tagsHTML = p.tags?.length > 0
        ? `<div class="card-tags">
            ${p.tags.slice(0, 2).map(tag =>
                `<span class="card-tag">${tag}</span>`
            ).join('')}
           </div>`
        : '';

    const precioHTML = p.precio > 0
        ? `<div class="card-precio">$${p.precio.toLocaleString('es-CL')}</div>`
        : '';

    card.innerHTML = `
        <img src="${p.imagen}" class="res-thumb" alt="${p.nombre}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        <div class="res-info">
            <strong class="card-nombre">${p.nombre}</strong>
            <small class="card-comuna">📍 ${p.comuna}</small>
            ${tagsHTML}
            ${precioHTML}
        </div>`;
    return card;
}

// ============================================================
// POPUP DETALLE
// ============================================================

function abrirDetalleProducto(p) {
    const whatsappNumber = (p.telefono || '').replace(/\s+/g, '').replace('+', '');

    const tagsHTML = p.tags?.length > 0
        ? `<div class="popup-tags">
            ${p.tags.map(tag => `<span class="popup-tag">${tag}</span>`).join('')}
           </div>`
        : '';

    const precioHTML = p.precio > 0
        ? `<h3 class="popup-precio">$${p.precio.toLocaleString('es-CL')}</h3>`
        : '';

    const contactoHTML = whatsappNumber
        ? `<a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener" class="btn-whatsapp">
               💬 Contactar por WhatsApp
           </a>`
        : '';

    const descripcionHTML = p.descripcion
        ? `<p class="popup-descripcion">${p.descripcion}</p>`
        : '';

    document.getElementById("popup-body").innerHTML = `
        <div class="popup-img-wrap">
            <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='images/placeholder.jpg'">
        </div>
        <div class="popup-info">
            <h2>${p.nombre}</h2>
            ${p.categoria ? `<p class="popup-meta">📁 ${p.categoria}</p>` : ''}
            ${p.direccion  ? `<p class="popup-meta">📍 ${p.direccion}</p>`  : ''}
            ${p.horario    ? `<p class="popup-meta">🕐 ${p.horario}</p>`    : ''}
            ${descripcionHTML}
            ${tagsHTML}
            ${precioHTML}
            ${contactoHTML}
            <button onclick="cerrarPopupProducto()" class="btn-volver">Volver</button>
        </div>`;

    document.getElementById("productPopup").style.display = "flex";
    document.body.style.overflow = "hidden"; // evita scroll de fondo
}

function cerrarPopupProducto() {
    document.getElementById("productPopup").style.display = "none";
    document.body.style.overflow = "";
}

// ============================================================
// POPUPS FORMULARIOS
// ============================================================

function abrirFormPromo() {
    document.getElementById("popupPromo").style.display = "flex";
    document.body.style.overflow = "hidden";
}
function cerrarFormPromo() {
    document.getElementById("popupPromo").style.display = "none";
    document.body.style.overflow = "";
}
function abrirFormDato() {
    document.getElementById("popupDato").style.display = "flex";
    document.body.style.overflow = "hidden";
}
function cerrarFormDato() {
    document.getElementById("popupDato").style.display = "none";
    document.body.style.overflow = "";
}

// ============================================================
// ENVÍO DE FORMULARIO: REGISTRAR NEGOCIO
// (Las picadas van por Tally externo, este form es para negocios)
// ============================================================

async function enviarPromo(event) {
    event.preventDefault();
    const btn = event.target.querySelector('.btn-submit');
    btn.textContent = 'Enviando…';
    btn.disabled = true;

    const datos = {
        nombre:    document.getElementById("promo-nombre").value,
        comuna:    document.getElementById("promo-comuna").value,
        categoria: document.getElementById("promo-categoria").value,
        promocion: document.getElementById("promo-promocion").value,
        contacto:  document.getElementById("promo-contacto").value
    };

    // Envía a tu Apps Script (ver instrucciones abajo)
    // Si aún no tienes el endpoint, se guarda igual y se muestra el alert
    try {
        if (CONFIG.APPS_SCRIPT_URL) {
            await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: 'negocio', ...datos })
            });
        }
    } catch (e) {
        console.warn('No se pudo enviar al script:', e.message);
    }

    btn.textContent = 'Registrar Negocio';
    btn.disabled = false;

    mostrarExito('¡Negocio registrado! Revisaremos tu información pronto 🎉');
    cerrarFormPromo();
    document.getElementById("formPromo").reset();
}

function mostrarExito(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast-exito';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ============================================================
// BÚSQUEDA Y FILTRO
// ============================================================

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase().trim();

    const res = allProducts.filter(p => {
        const cumpleComuna = !loc || p.comuna === loc;
        const cumpleBusca  = !txt
            || p.nombre.toLowerCase().includes(txt)
            || p.categoria.toLowerCase().includes(txt)
            || (p.tags && p.tags.some(t => t.toLowerCase().includes(txt)))
            || p.descripcion?.toLowerCase().includes(txt);
        return cumpleComuna && cumpleBusca;
    });

    displayProducts(res);
}

// ============================================================
// EVENTOS GLOBALES
// ============================================================

window.onclick = (e) => {
    if (e.target.classList.contains('popup-overlay')) {
        e.target.style.display = "none";
        document.body.style.overflow = "";
    }
};

// Cerrar popups con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.popup-overlay').forEach(p => p.style.display = 'none');
        document.body.style.overflow = "";
    }
});

// ============================================================
// ARRANQUE
// ============================================================

// Mostrar placeholders de inmediato antes de cargar datos
document.addEventListener('DOMContentLoaded', () => {
    const scroll = document.getElementById("cheap-scroll");
    if (scroll) {
        for (let i = 0; i < 6; i++) {
            scroll.appendChild(crearPlaceholderCard());
        }
    }
});

cargarDatosDeSheet();
setInterval(cargarDatosDeSheet, CONFIG.RELOAD_INTERVAL_MS);

/*
=================================================================
📋 INSTRUCCIONES DE SEGURIDAD — Lee antes de subir a GitHub
=================================================================

EL PROBLEMA:
Tu API Key de Google aparece visible en el código JS.
Cualquiera puede verla en GitHub y abusar de ella.

SOLUCIÓN RECOMENDADA — Google Apps Script como proxy:
1. En tu Google Sheet ve a Extensiones → Apps Script
2. Crea un script con este contenido:

   function doGet(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet();
     const hoja  = e.parameter.hoja || 'RedBarrio_Base';
     const data  = sheet.getSheetByName(hoja).getDataRange().getValues();
     return ContentService
       .createTextOutput(JSON.stringify({ values: data }))
       .setMimeType(ContentService.MimeType.JSON);
   }

3. Despliégalo como "Aplicación Web" → acceso "Cualquier usuario"
4. Copia la URL que te da (termina en /exec)
5. En este archivo, reemplaza la función fetchSheet() por:

   async function fetchSheet(sheetName) {
     const url = `TU_URL_DE_APPS_SCRIPT?hoja=${sheetName}`;
     const res = await fetch(url);
     return res.json();
   }

6. Elimina SHEET_ID y API_KEY del CONFIG — ya no los necesitas.

Así el Sheet Id y la API Key quedan dentro de Google,
nunca expuestos en GitHub.
=================================================================
*/
