const API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";
const formUrls = {
    tally: "https://tally.so/r/ja7DOQ",
    business: "https://forms.gle/tipCiPctSK1nNjjL9",
    offer: "#"
};

const DEBUG_MODE = false;
const IMAGE_PLACEHOLDER = "images/sin-imagen.png";

function debugLog() {
    if (DEBUG_MODE) console.log.apply(console, arguments);
}

function extractGoogleDriveFileId(url) {
    const raw = String(url || "");
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/uc\?export=view&id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = raw.match(pattern);
        if (match && match[1]) return match[1];
    }

    return "";
}

function getOptimizedImageSrc(value, fallback = IMAGE_PLACEHOLDER, width = 720) {
    const raw = String(value || "").trim();
    const safeFallback = fallback || IMAGE_PLACEHOLDER;

    if (!raw || raw === "sin-imagen.png") return safeFallback;

    if (/^https?:\/\//i.test(raw)) {
        // Importante: mantenemos la URL original de Google Drive/Formularios.
        // Convertirla a thumbnail puede romper imágenes si el archivo no permite ese formato.
        return raw;
    }

    if (raw.startsWith("images/")) return raw;
    return `images/${raw}`;
}

function imageLoadingAttrs(index = 99, width = 720, height = 480) {
    const isPriority = index < 2;
    return `loading="${isPriority ? "eager" : "lazy"}" decoding="async" fetchpriority="${isPriority ? "high" : "low"}" width="${width}" height="${height}"`;
}
let locales = [];
let joyitas = [];
let ofertasHoy = [];

function normalizeFieldName(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function normalizeSearchText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getSearchVariants(term) {
    const normalized = normalizeSearchText(term);
    if (!normalized) return [];

    const variants = new Set([normalized]);
    const words = normalized.split(" ").filter(Boolean);

    words.forEach((word) => {
        variants.add(word);

        if (word.endsWith("es") && word.length > 3) {
            variants.add(word.slice(0, -2));
        }

        if (word.endsWith("s") && word.length > 2) {
            variants.add(word.slice(0, -1));
        }

        if (!word.endsWith("s")) {
            variants.add(`${word}s`);
            variants.add(`${word}es`);
        }
    });

    return Array.from(variants);
}

function getFieldValue(source, preferredKeys = [], partialKeys = []) {
    if (!source || typeof source !== "object") return "";

    for (const key of preferredKeys) {
        if (source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== "") {
            return String(source[key]).trim();
        }
    }

    const entries = Object.entries(source);
    for (const [rawKey, rawValue] of entries) {
        if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") continue;
        const normalizedKey = normalizeFieldName(rawKey);
        if (partialKeys.some((partial) => normalizedKey.includes(normalizeFieldName(partial)))) {
            return String(rawValue).trim();
        }
    }

    return "";
}

function getScheduleValue(source, preferredKeys = [], partialKeys = []) {
    return getFieldValue(source, preferredKeys, partialKeys);
}

function getTodaySchedule(local) {
    const hoy = new Date().getDay();
    if (hoy >= 1 && hoy <= 5) return local.horLV || "";
    if (hoy === 6) return local.horS || "";
    return local.horD || "";
}

function getScheduleSummary(local) {
    const bloques = [];
    if (local.horLV) bloques.push(`L-V: ${local.horLV}`);
    if (local.horS) bloques.push(`Sáb: ${local.horS}`);
    if (local.horD) bloques.push(`Dom: ${local.horD}`);
    return bloques.join(" | ");
}

function getScheduleSummaryHtml(local) {
    const bloques = [];
    if (local.horLV) bloques.push(`L-V: ${local.horLV}`);
    if (local.horS) bloques.push(`Sáb: ${local.horS}`);
    if (local.horD) bloques.push(`Dom: ${local.horD}`);
    return bloques.join("<br>");
}

function getPriorityValue(source) {
    const raw = getFieldValue(source, ["Prioridad", "prioridad"], ["prioridad"]);
    const normalized = String(raw || "").trim().toLowerCase();

    if (!normalized) return 999;
    if (/^\d+$/.test(normalized)) return Number(normalized);
    if (normalized === "destacado" || normalized === "premium") return 1;
    if (normalized === "media") return 2;
    if (normalized === "normal") return 3;

    return 999;
}

function parseDateValue(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    }

    const slashMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
        const [, day, month, year] = slashMatch;
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDurationMs(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    if (!raw) return null;

    const match = raw.match(/(\d+)\s*(hora|horas|dia|dias|semana|semanas|mes|meses)/);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];

    if (unit.startsWith("hora")) return amount * 60 * 60 * 1000;
    if (unit.startsWith("dia")) return amount * 24 * 60 * 60 * 1000;
    if (unit.startsWith("semana")) return amount * 7 * 24 * 60 * 60 * 1000;
    if (unit.startsWith("mes")) return amount * 30 * 24 * 60 * 60 * 1000;

    return null;
}

