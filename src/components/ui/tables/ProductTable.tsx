import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import useProducts from "../../../api/hooks/useProducts";
import Portal from "../../../utils/Portal";
import CustomInput from "../fields/CustomInput";
import ProductSelectModal from "../../modal/CrudInherited/ProductSelectModal";
import { useAuth } from "../../../сontext/AuthContext";
import { formatMoney } from "../../../utils/formatPrice";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

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
  markupType: "percent" | "fixed";
}

const ProductsTable = ({
  products,
  onProductsChange,
  onTotalSumChange,
  markupType,
}: ProductsTableProps) => {
  const { authInfo } = useAuth();
  const { data: productsData, getProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showProductSelectModal, setShowProductSelectModal] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (products.length === 0) {
      const initialProducts = [
        {
          id: 1,
          name: "",
          price: 0,
          quantity: 1,
          markup: 0,
          totalPrice: 0,
        },
      ];
      onProductsChange(initialProducts);
    }
  }, []);

  useEffect(() => {
    getProducts({ name: searchTerm });
  }, [searchTerm, getProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateMenuPosition = (id: number) => {
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1 && inputRefs.current[index]) {
      const rect = inputRefs.current[index]!.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const totalSum = products.reduce(
    (sum, product) => sum + product.totalPrice,
    0
  );

  useEffect(() => {
    if (onTotalSumChange) {
      onTotalSumChange(totalSum);
    }
  }, [totalSum, onTotalSumChange]);

  const addNewRow = () => {
    const newProduct: Product = {
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      name: "",
      price: 0,
      quantity: 1,
      markup: 0,
      totalPrice: 0,
    };
    onProductsChange([...products, newProduct]);
  };

  const removeRow = (id: number) => {
    const remainingProducts = products.filter((product) => product.id !== id);
    onProductsChange(
      remainingProducts.length > 0
        ? remainingProducts
        : [
            {
              id: Date.now(),
              name: "",
              price: 0,
              quantity: 1,
              markup: 0,
              totalPrice: 0,
            },
          ]
    );
  };

  const handlePriceChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;

    handleInputChange(id, "price", e.target.value);

    requestAnimationFrame(() => {
      if (cursorPosition !== null) {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  const handleMarkupChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;

    handleInputChange(id, "markup", e.target.value);

    requestAnimationFrame(() => {
      if (cursorPosition !== null) {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  const handleTotalPriceChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    const desiredTotal = parseInt(rawValue, 10) || 0;

    const updatedProducts = products.map((product) => {
      if (product.id !== id) return product;

      const quantity = product.quantity || 1;
      const pricePerUnit = product.price;
      const desiredPerUnit = Math.max(0, Math.round(desiredTotal / quantity));
      const markupPerUnit = Math.max(0, desiredPerUnit - pricePerUnit);
      const totalPrice = Math.max(0, desiredPerUnit * quantity);

      return {
        ...product,
        markup: markupPerUnit,
        totalPrice,
      };
    });

    onProductsChange(updatedProducts);
  };

  const handleInputChange = (
    id: number,
    field: keyof Product,
    value: string
  ) => {
    const updatedProducts = products.map((product) => {
      if (product.id === id) {
        let numericValue: number;

        if (
          field === "price" ||
          (field === "markup" && markupType === "fixed")
        ) {
          numericValue = parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
        } else {
          numericValue = Number(value) || 0;
        }

        const updatedProduct = {
          ...product,
          [field]:
            field === "name" || (field === "markup" && markupType === "percent")
              ? value
              : numericValue,
        };

        if (["price", "quantity", "markup"].includes(field)) {
          if (markupType === "percent") {
            updatedProduct.totalPrice = roundTo50(
              updatedProduct.price *
                updatedProduct.quantity *
                (1 + updatedProduct.markup / 100)
            );
          } else {
            updatedProduct.totalPrice = roundTo50(
              (updatedProduct.price + updatedProduct.markup) *
                updatedProduct.quantity
            );
          }
        }

        return updatedProduct;
      }
      return product;
    });

    onProductsChange(updatedProducts);
  };

  // Шаг берётся из настроек компании, его задаёт директор. Ноль — не
  // округлять. Пятьдесят — то, что было прошито здесь до появления настройки.
  const roundingStep = authInfo?.employee.roundingStep ?? 50;

  const roundTo50 = (value: number): number => {
    if (roundingStep <= 0) return value;
    return Math.ceil(value / roundingStep) * roundingStep;
  };

  const handleProductSelect = (id: number, productName: string) => {
    const updatedProducts = products.map((product) => {
      if (product.id === id) {
        return { ...product, name: productName };
      }
      return product;
    });

    onProductsChange(updatedProducts);
    setActiveDropdown(null);
    setSearchTerm("");
  };

  const handleShowAllProducts = (productId: number) => {
    setCurrentProductId(productId);
    setShowProductSelectModal(true);
    setActiveDropdown(null);
  };

  const handleProductSelectFromModal = (selectedProduct: {
    id: number;
    name: string;
  }) => {
    if (currentProductId) {
      handleProductSelect(currentProductId, selectedProduct.name);
    }
    setShowProductSelectModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      const currentIndex = products.findIndex((product) => product.id === id);
      if (currentIndex === products.length - 1) {
        addNewRow();
      }
    }
  };

  const filteredProducts = productsData?.items || [];

  return (
    <>
      <TableContainer>
        <StyledTable>
          <TableHeader>
            <TableRow>
              <HeaderCell>Название</HeaderCell>
              <HeaderCell>Стоимость</HeaderCell>
              <HeaderCell>
                Надбавка
                {markupType === "percent" ? " (%)" : " (₽)"}
              </HeaderCell>
              <HeaderCell>Цена</HeaderCell>
              <ActionHeaderCell aria-label="Действия" />
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
                    transitionEnd: { borderBottom: "1px solid #edf2f7" },
                  }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
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
                          handleInputChange(product.id, "name", e.target.value);
                          setSearchTerm(e.target.value);
                        }}
                        onFocus={() => {
                          setActiveDropdown(product.id);
                          updateMenuPosition(product.id);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                        placeholder="Введите название товара"
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
                                position: "absolute",
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                                width: `${menuPosition.width}px`,
                                maxHeight: "300px",
                              }}
                            >
                              <DropdownContent>
                                {filteredProducts.length > 0 ? (
                                  filteredProducts.map((item) => (
                                    <DropdownItem
                                      key={item.id}
                                      onClick={() =>
                                        handleProductSelect(
                                          product.id,
                                          item.name
                                        )
                                      }
                                    >
                                      {item.name}
                                    </DropdownItem>
                                  ))
                                ) : (
                                  <DropdownItem>Товары не найдены</DropdownItem>
                                )}
                              </DropdownContent>

                              <DropdownFooter>
                                <ShowAllLink
                                  onClick={() =>
                                    handleShowAllProducts(product.id)
                                  }
                                >
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
                      value={
                        product.price
                          ? `${formatMoney(product.price.toString())}`
                          : ""
                      }
                      onChange={(e) => handlePriceChange(product.id, e)}
                      onKeyDown={(e) => handleKeyDown(e, product.id)}
                      placeholder="0"
                      min="0"
                    />
                  </BodyCell>
                  <BodyCell>
                    <CustomInput
                      inputType={markupType === "fixed" ? "rubles" : "ufloat"}
                      value={
                        markupType === "fixed"
                          ? formatMoney(product.markup.toString())
                          : product.markup || ""
                      }
                      onChange={(e) => handleMarkupChange(product.id, e)}
                      onKeyDown={(e) => handleKeyDown(e, product.id)}
                      placeholder="0"
                      min="0"
                    />
                  </BodyCell>
                  <BodyCell>
                    {markupType === "fixed" ? (
                      <CustomInput
                        inputType="rubles"
                        value={
                          product.totalPrice
                            ? formatMoney(product.totalPrice.toString())
                            : ""
                        }
                        onChange={(e) => handleTotalPriceChange(product.id, e)}
                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                        placeholder="0"
                        min="0"
                      />
                    ) : (
                      <PriceValue>
                        {formatMoney(product.totalPrice.toString())}
                      </PriceValue>
                    )}
                  </BodyCell>
                  <ActionCell>
                    <DeleteButton
                      type="button"
                      onClick={() => removeRow(product.id)}
                      aria-label="Удалить товар"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </DeleteButton>
                  </ActionCell>
                </TableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </StyledTable>
      </TableContainer>

      <AddProductButton type="button" onClick={addNewRow}>
        <AddCircleOutlineIcon fontSize="small" />
        Добавить товар
      </AddProductButton>

      <ProductSelectModal
        isOpen={showProductSelectModal}
        onClose={() => setShowProductSelectModal(false)}
        onSubmit={handleProductSelectFromModal}
      />
    </>
  );
};

const TableContainer = styled.div`
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  max-height: 230px;
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

  th,
  td {
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
  background-color: #f7f9fc;
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

const TableRow = styled(motion.tr)`
  background-color: white;
`;

const HeaderCell = styled.th`
  height: 46px;
  padding: 0 16px;
  text-align: left;
  color: #101828;
  font-size: 14px;
  font-weight: 600;

  &:first-child {
    width: 34%;
  }
`;

const BodyCell = styled.td`
  height: 64px;
  padding: 7px 14px;
  vertical-align: middle;
  position: relative;
  background-color: white;
  color: black;

  & input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid #d0d5dd;
    border-radius: 7px;
    box-sizing: border-box;
  }
`;

const NameCellContainer = styled.div`
  position: static;
`;

const NameInput = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  font-size: 14px;
  background-color: white;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  color: black;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3182ce;
  }
`;

const ActionHeaderCell = styled.th`
  width: 48px;
  border-right: 0 !important;
`;

const PriceValue = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #d8dee8;
  border-radius: 7px;
  background: #f8fafc;
  color: #475467;
  box-sizing: border-box;
`;

const ActionCell = styled.td`
  width: 48px;
  padding: 0;
  text-align: center;
  border-right: 0 !important;
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #667085;
  cursor: pointer;

  &:hover {
    background: #f2f4f7;
    color: #b42318;
  }
`;

const AddProductButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  margin-top: 8px;
  padding: 0 16px;
  border: 1px dashed #d0d5dd;
  border-radius: 7px;
  background: #ffffff;
  color: #53627a;
  font-size: 14px;
  cursor: pointer;

  & svg {
    color: #78aeb4;
  }

  &:hover {
    border-color: #168b96;
    color: #147d87;
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

export default ProductsTable;
