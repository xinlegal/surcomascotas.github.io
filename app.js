const CONFIG = window.SURCO_MASCOTAS_CONFIG || {};
const adminWhatsApp = String(CONFIG.whatsappAdmin || "").replace(/\D/g, "");

const pets = [
  {
    id: 1,
    type: "Perdida",
    name: "Luna",
    species: "Perro",
    zone: "Chacarilla",
    date: "2026-09-08",
    description: "Perrita pequeña, blanca, con collar rosado. Ejemplo de publicación.",
    emoji: "🐕"
  },
  {
    id: 2,
    type: "Perdida",
    name: "Max",
    species: "Perro",
    zone: "Surco Pueblo",
    date: "2026-09-07",
    description: "Mediano, pelaje marrón. Ejemplo de publicación.",
    emoji: "🐶"
  },
  {
    id: 3,
    type: "Encontrada",
    name: "Sin nombre",
    species: "Gato",
    zone: "Higuereta",
    date: "2026-09-09",
    description: "Gatito encontrado cerca de un parque. Ejemplo de publicación.",
    emoji: "🐈"
  },
  {
    id: 4,
    type: "Adopción",
    name: "Milo",
    species: "Gato",
    zone: "Monterrico",
    date: "2026-09-06",
    description: "Cariñoso y sociable. Busca adopción responsable.",
    emoji: "🐱"
  }
];

const els = {
  lost: document.getElementById("lostCards"),
  found: document.getElementById("foundCards"),
  adoption: document.getElementById("adoptionCards"),
  search: document.getElementById("searchInput"),
  zone: document.getElementById("zoneFilter"),
  modal: document.getElementById("publishModal"),
  formType: document.getElementById("formType")
};

function badgeClass(type) {
  if (type === "Perdida") return "lost";
  if (type === "Encontrada") return "found";
  return "adoption";
}

function cardTemplate(pet) {
  const shareText = encodeURIComponent(
    `🐾 ${pet.type.toUpperCase()} - ${pet.name}\n` +
    `📍 ${pet.zone}\n📅 ${pet.date}\n` +
    `${pet.description}\n\nAyúdanos compartiendo este aviso de Surco Mascotas.`
  );
  return `
    <article class="pet-card">
      <div class="pet-photo">${pet.emoji}</div>
      <div class="pet-body">
        <span class="badge ${badgeClass(pet.type)}">${pet.type}</span>
        <h3>${pet.name}</h3>
        <div class="meta">📍 ${pet.zone}<br>📅 ${pet.date}<br>🐾 ${pet.species}</div>
        <p>${pet.description}</p>
        <div class="card-actions">
          <button class="btn btn-dark" onclick="window.open('https://wa.me/?text=${shareText}', '_blank')">Compartir</button>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const q = (els.search.value || "").toLowerCase().trim();
  const zone = els.zone.value;

  const filtered = pets.filter(p => {
    const hay = `${p.name} ${p.species} ${p.zone} ${p.description}`.toLowerCase();
    return (!q || hay.includes(q)) && (!zone || p.zone === zone);
  });

  els.lost.innerHTML = filtered.filter(p => p.type === "Perdida").map(cardTemplate).join("") || "<p>No hay resultados.</p>";
  els.found.innerHTML = filtered.filter(p => p.type === "Encontrada").map(cardTemplate).join("") || "<p>No hay resultados.</p>";
  els.adoption.innerHTML = filtered.filter(p => p.type === "Adopción").map(cardTemplate).join("") || "<p>No hay resultados.</p>";

  document.getElementById("statLost").textContent = pets.filter(p => p.type === "Perdida").length;
  document.getElementById("statFound").textContent = pets.filter(p => p.type === "Encontrada").length;
  document.getElementById("statAdopt").textContent = pets.filter(p => p.type === "Adopción").length;
}

els.search.addEventListener("input", render);
els.zone.addEventListener("change", render);

document.querySelectorAll("[data-open-form]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.type) els.formType.value = btn.dataset.type;
    els.modal.classList.add("open");
    els.modal.setAttribute("aria-hidden", "false");
  });
});

document.querySelectorAll("[data-close-form]").forEach(btn => {
  btn.addEventListener("click", () => {
    els.modal.classList.remove("open");
    els.modal.setAttribute("aria-hidden", "true");
  });
});

document.getElementById("publishForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!adminWhatsApp || adminWhatsApp === "51999999999") {
    alert("Antes de publicar la web, coloca el WhatsApp del administrador en config.js.");
    return;
  }

  const type = document.getElementById("formType").value;
  const name = document.getElementById("petName").value.trim();
  const species = document.getElementById("species").value;
  const zone = document.getElementById("petZone").value.trim();
  const date = document.getElementById("petDate").value;
  const description = document.getElementById("petDescription").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();

  const message =
`🐾 SOLICITUD DE PUBLICACIÓN - SURCO MASCOTAS

Tipo: ${type}
Nombre: ${name}
Especie: ${species}
Zona: ${zone}
Fecha: ${date}
Descripción: ${description}
Contacto: ${phone}

La publicación es gratuita y queda sujeta a revisión antes de aparecer en la web.`;

  window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`, "_blank");
});

document.querySelectorAll("[data-product]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!adminWhatsApp || adminWhatsApp === "51999999999") {
      alert("Configura el WhatsApp del administrador en config.js.");
      return;
    }
    const product = btn.dataset.product;
    const msg = encodeURIComponent(`Hola. Vi ${product} en Surco Mascotas y deseo más información.`);
    window.open(`https://wa.me/${adminWhatsApp}?text=${msg}`, "_blank");
  });
});

document.getElementById("facebookLink").href = CONFIG.facebookUrl || "#";
document.getElementById("whatsappLink").href = adminWhatsApp ? `https://wa.me/${adminWhatsApp}` : "#";

render();
