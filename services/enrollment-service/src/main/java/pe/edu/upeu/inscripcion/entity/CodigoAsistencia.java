package pe.edu.upeu.inscripcion.entity;

import java.security.SecureRandom;

/** Genera códigos de asistencia legibles, p. ej. "UEP-7KQ2-M9XA" (sin 0/O ni 1/I para evitar confusiones). */
public final class CodigoAsistencia {

    private static final char[] ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private CodigoAsistencia() {
    }

    public static String generar() {
        StringBuilder sb = new StringBuilder("UEP-");
        for (int i = 0; i < 8; i++) {
            if (i == 4) sb.append('-');
            sb.append(ALFABETO[RANDOM.nextInt(ALFABETO.length)]);
        }
        return sb.toString();
    }

    /** Normaliza lo que escribe o escanea el organizador: mayúsculas y sin espacios. */
    public static String normalizar(String codigo) {
        return codigo == null ? "" : codigo.trim().toUpperCase().replace(" ", "");
    }
}
