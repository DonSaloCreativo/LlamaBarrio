// LISTA DE PRODUCTOS
const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia", destacado: true, category:"Comida" },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes", category:"Comida" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa", destacado: true, category:"Comida" },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "San Bernardo", category:"Comida" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Maipú", category:"Comida" }
];

// ELEMENTOS DEL DOM
const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");
const locationFilter = document.getElementById("location-filter");
const filterButtons = document.querySelectorAll(".filter-btn");
let selectedFilters = [];

// COMUNAS
const comunas = [ "Colina","Lampa","Til Til","Pirque","Puente Alto","San José de Maipo","Buin","Calera de Tango","Paine","San Bernardo","Alhué","Curacaví","María Pinto","Melipilla","San Pedro","Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Granja","La Florida","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Miguel","San Joaquín","San Ramón","Santiago","Vitacura","El Monte","Isla de Maipo","Padre Hurtado","Peñaflor","Talagante"];

// LLENAR SELECT
locationFilter.innerHTML = '<option value="">Todas las comunas</option>';
comunas.forEach(c => {
  const option = document.createElement("option");
  option.value = c;
  option.textContent = c;
  locationFilter.appendChild(option);
});

// FILTROS
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if(btn.dataset.category === "Todos"){
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedFilters = [];
    } else {
      btn.classList.toggle("active");
      document.querySelector(".filter-btn[data-category='Todos']").classList.remove("active");
      selectedFilters = Array.from(filterButtons)
        .filter(b => b.classList.contains("active") && b.dataset.category !== "Todos")
        .map(b => b.dataset.category);

      // Vida Nocturna activa cambia a gris
      filterButtons.forEach(b => {
        if(b.dataset.category === "Vida Nocturna") {
          if(b.classList.contains("active")) b.style.background="#888";
          else b.style.background="#000";
        }
      });
    }
  });
});

// MOSTRAR PRODUCTOS
function displayProducts(products){
  cheapScroll.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "cheap-card";
    card.innerHTML = `${p.destacado ? '<div class="badge">🌟 Oferta Real</div>' : ''}
      <img src="${p.image}" alt="${p.name}">
      <div class="info">
        <strong>${p.name}</strong><br>
        <small>${p.comuna}</small>
        <div>${p.price ? `$${p.price.toLocaleString('es-CL')}` : ''}</div>
      </div>`;
    card.onclick = () => abrirPopup(p);
    cheapScroll.appendChild(card);
  });

  // DESTACADOS
  featuredScroll.innerHTML = "";
  const destacados = products.filter(p => p.destacado);
  if(destacados.length === 0){
    featuredScroll.innerHTML = '<p style="padding:20px; color:#666;">No hay destacados en esta comuna.</p>';
  } else {
    destacados.forEach(p => {
      const card = document.createElement("div");
      card.className = "featured-card";
      card.innerHTML = `<div class="badge">🌟 Destacado</div>
        <img src="${p.image}" alt="${p.name}">
        <div class="info">
          <strong>${p.name}</strong><br>
          <small>${p.comuna}</small>
          <div>${p.price ? `$${p.price.toLocaleString('es-CL')}` : ''}</div>
        </div>`;
      card.onclick = () => abrirPopup(p);
      featuredScroll.appendChild(card);
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
          ${p.price ? `<strong>$${p.price.toLocaleString('es-CL')}</strong>` : ''}
        </div>`;
      li.onclick = () => abrirPopup(p);
      productList.appendChild(li);
    });
  }
}

// BUSCAR
function buscar(){
  const comuna = locationFilter.value;
  let filtered = allProducts.filter(p => comuna ? p.comuna === comuna : true);
  if(selectedFilters.length>0) filtered = filtered.filter(p => selectedFilters.includes(p.category));
  displayProducts(filtered);
}

// POPUP
function abrirPopup(p){
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  const content = document.createElement("div");
  content.className = "popup-content";
  content.style.maxWidth = "500px";
  content.innerHTML = `<button class="popup-close" onclick="this.parentElement.parentElement.remove()">X</button>
    <img src="${p.image}" style="width:100%; height:200px; object-fit:cover; border-radius:12px;">
    <h3>${p.name}</h3>
    <p>📍 ${p.comuna}</p>
    ${p.price ? `<p>💰 $${p.price.toLocaleString('es-CL')}</p>` : ''}`;
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

// INICIAL
displayProducts(allProducts);