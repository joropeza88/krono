# Plan de desarrollo — Krono

Krono será una PWA móvil para crear, guardar y ejecutar rutinas de intervalos de ejercicio. El objetivo del MVP es ofrecer una experiencia rápida, intuitiva y atractiva, sin cuentas ni estadísticas.

## Objetivo del MVP

Permitir que una persona cree una rutina en pocos toques, la guarde en su dispositivo y la ejecute mediante un temporizador visual con señales de audio.

### Funcionalidades incluidas

- Crear rutinas con nombre, duración de ejercicio, duración de descanso, número de ejercicios y número de ciclos.
- Guardar, editar, duplicar y eliminar rutinas en el dispositivo.
- Ejecutar rutinas con temporizador, pausa, reanudación, reinicio y finalización.
- Reproducir una señal tres segundos antes del inicio de cada ejercicio.
- Reproducir sonidos motivacionales aleatorios desde una lista.
- Ajustar el volumen y activar o desactivar sonidos.
- Instalar la aplicación y utilizarla sin conexión tras la primera carga.

### Fuera del alcance del MVP

- Cuentas de usuario y sincronización entre dispositivos.
- Estadísticas, historial o métricas de entrenamiento.
- Compras, puntos o pagos reales.

## Experiencia de usuario

La aplicación debe priorizar el uso con una mano y la lectura rápida durante el ejercicio.

```text
Inicio
 ├─ Rutinas guardadas
 │   └─ Ejecutar rutina
 └─ Crear rutina
     └─ Guardar y ejecutar

Sesión activa
 ├─ Estado: preparación, ejercicio, descanso o finalizada
 ├─ Temporizador grande
 ├─ Ejercicio y ciclo actuales
 ├─ Pausar / reanudar / finalizar
 └─ Señales y sonidos motivacionales
```

### Principios de diseño

- Diseño mobile-first, oscuro y de alto contraste.
- Cronómetro como elemento principal de la pantalla de sesión.
- Colores diferenciados para preparación, ejercicio y descanso.
- Botones grandes, alcanzables y con etiquetas claras.
- Animaciones cortas para comunicar transiciones sin distraer.
- Estados vacíos útiles y ejemplos de rutinas para el primer uso.

## Stack técnico

- Vue 3 con TypeScript y Vite.
- Tailwind CSS para el sistema visual responsive.
- Vue Router para la navegación.
- Pinia para estado de rutinas, sesión y preferencias.
- `vite-plugin-pwa` para instalación, caché y funcionamiento offline.
- `localStorage` para el MVP; migrable a IndexedDB si aumenta el volumen de datos.
- Web Audio API para precargar y reproducir sonidos con baja latencia.

## Modelo de datos inicial

```ts
type Routine = {
  id: string
  name: string
  exerciseDuration: number // segundos
  restDuration: number // segundos
  exerciseCount: number
  cycleCount: number
  createdAt: string
  updatedAt: string
}

type AudioPreferences = {
  enabled: boolean
  volume: number
  motivationalSoundsEnabled: boolean
  activeSoundPackId: string
}

type SoundPack = {
  id: string
  name: string
  sounds: string[]
  isOwned: boolean
}
```

## Motor de intervalos

La sesión se implementará como una máquina de estados para evitar transiciones ambiguas.

```text
Preparación (3 s) → Ejercicio → Descanso → siguiente ejercicio
                                      ↓
                              siguiente ciclo / finalización
```

- La cuenta regresiva debe calcularse con marcas de tiempo, no solo decrementando un contador, para reducir errores al cambiar de pestaña.
- Al pausar se conservará el tiempo restante y no se emitirán sonidos.
- A tres segundos de iniciar un ejercicio se reproducirá una señal de preparación.
- Se reproducirán señales distintas para iniciar ejercicio, iniciar descanso y completar la rutina.
- Los sonidos motivacionales se elegirán aleatoriamente sin repetir el sonido anterior de forma consecutiva.

## Fases de desarrollo

### 1. Configuración base

- Crear el proyecto con Vue 3, TypeScript y Vite.
- Configurar Tailwind, rutas, Pinia, linting y formato de código.
- Configurar manifiesto PWA, iconos y estrategia de caché inicial.
- Definir tokens visuales: colores, tipografías, espaciados, radios y sombras.

### 2. Interfaz y navegación

- Construir la pantalla de inicio y lista de rutinas.
- Crear formulario para crear y editar rutinas.
- Añadir validaciones y controles numéricos táctiles.
- Construir la pantalla de sesión centrada en el temporizador.
- Incluir estados vacíos y rutinas de ejemplo como Tabata, HIIT rápido y cardio.

### 3. Lógica de rutinas y almacenamiento

- Implementar el modelo de rutina y almacenamiento local.
- Crear operaciones de guardar, editar, duplicar y eliminar.
- Restaurar rutinas y preferencias al abrir la aplicación.

### 4. Temporizador de sesión

- Implementar la máquina de estados de preparación, ejercicio, descanso y finalización.
- Gestionar ejercicios, ciclos, pausas, reanudación, reinicio y finalización.
- Mostrar progreso de ejercicio y ciclo de forma clara.
- Añadir confirmación antes de abandonar una sesión activa.

### 5. Audio y retroalimentación

- Incorporar sonidos de cuenta regresiva, inicio, descanso y finalización.
- Precargar sonidos antes de iniciar una sesión.
- Añadir lista de motivaciones aleatorias y control de volumen.
- Añadir vibración como mejora progresiva cuando el navegador la soporte.

### 6. PWA y calidad

- Verificar instalación en Android e iOS.
- Asegurar que las pantallas y recursos esenciales estén disponibles offline.
- Crear pruebas unitarias del motor de intervalos.
- Validar manualmente pausas, cambio de pantalla, audio y finalización de ciclos.
- Revisar accesibilidad: contraste, foco, etiquetas y tamaños táctiles.

### 7. Preparación para evolución futura

Sin habilitar compras ni puntos en el MVP, se dejarán extensiones claras:

- Evento interno `routineCompleted` al finalizar una rutina.
- Catálogo desacoplado de paquetes de sonido.
- Campo `isOwned` para representar packs disponibles y adquiridos.
- Perfil local preparado para una futura moneda o puntos.
- Capa de almacenamiento desacoplada para facilitar una futura sincronización.

## Orden de prioridad

1. Base del proyecto y diseño móvil.
2. Creación y guardado local de rutinas.
3. Temporizador robusto de intervalos.
4. Señales de audio y aviso de tres segundos.
5. Instalación PWA y funcionamiento offline.
6. Pulido visual, animaciones y accesibilidad.
7. Estructura para paquetes de sonido y puntos futuros.

## Criterios de aceptación del MVP

- Una rutina puede crearse y ejecutarse sin necesidad de registro.
- Las rutinas guardadas siguen disponibles al cerrar y abrir la app.
- El temporizador completa correctamente todos los ejercicios y ciclos.
- El usuario recibe un aviso audible tres segundos antes de cada ejercicio.
- Los sonidos motivacionales son aleatorios y configurables.
- La aplicación puede instalarse y abrirse sin conexión tras su primera visita.
- La sesión es clara y operable desde un teléfono con una sola mano.
