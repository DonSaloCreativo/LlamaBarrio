const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxH1VvPvLKq9bxXD3bnP8owGzJVE0gmxScoWWY9smVlnO3TIPg554rTRdg34htBSDGysA/exec"; 
let datosLocales = [];

async function obtenerDatos() {
    try {
        const respuesta = await fetch(APPS_SCRIPT_URL);
        const data = await respuesta.json();
        
        // Limpiamos y filtramos datos
        datosLocales = data.filter(fila => {
            return fila.estado && fila.estado.toString().toLowerCase().trim() === "aprobado";
        });
        
        renderizarTarjetas(datosLocales);
        document.getElementById("loading").style.display = "none";
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("loading").innerText = "Error de conexión con el barrio.";
    }
}

function renderizarTarjetas(locales) {
    const contenedor = document.getElementById("grid-negocios");
    contenedor.innerHTML = "";

    locales.forEach(local => {
        const div = document.createElement("div");
        div.className = "card";
        div.onclick = () => abrirModal(local);
        
        div.innerHTML = `
            <img src="${local.imagen || 'https://via.placeholder.com/400x200?text=LlamaBarrio'}" alt="${local.nombre}">
            <div class="card-content">
                <span class="category-badge">${local.categoria || 'Negocio'}</span>
                <h3>${local.nombre}</h3>
                <p>📍 ${local.comuna}</p>
                <span class="info-resaltada">${local.precio || ""}</span>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function buscar() {
    const comunaSelec = document.getElementById("location-filter").value;
    const busqueda = document.getElementById("main-search").value.toLowerCase();

    const filtrados = datosLocales.filter(l => {
        const matchComuna = comunaSelec ? l.comuna === comunaSelec : true;
        const pool = `${l.nombre} ${l.tags || ''} ${l.categoria || ''}`.toLowerCase();
        return matchComuna && pool.includes(busqueda);
    });
    renderizarTarjetas(filtrados);
}

function abrirModal(l) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${l.imagen}" style="width:100%; height:240px; object-fit:cover; border-bottom: 2px solid var(--primary);">
        <div style="padding:25px; background: #111;">
            <h2 style="margin:0; color:var(--primary); font-size:24px;">${l.nombre}</h2>
            <p style="color:#aaa; margin-top:5px;">${l.categoria}</p>
            <hr style="border:0; border-top:1px solid #333; margin:20px 0;">
            <div style="color:white; font-size:14px;">
                <p><strong>📍 Ubicación:</strong> ${l.direccion || 'Consultar'}, ${l.comuna}</p>
                <p><strong>⏰ Horario:</strong> ${l.horario || 'No informado'}</p>
                <p><strong>📦 Vende:</strong> ${l.tags || l.categoria}</p>
            </div>
            <a href="https://wa.me/${l.telefono}" target="_blank" 
               style="display:block; background:var(--primary); color:black; text-align:center; padding:15px; border-radius:12px; margin-top:25px; text-decoration:none; font-weight:bold; text-transform:uppercase;">
               📱 WhatsApp
            </a>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarModal(e) { if (e.target.id === "productPopup") cerrarPopupBtn(); }
function cerrarPopupBtn() { document.getElementById("productPopup").style.display = "none"; }

obtenerDatos();