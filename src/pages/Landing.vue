<script setup lang="ts">
import { IonIcon } from "@ionic/vue";
import { logoAndroid, logoApple } from "ionicons/icons";
import { onBeforeUnmount, onMounted } from "vue";

let scrollAnimationFrame: number | undefined;

function scrollToSection(section: HTMLElement) {
  if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);

  const scrollRoot = document.scrollingElement ?? document.documentElement;
  const start = scrollRoot.scrollTop || window.scrollY || document.body.scrollTop;
  const target = section.getBoundingClientRect().top + start;
  const distance = target - start;
  const duration = Math.min(700, Math.max(300, Math.abs(distance) * 0.35));
  const startedAt = performance.now();

  function animate(now: number) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 4);
    const position = start + distance * easedProgress;

    scrollRoot.scrollTop = position;
    document.body.scrollTop = position;

    if (progress < 1) scrollAnimationFrame = requestAnimationFrame(animate);
  }

  scrollAnimationFrame = requestAnimationFrame(animate);
}

function handleAnchorClick(event: MouseEvent) {
  const source = event.target;
  if (!(source instanceof Element)) return;

  const anchor = source.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!anchor?.hash) return;

  const section = document.getElementById(anchor.hash.slice(1));
  if (!section) return;

  event.preventDefault();
  window.history.pushState(null, "", anchor.hash);
  scrollToSection(section);
}

onMounted(() => {
  document.documentElement.classList.add("landing-mode");
  document.body.classList.add("landing-mode");
  document.addEventListener("click", handleAnchorClick);
});

onBeforeUnmount(() => {
  if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
  document.documentElement.classList.remove("landing-mode");
  document.body.classList.remove("landing-mode");
  document.removeEventListener("click", handleAnchorClick);
});
</script>

