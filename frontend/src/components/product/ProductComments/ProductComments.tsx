import React from 'react';
import styles from './ProductComments.module.css';

interface ProductCommentsProps {
    productId: number;
    productName: string;
}

const ProductComments: React.FC<ProductCommentsProps> = ({ productId, productName }) => {
    return (
        <div className={styles.productComments}>
            <h3 className={styles.sectionTitle}>Comentarios y preguntas</h3>

            <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>
                    <span className="material-icons">chat_bubble_outline</span>
                </div>
                <div className={styles.placeholderContent}>
                    <h4 className={styles.placeholderTitle}>Próximamente</h4>
                    <p className={styles.placeholderText}>
                        Pronto podrás ver y hacer comentarios sobre este producto.
                        Esta funcionalidad estará disponible en una futura actualización.
                    </p>
                </div>
            </div>

            {/* Template para cuando esté implementado */}
            <div className={styles.commentsContainer} style={{ display: 'none' }}>
                <div className={styles.commentForm}>
                    <textarea
                        className={styles.commentInput}
                        placeholder={`¿Tienes alguna pregunta sobre ${productName}?`}
                        rows={3}
                    />
                    <button className={styles.submitButton} type="button">
                        <span className="material-icons">send</span>
                        Enviar comentario
                    </button>
                </div>

                <div className={styles.commentsList}>
                    {/* Aquí irán los comentarios cuando estén implementados */}
                </div>
            </div>
        </div>
    );
};

export default ProductComments; 