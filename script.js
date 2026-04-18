const API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";
const formUrls = {
    tally: "https://tally.so/r/ja7DOQ",
    business: "https://forms.gle/k3VE5zWxYB5Fxrdk6"
};
let locales = [];
let joyitas = [];
const IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23f4efe9'/%3E%3C/svg%3E";
const SUGGESTION_SEED = [
    "Almacén",
    "Comida Rápida",
    "Botillería",
    "Panadería",
    "Completos",
    "Sushi",
    "Empanadas",
    "Colaciones",
    "Pizzas",
    "Verdulería"
];
let lazyImageObserver = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔄 Iniciando carga de datos...");
    
    setupFormTriggers();
    setupFloatingCta();
    setupMiniHow();
    setupLazyMedia(document);
    
    Promise.all([
        fetch(`${API_BASE}?hoja=Publicaciones%20Locales`).then(r => r.json()),
        fetch(`${API_BASE}?hoja=Tally`).then(r => r.json())
    ]).then(([localesData, joyitasData]) => {
        console.log("📊 Datos RAW de Locales:", localesData);
        console.log("📊 Datos RAW de Joyitas:", joyitasData);
        
        locales = (localesData || []).map(local => ({
            name: local.Nombre || local.name || "",
            comuna: local.Comuna || local.comuna || "",
            loc: local.Dirección || local.loc || "",
            desc: local.Descripción || local.desc || "",
            hor: local.Horario || local.hor || "",
            img: (local.Imagen || local.Img || local.img || "sin-imagen.png"),
            wa: (typeof local.WhatsApp === "string" ? local.WhatsApp : (local.wa || "")),
            category: local.Categoria || local.category || ""
        }));
        
        joyitas = (joyitasData || []).map(j => {
            console.log("🎉 Joyita cruda:", j);
            return {
                localName: j["Nombre del Local"] || j.localName || "",
                name: j["¿Dónde lo encontraste?"] || j.name || j.Nombre || "",
                desc: j["Comentario sobre la Picada"] || j["Cuéntanos el dato"] || j.desc || j.Descripción || "",
                img: (j["Untitled file upload field"] || j["Untitled file upload"] || j["Untitled file uplo"] || j.Imagen || j.img || "sin-imagen.png"),
                price: j["¿Precio? (opcional)"] || j["💰Precio? (opcional)"] || "",
                autor: j["Tu Nombre"] ? String(j["Tu Nombre"]).trim() : "",
                category: j.Categoria || j.category || "",
                comuna: j["Comuna"] || j["Comun"] || j.Comuna || j.comuna || "",
                ubicacion: j["¿Dónde lo encontraste?"] || j.loc || "",
                estado: j.Estado || "Pendiente"
            };
        }).filter(j => {
            const estadoLimpio = String(j.estado).trim().toLowerCase();
            return estadoLimpio.includes("aprob");
        });
        
        console.log("✅ Locales procesados:", locales);
        console.log("✅ Joyitas procesadas:", joyitas);
        
        renderJoyitas();
        renderTrending();
        renderLocales();
    }).catch(err => {
        console.error("❌ Error cargando datos:", err);
    });

    function renderJoyitas(){
        const joyitasGrid = document.getElementById("joyitas-grid");
        if(!joyitasGrid) {
            console.error("❌ No encontré el elemento joyitas-grid");
            return;
        }
        joyitasGrid.innerHTML = "";
        console.log("🎨 Renderizando joyitas, cantidad:", joyitas.length);
        
        if (joyitas.length === 0) {
            joyitasGrid.innerHTML = "<p style='padding:2em;text-align:center;color:#bbb;'>No hay recomendaciones aún.</p>";
            return;
        }
        joyitas.forEach((j, idx) => {
            console.log(`🎴 Card #${idx}:`, j);
            const c = document.createElement("article");
            c.className = "comm-card";
            c.style.cursor = "pointer";
            
            const imgSrc = j.img && String(j.img).startsWith("http") 
                ? j.img 
                : (j.img && j.img !== "sin-imagen.png" 
                    ? `images/${j.img}` 
                    : "images/sin-imagen.png");
            
            c.innerHTML = `
                <div class="comm-img-box"><img src="${imgSrc}" alt="Dato recomendado"></div>
                <div class="comm-info">
                    <span class="comm-tag">${j.comuna || "Sin comuna"}</span>
                    <b>${j.autor && j.autor.trim() ? j.autor : "Anónimo"}</b>
                    <p>"${j.desc || ""}"</p>
                </div>
            `;
            c.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirDetalleJoyita(j);
            });
            prepareLazyImage(c.querySelector("img"), imgSrc);
            joyitasGrid.appendChild(c);
        });
        setupLazyMedia(joyitasGrid);
    }

    const grid = document.getElementById("locals-grid");
    const searchInput = document.getElementById("main-search");
    const searchButton = document.querySelector(".btn-buscar-main");
    const suggestions = document.getElementById("search-suggestions");
    const comunaSelect = document.getElementById("comuna-select");
    const comunaLabel = document.getElementById("current-comuna-label");
    const noResults = document.getElementById("no-results");
    const loadMoreHint = document.getElementById("load-more-hint");
    const categoryButtons = document.querySelectorAll(".category-pill");
    const openNowFilter = document.getElementById("open-now-filter");

    let categoriaActiva = "Todas";
    let soloAbiertos = false;

    function getMainCategory(category) {
        const normalized = String(category || "").trim().toLowerCase();
        if (!normalized) return "";
        if (normalized.includes("botiller")) return "Botillería";
        if (normalized.includes("almac")) return "Almacén";
        if (
            normalized.includes("comida rápida") ||
            normalized.includes("comida rapida") ||
            normalized.includes("completo") ||
            normalized.includes("sushi") ||
            normalized.includes("empanad") ||
            normalized.includes("colacion") ||
            normalized.includes("pizza") ||
            normalized.includes("panader") ||
            normalized.includes("pasteler")
        ) {
            return "Comida Rápida";
        }
        return category || "";
    }

    function renderLocales() {
        if(!grid) {
            console.error("❌ No encontré el elemento locals-grid");
            return;
        }
        grid.innerHTML = "";
        console.log("🏪 Renderizando locales, cantidad:", locales.length);
        
        const imagenesPorCategoria = {
            "Almacén": "images/almacen.png",
            "Botillería": "images/botilleria.png",
            "Comida rápida": "images/comida-rapida.png",
            "Comida Rápida": "images/comida-rapida.png",
            "Panadería": "images/panaderia.png",
            "Pastelería": "images/pasteleria.png",
            "Pizzería": "images/pizzeria.png",
            "Completos": "images/completo.jpg",
            "Sushi": "images/sushi.jpg",
            "Empanadas": "images/empanadas.jpg",
            "Colaciones": "images/casera.jpg",
            "Pizzas": "images/pizza.jpg"
        };
        
        const isInitialLoad = (searchInput?.value || "").trim() === "" && 
                              (comunaSelect?.value || "") === "";
        const maxCards = isInitialLoad ? 10 : locales.length;
        
        const localesToRender = locales.slice(0, maxCards);
        
        localesToRender.forEach((local) => {
            const abierta = estaAbiertoAhora(local.hor);
            const card = document.createElement("article");
            card.className = "local-card";
            card.dataset.comuna = local.comuna;
            const categoriaPrincipal = getMainCategory(local.category);
            card.dataset.category = categoriaPrincipal;
            card.dataset.search = `${local.name} ${local.loc} ${local.desc} ${local.category} ${categoriaPrincipal}`.toLowerCase();
            card.dataset.open = abierta ? "true" : "false";
            
            let imgSrc = "images/sin-imagen.png";
            
            if (local.img && String(local.img).startsWith("http")) {
                imgSrc = local.img;
            } else if (local.img && local.img !== "sin-imagen.png" && String(local.img).trim() !== "") {
                imgSrc = `images/${local.img}`;
            } else {
                imgSrc = imagenesPorCategoria[local.category] || "images/sin-imagen.png";
            }
            
            card.innerHTML = `
                <div class="local-img-wrap">
                    <div class="local-img-box">
                        <img src="${imgSrc}" alt="${local.name}">
                    </div>
                </div>
                <div class="local-body">
                    <div class="local-headline">
                        <span class="local-inline-tag">${local.category}</span>
                        <span class="local-status ${abierta ? "open" : "closed"}">${abierta ? "Abierto" : "Cerrado"}</span>
                    </div>
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
            prepareLazyImage(card.querySelector("img"), imgSrc);
            grid.appendChild(card);
        });
        
        if (isInitialLoad && locales.length > 10) {
            if (loadMoreHint) loadMoreHint.hidden = false;
        } else {
            if (loadMoreHint) loadMoreHint.hidden = true;
        }
        
        filtrarLocales();
        setupLazyMedia(grid);
    }

    function updateCategoryButtons() {
        if(!categoryButtons) return;
        categoryButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.category === categoriaActiva);
        });
    }

    function filtrarLocales() {
        if (!grid) return;
        const termino = (searchInput?.value || "").trim().toLowerCase();
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
            const coincideBusqueda = termino === "" || card.dataset.search.includes(termino);
            const coincideComuna = comunaSeleccionada === "" || card.dataset.comuna === comunaSeleccionada;
            const coincideCategoria = categoriaActiva === "Todas" || card.dataset.category === categoriaActiva;
            const coincideAbierto = !soloAbiertos || card.dataset.open === "true";
            const mostrar = coincideBusqueda && coincideComuna && coincideCategoria && coincideAbierto;
            card.classList.toggle("is-hidden", !mostrar);
            if (mostrar) visibles += 1;
        });
        if (noResults) noResults.hidden = visibles !== 0;
    }

    function renderSuggestions() {
        if (!searchInput || !suggestions) return;
        const query = searchInput.value.trim().toLowerCase();
        suggestions.innerHTML = "";
        if (query.length < 2) return;

        const dynamicSuggestions = locales
            .map((local) => getMainCategory(local.category) || local.category)
            .filter(Boolean);
        const allSuggestions = Array.from(new Set([...SUGGESTION_SEED, ...dynamicSuggestions]));
        const matches = allSuggestions
            .filter((term) => term.toLowerCase().includes(query))
            .slice(0, 8);

        matches.forEach((term) => {
            const option = document.createElement("option");
            option.value = term;
            suggestions.appendChild(option);
        });
    }

    const debouncedSearch = debounce(() => {
        renderSuggestions();
        filtrarLocales();
    }, 220);

    if (searchInput) searchInput.addEventListener("input", debouncedSearch);
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
    renderSuggestions();
});

function getPreferredImageSource(src) {
    if (!src || /^https?:/i.test(src)) return src;
    return src.replace(/\.(png|jpe?g)$/i, ".webp");
}

function prepareLazyImage(imageElement, source) {
    if (!imageElement) return;
    const safeSource = source || "images/sin-imagen.png";
    imageElement.classList.add("lazy-media", "is-loading");
    imageElement.setAttribute("loading", "lazy");
    imageElement.setAttribute("decoding", "async");
    imageElement.dataset.src = getPreferredImageSource(safeSource);
    imageElement.dataset.fallback = safeSource;
    imageElement.dataset.srcset = `${getPreferredImageSource(safeSource)} 640w, ${safeSource} 640w`;
    imageElement.setAttribute("sizes", "(max-width: 760px) 86vw, 320px");
    imageElement.src = IMAGE_PLACEHOLDER;
    imageElement.removeAttribute("onerror");
}

function loadLazyImage(imageElement) {
    if (!imageElement || !imageElement.dataset.src) return;
    const preferredSource = imageElement.dataset.src;
    const fallbackSource = imageElement.dataset.fallback || "images/sin-imagen.png";
    const srcSet = imageElement.dataset.srcset;
    imageElement.onerror = () => {
        imageElement.onerror = null;
        imageElement.src = fallbackSource;
        imageElement.classList.remove("is-loading");
    };
    imageElement.onload = () => {
        imageElement.classList.remove("is-loading");
    };
    if (srcSet) {
        imageElement.setAttribute("srcset", srcSet);
        imageElement.removeAttribute("data-srcset");
    }
    imageElement.src = preferredSource;
    imageElement.removeAttribute("data-src");
}

function setupLazyMedia(rootElement = document) {
    const lazyImages = rootElement.querySelectorAll("img.lazy-media[data-src]");
    if (!lazyImages.length) return;

    if (!("IntersectionObserver" in window)) {
        lazyImages.forEach(loadLazyImage);
        return;
    }

    if (!lazyImageObserver) {
        lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const imageElement = entry.target;
                loadLazyImage(imageElement);
                lazyImageObserver.unobserve(imageElement);
            });
        }, { rootMargin: "180px 0px" });
    }

    lazyImages.forEach((imageElement) => lazyImageObserver.observe(imageElement));
}

function debounce(fn, wait = 200) {
    let timer = null;
    return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), wait);
    };
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
    el("modal-titulo").innerText = local.name || "";
    el("modal-categoria").innerText = local.category || "";
    el("modal-dir").innerText = `${local.comuna || ""} · ${local.loc || ""}`;
    el("modal-desc").innerText = local.desc || "";
    el("modal-hor").innerText = local.hor ? `Horario: ${local.hor}` : "";
    el("modal-precio").innerText = '';
    el("modal-autor").innerText = '';
    
    const imgSrc = local.img && String(local.img).startsWith("http")
        ? local.img
        : (local.img && local.img !== "sin-imagen.png"
            ? `images/${local.img}`
            : "images/sin-imagen.png");
    const modalImg = el("modal-img");
    modalImg.onerror = function () {
        this.onerror = null;
        this.src = "images/sin-imagen.png";
    };
    modalImg.src = getPreferredImageSource(imgSrc);
    el("modal-img").alt = local.name || "";
    
    const waBtn = el("modal-wa");
    const waLink = typeof local.wa === "string" && local.wa.trim() !== "" ? `https://wa.me/${local.wa.replace(/\D/g, "")}` : "#";
    waBtn.href = waLink;
    if (waBtn.classList) waBtn.classList.toggle("is-hidden", waLink === "#");
    el("modal-detalle").style.display = "flex";
}

function abrirDetalleJoyita(j) {
    const el = id => document.getElementById(id) || { innerText:"", src:"", alt:"", href:"#", style:{} };
    el("modal-titulo").innerText = j.localName ? `${j.localName}` : (j.name || "Recomendación");
    el("modal-categoria").innerText = j.category || "";
    el("modal-dir").innerText = j.ubicacion ? `${j.ubicacion}` : (j.comuna ? `${j.comuna}` : "");
    el("modal-desc").innerText = j.desc || '';
    el("modal-hor").innerText = '';
    el("modal-precio").innerText = j.price ? "Precio: " + j.price : '';
    el("modal-autor").innerText = j.autor && j.autor.trim() ? `Por: ${j.autor}` : '';
    
    const imgSrc = j.img && String(j.img).startsWith("http")
        ? j.img
        : (j.img && j.img !== "sin-imagen.png"
            ? `images/${j.img}`
            : "images/sin-imagen.png");
    const modalImg = el("modal-img");
    modalImg.onerror = function () {
        this.onerror = null;
        this.src = "images/sin-imagen.png";
    };
    modalImg.src = getPreferredImageSource(imgSrc);
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

window.onclick = function (event) {
    if (event.target === document.getElementById("modal-detalle")) cerrarModal();
    if (event.target === document.getElementById("form-modal")) cerrarFormulario();
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

function setupFloatingCta() {
    const floatingBtns = document.querySelectorAll(".floating-cta-btn");
    floatingBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const formType = btn.getAttribute("data-form-modal");
            abrirFormulario(formType);
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
    // Calcular qué LOCAL fue más recomendado (usando el nombre del local)
    const localesConteo = {};
    
    joyitas.forEach(joyita => {
        const nombreLocal = joyita.localName;
        if (nombreLocal && nombreLocal.trim() !== "") {
            localesConteo[nombreLocal] = (localesConteo[nombreLocal] || 0) + 1;
        }
    });
    
    // Ordenar de mayor a menor y sacar TOP 5
    const trending = Object.entries(localesConteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Verificar que existe el elemento
    const trendingContainer = document.getElementById('trending-section');
    if (!trendingContainer) {
        console.log("ℹ️ No hay sección de trending configurada");
        return;
    }
    
    // Si no hay datos, mostrar mensaje
    if (trending.length === 0) {
        trendingContainer.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Aún no hay recomendaciones</p>';
        return;
    }
    
    // Crear HTML de trending - NOMBRE DEL LOCAL
    const trendingHTML = trending.map(([nombre, cantidad], index) => `
        <div class="trending-item">
            <div class="trending-rank">#${index + 1}</div>
            <div class="trending-info">
                <h4>${nombre}</h4>
                <p>⭐⭐⭐⭐⭐ ${cantidad} recomendaciones</p>
            </div>
        </div>
    `).join('');
    
    trendingContainer.innerHTML = trendingHTML;
}
