import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useProducts from '../../../api/hooks/useProducts';
import Portal from '../../../utils/Portal';
import CustomInput from '../fields/CustomInput';
import ProductSelectModal from '../../modal/CrudInherited/ProductSelectModal';
import { useAuth } from '../../../сontext/AuthContext';
import { formatMoney } from '../../../utils/formatPrice';

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
  onTotalSumChange?: (sum: number) => void;
  markupType: 'percent' | 'fixed';
  onMarkupTypeChange: (type: 'percent' | 'fixed') => void;
}

const ProductsTable = ({ products, onProductsChange, onTotalSumChange, markupType, onMarkupTypeChange }: ProductsTableProps) => {
  const { authInfo } = useAuth();
  const { data: productsData, getProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showProductSelectModal, setShowProductSelectModal] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const minMarkup = authInfo?.employee.minSurcharge || 0;

  useEffect(() => {
    if (products.length === 0) {
      const initialProducts = [
        {
          id: 1,
          name: '',
          price: 0,
          quantity: 1,
          markup: 0,
          totalPrice: 0
        },
        {
          id: 2,
          name: '',
          price: 0,
          quantity: 1,
          markup: 0,
          totalPrice: 0
        }
      ];
      onProductsChange(initialProducts);
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

  const totalSum = products.reduce((sum, product) => sum + product.totalPrice, 0);

  useEffect(() => {
    if (onTotalSumChange) {
      onTotalSumChange(totalSum);
    }
  }, [totalSum, onTotalSumChange]);

  const addNewRow = () => {
    const newProduct: Product = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name: '',
      price: 0,
      quantity: 1,
      markup: 0,
      totalPrice: 0
    };
    onProductsChange([...products, newProduct]);
  };

  const handlePriceChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    
    handleInputChange(id, 'price', e.target.value);
    
    requestAnimationFrame(() => {
      if (cursorPosition !== null) {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  const handleMarkupChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    
    handleInputChange(id, 'markup', e.target.value);
    
    requestAnimationFrame(() => {
      if (cursorPosition !== null) {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  const handleTotalPriceChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const desiredTotal = parseInt(rawValue, 10) || 0;

    const updatedProducts = products.map(product => {
      if (product.id !== id) return product;

      const quantity = product.quantity || 1;
      const pricePerUnit = product.price;
      const desiredPerUnit = Math.max(0, Math.round(desiredTotal / quantity));
      const markupPerUnit = Math.max(0, desiredPerUnit - pricePerUnit);
      const totalPrice = Math.max(0, desiredPerUnit * quantity);

      return {
        ...product,
        markup: markupPerUnit,
        totalPrice
      };
    });

    onProductsChange(updatedProducts);
  };

  const handleInputChange = (id: number, field: keyof Product, value: string) => {
    const updatedProducts = products.map(product => {
      if (product.id === id) {
        let numericValue: number;
        
        if (field === 'price' || (field === 'markup' && markupType === 'fixed')) {
          numericValue = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
        } else {
          numericValue = Number(value) || 0;
        }
        
        const updatedProduct = {
          ...product,
          [field]: (field === 'name' || (field === 'markup' && markupType === 'percent')) ? value : numericValue
        };
        
        if (['price', 'quantity', 'markup'].includes(field)) {
          if (markupType === 'percent') {
            updatedProduct.totalPrice = roundTo50(
              updatedProduct.price * updatedProduct.quantity * (1 + updatedProduct.markup / 100)
            );
          } else {
            updatedProduct.totalPrice = roundTo50(
              (updatedProduct.price + updatedProduct.markup) * updatedProduct.quantity
            );
          }
        }
        
        return updatedProduct;
      }
      return product;
    });

    onProductsChange(updatedProducts);
  };

  const roundTo50 = (value: number): number => {
    return Math.ceil(value / 50) * 50;
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

  const handleShowAllProducts = (productId: number) => {
    setCurrentProductId(productId);
    setShowProductSelectModal(true);
    setActiveDropdown(null);
  };

  const handleProductSelectFromModal = (selectedProduct: { id: number; name: string }) => {
    if (currentProductId) {
      handleProductSelect(currentProductId, selectedProduct.name);
    }
    setShowProductSelectModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      const currentIndex = products.findIndex(product => product.id === id);
      if (currentIndex === products.length - 1) {
        addNewRow();
      }
    }
  };

  const handleDeleteRow = (id: number) => {
    const updatedProducts = products.filter(product => product.id !== id);
    onProductsChange(updatedProducts);
  };

  const filteredProducts = productsData?.items || [];

  return (
    <>
      <TableContainer>
        <StyledTable>
          <TableHeader>
          <TableRow>
            <HeaderCell>№</HeaderCell>
            <HeaderCell>Название</HeaderCell>
            <HeaderCell>Стоимость</HeaderCell>
            <HeaderCell>
              Надбавка
              {markupType === 'percent' ? ' (%)' : ' (₽)'}
            </HeaderCell>
            <HeaderCell>Цена</HeaderCell>
            <HeaderCell></HeaderCell>
          </TableRow>
        </TableHeader>
          <TableBody>
            <AnimatePresence>
              {products.map((product, index) => (
                <TableRow 
                  key={product.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transitionEnd: { borderBottom: '1px solid #edf2f7' }
                  }}
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
                              width: `${menuPosition.width}px`,
                              maxHeight: '300px'
                            }}
                          >
                            <DropdownContent>
                              {filteredProducts.length > 0 ? (
                                filteredProducts.map((item) => (
                                  <DropdownItem
                                    key={item.id}
                                    onClick={() => handleProductSelect(product.id, item.name)}
                                  >
                                    {item.name}
                                  </DropdownItem>
                                ))
                              ) : (
                                <DropdownItem>Товары не найдены</DropdownItem>
                              )}
                            </DropdownContent>
                            
                            <DropdownFooter>
                              <ShowAllLink onClick={() => handleShowAllProducts(product.id)}>
                                Показать все
                              </ShowAllLink>
                            </DropdownFooter>
                          </DropdownMenu>
                          </Portal>
                        )}
                      </AnimatePresence>
                    </NameCellContainer>
                  </BodyCell>
                  <BodyCell>
                    <CustomInput
                      inputType="rubles"
                      value={product.price ? `${formatMoney(product.price.toString())}` : ''}
                      onChange={(e) => handlePriceChange(product.id, e)}
                      onKeyDown={(e) => handleKeyDown(e, product.id)}
                      placeholder="0"
                      min="0"
                      style={{ border: 'none', padding: '0' }}
                    />
                  </BodyCell>
                  <BodyCell>
                    <CustomInput
                      inputType={markupType === 'fixed' ? 'rubles' : 'ufloat'}
                      value={markupType === 'fixed' ? formatMoney(product.markup.toString()) : product.markup || ''}
                      onChange={(e) => handleMarkupChange(product.id, e)}
                      onKeyDown={(e) => handleKeyDown(e, product.id)}
                      placeholder="0"
                      min="0"
                      style={{ border: 'none', padding: '0' }}
                    />
                  </BodyCell>
                  <BodyCell>
                    {markupType === 'fixed' ? (
                      <CustomInput
                        inputType="rubles"
                        value={product.totalPrice ? formatMoney(product.totalPrice.toString()) : ''}
                        onChange={(e) => handleTotalPriceChange(product.id, e)}
                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                        placeholder="0"
                        min="0"
                        style={{ border: 'none', padding: '0' }}
                      />
                    ) : (
                      formatMoney(product.totalPrice.toString())
                    )}
                  </BodyCell>
                  <BodyCell>
                    {index !== products.length - 1 && (
                      <DeleteButton 
                        onClick={() => handleDeleteRow(product.id)}
                        width="18"
                        height="19"
                        viewBox="0 0 18 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          d="M1.97284 16.8889C1.97284 18.05 3.01977 19 4.29937 19H13.6055C14.8851 19 15.932 18.05 15.932 16.8889V4.22222H1.97284V16.8889ZM17.0953 1.05556H13.0239L11.8606 0H6.04426L4.881 1.05556H0.80957V3.16667H17.0953V1.05556Z" 
                          fill="#50555C"
                        />
                      </DeleteButton>
                    )}
                  </BodyCell>
                </TableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </StyledTable>
      </TableContainer>

      <ProductSelectModal
        isOpen={showProductSelectModal}
        onClose={() => setShowProductSelectModal(false)}
        onSubmit={handleProductSelectFromModal}
      />
    </>
  );
};

const MarkupTypeToggle = styled.button<{ active: boolean }>`
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  background: ${props => props.active ? '#007d88' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
  
  &:first-child {
    border-radius: 4px 0 0 4px;
    border-right: none;
  }
  
  &:last-child {
    border-radius: 0 4px 4px 0;
  }
  
  &:hover {
    background: ${props => props.active ? '#007d88' : '#f7fafc'};
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  margin-bottom: 4px;
`;

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 16px;
  height: 180px;
  overflow: auto;
  position: relative;
  background-color: white;
  color: black;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-sizing: border-box;
  
  th, td {
    box-sizing: border-box;
    position: relative;
    border-right: 1px solid #e2e8f0;
  }

  th:last-child,
  td:last-child {
    border-right: none;
  }

  tbody tr:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.thead`
  background-color: #f7fafc;
  position: sticky;
  top: 0;
  z-index: 10;
  
  th {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #edf2f7;
  }
`;

const MinMarkupHint = styled.div`
  font-size: 10px;
  color: #666;
  margin-top: 2px;
`;

const TableRow = styled(motion.tr)`
  background-color: white;
`;

const HeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
`;

const BodyCell = styled.td`
  padding: 2px 16px;
  vertical-align: middle;
  position: relative;
  background-color: white;
  color: black;
`;

const NameCellContainer = styled.div`
  position: static;
`;

const NameInput = styled.input`
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

const DropdownMenu = styled(motion.div)`
  position: absolute;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  display: flex;
  flex-direction: column;
`;

const DropdownContent = styled.div`
  overflow-y: auto;
  flex-grow: 1;
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

const DropdownFooter = styled.div`
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-top: 1px solid rgba(209, 213, 219, 1);
`;

const ShowAllLink = styled.div`
  font-size: 15px;
  color: rgba(0, 125, 136, 1);
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 2px;
`;

const DeleteButton = styled.svg`
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
`;

export default ProductsTable;
