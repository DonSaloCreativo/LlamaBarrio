const API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";
const IMAGE_FALLBACK = "images/sin-imagen.png";

let locales = [];
let joyitas = [];
let filtrosIniciados = false;

function safeTrim(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeImageValue(value) {
    if (Array.isArray(value)) {
        for (const item of value) {
            const normalized = normalizeImageValue(item);
            if (normalized) return normalized;
        }
        return "";
    }

    if (value && typeof value === "object") {
        return safeTrim(value.url || value.href || value.downloadUrl || value.src || "");
    }

    return safeTrim(String(value || ""));
}

function isHttpUrl(url) {
    return /^https?:\/\//i.test(safeTrim(url));
}

function resolveImageSrc(value) {
    const image = normalizeImageValue(value);
    if (!image) return IMAGE_FALLBACK;
    if (isHttpUrl(image)) return image;
    return `images/${image.replace(/^\/+/, "")}`;
}

function extractJoyitaImage(entry) {
    return normalizeImageValue(
        entry["Untitled file upload field"] ||
        entry["Untitled file upload"] ||
        entry["Untitled file uplo"] ||
        entry.Imagen ||
        entry.img ||
        ""
    );
}

function isAprobada(estado) {
    return safeTrim(estado).toLowerCase().startsWith("aprob");
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`No se pudo cargar ${url}`);
    }
    return response.json();
}

async function cargarDatos() {
    try {
        const localesPromise = fetchJson(`${API_BASE}?hoja=Publicaciones%20Locales`)
            .catch(() => fetchJson(`locales.json?v=${Date.now()}`));

        const joyitasPromise = fetchJson(`${API_BASE}?hoja=Tally`)
            .catch(() => []);

        const [localesData, joyitasData] = await Promise.all([localesPromise, joyitasPromise]);

        locales = (localesData || []).map((local) => ({
            name: local.Nombre || local.name || "",
            comuna: local.Comuna || local.comuna || "",
            loc: local.Dirección || local.loc || "",
            desc: local.Descripción || local.desc || "",
            hor: local.Horario || local.hor || "",
            img: normalizeImageValue(local.Imagen || local.Img || local.img || ""),
            wa: typeof local.WhatsApp === "string" ? local.WhatsApp : (local.wa || ""),
            category: local.Categoria || local.category || ""
        }));

        joyitas = (joyitasData || [])
            .map((entry) => {
                const autor = safeTrim(entry["Nombre"] || entry["¿Quieres que aparezca tu nombre? (opcional)"] || "");
                return {
                    // Columna F
                    name: entry["¿Dónde lo encontraste?"] || entry.name || entry.Nombre || "",
                    ubicacion: entry["¿Dónde lo encontraste?"] || entry.loc || "",
                    // Columna G
                    desc: entry["Comentario sobre la Picada"] || entry["Cuéntanos el dato"] || entry.desc || "",
                    // Columna D
                    img: extractJoyitaImage(entry),
                    // Columna E
                    comuna: entry["Comun"] || entry.Comuna || entry.comuna || "",
                    // Columna H
                    autor,
                    category: entry.Categoria || entry.category || "",
                    price: entry["¿Precio? (opcional)"] || entry["💰Precio? (opcional)"] || "",
                    estado: entry.Estado || ""
                };
            })
            .filter((entry) => isAprobada(entry.estado));

        renderJoyitas();
        renderLocales();
        inicializarFiltros();
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
}

function renderJoyitas() {
    const joyitasGrid = document.getElementById("joyitas-grid");
    if (!joyitasGrid) return;

    joyitasGrid.innerHTML = "";

    if (joyitas.length === 0) {
        joyitasGrid.innerHTML = "<p style='padding:2em;text-align:center;color:#bbb;'>No hay recomendaciones aún.</p>";
        return;
    }

    joyitas.forEach((joyita) => {
        const card = document.createElement("article");
        card.className = "comm-card";
        card.style.cursor = "pointer";

        card.innerHTML = `
            <div class="comm-img-box">
                <img src="${resolveImageSrc(joyita.img)}" alt="Dato recomendado" onerror="this.src='${IMAGE_FALLBACK}'">
            </div>
            <div class="comm-info">
                <span class="comm-tag">${joyita.comuna || "Sin comuna"}</span>
                <b>${joyita.autor || "Anónimo"}</b>
                <p>"${joyita.desc || ""}"</p>
            </div>
        `;

        card.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            abrirDetalleJoyita(joyita);
        });

        joyitasGrid.appendChild(card);
    });
}

