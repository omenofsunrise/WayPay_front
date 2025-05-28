import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useProducts from '../../../api/hooks/useProducts';
import Portal from '../../../utils/Portal';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  markup: number;
  totalPrice: number;
}

interface ProductsTableProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
}

const ProductsTable = ({ products, onProductsChange }: ProductsTableProps) => {
  const { data: productsData, getProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (products.length === 0) {
      addNewRow();
    }
  }, []);

  useEffect(() => {
    getProducts({ name: searchTerm });
  }, [searchTerm, getProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateMenuPosition = (id: number) => {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1 && inputRefs.current[index]) {
      const rect = inputRefs.current[index]!.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const addNewRow = () => {
    const newProduct: Product = {
      id: Date.now(),
      name: '',
      price: 0,
      quantity: 1,
      markup: 0,
      totalPrice: 0
    };
    onProductsChange([...products, newProduct]);
  };

  const handleInputChange = (id: number, field: keyof Product, value: string) => {
    const updatedProducts = products.map(product => {
      if (product.id === id) {
        const updatedProduct = {
          ...product,
          [field]: field === 'name' ? value : Number(value) || 0
        };
        
        if (['price', 'quantity', 'markup'].includes(field)) {
          updatedProduct.totalPrice = updatedProduct.price * updatedProduct.quantity * (1 + updatedProduct.markup / 100);
        }
        
        return updatedProduct;
      }
      return product;
    });

    onProductsChange(updatedProducts);

    const editedProduct = updatedProducts.find(p => p.id === id);
    if (editedProduct && id === products[products.length - 1].id) {
      const isNotEmpty = editedProduct.name.trim() !== '' || 
                        editedProduct.price > 0 || 
                        editedProduct.quantity > 1 || 
                        editedProduct.markup > 0;
      
      if (isNotEmpty) {
        addNewRow();
      }
    }
  };

  const handleProductSelect = (id: number, productName: string) => {
    const updatedProducts = products.map(product => {
      if (product.id === id) {
        return { ...product, name: productName };
      }
      return product;
    });
    
    onProductsChange(updatedProducts);
    setActiveDropdown(null);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      const currentIndex = products.findIndex(product => product.id === id);
      if (currentIndex === products.length - 1) {
        addNewRow();
      }
    }
  };

  const filteredProducts = productsData?.items || [];

  return (
    <TableContainer>
      <StyledTable>
        <TableHeader>
          <TableRow>
            <HeaderCell>№</HeaderCell>
            <HeaderCell>Название</HeaderCell>
            <HeaderCell>Стоимость</HeaderCell>
            <HeaderCell>Количество</HeaderCell>
            <HeaderCell>Надбавка</HeaderCell>
            <HeaderCell>Цена</HeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {products.map((product, index) => (
              <TableRow 
                key={product.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <BodyCell>{index + 1}</BodyCell>
                <BodyCell>
                  <NameCellContainer>
                    <NameInput
                      ref={(el: HTMLInputElement | null) => {
                        if (el) {
                          inputRefs.current[index] = el;
                        }
                      }}
                      type="text"
                      value={product.name}
                      onChange={(e) => {
                        handleInputChange(product.id, 'name', e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                      onFocus={() => {
                        setActiveDropdown(product.id);
                        updateMenuPosition(product.id);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, product.id)}
                      placeholder="Введите название"
                    />
                    <AnimatePresence>
                     {activeDropdown === product.id && (
                      <Portal>
                        <DropdownMenu
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          ref={dropdownRef}
                          style={{
                            position: 'absolute',
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            width: `${menuPosition.width}px`
                          }}
                        >
                            {filteredProducts.map((item) => (
                              <DropdownItem
                                key={item.id}
                                onClick={() => handleProductSelect(
                                  product.id, 
                                  item.name
                                )}
                              >
                                {item.name}
                              </DropdownItem>
                            ))}
                            {filteredProducts.length === 0 && (
                              <DropdownEmpty>Товары не найдены</DropdownEmpty>
                            )}
                          </DropdownMenu>
                        </Portal>
                      )}
                    </AnimatePresence>
                  </NameCellContainer>
                </BodyCell>
                <BodyCell>
                  <NumberInput
                    type="number"
                    value={product.price || ''}
                    onChange={(e) => handleInputChange(product.id, 'price', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, product.id)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </BodyCell>
                <BodyCell>
                  <NumberInput
                    type="number"
                    value={product.quantity || ''}
                    onChange={(e) => handleInputChange(product.id, 'quantity', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, product.id)}
                    placeholder="1"
                    min="1"
                  />
                </BodyCell>
                <BodyCell>
                  <NumberInput
                    type="number"
                    value={product.markup || ''}
                    onChange={(e) => handleInputChange(product.id, 'markup', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, product.id)}
                    placeholder="0"
                    min="0"
                  />
                </BodyCell>
                <BodyCell>{product.totalPrice.toLocaleString('ru-RU')} ₽</BodyCell>
              </TableRow>
            ))}
          </AnimatePresence>
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 16px;
  height: 250px;
  overflow: auto;
  position: relative;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
`;

const TableHeader = styled.thead`
  background-color: #f7fafc;
`;

const TableBody = styled.tbody``;

const TableRow = styled(motion.tr)`
  &:not(:last-child) {
    border-bottom: 1px solid #edf2f7;
  }
`;

const HeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  color: #4a5568;
`;

const BodyCell = styled.td`
  padding: 12px 16px;
  vertical-align: middle;
  position: relative;
  background-color: white;
  border: none;
  color: black;
`;

const NameCellContainer = styled.div`
  position: static;
`;

const NameInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  background-color: white;
  border: none;
  color: black;

  &:focus {
    outline: none;
    border-color: #3182ce;
  }
`;

const NumberInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  background-color: white;
  border: none;
  color: black;

  /* Hide number input arrows */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-color: #3182ce;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: black;
  &:hover {
    background-color: #ebf8ff;
  }
`;

const DropdownEmpty = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  color: #718096;
`;

export default ProductsTable;