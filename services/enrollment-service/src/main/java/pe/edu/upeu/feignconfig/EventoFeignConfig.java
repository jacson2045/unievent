package pe.edu.upeu.feignconfig;

import feign.RetryableException;
import feign.Retryer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class EventoFeignConfig {

    private static final Logger log =
            LoggerFactory.getLogger(EventoFeignConfig.class);

    private static class LoggingRetryer implements Retryer {

        private final Retryer delegate;
        private int attemptNumber = 1;

        LoggingRetryer() {
            this(new Retryer.Default(
                    100,
                    TimeUnit.SECONDS.toMillis(1),
                    2
            ));
        }

        private LoggingRetryer(Retryer delegate) {
            this.delegate = delegate;
        }

        @Override
        public void continueOrPropagate(RetryableException exception) {

            if (attemptNumber < 2) {
                log.warn(
                    "RETRY Feign event-service: ejecutando intento {} de 2. Causa: {}",
                    attemptNumber + 1,
                    exception.getMessage()
                );

                attemptNumber++;
            } else {
                log.error(
                    "RETRY Feign event-service: se agotaron los 2 intentos.",
                    exception
                );
            }

            delegate.continueOrPropagate(exception);
        }

        @Override
        public Retryer clone() {
            return new LoggingRetryer(delegate.clone());
        }
    }

    @Bean
    public Retryer feignRetryer() {
        return new LoggingRetryer();
    }
}