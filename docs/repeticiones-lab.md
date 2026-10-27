# Laboratorio de repeticiones

El acceso temporal está en **Rutinas → Probar contador con cámara**. La rutina de esta fase no se guarda ni se edita: son 15 repeticiones, 20 segundos de descanso y 3 rondas. Se puede elegir Sentadillas o Jumping jacks para probar los dos detectores.

## Funcionamiento y privacidad

La cámara, la detección de pose y el conteo ocurren en el navegador. No se guarda ni se transmite vídeo, imágenes o métricas. El modelo `pose_landmarker_lite.task` y el runtime WASM se sirven desde `public/models` y `public/mediapipe`; proceden de MediaPipe Tasks Vision (Apache-2.0). Se cargan solamente al abrir el laboratorio y el service worker los conserva en caché después de su primera carga correcta.

En iPhone y otros navegadores, la cámara requiere HTTPS (o localhost) y el permiso explícito. Al volver de la vista se cierran sus tracks.

## Ajustar o añadir ejercicios

- Declara el ejercicio en `ExerciseCatalog.ts`.
- Añade un detector que implemente `ExerciseDetector` en `detectors.ts` y entrégalo desde `createDetector`.
- Cada detector devuelve `initial`, `contracted` o `tracking-lost`; el contador solo suma el ciclo `initial → contracted → initial`, con confirmación y antirrebote.
- Ajusta los umbrales con pruebas físicas reales. Los actuales son puntos de inicio, no criterios biomecánicos ni una garantía de precisión.

## Validación pendiente en dispositivo físico

La compilación valida tipos y empaquetado. Aún se debe probar en iPhone/Safari/PWA instalada: permiso de cámara, conteo de ambos ejercicios, pausa, transiciones de descanso, ocultar depuración, liberación de cámara al salir y reapertura offline tras la primera descarga. La pantalla muestra FPS, milisegundos por inferencia y pérdidas de seguimiento para esa evaluación.
