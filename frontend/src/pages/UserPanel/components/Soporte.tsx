/**
 * Componente Soporte - Centro de ayuda y soporte al usuario
 * FAQ, información de contacto y enlaces útiles
 */
import { useState } from 'react';
import styles from './Soporte.module.css';

interface FAQItem {
    pregunta: string;
    respuesta: string;
}

const faqData: FAQItem[] = [
    {
        pregunta: '¿Cómo puedo rastrear mi pedido?',
        respuesta: 'Puedes rastrear tu pedido desde la sección "Mis Compras" en tu panel de usuario. Allí encontrarás el número de seguimiento y el estado actual de tu pedido.'
    },
    {
        pregunta: '¿Cuáles son los métodos de pago disponibles?',
        respuesta: 'Aceptamos transferencias bancarias, pagos con tarjeta de crédito/débito, y pago contra entrega en ciertas zonas. Los métodos disponibles se mostrarán durante el proceso de compra.'
    },
    {
        pregunta: '¿Cuánto tiempo tarda el envío?',
        respuesta: 'Los tiempos de envío varían según tu ubicación. Generalmente, los pedidos se entregan entre 3 a 7 días hábiles dentro del área metropolitana, y hasta 15 días en áreas rurales.'
    },
    {
        pregunta: '¿Puedo devolver un producto?',
        respuesta: 'Sí, aceptamos devoluciones dentro de los 30 días posteriores a la compra, siempre que el producto esté en su estado original y con su empaque. Revisa nuestra política de devoluciones para más detalles.'
    },
    {
        pregunta: '¿Cómo actualizo mi información personal?',
        respuesta: 'Puedes actualizar tu información personal desde la sección "Información Personal" en tu panel de usuario. Allí podrás modificar tu nombre, apellido, celular y NIT/CI.'
    },
    {
        pregunta: '¿Qué hago si olvidé mi contraseña?',
        respuesta: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones para restablecerla. Recibirás un correo con un enlace para crear una nueva contraseña.'
    },
    {
        pregunta: '¿Los productos tienen garantía?',
        respuesta: 'Sí, todos nuestros productos cuentan con garantía del fabricante. La duración varía según el tipo de producto. Consulta los detalles de garantía en la página de cada producto.'
    },
    {
        pregunta: '¿Puedo cambiar mi dirección de envío después de realizar el pedido?',
        respuesta: 'Puedes cambiar la dirección de envío solo si el pedido aún no ha sido procesado. Contáctanos inmediatamente después de realizar tu pedido si necesitas hacer cambios.'
    }
];

const Soporte = () => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Centro de Soporte</h2>
                <p className={styles.subtitle}>Estamos aquí para ayudarte</p>
            </div>

            {/* FAQ Section */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <span className="material-icons">help</span>
                    Preguntas Frecuentes
                </h3>
                <div className={styles.faqList}>
                    {faqData.map((item, index) => (
                        <div key={index} className={styles.faqItem}>
                            <button
                                className={styles.faqQuestion}
                                onClick={() => toggleFAQ(index)}
                            >
                                <span>{item.pregunta}</span>
                                <span className="material-icons">
                                    {expandedIndex === index ? 'expand_less' : 'expand_more'}
                                </span>
                            </button>
                            {expandedIndex === index && (
                                <div className={styles.faqAnswer}>
                                    <p>{item.respuesta}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Methods */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <span className="material-icons">contact_support</span>
                    Métodos de Contacto
                </h3>
                <div className={styles.contactGrid}>
                    <div className={styles.contactCard}>
                        <span className="material-icons">email</span>
                        <h4>Email</h4>
                        <p>soporte@tecnocel.com</p>
                        <p className={styles.contactDetail}>
                            Respuesta en 24-48 horas
                        </p>
                    </div>

                    <div className={styles.contactCard}>
                        <span className="material-icons">phone</span>
                        <h4>Teléfono</h4>
                        <p>+591 70123456</p>
                        <p className={styles.contactDetail}>
                            Lun-Vie: 9:00 - 18:00
                        </p>
                    </div>

                    <div className={styles.contactCard}>
                        <span className="material-icons">chat</span>
                        <h4>WhatsApp</h4>
                        <p>+591 70123456</p>
                        <a
                            href="https://wa.me/59170123456"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.contactLink}
                        >
                            Chatear ahora
                        </a>
                    </div>

                    <div className={styles.contactCard}>
                        <span className="material-icons">location_on</span>
                        <h4>Ubicación</h4>
                        <p>La Paz, Bolivia</p>
                        <p className={styles.contactDetail}>
                            Zona Sopocachi
                        </p>
                    </div>
                </div>
            </section>

            {/* Useful Links */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <span className="material-icons">link</span>
                    Enlaces Útiles
                </h3>
                <div className={styles.linksList}>
                    <a href="/terminos" className={styles.link}>
                        <span className="material-icons">description</span>
                        <span>Términos y Condiciones</span>
                        <span className="material-icons">chevron_right</span>
                    </a>
                    <a href="/privacidad" className={styles.link}>
                        <span className="material-icons">privacy_tip</span>
                        <span>Política de Privacidad</span>
                        <span className="material-icons">chevron_right</span>
                    </a>
                    <a href="/garantias" className={styles.link}>
                        <span className="material-icons">verified_user</span>
                        <span>Política de Garantías</span>
                        <span className="material-icons">chevron_right</span>
                    </a>
                    <a href="/envios" className={styles.link}>
                        <span className="material-icons">local_shipping</span>
                        <span>Información de Envíos</span>
                        <span className="material-icons">chevron_right</span>
                    </a>
                </div>
            </section>

            {/* Additional Help */}
            <div className={styles.helpBox}>
                <span className="material-icons">info</span>
                <div>
                    <h4>¿No encontraste lo que buscabas?</h4>
                    <p>
                        No dudes en contactarnos directamente. Nuestro equipo de soporte está
                        disponible para ayudarte con cualquier consulta o problema que tengas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Soporte;
