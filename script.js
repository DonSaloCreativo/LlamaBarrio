const locales = [
    { name: "El Rincón del Flaco", loc: "Mercado Central, local 45", status: "Abierto", rate: "4.8", dist: "320 m" },
    { name: "La Empanada de Doña Rosa", loc: "Paseo Ahumada 230", status: "Abierto", rate: "4.6", dist: "150 m" },
    { name: "Sopaipillas La Mechita", loc: "Av. Providencia esq. Pedro", status: "Cerrado", rate: "4.9", dist: "1.2 km" },
    { name: "Anticuchos Don Aurelio", loc: "Feria Libre, puesto 12", status: "Abierto", rate: "4.7", dist: "2.1 km" },
    { name: "Mote con Huesillo Carmen", loc: "Plaza Ñuñoa", status: "Abierto", rate: "4.5", dist: "3.4 km" },
    { name: "Churros La Esquina", loc: "Av. Apoquindo 3000", status: "Abierto", rate: "4.3", dist: "4.8 km" }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('locals-grid');
    if(grid) {
        locales.forEach(l => {
            const card = document.createElement('div');
            card.className = 'local-card';
            card.innerHTML = `
                <div class="card-img-box">
                    <span class="badge ${l.status === 'Abierto' ? 'open' : 'closed'}">${l.status}</span>
                </div>
                <div class="card-body">
                    <h3 style="margin:0;">${l.name}</h3>
                    <p style="font-size:0.75rem; color:#888;">📍 ${l.loc}</p>
                    <div class="card-foot">
                        <span>⭐ ${l.rate}</span>
                        <span style="color:#888; font-weight:500;">⏱️ ${l.dist}</span>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
    }
});