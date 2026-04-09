// LISTA DE PRODUCTOS
const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia", destacado: true },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa", destacado: true },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "San Bernardo" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Maipú" }
];

// ELEMENTOS DEL DOM
const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");
const locationFilter = document.getElementById("location-filter");
const searchInput = document.getElementById("search-input");

// COMUNAS
const comunas = [ "Colina","Lampa","Til Til","Pirque","Puente Alto","San José de Maipo","Buin", "Calera de Tango","Paine","San Bernardo","Alhué","Curacaví","María Pinto", "Melipilla","San Pedro","Cerrillos","Cerro Navia","Conchalí","El Bosque", "Estación Central","Huechuraba","Independencia","La Cisterna","La Granja","La Florida","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén", "Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca", "San Miguel","San Joaquín","San Ramón","Santiago","Vitacura","El Monte", "Isla de Maipo","Padre Hurtado","Peñaflor","Talagante" ];

// LLENAR SELECT
locationFilter.innerHTML = '<option value="">Todas las comunas</option>';
comunas.forEach(c => {
  const option = document.createElement("option");
  option.value = c;
  option.textContent = c;
  locationFilter.appendChild(option);
});

// FUNCIÓN PARA MOSTRAR PRODUCTOS
function displayProducts(products) {
  cheapScroll.innerHTML = "";
  allProducts.forEach(p => {
    const cheapCard = document.createElement("div");
    cheapCard.className = "cheap-card";
    cheapCard.innerHTML = `${p.destacado ? '<div class="badge">🌟 Oferta Real</div>' : ''}
      <img src="${p.image}" alt="${p.name}">
      <div class="info">
        <strong>${p.name}</strong><br>
        <small>${p.comuna}</small>
        <div>$${p.price.toLocaleString('es-CL')}</div>
      </div>`;
    cheapCard.onclick = () => abrirPopup(p);
    cheapScroll.appendChild(cheapCard);
  });

  // DESTACADOS
  featuredScroll.innerHTML = "";
  const destacados = products.filter(p => p.destacado);
  if(destacados.length === 0){
    featuredScroll.innerHTML = '<p style="padding:20px; color:#666;">No hay destacados en esta comuna.</p>';
  } else {
    destacados.forEach(p => {
      const featuredCard = document.createElement("div");
      featuredCard.className = "featured-card";
      featuredCard.innerHTML = `<div class="badge">🌟 Destacado</div>
        <img src="${p.image}" alt="${p.name}">
        <div class="info">
          <strong>${p.name}</strong><br>
          <small>${p.comuna}</small>
          <div>$${p.price.toLocaleString('es-CL')}</div>
        </div>`;
      featuredCard.onclick = () => abrirPopup(p);
      featuredScroll.appendChild(featuredCard);
    });
  }

  // LISTA VERTICAL
  productList.innerHTML = "";
  if(products.length === 0){
    productList.innerHTML = '<p style="padding:20px; color:#666;">No se encontraron promociones con esos filtros.</p>';
  } else {
    products.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<img class="product-img" src="${p.image}" alt="${p.name}">
        <div class="product-info">
          <strong>${p.name}</strong> - <small>${p.comuna}</small><br>
          <strong>$${p.price.toLocaleString('es-CL')}</strong>
        </div>`;
      li.onclick = () => abrirPopup(p);
      productList.appendChild(li);
    });
  }
}

// BÚSQUEDA
function buscar() {
  const comuna = locationFilter.value;
  const query = searchInput.value.toLowerCase();
  const filtered = allProducts.filter(p => {
    const matchComuna = comuna ? p.comuna === comuna : true;
    const matchName = query ? p.name.toLowerCase().includes(query) : true;
    return matchComuna && matchName;
  });
  displayProducts(filtered);
}

// POPUP NUEVO
function abrirPopup(p) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  const content = document.createElement("div");
  content.className = "popup-content";
  content.innerHTML = `<button class="popup-close" onclick="this.parentElement.parentElement.remove()">X</button>
    <img src="${p.image}">
    <h3>${p.name}</h3>
    <p>📍 ${p.comuna}</p>
    <p>💰 $${p.price.toLocaleString('es-CL')}</p>`;
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

// INICIAL
displayProducts(allProducts);