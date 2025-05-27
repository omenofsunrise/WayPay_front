import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useProducts from '../../../api/hooks/useProducts';

interface ProductRow {
  id: number;
  number: number;
  name: string;
  price: string;
  quantity: string;
  markup: string;
  total: string;
  isNew?: boolean;
}

const ProductsTable = () => {
  const { data: productsData, getProducts } = useProducts();
  const [rows, setRows] = useState<ProductRow[]>([
    { id: 1, number: 1, name: '', price: '', quantity: '', markup: '', total: '', isNew: true }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Add new row when current is filled
  useEffect(() => {
    const lastRow = rows[rows.length - 1];
    if (lastRow && !lastRow.isNew && rows.every(row => !row.isNew)) {
      addNewRow();
    }
  }, [rows]);

  // Calculate total price when price, quantity or markup changes
  useEffect(() => {
    const updatedRows = rows.map(row => {
      const price = parseFloat(row.price) || 0;
      const quantity = parseInt(row.quantity) || 0;
      const markup = parseFloat(row.markup) || 0;
      
      const total = price * quantity * (1 + markup / 100);
      
      return {
        ...row,
        total: total.toFixed(2)
      };
    });
    
    setRows(updatedRows);
  }, [rows]);

  const addNewRow = () => {
    const newRow: ProductRow = {
      id: Date.now(),
      number: rows.length + 1,
      name: '',
      price: '',
      quantity: '',
      markup: '',
      total: '',
      isNew: true
    };
    setRows([...rows, newRow]);
  };

  const handleInputChange = (rowId: number, field: keyof ProductRow, value: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: value, isNew: false };
      }
      return row;
    }));
  };

  const handleProductSelect = (rowId: number, productName: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return { 
          ...row, 
          name: productName,
          isNew: false
        };
      }
      return row;
    }));
    setActiveDropdown(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: number) => {
    if (e.key === 'Enter') {
      const currentIndex = rows.findIndex(row => row.id === rowId);
      if (currentIndex === rows.length - 1) {
        addNewRow();
      }
    }
  };

  // Handle numeric input manually to remove arrow controls
  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
                        '.', ',', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    
    if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
    
    // Replace comma with dot for decimal separator
    if (e.key === ',') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      const value = target.value + '.';
      target.value = value;
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
            {rows.map((row) => (
              <TableRow 
                key={row.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <BodyCell>{row.number}</BodyCell>
                <BodyCell>
                  <NameCellContainer>
                    <NameInput
                      type="text"
                      value={row.name}
                      onChange={(e) => {
                        handleInputChange(row.id, 'name', e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                      onFocus={() => setActiveDropdown(row.id)}
                      onKeyDown={(e) => handleKeyDown(e, row.id)}
                      placeholder="Введите название"
                    />
                    <AnimatePresence>
                      {activeDropdown === row.id && (
                        <DropdownMenu
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          ref={dropdownRef}
                        >
                          {filteredProducts.map((product) => (
                            <DropdownItem
                              key={product.id}
                              onClick={() => handleProductSelect(
                                row.id, 
                                product.name
                              )}
                            >
                              {product.name}
                            </DropdownItem>
                          ))}
                          {filteredProducts.length === 0 && (
                            <DropdownEmpty>Товары не найдены</DropdownEmpty>
                          )}
                        </DropdownMenu>
                      )}
                    </AnimatePresence>
                  </NameCellContainer>
                </BodyCell>
                <BodyCell>
                  <NumberInput
                    type="text"
                    inputMode="decimal"
                    value={row.price}
                    onChange={(e) => handleInputChange(row.id, 'price', e.target.value)}
                    onKeyDown={(e) => {
                      handleNumericInput(e);
                      handleKeyDown(e, row.id);
                    }}
                    placeholder="0.00"
                  />
                </BodyCell>
                <BodyCell>
                  <NumberInput
                    type="text"
                    inputMode="numeric"
                    value={row.quantity}
                    onChange={(e) => handleInputChange(row.id, 'quantity', e.target.value)}
                    onKeyDown={(e) => {
                      handleNumericInput(e);
                      handleKeyDown(e, row.id);
                    }}
                    placeholder="1"
                  />
                </BodyCell>
                <BodyCell>
                  <NumberInput
                    type="text"
                    inputMode="decimal"
                    value={row.markup}
                    onChange={(e) => handleInputChange(row.id, 'markup', e.target.value)}
                    onKeyDown={(e) => {
                      handleNumericInput(e);
                      handleKeyDown(e, row.id);
                    }}
                    placeholder="0"
                  />
                </BodyCell>
                <BodyCell>{parseFloat(row.total || '0').toLocaleString('ru-RU')} ₽</BodyCell>
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
  overflow: hidden;
  margin-top: 16px;
  height: 600px;
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
`;

const NameCellContainer = styled.div`
  position: relative;
`;

const NameInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3182ce;
  }
`;

const NumberInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;

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
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;

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