const API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";
const formUrls = {
    tally: "https://tally.so/r/ja7DOQ",
    business: "https://forms.gle/k3VE5zWxYB5Fxrdk6"
};
let locales = [];
let joyitas = [];

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔄 Iniciando carga de datos...");
    
    setupVisualEnhancements();
    setupFooterLegal();
    setupFormTriggers();
    setupMobileNav();
    setupMiniHow();
    renderLoadingSkeletons();
    
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
        initTrendingCompact();
        refreshRevealTargets();
    }).catch(err => {
        console.error("❌ Error cargando datos:", err);
        clearLoadingSkeletons();
        refreshRevealTargets();
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
                <div class="comm-img-box">
                    <img src="${imgSrc}" alt="Dato recomendado" onerror="this.src='images/sin-imagen.png'">
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
        console.log("🏪 Renderizando locales, cantidad:", locales.length);
        
        const imagenesPorCategoria = {
            "Almacén": "images/almacen.jpg",
            "Botillería": "images/botilleria.jpg",
            "Comida rápida": "images/comida-rapida.jpg",
            "Comida Rápida": "images/comida-rapida.jpg",
            "Panadería": "images/panaderia.jpg",
            "Pastelería": "images/pasteleria.jpg",
            "Pizzería": "images/pizzeria.jpg",
            "Completos": "images/comida-rapida.jpg",
            "Sushi": "images/comida-rapida.jpg",
            "Empanadas": "images/comida-rapida.jpg",
            "Colaciones": "images/panaderia.jpg",
            "Pizzas": "images/pizzeria.jpg"
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
            card.dataset.category = local.category;
            card.dataset.search = `${local.name} ${local.loc} ${local.desc} ${local.category}`.toLowerCase();
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
                        <img src="${imgSrc}" alt="${local.name}" onerror="this.src='images/sin-imagen.png'">
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

    if (joyitasGrid) {
        joyitasGrid.innerHTML = Array.from({ length: 4 }, () => '<article class="ui-skeleton" aria-hidden="true"></article>').join("");
    }

    if (localsGrid) {
        localsGrid.innerHTML = Array.from({ length: 6 }, () => '<article class="ui-skeleton ui-skeleton--local" aria-hidden="true"></article>').join("");
    }

    if (trendingCompact) {
        trendingCompact.innerHTML = Array.from({ length: 3 }, () => '<div class="ui-skeleton ui-skeleton--compact" aria-hidden="true"></div>').join("");
    }

    refreshRevealTargets();
}

function clearLoadingSkeletons() {
    const joyitasGrid = document.getElementById("joyitas-grid");
    const localsGrid = document.getElementById("locals-grid");
    const trendingCompact = document.getElementById("trending-compact");

    if (joyitasGrid && joyitasGrid.querySelector(".ui-skeleton")) {
        joyitasGrid.innerHTML = "";
    }

    if (localsGrid && localsGrid.querySelector(".ui-skeleton")) {
        localsGrid.innerHTML = "";
    }

    if (trendingCompact && trendingCompact.querySelector(".ui-skeleton")) {
        trendingCompact.innerHTML = "";
    }
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
    el("modal-img").src = imgSrc;
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
            <p>LlamaBarrio © 2026 · <a href="javascript:void(0);" onclick="abrirTerminos(); return false;">Términos</a> · <a href="javascript:void(0);" onclick="abrirPrivacidad(); return false;">Privacidad</a></p>
            <p>Creado por <a href="https://www.fullcreator.cl" target="_blank" rel="noopener noreferrer">FullCreator Lab</a></p>
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
            e.preventDefault();
            const section = item.getAttribute("data-section");
            const formModal = item.getAttribute("data-form-modal");
            
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
                    joyitasSection.scrollIntoView({ behavior: "smooth" });
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
        console.log("ℹ️ No hay sección de trending configurada");
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
