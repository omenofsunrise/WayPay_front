import { useState, useCallback } from 'react';
import productService from '../services/productService';
import type { Product, ProductParams } from '../types/product';
import type { PaginatedResponse } from '../types/common';

const useProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);

  const getProducts = useCallback(async (params?: ProductParams): Promise<PaginatedResponse<Product> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.getProducts(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdProduct = await productService.createProduct(product);
      return createdProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id: number, product: Partial<Product>): Promise<Product | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedProduct = await productService.updateProduct(id, product);
      if (data) {
        const updatedItems = data.items.map(item => 
          item.id === id ? { ...item, ...updatedProduct } : item
        );
        setData({ ...data, items: updatedItems });
      }
      return updatedProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    getProducts,
    createProduct,
    updateProduct,
  };
};

export default useProducts;