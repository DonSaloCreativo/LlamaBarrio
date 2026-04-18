const API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";
const formUrls = {
    tally: "https://tally.so/r/ja7DOQ",
    business: "https://forms.gle/k3VE5zWxYB5Fxrdk6"
};
let locales = [];
let joyitas = [];

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔄 Iniciando carga de datos...");
    
    setupFormTriggers();
    setupFloatingCta();
    
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
                name: j["¿Dónde lo encontraste?"] || j.name || j.Nombre || "",
                desc: j["Comentario sobre la Picada"] || j["Cuéntanos el dato"] || j.desc || j.Descripción || "",
                img: (j["Untitled file upload field"] || j["Untitled file upload"] || j["Untitled file uplo"] || j.Imagen || j.img || "sin-imagen.png"),
                price: j["¿Precio? (opcional)"] || j["💰Precio? (opcional)"] || "",
                autor: j["Nombre"] ? String(j["Nombre"]).trim() : "",
                category: j.Categoria || j.category || "",
                comuna: j["Comun"] || j.Comuna || j.comuna || "",
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
        setupTestimonials();
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
                <div class="comm-img-box"><img src="${imgSrc}" alt="Dato recomendado" onerror="this.src='images/sin-imagen.png'"></div>
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
            joyitasGrid.appendChild(c);
        });
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
            grid.appendChild(card);
        });
        
        if (isInitialLoad && locales.length > 10) {
            if (loadMoreHint) loadMoreHint.hidden = false;
        } else {
            if (loadMoreHint) loadMoreHint.hidden = true;
        }
        
        filtrarLocales();
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
    el("modal-titulo").innerText = j.autor && j.autor.trim() ? `"${j.name}" - ${j.autor}` : `"${j.name}" - Anónimo`;
    el("modal-categoria").innerText = j.category || "";
    el("modal-dir").innerText = j.ubicacion ? `${j.ubicacion}` : (j.comuna ? `Encontrado en: ${j.comuna}` : "");
    el("modal-desc").innerText = j.desc || '';
    el("modal-hor").innerText = '';
    el("modal-precio").innerText = j.price ? "Precio: " + j.price : '';
    el("modal-autor").innerText = '';
    
    const imgSrc = j.img && String(j.img).startsWith("http")
        ? j.img
        : (j.img && j.img !== "sin-imagen.png"
            ? `images/${j.img}`
            : "images/sin-imagen.png");
    el("modal-img").src = imgSrc;
    el("modal-img").alt = j.name || '';
    
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

function setupTestimonials() {
    const testimonialsGrid = document.getElementById('testimonials-grid');
    const testimonialsDots = document.getElementById('testimonials-dots');

    if (testimonialsGrid && testimonialsDots && window.innerWidth < 760) {
        const cards = testimonialsGrid.querySelectorAll('.testimonial-card');
        const totalCards = cards.length;
        let testimonialIndex = 0;
        
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('div');
            dot.className = `testimonial-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => showTestimonial(i));
            testimonialsDots.appendChild(dot);
        }
        
        function showTestimonial(index) {
            testimonialIndex = index;
            testimonialsGrid.style.transform = `translateX(-${index * 100}%)`;
            
            const dots = testimonialsDots.querySelectorAll('.testimonial-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
        
        setInterval(() => {
            testimonialIndex = (testimonialIndex + 1) % totalCards;
            showTestimonial(testimonialIndex);
        }, 6000);
        
        testimonialsGrid.style.transition = 'transform 0.3s ease';
    }
}

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