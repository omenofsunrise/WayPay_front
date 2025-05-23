import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable from "../components/ui/fields/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import { useEffect, useState, useCallback } from "react";
import useProducts from "../api/hooks/useProducts";
import { exportToExcel } from '../utils/exportUtils';
import { ProductModal } from "../components/modal/ProductModal";

const ProductPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedProduct, setSelectedProduct] = useState<{ id?: number, name: string } | null>(null);
    
    const { 
        isLoading, 
        error, 
        data: productsData, 
        getProducts,
        createProduct,
        updateProduct
    } = useProducts();
    
    const loadProducts = useCallback(async () => {
        await getProducts({
            page: currentPage,
            pageSize,
            name: nameFilter || undefined
        });
    }, [currentPage, nameFilter, getProducts]);
    
    useEffect(() => {
        loadProducts();
    }, [currentPage, loadProducts]);

    const handleExport = async () => {
        try {
            const allProducts = await getProducts({
                name: nameFilter || undefined,
                pageSize: 100
            });
            
            if (allProducts?.items) {
                exportToExcel(allProducts.items.map(product => ({
                    'ID': product.id,
                    'Название': product.name,
                })), {
                    fileName: 'products_export',
                    sheetName: 'Products',
                    columnWidths: [10, 30]
                });
            }
        } catch (err) {
            console.error('Ошибка при экспорте:', err);
        }
    };

    const handleCreateProduct = () => {
        setModalMode('create');
        setSelectedProduct({ name: '' });
        setIsModalOpen(true);
    };

    const handleEditProduct = (productId: number, productName: string) => {
        setModalMode('edit');
        setSelectedProduct({ id: productId, name: productName });
        setIsModalOpen(true);
    };

    const handleViewProduct = (productId: number, productName: string) => {
        setModalMode('view');
        setSelectedProduct({ id: productId, name: productName });
        setIsModalOpen(true);
    };

    const handleSubmitProduct = async (productData: { name: string }) => {
        try {
            if (modalMode === 'create') {
                await createProduct(productData);
            } else if (modalMode === 'edit' && selectedProduct?.id) {
                await updateProduct(selectedProduct.id, productData);
            }
            loadProducts();
        } catch (err) {
            console.error('Ошибка при сохранении товара:', err);
        }
    };

    const handleRowDoubleClick = (rowData: any[], rowIndex: number) => {
        const [id, name] = rowData;
        handleEditProduct(Number(id), name);
    };

    const tableData = productsData?.items.map(product => [
        product.id.toString(),
        product.name,
    ]) || [];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Товары</CustomTitle>
                <ExportButton onClick={handleExport} />
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="text"
                    placeholder="Название товара"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                />
                <DarkCyanButton 
                    style={{ width: "15vw" }}
                    onClick={handleCreateProduct}
                >
                    + Новый товар
                </DarkCyanButton>
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "ID", isSortable: true },
                            { name: "Название", isSortable: true },
                        ]} 
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={productsData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={productsData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            <ProductModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitProduct}
                initialData={selectedProduct || { name: '' }}
            />
        </PageLayout>
    );
};

export default ProductPage;