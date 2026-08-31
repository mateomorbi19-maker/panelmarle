"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Dictado por voz: se habla y aparece el texto.
 *
 * Es el micrófono que ya tiene el navegador (la Web Speech API, la misma que
 * usa el teclado del teléfono). No sube un archivo a ningún lado nuestro ni
 * necesita una clave: el navegador escucha y devuelve texto. En Chrome ese
 * reconocimiento lo hace Google, igual que cuando se dicta en el teclado.
 *
 * POR QUÉ NO SE GUARDA EL AUDIO. Marle no quiere mandar un audio: quiere
 * escribir sin escribir. Lo que sirve para arreglar el prompt del agente es el
 * TEXTO, y guardar además el audio obligaría a escucharlo para saber qué dice.
 *
 * DOS COSAS QUE ROMPEN SI NO SE MIRAN:
 *
 * 1. El reconocimiento se corta solo. Aunque se pida `continuous`, el
 *    navegador manda `end` después de un silencio —en el iPhone, a los pocos
 *    segundos—. Si no se lo vuelve a arrancar, el dictado se muere en la
 *    primera pausa para pensar. Por eso está `queriendo`: mientras Marle no
 *    haya tocado "parar", se reengancha solo.
 *
 * 2. Firefox no lo tiene. No se puede saber en el servidor, así que la
 *    pantalla arranca creyendo que no y lo confirma al montar. Lo que NO se
 *    hace es ofrecer el botón y fallar al tocarlo.
 */

interface ResultadoDictado {
  isFinal: boolean;
  length: number;
  [i: number]: { transcript: string };
}

interface EventoDictado extends Event {
  resultIndex: number;
  results: { length: number; [i: number]: ResultadoDictado };
}

interface Reconocimiento extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventoDictado) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type ConstructorReconocimiento = new () => Reconocimiento;

/** El español que habla Marle. Cambia bastante el resultado. */
const IDIOMA = "es-AR";

/**
 * Si el navegador sabe dictar no cambia nunca durante la vida de la pestaña,
 * así que no hay a qué suscribirse. Se lee con `useSyncExternalStore` igual,
 * que es la forma de mirar algo del navegador SIN que el servidor y la
 * hidratación digan cosas distintas.
 */
function suscribirNunca(): () => void {
  return () => {};
}

function constructorDisponible(): ConstructorReconocimiento | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocimiento;
    webkitSpeechRecognition?: ConstructorReconocimiento;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface Dictado {
  /** El navegador sabe dictar. Se resuelve recién al montar. */
  soportado: boolean;
  grabando: boolean;
  /** Lo que se está escuchando y todavía no cerró: se muestra en gris. */
  parcial: string;
  segundos: number;
  /** null si viene todo bien. */
  error: string | null;
  empezar: () => void;
  parar: () => void;
}

/**
 * `onTexto` recibe cada pedazo YA CERRADO, para que quien llama lo vaya
 * pegando al final de lo que haya escrito. Así el dictado y el teclado
 * conviven: se puede dictar, corregir a mano y seguir dictando.
 */
export function useDictado(onTexto: (fragmento: string) => void): Dictado {
  // En el servidor se asume que NO: es lo único que se puede afirmar desde
  // ahí, y así el primer dibujo coincide con el de la hidratación.
  const soportado = useSyncExternalStore(
    suscribirNunca,
    () => constructorDisponible() !== null,
    () => false
  );
  const [grabando, setGrabando] = useState(false);
  const [parcial, setParcial] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const motor = useRef<Reconocimiento | null>(null);
  const queriendo = useRef(false);
  // En un ref para que reenganchar el reconocimiento no dependa de volver a
  // crear los callbacks: si `onTexto` cambia de identidad en cada render, el
  // motor se reiniciaría solo y se comería palabras.
  const alTexto = useRef(onTexto);
  useEffect(() => {
    alTexto.current = onTexto;
  });

  // Soltar el micrófono al salir de la pantalla. Sin esto el teléfono queda
  // con la lucecita de "escuchando" prendida.
  useEffect(() => {
    return () => {
      queriendo.current = false;
      motor.current?.abort();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    if (!grabando) return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [grabando]);

  const parar = useCallback(() => {
    queriendo.current = false;
    setGrabando(false);
    setParcial("");
    motor.current?.stop();
  }, []);

  const empezar = useCallback(() => {
    const Motor = constructorDisponible();
    if (!Motor) {
      setError("Este navegador no sabe dictar. Escribilo a mano.");
      return;
    }

    const rec = new Motor();
    rec.lang = IDIOMA;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let cerrado = "";
      let enVuelo = "";
      // Desde `resultIndex`: lo anterior ya se entregó y volver a leerlo
      // duplicaría media frase.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const resultado = e.results[i];
        const texto = resultado[0]?.transcript ?? "";
        if (resultado.isFinal) cerrado += texto;
        else enVuelo += texto;
      }
      setParcial(enVuelo);
      if (cerrado.trim()) alTexto.current(cerrado.trim());
    };

    rec.onerror = (e) => {
      const cual = e.error;
      // "no-speech" es un silencio largo y "aborted" somos nosotros parando:
      // ninguno de los dos es un problema que haya que contarle a nadie.
      if (cual === "no-speech" || cual === "aborted") return;
      if (cual === "not-allowed" || cual === "service-not-allowed") {
        queriendo.current = false;
        setGrabando(false);
        setError(
          "No pude usar el micrófono. Fijate que el navegador tenga permiso."
        );
        return;
      }
      setError("Se cortó el dictado. Probá de nuevo.");
    };

    rec.onend = () => {
      // Se cortó solo (silencio) pero Marle sigue dictando: se reengancha.
      if (!queriendo.current) {
        setGrabando(false);
        setParcial("");
        return;
      }
      try {
        rec.start();
      } catch {
        queriendo.current = false;
        setGrabando(false);
        setParcial("");
      }
    };

    motor.current = rec;
    queriendo.current = true;
    setError(null);
    setParcial("");
    setSegundos(0);
    try {
      rec.start();
      setGrabando(true);
    } catch {
      queriendo.current = false;
      setError("No se pudo abrir el micrófono. Probá de nuevo.");
    }
  }, []);

  return { soportado, grabando, parcial, segundos, error, empezar, parar };
}