function isOfferActive(oferta) {
    if (!oferta.desde || !oferta.tiempoMs) return true;

    const start = parseDateValue(oferta.desde);
    if (!start) return true;

    const expiresAt = start.getTime() + oferta.tiempoMs;
    return Date.now() <= expiresAt;
}

function getOfferExpiryDate(oferta) {
    if (!oferta.desde || !oferta.tiempoMs) return null;

    const start = parseDateValue(oferta.desde);
    if (!start) return null;

    return new Date(start.getTime() + oferta.tiempoMs);
}

function formatDateDisplay(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function fetchSheetData(sheetName) {
    return fetch(`${API_BASE}?hoja=${encodeURIComponent(sheetName)}`)
        .then((response) => response.json())
        .catch(() => []);
}

function fetchOffersData() {
    return fetchSheetData("Ofertas de hoy").then((data) => {
        if (Array.isArray(data) && data.length) return data;
        return fetchSheetData("Ofertas Hoy");
    });
}

function getPhoneHref(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/sin contacto/i.test(raw)) return "";

    let digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    if (digits.startsWith("56")) {
        return `tel:+${digits}`;
    }

    if (digits.length === 9 && digits.startsWith("9")) {
        return `tel:+56${digits}`;
    }

    if (digits.length === 8 || digits.length === 9) {
        return `tel:+56${digits}`;
    }

    return `tel:+${digits}`;
}

