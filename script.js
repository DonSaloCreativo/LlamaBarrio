const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia", tipo: "barato" },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes", tipo: "destacado" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa", tipo: "barato" },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "Providencia", tipo: "destacado" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Las Condes", tipo: "barato" }
];

const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");
const locationFilter = document.getElementById("location-filter");
const searchInput = document.getElementById("search-input");

const normalizeText = (text) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function displayProducts(products) {
  // Limpiamos todo antes de rellenar
  cheapScroll.innerHTML = "";
  featuredScroll.innerHTML = "";
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = `<p style="padding: 20px; color: #666;">No hay resultados para esta búsqueda.</p>`;
    return;
  }

  products.forEach(p => {
    // 1. Crear tarjeta para los Scrolls Horizontales
    const cardHTML = `
      <div class="cheap-card"> 
        <img src="${p.image}" alt="${p.name}">
        <div class="price-tag">$${p.price.toLocaleString('es-CL')}</div>
        <div class="info">
          <strong>${p.name}</strong><br>
          <small>${p.comuna}</small>
        </div>
      </div>
    `;

    // Distribuimos según el tipo o mostramos en ambos si es búsqueda
    if (p.tipo === "barato") {
      cheapScroll.innerHTML += cardHTML;
    } else {
      featuredScroll.innerHTML += cardHTML.replace("cheap-card", "featured-card");
    }

    // 2. Crear elemento para la lista vertical (Todas las promociones)
    const li = document.createElement("li");
    li.innerHTML = `
      <img class="product-img" src="${p.image}">
      <div class="product-info">
        <div style="display:flex; justify-content:between; align-items:center;">
           <strong style="font-size:1.2rem;">${p.name}</strong>
           <span style="margin-left:auto; background:#25D366; padding:2px 8px; border-radius:5px; font-weight:bold;">$${p.price.toLocaleString('es-CL')}</span>
        </div>
        <small>${p.comuna}</small>
      </div>
    `;
    productList.appendChild(li);
  });
}

function buscar() {
  const comuna = locationFilter.value;
  const query = normalizeText(searchInput.value);

  const filtered = allProducts.filter(p => {
    const matchComuna = comuna ? p.comuna === comuna : true;
    const matchName = query ? normalizeText(p.name).includes(query) : true;
    return matchComuna && matchName;
  });

  displayProducts(filtered);
}

// Inicializar
displayProducts(allProducts);