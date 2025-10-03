// ============================
// CONFIGURACIÓN SUPABASE
// ============================
const SUPABASE_URL = "https://yhffwujihboljvatdzit.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZmZ3dWppaGJvbGp2YXRkeml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzAyNzQsImV4cCI6MjA3NDYwNjI3NH0.hBnvIRrX-4bpMvehELN-LGfCofYYO3exoC-dhfm-n-0";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// UI INTERACTIONS
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // ---- NAV TOGGLE ----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // ---- SMOOTH SCROLL ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks.classList.contains('show')) navLinks.classList.remove('show');
      }
    });
  });

  // ---- SET YEAR ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- ENTRY ANIMATIONS ----
  const animateEls = document.querySelectorAll('.card, .title, .profile-info');
  animateEls.forEach((el, i) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(18px)';
    setTimeout(() => {
      el.style.transition = 'all 500ms cubic-bezier(.2,.9,.3,1)';
      el.style.opacity = 1;
      el.style.transform = 'translateY(0)';
    }, 120 + i * 80);
  });

  // ---- CONTACT FORM ----
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedback.textContent = '';
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const msg = form.message.value.trim();
      if (!name || !email || !msg) {
        feedback.textContent = 'Por favor completa todos los campos.';
        feedback.style.color = '#ffbaba';
        return;
      }
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email)) {
        feedback.textContent = 'Ingresa un correo válido.';
        feedback.style.color = '#ffbaba';
        return;
      }
      feedback.style.color = '#b2f5e9';
      feedback.textContent = 'Enviando mensaje...';
      setTimeout(() => {
        feedback.textContent = '¡Mensaje enviado! Te responderé pronto.';
        form.reset();
      }, 900);
    });
  }
});

// ============================
// AUTH: LOGIN & LOGOUT
// ============================

// LOGIN
async function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Error al iniciar sesión: " + error.message);
    return;
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("mainHeader").style.display = "flex";
  document.getElementById("courses").style.display = "block";

  // Mostrar rol según usuario
  if (email === "erick@gmail.com") {
    document.body.classList.add("admin");
  } else {
    document.body.classList.add("invitado");
  }
}

// LOGOUT
async function logout() {
  await supabaseClient.auth.signOut();
  document.getElementById("mainHeader").style.display = "none";
  document.getElementById("courses").style.display = "none";
  document.getElementById("login").style.display = "flex";
  document.body.classList.remove("admin", "invitado");
}

// ============================
// FILE HANDLING (CURSOS)
// ============================

async function uploadFile(course, week) {
  const fileInput = document.getElementById(`fileInput-${course}-${week}`);
  const file = fileInput.files[0];
  if (!file) return alert("Selecciona un archivo");

  const filePath = `${course}/Semana${week}/${file.name}`;
  let { error } = await supabaseClient.storage.from("cursos").upload(filePath, file, { upsert: true });

  if (error) {
    alert("Error al subir: " + error.message);
    return;
  }
  alert("Archivo subido correctamente");
  listFiles(course, week);
}

async function listFiles(course, week) {
  const { data, error } = await supabaseClient.storage.from("cursos").list(`${course}/Semana${week}`);

  const fileList = document.getElementById(`fileList-${course}-${week}`);
  fileList.innerHTML = "";

  if (error) return;

  data.forEach(file => {
    const li = document.createElement("li");
    li.textContent = file.name;

    // Botón ver/descargar
    const viewBtn = document.createElement("button");
    viewBtn.textContent = "Ver";
    viewBtn.onclick = async () => {
      const { data: urlData } = await supabaseClient.storage.from("cursos").getPublicUrl(`${course}/Semana${week}/${file.name}`);
      window.open(urlData.publicUrl, "_blank");
    };

    // Botón eliminar (solo admin)
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.onclick = async () => {
      await supabaseClient.storage.from("cursos").remove([`${course}/Semana${week}/${file.name}`]);
      listFiles(course, week);
    };

    li.appendChild(viewBtn);
    if (document.body.classList.contains("admin")) {
      li.appendChild(deleteBtn);
    }
    fileList.appendChild(li);
  });
}
