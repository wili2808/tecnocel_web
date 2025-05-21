import styles from '../../styles/Layout.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p>&copy; {new Date().getFullYear()} MAC WIL. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