document.addEventListener("DOMContentLoaded", () => {
    debugLog("🔄 Iniciando carga de datos...");
    
    setupVisualEnhancements();
    setupFooterLegal();
    setupFormTriggers();
    setupAdsForm();
    setupMobileNav();
    setupMiniHow();
    renderLoadingSkeletons();

    const DATA_CACHE_KEY = "llamabarrio-cache-v3";
    const DATA_CACHE_TTL = 1000 * 60 * 60 * 6;

    function processLocalesData(localesData) {
        return (localesData || []).map(local => ({
            name: getFieldValue(local, ["Nombre", "name"], ["nombre"]),
            comuna: getFieldValue(local, ["Comuna", "comuna"], ["comuna"]),
            loc: getFieldValue(local, ["Dirección", "Direccion", "loc"], ["direccion", "ubicacion", "direccionexacta"]),
            desc: getFieldValue(local, ["Descripción", "Descripcion", "desc"], ["descripcion"]),
            tags: getFieldValue(local, ["Tags", "tags", "Comunidad", "comunidad"], ["tags", "comunidad"]),
            horLV: getScheduleValue(local, ["Horario_LV", "Horario LV", "HorarioLV"], ["horariolv"]),
            horS: getScheduleValue(local, ["Horario_S", "Horario S", "HorarioS"], ["horarios"]),
            horD: getScheduleValue(local, ["Horario_D", "Horario D", "HorarioD"], ["horariod"]),
            img: (local.Imagen || local.Img || local.img || "sin-imagen.png"),
            wa: getFieldValue(local, ["WhatsApp", "Whatsapp", "whatsapp", "wa"], ["whatsapp", "telefono", "contacto", "celular"]),
            category: getFieldValue(local, ["Categoria", "Categoría", "category"], ["categoria"]),
            prioridad: getPriorityValue(local),
            raw: local
        })).sort((a, b) => {
            const prioridadA = a.prioridad ?? 999;
            const prioridadB = b.prioridad ?? 999;
            if (prioridadA !== prioridadB) return prioridadA - prioridadB;

            const abiertaA = estaAbiertoAhora(getTodaySchedule(a)) ? 1 : 0;
            const abiertaB = estaAbiertoAhora(getTodaySchedule(b)) ? 1 : 0;
            if (abiertaA !== abiertaB) return abiertaB - abiertaA;

            return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        });
    }

    function processJoyitasData(joyitasData) {
        return (joyitasData || []).map(j => ({
            localName: j["Nombre del Local"] || j.localName || "",
            name: j["¿Dónde lo encontraste?"] || j.name || j.Nombre || "",
            desc: j["Comentario sobre la Picada"] || j["Cuéntanos el dato"] || j.desc || j.Descripción || "",
            img: (j["Untitled file upload field"] || j["Untitled file upload"] || j["Untitled file uplo"] || j.Imagen || j.img || "sin-imagen.png"),
            price: j["¿Precio? (opcional)"] || j["💰Precio? (opcional)"] || "",
            autor: j["Tu Nombre"] ? String(j["Tu Nombre"]).trim() : "",
            category: j.Categoria || j.category || "",
            comuna: j["Comuna"] || j["Comun"] || j.Comuna || j.comuna || "",
            ubicacion: j["¿Dónde lo encontraste?"] || j.loc || "",
            estado: j.Estado || j.estado || "",
            prioridad: getPriorityValue(j)
        })).filter(j => {
            const estadoLimpio = String(j.estado).trim().toLowerCase();
            return estadoLimpio === "" || estadoLimpio.includes("aprob");
        }).sort((a, b) => {
            const prioridadA = a.prioridad ?? 999;
            const prioridadB = b.prioridad ?? 999;
            if (prioridadA !== prioridadB) return prioridadA - prioridadB;

            const tituloA = (a.localName || a.name || "").trim();
            const tituloB = (b.localName || b.name || "").trim();
            return tituloA.localeCompare(tituloB, "es", { sensitivity: "base" });
        });
    }

    function processOfertasData(ofertasData) {
        return (ofertasData || []).map(oferta => ({
            local: getFieldValue(oferta, ["Local", "Nombre del local", "Nombre", "name"], ["local", "nombre"]),
            texto: getFieldValue(oferta, ["Oferta", "Texto", "Mensaje", "Promocion", "Promoción"], ["oferta", "texto", "mensaje", "promo", "promocion"]),
            comuna: getFieldValue(oferta, ["Comuna", "comuna"], ["comuna"]),
            desde: getFieldValue(oferta, ["Desde", "Fecha", "Inicio"], ["desde", "fecha", "inicio"]),
            tiempo: getFieldValue(oferta, ["Tiempo", "Duracion", "Duración"], ["tiempo", "duracion"]),
            tiempoMs: parseDurationMs(getFieldValue(oferta, ["Tiempo", "Duracion", "Duración"], ["tiempo", "duracion"])),
            estado: getFieldValue(oferta, ["Estado", "estado"], ["estado"]),
            prioridad: getPriorityValue(oferta)
        })).filter(oferta => {
            const estado = String(oferta.estado || "").trim().toLowerCase();
            return oferta.local && oferta.texto && (!estado || estado.includes("aprob")) && isOfferActive(oferta);
        }).sort((a, b) => {
            const prioridadA = a.prioridad ?? 999;
            const prioridadB = b.prioridad ?? 999;
            if (prioridadA !== prioridadB) return prioridadA - prioridadB;
            return a.local.localeCompare(b.local, "es", { sensitivity: "base" });
        });
    }

    function renderDataSections(options = {}) {
        if (options.joyitas !== false) {
            renderJoyitas();
            renderTrending();
            initTrendingCompact();
        }
        if (options.locales !== false) renderLocales();
        if (options.ofertas !== false) renderOffers();
        refreshRevealTargets();
    }

    function readDataCache() {
        try {
            const cached = JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || "null");
            if (!cached || !cached.timestamp) return null;
            if (Date.now() - cached.timestamp > DATA_CACHE_TTL) return null;
            return cached;
        } catch (error) {
            return null;
        }
    }

    function writeDataCache() {
        try {
            localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                locales,
                joyitas,
                ofertasHoy
            }));
        } catch (error) {
            // Si el navegador no permite localStorage, la web sigue funcionando igual.
        }
    }

    const cachedData = readDataCache();
    if (cachedData) {
        locales = cachedData.locales || [];
        joyitas = cachedData.joyitas || [];
        ofertasHoy = cachedData.ofertasHoy || [];
        renderDataSections();
    }

    fetchSheetData("Publicaciones Locales")
        .then((localesData) => {
            locales = processLocalesData(localesData);
            renderDataSections({ joyitas: false, ofertas: false });
            writeDataCache();
        })
        .catch((error) => {
            console.error("❌ Error cargando locales:", error);
            if (!cachedData) clearLoadingSkeletons();
        });

    fetchSheetData("Publicaciones Tally")
        .then((joyitasData) => {
            joyitas = processJoyitasData(joyitasData);
            renderDataSections({ locales: false, ofertas: false });
            writeDataCache();
        })
        .catch((error) => {
            console.error("❌ Error cargando joyitas:", error);
            if (!cachedData) clearLoadingSkeletons();
        });

    fetchOffersData()
        .then((ofertasData) => {
            ofertasHoy = processOfertasData(ofertasData);
            renderDataSections({ locales: false, joyitas: false });
            writeDataCache();
        })
        .catch((error) => {
            console.error("❌ Error cargando ofertas:", error);
            if (!cachedData) clearLoadingSkeletons();
        });

    function renderJoyitas(){
        const joyitasGrid = document.getElementById("joyitas-grid");
        if(!joyitasGrid) {
            console.error("❌ No encontré el elemento joyitas-grid");
            return;
        }
        joyitasGrid.innerHTML = "";
        debugLog("🎨 Renderizando joyitas, cantidad:", joyitas.length);
        
        if (joyitas.length === 0) {
            joyitasGrid.innerHTML = "<p style='padding:2em;text-align:center;color:#bbb;'>No hay recomendaciones aún.</p>";
            return;
        }
        joyitas.forEach((j, idx) => {
            debugLog(`🎴 Card #${idx}:`, j);
            const c = document.createElement("article");
            c.className = "comm-card";
            c.style.cursor = "pointer";
            
            const imgSrc = getOptimizedImageSrc(j.img, IMAGE_PLACEHOLDER, 720);
            
            c.innerHTML = `
                <div class="comm-img-box">
                    <img src="${imgSrc}" alt="Dato recomendado" ${imageLoadingAttrs(idx, 720, 480)} onerror="this.onerror=null;this.src='images/sin-imagen.png'">
                    <div class="comm-image-overlay">
                        <span class="comm-tag">${j.comuna || "Sin comuna"}</span>
                        <span class="comm-chip">Joyita</span>
                    </div>
                </div>
                <div class="comm-info">
                    <div class="comm-info-top">
                        <b>${j.localName || j.name || "Recomendación local"}</b>
                        <span class="comm-author-line">por ${j.autor && j.autor.trim() ? j.autor : "Anónimo"}</span>
                    </div>
                    <p>"${j.desc || ""}"</p>
                </div>
            `;
            c.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirDetalleJoyita(j);
            });
            joyitasGrid.appendChild(c);
        });

        refreshRevealTargets();
    }

    const grid = document.getElementById("locals-grid");
    const searchInput = document.getElementById("main-search");
    const searchButton = document.querySelector(".btn-buscar-main");
    const comunaSelect = document.getElementById("comuna-select");
    const comunaLabel = document.getElementById("current-comuna-label");
    const noResults = document.getElementById("no-results");
    const loadMoreHint = document.getElementById("load-more-hint");
    const categoryButtons = document.querySelectorAll(".category-pill");
    const openNowFilter = document.getElementById("open-now-filter");

    let categoriaActiva = "Todas";
    let soloAbiertos = false;

    function renderLocales() {
        if(!grid) {
            console.error("❌ No encontré el elemento locals-grid");
            return;
        }
        grid.innerHTML = "";
        debugLog("🏪 Renderizando locales, cantidad:", locales.length);
        
        const imagenesPorCategoria = {
            "Almacén": "images/almacen.jpg",
            "Botillería": "images/botilleria.jpg",
            "Comida rápida": "images/comida-rapida.jpg",
            "Comida Rápida": "images/comida-rapida.jpg",
            "Panadería": "images/panaderia.jpg",
            "Cafetería": "images/panaderia.jpg",
            "Cafeterías": "images/panaderia.jpg",
            "Pastelería": "images/pasteleria.jpg",
            "Florería": "images/sin-imagen.png",
            "Pizzería": "images/pizzeria.jpg",
            "Completos": "images/comida-rapida.jpg",
            "Sushi": "images/comida-rapida.jpg",
            "Empanadas": "images/comida-rapida.jpg",
            "Colaciones": "images/panaderia.jpg",
            "Pizzas": "images/pizzeria.jpg",
            "Servicios": "images/sin-imagen.png"
        };
        
        const isInitialLoad = (searchInput?.value || "").trim() === "" && 
                              (comunaSelect?.value || "") === "";
        const maxCards = isInitialLoad ? 10 : locales.length;
        
        const localesToRender = locales.slice(0, maxCards);
        
        localesToRender.forEach((local, idx) => {
            const abierta = estaAbiertoAhora(getTodaySchedule(local));
            const card = document.createElement("article");
            card.className = "local-card";
            card.dataset.comuna = local.comuna;
            card.dataset.category = local.category;
            card.dataset.search = normalizeSearchText(`${local.name} ${local.loc} ${local.desc} ${local.category} ${local.tags || ""}`);
            card.dataset.open = abierta ? "true" : "false";
            
            const imgSrc = getOptimizedImageSrc(
                local.img,
                imagenesPorCategoria[local.category] || IMAGE_PLACEHOLDER,
                720
            );
            
            card.innerHTML = `
                <div class="local-img-wrap">
                    <div class="local-img-box">
                        <img src="${imgSrc}" alt="${local.name}" ${imageLoadingAttrs(idx, 720, 480)} onerror="this.onerror=null;this.src='images/sin-imagen.png'">
                        <div class="local-image-overlay">
                            <div class="local-headline">
                                <span class="local-inline-tag">${local.category}</span>
                                <span class="local-status ${abierta ? "open" : "closed"}">${abierta ? "Abierto" : "Cerrado"}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="local-body">
                    <div class="local-topline">
                        <h3>${local.name}</h3>
                    </div>
                    <div class="local-meta">
                        <p><b>${local.comuna}</b></p>
                        <p>${local.loc}</p>
                    </div>
                    <button type="button" class="btn-ver">Ver más</button>
                </div>
            `;
            card.addEventListener("click", (e) => {
                e.preventDefault();
                abrirDetalle(local);
            });
            card.querySelector(".btn-ver").addEventListener("click", (event) => {
                event.stopPropagation();
                abrirDetalle(local);
            });
            grid.appendChild(card);
        });
        
        if (isInitialLoad && locales.length > 10) {
            if (loadMoreHint) loadMoreHint.hidden = false;
        } else {
            if (loadMoreHint) loadMoreHint.hidden = true;
        }
        
        filtrarLocales();
        refreshRevealTargets();
    }

    function updateCategoryButtons() {
        if(!categoryButtons) return;
        categoryButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.category === categoriaActiva);
        });
    }

    function filtrarLocales() {
        if (!grid) return;
        const termino = normalizeSearchText(searchInput?.value || "");
        const terminoVariantes = getSearchVariants(termino);
        const comunaSeleccionada = comunaSelect?.value || "";
        const cards = grid.querySelectorAll(".local-card");
        let visibles = 0;
        
        if (comunaLabel) {
            if (comunaSeleccionada === "") {
                comunaLabel.textContent = "Todas las comunas";
            } else {
                comunaLabel.textContent = comunaSeleccionada;
            }
        }
        
        cards.forEach((card) => {
            const coincideBusqueda = termino === "" || terminoVariantes.some((variant) => card.dataset.search.includes(variant));
            const coincideComuna = comunaSeleccionada === "" || card.dataset.comuna === comunaSeleccionada;
            const coincideCategoria = categoriaActiva === "Todas" || card.dataset.category === categoriaActiva;
            const coincideAbierto = !soloAbiertos || card.dataset.open === "true";
            const mostrar = coincideBusqueda && coincideComuna && coincideCategoria && coincideAbierto;
            card.classList.toggle("is-hidden", !mostrar);
            if (mostrar) visibles += 1;
        });
        if (noResults) noResults.hidden = visibles !== 0;
    }

    if (searchInput) searchInput.addEventListener("input", filtrarLocales);
    if (searchButton) searchButton.addEventListener("click", filtrarLocales);
    if (comunaSelect) comunaSelect.addEventListener("change", filtrarLocales);
    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            categoriaActiva = button.dataset.category || "Todas";
            updateCategoryButtons();
            filtrarLocales();
        });
    });
    if (openNowFilter) {
        openNowFilter.addEventListener("click", () => {
            soloAbiertos = !soloAbiertos;
            openNowFilter.classList.toggle("is-active", soloAbiertos);
            filtrarLocales();
        });
    }
    updateCategoryButtons();
});

