const CONFIG = window.SURCO_MASCOTAS_CONFIG || {};
const adminWhatsApp = String(CONFIG.whatsappAdmin || "").replace(/\D/g, "");
const supabaseClient = (window.supabase && CONFIG.supabaseUrl && CONFIG.supabaseKey)
  ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey)
  : null;

let pets = [];

const els = {
  lost: document.getElementById("lostCards"),
  found: document.getElementById("foundCards"),
  adoption: document.getElementById("adoptionCards"),
  search: document.getElementById("searchInput"),
  zone: document.getElementById("zoneFilter"),
  modal: document.getElementById("publishModal"),
  formType: document.getElementById("formType"),
  publishStatus: document.getElementById("publishStatus"),
  publishSubmit: document.getElementById("publishSubmit")
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
  const photo = pet.photo_url
    ? `<img src="${pet.photo_url}" alt="${pet.name}" loading="lazy" style="width:100%;height:220px;object-fit:cover;display:block;">`
    : (pet.species === "Gato" ? "🐈" : "🐶");

  return `
    <article class="pet-card">
      <div class="pet-photo">${photo}</div>
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

async function loadApprovedPets() {
  if (!supabaseClient) {
    render();
    return;
  }
  const { data, error } = await supabaseClient
    .from("mascotas_publicaciones")
    .select("id,tipo,nombre,especie,zona,fecha,descripcion,telefono,foto_url,estado,creado_en")
    .eq("estado", "Aprobado")
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error al cargar publicaciones:", error);
    pets = [];
  } else {
    pets = (data || []).map(row => ({
      id: row.id,
      type: row.tipo,
      name: row.nombre,
      species: row.especie,
      zone: row.zona,
      date: row.fecha,
      description: row.descripcion,
      phone: row.telefono,
      photo_url: row.foto_url
    }));
  }
  render();
}

els.search.addEventListener("input", render);
els.zone.addEventListener("change", render);

document.querySelectorAll("[data-open-form]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.type) els.formType.value = btn.dataset.type;
    els.publishStatus.textContent = "";
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

document.getElementById("publishForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!supabaseClient) {
    alert("La conexión con la base de datos aún no está disponible.");
    return;
  }

  const type = document.getElementById("formType").value;
  const name = document.getElementById("petName").value.trim();
  const species = document.getElementById("species").value;
  const zone = document.getElementById("petZone").value.trim();
  const date = document.getElementById("petDate").value;
  const description = document.getElementById("petDescription").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const photoInput = document.getElementById("petPhoto");
  const file = photoInput.files[0];

  if (!file) {
    alert("Selecciona una foto de la mascota.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("La foto no debe superar los 5 MB.");
    return;
  }

  els.publishSubmit.disabled = true;
  els.publishSubmit.textContent = "Enviando...";
  els.publishStatus.textContent = "Subiendo foto y registrando publicación...";

  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg","jpeg","png","webp"].includes(ext) ? ext : "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
    const filePath = `pendientes/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("mascotas")
      .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseClient.storage.from("mascotas").getPublicUrl(filePath);
    const photoUrl = publicData.publicUrl;

    const { error: insertError } = await supabaseClient
      .from("mascotas_publicaciones")
      .insert({
        tipo: type,
        nombre: name,
        especie: species,
        zona: zone,
        fecha: date,
        descripcion: description,
        telefono: phone,
        foto_url: photoUrl,
        estado: "Pendiente"
      });
    if (insertError) throw insertError;

    els.publishStatus.textContent = "✅ Tu publicación fue enviada correctamente y está pendiente de aprobación.";
    document.getElementById("publishForm").reset();
    setTimeout(() => {
      els.modal.classList.remove("open");
      els.modal.setAttribute("aria-hidden", "true");
    }, 1800);
  } catch (err) {
    console.error(err);
    els.publishStatus.textContent = `❌ No se pudo enviar la publicación: ${err.message || "error inesperado"}`;
  } finally {
    els.publishSubmit.disabled = false;
    els.publishSubmit.textContent = "Enviar para aprobación";
  }
});

document.querySelectorAll("[data-product]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!adminWhatsApp) return;
    const product = btn.dataset.product;
    const msg = encodeURIComponent(`Hola. Vi ${product} en Surco Mascotas y deseo más información.`);
    window.open(`https://wa.me/${adminWhatsApp}?text=${msg}`, "_blank");
  });
});

document.getElementById("facebookLink").href = CONFIG.facebookUrl || "#";
document.getElementById("whatsappLink").href = adminWhatsApp ? `https://wa.me/${adminWhatsApp}` : "#";

loadApprovedPets();
