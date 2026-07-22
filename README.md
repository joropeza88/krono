# Krono

Una PWA móvil para crear y ejecutar rutinas de ejercicio por intervalos. Krono elimina lo innecesario: crea tu rutina, inicia el temporizador y sigue el ritmo.

## Características

- Crea rutinas con duración de ejercicio, descanso, ejercicios y ciclos.
- Guarda, edita, duplica o elimina tus rutinas directamente en el dispositivo.
- Ejecuta sesiones con un temporizador claro, pausa, reinicio y finalización.
- Recibe una señal tres segundos antes de cada ejercicio.
- Activa sonidos motivacionales aleatorios durante tu entrenamiento.
- Configura volumen y sonidos desde los ajustes.
- Instálala como PWA y úsala sin conexión después de la primera visita.

Krono no requiere cuenta y no recopila estadísticas: tus rutinas y preferencias permanecen en tu navegador.

## Tecnologías

- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- Web Audio API
- Service Worker y Web App Manifest

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Para crear una versión de producción:

```bash
npm run build
```

## Uso

1. Pulsa **Crear rutina**.
2. Define los segundos de ejercicio y descanso, ejercicios y ciclos.
3. Guarda la rutina o elige **Guardar y empezar**.
4. Durante la sesión, Krono indicará la preparación, el ejercicio y el descanso mediante colores y sonidos.

## Evolución prevista

La estructura de audio está preparada para incorporar en el futuro paquetes de sonidos o personajes. También se contempla un sistema opcional de puntos por rutinas completadas, sin formar parte de la primera versión.

## Licencia

Proyecto personal. Todos los derechos reservados.