let revealObserver;

function setupVisualEnhancements() {
    const revealTargets = document.querySelectorAll(
        ".hero, .community-section, .locals-section-wrapper, .destacados-section, .cta-banner, .footer-extended, .site-footer"
    );

    revealTargets.forEach((element) => element.classList.add("ui-reveal"));

    if (!("IntersectionObserver" in window)) {
        revealTargets.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -40px 0px"
    });

    revealTargets.forEach((element) => revealObserver.observe(element));
}

function refreshRevealTargets() {
    const dynamicTargets = document.querySelectorAll(".comm-card, .local-card, .trending-compact-item");

    dynamicTargets.forEach((element, index) => {
        if (element.dataset.revealReady === "true") return;
        element.dataset.revealReady = "true";
        element.classList.add("ui-reveal");
        element.style.transitionDelay = `${Math.min(index * 35, 210)}ms`;

        if (revealObserver) {
            revealObserver.observe(element);
        } else {
            element.classList.add("is-visible");
        }
    });
}

function renderLoadingSkeletons() {
    const joyitasGrid = document.getElementById("joyitas-grid");
    const localsGrid = document.getElementById("locals-grid");
    const trendingCompact = document.getElementById("trending-compact");
    const offersFeed = document.getElementById("offers-feed");

    if (joyitasGrid) {
        joyitasGrid.innerHTML = Array.from({ length: 4 }, () => '<article class="ui-skeleton" aria-hidden="true"></article>').join("");
    }

    if (localsGrid) {
        localsGrid.innerHTML = Array.from({ length: 6 }, () => '<article class="ui-skeleton ui-skeleton--local" aria-hidden="true"></article>').join("");
    }

    if (trendingCompact) {
        trendingCompact.innerHTML = Array.from({ length: 3 }, () => '<div class="ui-skeleton ui-skeleton--compact" aria-hidden="true"></div>').join("");
    }

    if (offersFeed) {
        offersFeed.innerHTML = Array.from({ length: 3 }, () => '<div class="ui-skeleton ui-skeleton--compact" aria-hidden="true"></div>').join("");
    }

    refreshRevealTargets();
}

