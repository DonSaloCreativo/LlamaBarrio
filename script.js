const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia" },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa" },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "Providencia" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Las Condes" }
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
  // Limpiar antes de mostrar
  cheapScroll.innerHTML = "";
  featuredScroll.innerHTML = "";
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = "<p style='color:gray; padding:20px;'>No se encontraron resultados.</p>";
    return;
  }

  products.forEach(p => {
    const priceText = "$" + p.price.toLocaleString('es-CL');

    // 1. Tarjetas para los Scrolls (Diseño compacto)
    const card = `
      <div class="cheap-card" style="min-width:200px; position:relative;">
        <img src="${p.image}" style="width:100%; height:140px; object-fit:cover;">
        <div class="price-tag" style="position:absolute; top:10px; right:10px; background:#25D366; color:black; padding:4px 8px; border-radius:8px; font-weight:bold;">${priceText}</div>
        <div style="padding:10px; text-align:left;">
          <strong>${p.name}</strong><br>
          <small style="color:gray;">${p.comuna}</small>
        </div>
      </div>`;
    
    cheapScroll.innerHTML += card;
    featuredScroll.innerHTML += card.replace("cheap-card", "featured-card");

    // 2. Lista Vertical (Diseño estirado)
    const li = document.createElement("li");
    li.style.listStyle = "none";
    li.innerHTML = `
      <div style="background:white; margin-bottom:15px; border-radius:15px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <img src="${p.image}" style="width:100%; height:180px; object-fit:cover;">
        <div style="padding:15px; text-align:left; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${p.name}</strong><br>
            <small>${p.comuna}</small>
          </div>
          <span style="background:#25D366; padding:5px 10px; border-radius:10px; font-weight:bold;">${priceText}</span>
        </div>
      </div>`;
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

// Iniciar aplicación
displayProducts(allProducts);