<template>
  <main class="landing-page">
    <header class="landing-header">
      <a class="landing-brand" href="#inicio" aria-label="Krono, inicio">kron<i>o</i></a>
      <a class="landing-header-cta" href="#instalar">Instalar</a>
    </header>

    <section id="inicio" class="landing-hero">
      <div class="landing-hero-copy">
        <p class="landing-kicker"><span></span> Tu ritmo, tus reglas</p>
        <h1>Entrena con<br /><em>intención.</em></h1>
        <p class="landing-lede">
          Krono marca cada bloque, cada descanso y cada avance para que tú solo tengas que moverte.
        </p>
        <div class="landing-actions">
          <a class="landing-button landing-button-primary" href="#instalar"
            >Instalar Krono <span>↓</span></a
          >
          <a class="landing-text-link" href="#como-funciona"
            >Descubre cómo funciona <span>→</span></a
          >
        </div>
        <p class="landing-note">Gratis · Sin cuenta · Hecha para acompañarte</p>
      </div>

      <div class="landing-phone-stage" aria-label="Vista previa de una sesión de Krono">
        <!-- Reemplaza este mockup CSS por una captura o ilustración de la app si generas una. -->
        <div class="landing-orbit landing-orbit-one"></div>
        <div class="landing-orbit landing-orbit-two"></div>
        <article class="landing-phone">
          <div class="landing-phone-speaker"></div>
          <div class="landing-phone-screen">
            <div class="landing-phone-top">
              <span>9:41</span><strong>kron<i>o</i></strong
              ><span>●●●</span>
            </div>
            <p class="landing-phone-state">A entrenar</p>
            <h2>Ejercicio 2</h2>
            <div class="landing-phone-ring">
              <div><strong>00:30</strong><span>mantén el ritmo</span></div>
            </div>
            <p class="landing-phone-meta">Ejercicio 2 de 4 · Ronda 1 de 3</p>
            <div class="landing-phone-controls">
              <button>Pausar</button><button>Reiniciar</button>
            </div>
          </div>
        </article>
        <div class="landing-float-card">
          <span>✦</span>
          <div><strong>Un ritmo para ti</strong><small>Sin mirar el reloj</small></div>
        </div>
      </div>
    </section>

    <section class="landing-proof" aria-label="Beneficios de Krono">
      <p>MENOS CÁLCULO</p>
      <span></span>
      <p>MÁS MOVIMIENTO</p>
      <span></span>
      <p>A TU RITMO</p>
    </section>

    <section class="landing-section landing-benefits">
      <div class="landing-section-intro">
        <p class="landing-kicker"><span></span> Entrenar, simplificado</p>
        <h2>Todo lo que necesitas.<br /><em>Nada que distraiga.</em></h2>
      </div>
      <div class="landing-benefit-grid">
        <article class="landing-benefit landing-benefit-featured">
          <span class="landing-benefit-icon">◷</span>
          <h3>El tiempo te acompaña</h3>
          <p>Configura trabajo, descanso y rondas. Krono sostiene el ritmo por ti.</p>
          <div class="landing-mini-ring"><span>30s</span></div>
        </article>
        <article class="landing-benefit">
          <span class="landing-benefit-icon">⌁</span>
          <h3>Sin interrupciones</h3>
          <p>La pantalla se mantiene activa mientras entrenas y el sonido avisa cada cambio.</p>
        </article>
        <article class="landing-benefit">
          <span class="landing-benefit-icon">✦</span>
          <h3>Hecho a tu medida</h3>
          <p>Guarda tus rutinas o usa el cronómetro cuando solo quieres empezar a moverte.</p>
        </article>
      </div>
    </section>

    <section id="como-funciona" class="landing-section landing-flow">
      <div class="landing-section-intro">
        <p class="landing-kicker"><span></span> En tres pasos</p>
        <h2>De la intención<br />a la <em>acción.</em></h2>
      </div>
      <ol class="landing-steps">
        <li>
          <span>01</span>
          <div>
            <h3>Crea tu ritmo</h3>
            <p>Elige duración de trabajo, descanso y rondas.</p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <h3>Presiona iniciar</h3>
            <p>Las señales visuales y de audio se ocupan del tiempo.</p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <h3>Quédate en movimiento</h3>
            <p>Concéntrate en tu cuerpo, no en contar segundos.</p>
          </div>
        </li>
      </ol>
    </section>

    <section id="instalar" class="landing-install">
      <div class="landing-install-intro">
        <p class="landing-kicker"><span></span> Llévala contigo</p>
        <h2>Instala Krono<br />en tu inicio.</h2>
        <p>Úsala como una app: pantalla completa, siempre lista para tu próxima sesión.</p>
      </div>
      <div class="landing-install-grid">
        <article class="landing-install-card">
          <IonIcon class="landing-platform-icon" :icon="logoApple" aria-hidden="true" />
          <p class="landing-platform">iPhone / iPad</p>
          <h3>Instala desde Safari</h3>
          <ol>
            <li>
              <span>1</span>
              <p>Toca Compartir <b>□↑</b>.</p>
            </li>
            <li>
              <span>2</span>
              <p>Elige <strong>Agregar a inicio</strong>.</p>
            </li>
          </ol>
        </article>
        <article class="landing-install-card">
          <IonIcon class="landing-platform-icon" :icon="logoAndroid" aria-hidden="true" />
          <p class="landing-platform">Android</p>
          <h3>Instala desde Chrome</h3>
          <ol>
            <li>
              <span>1</span>
              <p>Toca el menú <b>⋮</b>.</p>
            </li>
            <li>
              <span>2</span>
              <p>Elige <strong>Instalar app</strong>.</p>
            </li>
          </ol>
        </article>
      </div>
      <a class="landing-button landing-button-primary landing-install-button" href="#inicio"
        >Volver al inicio <span>↑</span></a
      >
    </section>

    <footer class="landing-footer">
      <a class="landing-brand" href="#inicio">kron<i>o</i></a>
      <p>Tu ritmo, tus reglas.</p>
    </footer>
  </main>
</template>
