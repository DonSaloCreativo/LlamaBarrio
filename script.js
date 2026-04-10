/* (Las variables comunas y allProducts se mantienen igual) */

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
            div.innerHTML = `<img src="${p.image}" class="circle-img" loading="lazy"><p style="font-size:0.7rem; font-weight:600; margin-top:5px;">${p.name}</p>`;
            scroll.appendChild(div);
        });
    }

    if(list) {
        list.innerHTML = "";
        if(products.length === 0) document.getElementById("no-results").style.display = "block";
        else {
            document.getElementById("no-results").style.display = "none";
            products.forEach(p => list.appendChild(createCard(p)));
        }
    }

    if(comunaList) {
        comunaList.innerHTML = "";
        // Recomendaciones: mostramos 3 al azar o las primeras 3
        allProducts.slice(0, 3).forEach(p => comunaList.appendChild(createCard(p)));
    }
}

function createCard(p) {
    const card = document.createElement("div");
    card.className = "res-card";
    card.onclick = () => abrirDetalleProducto(p);
    card.innerHTML = `
        <img src="${p.image}" class="res-thumb" loading="lazy">
        <div class="res-info">
            <strong>${p.name}</strong><br>
            <small>📍 ${p.comuna}</small>
            <div style="color:var(--primary); font-weight:800; margin-top:5px; font-size:1.1rem;">$${p.price.toLocaleString('es-CL')}</div>
        </div>`;
    return card;
}

/* ... (resto de funciones igual para mantener estabilidad) ... */
init();