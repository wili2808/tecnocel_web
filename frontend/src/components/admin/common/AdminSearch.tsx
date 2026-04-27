import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import styles from './AdminSearch.module.css';

interface AdminSearchProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

const AdminSearch: React.FC<AdminSearchProps> = ({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  delay = 500,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, delay);

  // Sync internal state if external value changes (e.g. clearing filters)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Trigger onChange only when debounced value changes
  useEffect(() => {
    // Evita disparar el onChange si el valor no ha cambiado
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]); 

  const handleClear = () => {
    setInputValue('');
    onChange(''); 
  };

  return (
    <div className={`${styles.searchWrapper} ${className}`}>
      <span className={`material-icons ${styles.searchIcon}`}>search</span>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {inputValue && (
        <button 
          className={styles.clearBtn} 
          onClick={handleClear}
          title="Borrar búsqueda"
        >
          <span className="material-icons">close</span>
        </button>
      )}
    </div>
  );
};

export default AdminSearch;
