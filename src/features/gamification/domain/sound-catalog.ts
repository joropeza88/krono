import type { SoundPack } from "./types";

/**
 * Catálogo estático de packs. Solo `available: true` puede mostrarse, comprarse
 * o equiparse. Al añadir un pack, colocar antes sus tres MP3 en public/sounds/<id>/
 * y cambiarlo a disponible en este único archivo.
 */
export const soundCatalog: readonly SoundPack[] = [
  {
    id: "default",
    name: "Clásico",
    description: "Las señales originales de Krono.",
    pricePoints: 0,
    free: true,
    available: true,
    sounds: {
      countdown: "/sounds/default/get_ready.mp3",
      exercise: "/sounds/default/start.mp3",
      rest: "/sounds/default/rest.mp3",
    },
  },
  {
    id: "pulso-prueba",
    name: "Pulso · prueba",
    description: "Pack temporal para probar la tienda y el desbloqueo.",
    pricePoints: 30,
    free: false,
    available: true,
    // Reutiliza los audios existentes; sustituir estas rutas al publicar un pack real.
    sounds: {
      countdown: "/sounds/default/get_ready.mp3",
      exercise: "/sounds/default/start.mp3",
      rest: "/sounds/default/rest.mp3",
    },
  },
  // Plantilla para futuros packs. No activar hasta que los tres archivos existan.
  // {
  //   id: "arcade",
  //   name: "Arcade",
  //   description: "Señales con energía retro.",
  //   pricePoints: 1200,
  //   free: false,
  //   available: false,
  //   sounds: {
  //     countdown: "/sounds/arcade/get_ready.mp3",
  //     exercise: "/sounds/arcade/start.mp3",
  //     rest: "/sounds/arcade/rest.mp3",
  //   },
  // },
];

export function getSoundPack(packId: string) {
  return soundCatalog.find((pack) => pack.id === packId && pack.available);
}

export function getAvailableSoundPacks() {
  return soundCatalog.filter((pack) => pack.available);
}
