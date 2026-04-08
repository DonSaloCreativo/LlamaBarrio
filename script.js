// ==========================
// LISTA DE PRODUCTOS
// ==========================
const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia", destacado: true },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa", destacado: true },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "Providencia" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Las Condes" }
];

// ==========================
// ELEMENTOS DEL DOM
// ==========================
const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");
const locationFilter = document.getElementById("location-filter");
const searchInput = document.getElementById("search-input");

// ==========================
// MODAL DE CONTACTO
// ==========================
const modal = document.createElement("div");
modal.id = "modal";
modal.style.cssText = `
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0);
  background: #fffae6;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
  z-index: 9999;
  width: 280px;
  text-align: center;
  transition: transform 0.25s cubic-bezier(.68,-0.55,.27,1.55);
`;
document.body.appendChild(modal);

const modalClose = document.createElement("span");
modalClose.textContent = "✖";
modalClose.style.cssText = "position:absolute; top:8px; right:10px; cursor:pointer; font-size:22px; color:red; font-weight:bold;";
modal.appendChild(modalClose);

const modalImg = document.createElement("img");
modalImg.style.cssText = "width:100%; height:140px; object-fit:cover; border-radius:10px;";
modal.appendChild(modalImg);

const modalName = document.createElement("div");
modalName.style.cssText = "font-weight:600; margin:8px 0 2px;";
modal.appendChild(modalName);

const modalComuna = document.createElement("div");
modalComuna.style.cssText = "font-size:0.9rem; color:#555;";
modal.appendChild(modalComuna);

const modalPrice = document.createElement("div");
modalPrice.style.cssText = "font-weight:600; margin:4px 0;";
modal.appendChild(modalPrice);

const modalBtn = document.createElement("button");
modalBtn.textContent = "📩 Contactar";
modalBtn.style.cssText = `
  background-color:#25D366; color:white; border:none;
  padding:8px 14px; border-radius:12px; cursor:pointer; margin-top:10px;
`;
modal.appendChild(modalBtn);

// ==========================
// CERRAR MODAL
// ==========================
modalClose.addEventListener("click", closeModal);
modalBtn.addEventListener("click", () => {
  window.open("https://wa.me/56984368260", "_blank");
});
window.addEventListener("click", (e) => {
  if(e.target === modal) closeModal();
});

function closeModal(){
  modal.style.transform = "translate(-50%, -50%) scale(0)";
  setTimeout(() => {
    modalImg.src = "";
    modalName.textContent = "";
    modalComuna.textContent = "";
    modalPrice.textContent = "";
  }, 250);
}

// ==========================
// RELLENAR SELECT DE COMUNAS
// ==========================
const comunas = [...new Set(allProducts.map(p => p.comuna))];
comunas.forEach(c => {
  const option = document.createElement("option");
  option.value = c;
  option.textContent = c;
  locationFilter.appendChild(option);
});

// ==========================
// MOSTRAR PRODUCTOS
// ==========================
function displayProducts(products){
  // Lo más barato siempre intacto
  cheapScroll.innerHTML = "";
  allProducts.forEach(p => {
    const cheapCard = document.createElement("div");
    cheapCard.className = "cheap-card";
    cheapCard.innerHTML = `
      ${p.destacado ? `<div class="badge">🌟 Oferta Real</div>` : ''}
      <img src="${p.image}" alt="${p.name}">
      <div class="info"><strong>${p.name}</strong><br><small>${p.comuna}</small><div>$${p.price.toLocaleString('es-CL')}</div></div>
    `;
    cheapCard.addEventListener("click", () => showModal(p));
    cheapScroll.appendChild(cheapCard);
  });

  // Destacados filtrados
  featuredScroll.innerHTML = "";
  const featured = products.filter(p => p.destacado);
  if(featured.length === 0){
    featuredScroll.innerHTML = `<p style="padding:15px; color:#666;">No hay destacados en esta comuna</p>`;
  } else {
    featured.forEach(p => {
      const card = document.createElement("div");
      card.className = "featured-card";
      card.innerHTML = `
        <div class="badge">🌟 Destacado</div>
        <img src="${p.image}" alt="${p.name}">
        <div class="info"><strong>${p.name}</strong><br><small>${p.comuna}</small><div>$${p.price.toLocaleString('es-CL')}</div></div>
      `;
      card.addEventListener("click", () => showModal(p));
      featuredScroll.appendChild(card);
    });
  }

  // Lista vertical
  productList.innerHTML = "";
  if(products.length === 0){
    productList.innerHTML = `<p style="padding:20px; color:#666;">No se encontraron promociones</p>`;
  } else {
    products.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img class="product-img" src="${p.image}" alt="${p.name}">
        <div class="product-info"><strong>${p.name}</strong> - <small>${p.comuna}</small><br><strong>$${p.price.toLocaleString('es-CL')}</strong></div>
      `;
      li.addEventListener("click", () => showModal(p));
      productList.appendChild(li);
    });
  }
}

// ==========================
// MOSTRAR MODAL CON REBOTE SUAVE
// ==========================
function showModal(product){
  modalImg.src = product.image;
  modalName.textContent = product.name;
  modalComuna.textContent = product.comuna;
  modalPrice.textContent = `$${product.price.toLocaleString('es-CL')}`;
  modal.style.transform = "translate(-50%, -50%) scale(1.05)";
  setTimeout(()=> modal.style.transform = "translate(-50%, -50%) scale(1)", 150);
}

// ==========================
// BÚSQUEDA Y FILTRO
// ==========================
function buscar(){
  const comuna = locationFilter.value;
  const query = searchInput.value.toLowerCase();

  const filtered = allProducts.filter(p => {
    const matchComuna = comuna ? p.comuna === comuna : true;
    const matchName = query ? p.name.toLowerCase().includes(query) : true;
    return matchComuna && matchName;
  });

  displayProducts(filtered);
}

// ==========================
// INICIALIZAR
// ==========================
displayProducts(allProducts);