function clearLoadingSkeletons() {
    const joyitasGrid = document.getElementById("joyitas-grid");
    const localsGrid = document.getElementById("locals-grid");
    const trendingCompact = document.getElementById("trending-compact");
    const offersFeed = document.getElementById("offers-feed");

    if (joyitasGrid && joyitasGrid.querySelector(".ui-skeleton")) {
        joyitasGrid.innerHTML = "";
    }

    if (localsGrid && localsGrid.querySelector(".ui-skeleton")) {
        localsGrid.innerHTML = "";
    }

    if (trendingCompact && trendingCompact.querySelector(".ui-skeleton")) {
        trendingCompact.innerHTML = "";
    }

    if (offersFeed && offersFeed.querySelector(".ui-skeleton")) {
        offersFeed.innerHTML = "";
    }
}

function renderOffers() {
    const section = document.getElementById("offers-section");
    const feed = document.getElementById("offers-feed");
    if (!section || !feed) return;

    if (!ofertasHoy.length) {
        section.classList.add("is-hidden");
        feed.innerHTML = "";
        return;
    }

    section.classList.remove("is-hidden");
    feed.innerHTML = ofertasHoy.map((oferta) => `
        <article class="offer-item">
            <strong>${oferta.local}</strong>
            <p>${oferta.texto}</p>
            ${oferta.comuna ? `<span>${oferta.comuna}</span>` : ""}
            ${getOfferExpiryDate(oferta) ? `<small>Válido hasta el ${formatDateDisplay(getOfferExpiryDate(oferta))}</small>` : ""}
        </article>
    `).join("");
}

