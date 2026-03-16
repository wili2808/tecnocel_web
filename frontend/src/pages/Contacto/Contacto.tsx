import React from 'react';
import ContactForm from '../../components/contact/ContactForm';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import ContactMethods from '../../components/contact/ContactMethods';
import LocationSection from '../../components/location/LocationSection';
import styles from './Contacto.module.css';

/**
 * Página de Contacto
 *
 * Página completa de contacto con formulario, métodos alternativos
 * de contacto y mapa de ubicación.
 *
 * @component
 */
const Contacto: React.FC = () => {
    // Handler para éxito en el envío del formulario
    const handleFormSuccess = () => {
        console.log('Formulario enviado exitosamente');
        // Aquí podrías agregar lógica adicional como scroll to top, analytics, etc.
    };

    return (
        <div className={styles.contactoPage}>
            <PageMeta
                title="Contacto"
                description="Contactate con TecnoCel. Respondemos en menos de 24 horas hábiles. Lunes a viernes 9–20 hs, sábados 9–13 hs."
                url="/contacto"
            />
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContainer}>
                        <h1 className={styles.heroTitle}>Hablanos</h1>
                        <p className={styles.heroSubtitle}>
                            ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para ti
                        </p>
                </div>
            </section>

            {/* Main Content - Form + Methods */}
            <section className={styles.mainContent}>
                <div className={styles.container}>
                    <div className={styles.contentGrid}>
                        {/* Formulario de contacto */}
                        <div className={styles.formWrapper}>
                            <ContactForm onSubmitSuccess={handleFormSuccess} />
                        </div>

                        {/* Métodos de contacto alternativos */}
                        <div className={styles.methodsWrapper}>
                            <ContactMethods />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className={styles.faqSection}>
                <div className={styles.container}>
                    <div className={styles.faqHeader}>
                        <h2 className={styles.faqTitle}>Preguntas Frecuentes</h2>
                        <p className={styles.faqSubtitle}>
                            Encuentra respuestas rápidas a las preguntas más comunes
                        </p>
                    </div>

                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>
                                ¿Cuál es el horario de atención?
                            </h3>
                            <p className={styles.faqAnswer}>
                                Nuestro horario de atención es de Lunes a Viernes de 9:00 a 20:00hs
                                y los Sábados de 9:00 a 13:00hs. Domingos y feriados cerrado.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>
                                ¿Dónde están ubicados?
                            </h3>
                            <p className={styles.faqAnswer}>
                                Estamos ubicados en Resistencia, Chaco, Argentina. Puedes encontrar
                                nuestra ubicación exacta en el mapa más abajo.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>
                                ¿Cuánto tiempo tardan en responder?
                            </h3>
                            <p className={styles.faqAnswer}>
                                Respondemos todos los mensajes dentro de las 24 horas hábiles. Por
                                WhatsApp la respuesta suele ser más rápida.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>
                                ¿Hacen envíos?
                            </h3>
                            <p className={styles.faqAnswer}>
                                Sí, realizamos envíos a todo el país. Los costos y tiempos de entrega
                                varían según la ubicación. Consúltanos para más detalles.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>
                                ¿Aceptan todos los medios de pago?
                            </h3>
                            <p className={styles.faqAnswer}>
                                Aceptamos efectivo, transferencia bancaria, Mercado Pago y las
                                principales tarjetas de crédito y débito.
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3 className={styles.faqQuestion}>
                                ¿Ofrecen garantía en los productos?
                            </h3>
                            <p className={styles.faqAnswer}>
                                Todos nuestros productos cuentan con garantía oficial. La duración
                                varía según el fabricante, generalmente entre 6 meses y 1 año.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <LocationSection
                title="Nuestra Ubicación"
                subtitle="Visítanos en nuestra tienda física"
                showContactInfo={true}
            />
        </div>
    );
};

export default Contacto;
