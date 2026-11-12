package pe.edu.upeu.auth.exception;

/**
 * Datos válidos en forma pero rechazados por una regla de negocio (responde 400).
 * Se usa, por ejemplo, cuando la contraseña actual no coincide: no es un 401 porque
 * el usuario sí está autenticado, y un 401 haría que el frontend cierre la sesión.
 */
public class SolicitudInvalidaException extends RuntimeException {
    public SolicitudInvalidaException(String message) {
        super(message);
    }
}