function convertirHoraAMinutos(valor) {
    const match = valor.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

function estaAbiertoAhora(horario) {
    if (!horario || !horario.includes("-")) return false;
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const partes = horario.split("-").map((parte) => parte.trim());
    if (partes.length !== 2) return false;
    const inicio = convertirHoraAMinutos(partes[0]);
    const fin = convertirHoraAMinutos(partes[1]);
    if (inicio === null || fin === null) return false;
    if (inicio <= fin) return minutosActuales >= inicio && minutosActuales <= fin;
    return minutosActuales >= inicio || minutosActuales <= fin;
}

function abrirDetalle(local) {
    const el = id => document.getElementById(id) || { innerText:"", src: "", alt:"", href:"#", classList:{toggle:()=>{}}, style:{} };
    const horarioDetalle = getScheduleSummary(local);
    const horarioDetalleHtml = getScheduleSummaryHtml(local);
    const contactoDetalle = local.wa || getFieldValue(local.raw, ["WhatsApp", "Whatsapp", "whatsapp", "wa"], ["whatsapp", "telefono", "contacto", "celular"]);
    const contactoLink = getPhoneHref(contactoDetalle);

    el("modal-titulo").innerText = local.name || "";
    el("modal-categoria").innerText = local.category || "";
    el("modal-dir").innerText = local.loc ? `Dirección: ${local.loc}` : "";
    el("modal-desc").innerText = local.desc || "Sin descripción disponible.";
    el("modal-hor").innerHTML = horarioDetalleHtml ? `Horario:<br>${horarioDetalleHtml}` : "Horario no informado";
    el("modal-contacto").innerText = typeof contactoDetalle === "string" && contactoDetalle.trim() !== ""
        ? contactoDetalle.trim()
        : "Sin contacto";
    el("modal-contacto").href = contactoLink || "#";
    el("modal-contacto").target = contactoLink ? "_self" : "";
    el("modal-precio").innerText = '';
    el("modal-autor").innerText = '';
    
    const imgSrc = getOptimizedImageSrc(local.img, IMAGE_PLACEHOLDER, 1080);
    el("modal-img").src = imgSrc;
    el("modal-img").alt = local.name || "";
    
    const waBtn = el("modal-wa");
    waBtn.href = "#";
    if (waBtn.classList) waBtn.classList.add("is-hidden");
    el("modal-detalle").style.display = "flex";
}

function abrirDetalleJoyita(j) {
    const el = id => document.getElementById(id) || {
        innerText:"", src:"", alt:"", href:"#",
        style:{},
        classList:{ add:()=>{}, remove:()=>{}, toggle:()=>{} }
    };
    const titulo = j.localName && j.localName.trim() ? j.localName.trim() : (j.name || "Recomendación");
    const comuna = j.comuna && j.comuna.trim() ? `Comuna: ${j.comuna.trim()}` : "";
    const encontrado = j.name && j.name.trim() ? `¿Dónde lo encontraste?: ${j.name.trim()}` : "";
    const descripcion = j.desc && j.desc.trim() ? j.desc.trim() : "Sin comentario disponible.";
    const autor = j.autor && j.autor.trim() ? j.autor.trim() : "Anónimo";

    el("modal-titulo").innerText = titulo;
    el("modal-categoria").innerText = "";
    el("modal-categoria").classList.add("is-hidden");
    el("modal-dir").innerText = comuna;
    el("modal-dir").style.display = comuna ? "block" : "none";
    el("modal-desc").innerText = descripcion;
    el("modal-desc").style.display = "block";
    el("modal-hor").innerText = encontrado;
    el("modal-hor").style.display = encontrado ? "block" : "none";
    el("modal-contacto").innerText = `Recomendado por: ${autor}`;
    el("modal-contacto").href = "#";
    el("modal-contacto").target = "";
    el("modal-precio").innerText = "";
    el("modal-autor").innerText = '';
    
    const imgSrc = getOptimizedImageSrc(j.img, IMAGE_PLACEHOLDER, 1080);
    el("modal-img").src = imgSrc;
    el("modal-img").alt = j.localName || j.name || '';
    
    el("modal-wa").classList.add('is-hidden');
    el("modal-wa").href = "#";
    el("modal-detalle").style.display = "flex";
}

function cerrarModal() {
    const el = id => document.getElementById(id) || { style:{} };
    el("modal-detalle").style.display = "none";
}

function abrirFormulario(tipoFormulario) {
    if (tipoFormulario === "business") {
        const businessModal = document.getElementById("business-form-modal");
        const businessFrame = document.getElementById("business-form-frame");
        if (businessFrame) businessFrame.src = formUrls.business;
        if (businessModal) businessModal.style.display = "flex";
        return;
    }

    if (tipoFormulario === "ads") {
        const adsModal = document.getElementById("ads-form-modal");
        if (adsModal) adsModal.style.display = "flex";
        return;
    }

    if (tipoFormulario === "offer") {
        const offerModal = document.getElementById("offer-form-modal");
        if (offerModal) offerModal.style.display = "flex";
        return;
    }

    const modal = document.getElementById("form-modal");
    const frame = document.getElementById("form-modal-frame");
    const url = {
        tally: "https://tally.so/r/ja7DOQ",
        business: "https://forms.gle/k3VE5zWxYB5Fxrdk6"
    }[tipoFormulario];
    if (!modal || !frame || !url) return;
    frame.src = url;
    modal.style.display = "flex";
}

function cerrarFormulario() {
    const modal = document.getElementById("form-modal");
    const frame = document.getElementById("form-modal-frame");
    if (!modal || !frame) return;
    modal.style.display = "none";
    frame.src = "";
}

function cerrarBusinessFormulario() {
    const modal = document.getElementById("business-form-modal");
    const frame = document.getElementById("business-form-frame");
    if (frame) frame.src = "";
    if (modal) modal.style.display = "none";
}

function cerrarOfertaFormulario() {
    const modal = document.getElementById("offer-form-modal");
    const form = modal ? modal.querySelector("form") : null;
    if (form) form.reset();
    if (modal) modal.style.display = "none";
}

function cerrarAdsFormulario() {
    const modal = document.getElementById("ads-form-modal");
    const form = document.getElementById("ads-form");
    const success = document.getElementById("ads-form-success");
    if (form) form.reset();
    if (success) success.hidden = true;
    if (form) form.hidden = false;
    if (modal) modal.style.display = "none";
}

function setupAdsForm() {
    const form = document.getElementById("ads-form");
    const success = document.getElementById("ads-form-success");
    if (!form || !success) return;

    form.addEventListener("submit", () => {
        window.setTimeout(() => {
            form.hidden = true;
            success.hidden = false;
        }, 250);
    });
}

function abrirFAQ() {
    const modal = document.getElementById("faq-modal");
    if (modal) modal.style.display = "flex";
}

function cerrarFAQ() {
    const modal = document.getElementById("faq-modal");
    if (modal) modal.style.display = "none";
}

function abrirComoUsar() {
    const modal = document.getElementById("como-usar-modal");
    if (modal) modal.style.display = "flex";
}

function cerrarComoUsar() {
    const modal = document.getElementById("como-usar-modal");
    if (modal) modal.style.display = "none";
}

function abrirQuienesSomos() {
    const modal = document.getElementById("quienes-somos-modal");
    if (modal) modal.style.display = "flex";
}

function cerrarQuienesSomos() {
    const modal = document.getElementById("quienes-somos-modal");
    if (modal) modal.style.display = "none";
}

function setupFooterLegal() {
    const footerLinks = document.querySelector(".footer-links");
    if (footerLinks) {
        footerLinks.innerHTML = `
            <p>LlamaBarrio © 2026 · Creado por <a href="https://www.fullcreator.cl" target="_blank" rel="noopener noreferrer">FullCreator Lab</a></p>
            <p><a href="javascript:void(0);" onclick="abrirTerminos(); return false;">Términos</a> · <a href="javascript:void(0);" onclick="abrirPrivacidad(); return false;">Privacidad</a></p>
        `;
    }

    createLegalModal(
        "terminos-modal",
        "Términos de uso",
        [
            ["Uso de la plataforma", "LlamaBarrio es una plataforma informativa y comunitaria para descubrir picadas y recomendaciones locales. El contenido publicado tiene fines referenciales y puede cambiar con el tiempo."],
            ["Responsabilidad de los negocios", "Cada local publicado es independiente y responsable de sus productos, precios, horarios, medios de contacto y calidad de servicio. LlamaBarrio no vende ni opera en nombre de los negocios."],
            ["Contenido enviado por usuarios", "Las recomendaciones recibidas mediante formularios pueden ser revisadas, aprobadas, editadas o descartadas para mantener la calidad, pertinencia y seguridad de la comunidad."],
            ["Actualizaciones", "Podemos modificar el diseño, las funcionalidades, el contenido y estos términos para mejorar la plataforma. El uso continuado del sitio implica aceptación de dichas actualizaciones."]
        ]
    );

    createLegalModal(
        "privacidad-modal",
        "Política de privacidad",
        [
            ["Datos recibidos", "Cuando un usuario completa formularios de recomendación o contacto, podemos recibir datos como nombre, comuna, descripción, fotografías y medios de contacto entregados voluntariamente."],
            ["Uso de la información", "La información se utiliza para revisar recomendaciones, publicar contenidos relevantes, responder consultas y mejorar la experiencia general dentro de la plataforma."],
            ["No venta de datos", "LlamaBarrio no vende datos personales a terceros. Solo se publica la información necesaria para mostrar una recomendación o facilitar el contacto con un negocio cuando corresponde."],
            ["Corrección o eliminación", "Si necesitas corregir, actualizar o solicitar la eliminación de un contenido o dato enviado a la plataforma, puedes contactarnos y revisaremos tu solicitud."]
        ]
    );
}

function createLegalModal(id, title, items) {
    if (document.getElementById(id)) return;

    const steps = items.map(([heading, text], index) => `
        <div class="info-step">
            <div class="step-number">${index + 1}</div>
            <div class="step-desc">
                <strong>${heading}</strong>
                <p>${text}</p>
            </div>
        </div>
    `).join("");

    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="info-modal-card">
            <button type="button" class="close-btn" onclick="${id === "terminos-modal" ? "cerrarTerminos()" : "cerrarPrivacidad()"}">&times;</button>
            <div class="info-content">
                <h2>${title}</h2>
                <div class="info-steps">${steps}</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function abrirTerminos() {
    const modal = document.getElementById("terminos-modal");
    if (modal) modal.style.display = "flex";
}

function cerrarTerminos() {
    const modal = document.getElementById("terminos-modal");
    if (modal) modal.style.display = "none";
}

function abrirPrivacidad() {
    const modal = document.getElementById("privacidad-modal");
    if (modal) modal.style.display = "flex";
}

function cerrarPrivacidad() {
    const modal = document.getElementById("privacidad-modal");
    if (modal) modal.style.display = "none";
}

function toggleFAQ(button) {
    const item = button.parentElement;
    const wasActive = item.classList.contains("active");
    
    document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("active"));
    
    if (!wasActive) {
        item.classList.add("active");
    }
}

window.onclick = function (event) {
    if (event.target === document.getElementById("modal-detalle")) cerrarModal();
    if (event.target === document.getElementById("form-modal")) cerrarFormulario();
    if (event.target === document.getElementById("business-form-modal")) cerrarBusinessFormulario();
    if (event.target === document.getElementById("ads-form-modal")) cerrarAdsFormulario();
    if (event.target === document.getElementById("offer-form-modal")) cerrarOfertaFormulario();
    if (event.target === document.getElementById("faq-modal")) cerrarFAQ();
    if (event.target === document.getElementById("como-usar-modal")) cerrarComoUsar();
    if (event.target === document.getElementById("quienes-somos-modal")) cerrarQuienesSomos();
    if (event.target === document.getElementById("terminos-modal")) cerrarTerminos();
    if (event.target === document.getElementById("privacidad-modal")) cerrarPrivacidad();
};

function setupFormTriggers() {
    const formTriggers = document.querySelectorAll("[data-form-modal]");
    formTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            const formType = trigger.getAttribute("data-form-modal");
            abrirFormulario(formType);
        });
    });
}

