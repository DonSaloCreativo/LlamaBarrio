const SHEETBEST_URL = "TU_URL_AQUI"; // REEMPLAZA ESTO
let datosLocales = [];

async function obtenerDatos() {
    try {
        const respuesta = await fetch(SHEETBEST_URL);
        const data = await respuesta.json();
        // Solo mostramos lo que esté aprobado
        datosLocales = data.filter(fila => fila.estado === "aprobado");
        renderizarTarjetas(datosLocales);
        document.getElementById("loading").style.display = "none";
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("loading").innerText = "Error al cargar los datos.";
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
            <img src="${local.imagen}" alt="${local.nombre}">
            <div class="card-content">
                <span class="category-badge">${local.categoria}</span>
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
        const textoParaBuscar = `${l.nombre} ${l.tags} ${l.categoria}`.toLowerCase();
        const matchTexto = textoParaBuscar.includes(busqueda);
        return matchComuna && matchTexto;
    });

    renderizarTarjetas(filtrados);
}

function abrirModal(l) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `
        <img src="${l.imagen}" style="width:100%; height:200px; object-fit:cover;">
        <div style="padding:20px;">
            <h2 style="margin:0;">${l.nombre}</h2>
            <p style="color:var(--primary); font-weight:bold;">${l.categoria}</p>
            <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">
            <p><strong>📍 Comuna:</strong> ${l.comuna}</p>
            <p><strong>🏠 Dirección:</strong> ${l.direccion || "No especificada"}</p>
            <p><strong>⏰ Horario:</strong> ${l.horario || "Consultar"}</p>
            <p><strong>📦 Tags:</strong> ${l.tags || "-"}</p>
            
            <a href="https://wa.me/${l.telefono}" target="_blank" 
               style="display:block; background:#25d366; color:white; text-align:center; padding:12px; border-radius:8px; margin-top:20px; text-decoration:none; font-weight:bold;">
               Contactar por WhatsApp
            </a>
        </div>
    `;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarModal(e) {
    if (e.target.id === "productPopup") cerrarPopupBtn();
}

function cerrarPopupBtn() {
    document.getElementById("productPopup").style.display = "none";
}

obtenerDatos();