function renderLocales() {
    const grid = document.getElementById("locals-grid");
    if (!grid) return;

    grid.innerHTML = "";

    locales.forEach((local) => {
        const card = document.createElement("article");
        card.className = "local-card";
        card.dataset.search = `${local.name} ${local.comuna} ${local.category}`.toLowerCase();

        card.innerHTML = `
            <div class="local-img-wrap">
                <div class="local-img-box">
                    <img src="${resolveImageSrc(local.img)}" alt="${local.name}" onerror="this.src='${IMAGE_FALLBACK}'">
                </div>
            </div>
            <div class="local-body">
                <span class="local-inline-tag">${local.category}</span>
                <h3>${local.name}</h3>
                <p><b>${local.comuna}</b></p>
                <p>${local.loc}</p>
                <button type="button" class="btn-ver">Ver más</button>
            </div>
        `;

        card.addEventListener("click", () => abrirDetalle(local));
        grid.appendChild(card);
    });
}

function inicializarFiltros() {
    if (filtrosIniciados) return;

    const searchInput = document.getElementById("main-search");
    if (!searchInput) return;

    filtrosIniciados = true;
    searchInput.addEventListener("input", () => {
        const termino = safeTrim(searchInput.value).toLowerCase();
        const cards = document.querySelectorAll(".local-card");

        cards.forEach((card) => {
            const contenido = card.dataset.search || "";
            card.style.display = contenido.includes(termino) ? "flex" : "none";
        });
    });
}

function abrirDetalle(local) {
    const titulo = document.getElementById("modal-titulo");
    const categoria = document.getElementById("modal-categoria");
    const dir = document.getElementById("modal-dir");
    const desc = document.getElementById("modal-desc");
    const hor = document.getElementById("modal-hor");
    const img = document.getElementById("modal-img");
    const waBtn = document.getElementById("modal-wa");
    const modal = document.getElementById("modal-detalle");

    if (!titulo || !categoria || !dir || !desc || !hor || !img || !waBtn || !modal) return;

    titulo.innerText = local.name || "";
    categoria.innerText = local.category || "";
    dir.innerText = `${local.comuna || ""} · ${local.loc || ""}`;
    desc.innerText = local.desc || "";
    hor.innerText = local.hor || "";
    img.src = resolveImageSrc(local.img);
    img.alt = local.name || "";

    const numLimpio = local.wa ? String(local.wa).replace(/\D/g, "") : "";
    waBtn.href = numLimpio ? `https://wa.me/${numLimpio}` : "#";

    modal.style.display = "flex";
}

function abrirDetalleJoyita(joyita) {
    const titulo = document.getElementById("modal-titulo");
    const categoria = document.getElementById("modal-categoria");
    const dir = document.getElementById("modal-dir");
    const desc = document.getElementById("modal-desc");
    const hor = document.getElementById("modal-hor");
    const precio = document.getElementById("modal-precio");
    const autor = document.getElementById("modal-autor");
    const img = document.getElementById("modal-img");
    const waBtn = document.getElementById("modal-wa");
    const modal = document.getElementById("modal-detalle");

    if (!titulo || !categoria || !dir || !desc || !hor || !img || !waBtn || !modal) return;

    const nombreAutor = joyita.autor || "Anónimo";

    titulo.innerText = joyita.name ? `"${joyita.name}" - ${nombreAutor}` : nombreAutor;
    categoria.innerText = joyita.category || "";
    dir.innerText = joyita.ubicacion ? `📍 ${joyita.ubicacion}` : (joyita.comuna ? `Encontrado en: ${joyita.comuna}` : "");
    desc.innerText = joyita.desc || "";
    hor.innerText = "";

    if (precio) {
        precio.innerText = joyita.price ? `💰 Precio: ${joyita.price}` : "";
    }
    if (autor) {
        autor.innerText = "";
    }

    img.src = resolveImageSrc(joyita.img);
    img.alt = joyita.name || "Dato recomendado";

    waBtn.href = "#";
    if (waBtn.classList) {
        waBtn.classList.add("is-hidden");
    }

    modal.style.display = "flex";
}

function cerrarModal() {
    const modal = document.getElementById("modal-detalle");
    if (modal) {
        modal.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", cargarDatos);

window.onclick = function (event) {
    const modal = document.getElementById("modal-detalle");
    if (event.target === modal) {
        cerrarModal();
    }
};