function setupMobileNav() {
    const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
    
    mobileNavItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            const section = item.getAttribute("data-section");
            const formModal = item.getAttribute("data-form-modal");

            if (!section && !formModal) {
                return;
            }

            e.preventDefault();
            
            if (formModal) {
                abrirFormulario(formModal);
                return;
            }
            
            mobileNavItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            
            if (section === "inicio") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else if (section === "joyitas") {
                const joyitasSection = document.querySelector(".community-section");
                if (joyitasSection) {
                    joyitasSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        });
    });
}

function setupMiniHow() {
    const header = document.querySelector('.mini-how-header');
    const steps = document.querySelector('.mini-how-steps');
    const section = document.querySelector('.mini-how-section');
    
    if (header && steps && section) {
        section.addEventListener('click', () => {
            steps.classList.toggle('collapsed');
        });
        
        steps.classList.add('collapsed');
    }
}

function renderTrending() {
    const localesConteo = {};
    
    if (joyitas && joyitas.length > 0) {
        joyitas.forEach(joyita => {
            const nombreLocal = joyita.localName;
            if (nombreLocal && nombreLocal.trim() !== "") {
                localesConteo[nombreLocal] = (localesConteo[nombreLocal] || 0) + 1;
            }
        });
    }
    
    const trending = Object.entries(localesConteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const trendingContainer = document.getElementById('trending-section');
    if (!trendingContainer) {
        debugLog("ℹ️ No hay sección de trending configurada");
        return;
    }
    
    if (trending.length === 0) {
        trendingContainer.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Aún no hay recomendaciones</p>';
        return;
    }
}

function initTrendingCompact() {
    const trendingCompact = document.getElementById('trending-compact');
    if (!trendingCompact) return;
    
    const localesConteo = {};
    
    if (joyitas && joyitas.length > 0) {
        joyitas.forEach(joyita => {
            const nombreLocal = joyita.localName;
            if (nombreLocal && nombreLocal.trim() !== "") {
                localesConteo[nombreLocal] = (localesConteo[nombreLocal] || 0) + 1;
            }
        });
    }
    
    const trending = Object.entries(localesConteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (trending.length === 0) {
        trendingCompact.innerHTML = '<p style="color:#999; text-align: center; padding: 12px;">Sin datos aún</p>';
        return;
    }
    
    const html = trending.map(([nombre, cantidad], idx) => `
        <div class="trending-compact-item">
            <strong>#${idx + 1} ${nombre}</strong><br>
            ⭐ ${cantidad} recomendaciones
        </div>
    `).join('');
    
    trendingCompact.innerHTML = html;
}



