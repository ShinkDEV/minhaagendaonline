import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Minus, Trash2, Search } from "lucide-react";
import { useActiveProducts, Product } from "@/hooks/useProducts";

export interface SelectedProduct {
  product: Product;
  quantity: number;
}

interface ProductSelectorProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
}

export function ProductSelector({ selectedProducts, onProductsChange }: ProductSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const { data: products = [], isLoading } = useActiveProducts();

  const availableProducts = products.filter(
    (p) => !selectedProducts.find((sp) => sp.product.id === p.id)
  );

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProduct = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    onProductsChange([
      ...selectedProducts,
      { product, quantity: 1 },
    ]);
    setSelectedProductId("");
    setSearch("");
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    onProductsChange(
      selectedProducts
        .map((sp) => {
          if (sp.product.id === productId) {
            const newQty = sp.quantity + delta;
            // Don't allow more than available stock
            if (newQty > sp.product.quantity) return sp;
            return { ...sp, quantity: Math.max(0, newQty) };
          }
          return sp;
        })
        .filter((sp) => sp.quantity > 0)
    );
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId));
  };

  const totalProducts = selectedProducts.reduce(
    (acc, sp) => acc + sp.product.price * sp.quantity,
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Adicionar Produtos</span>
      </div>

      {/* Product Selection */}
      <div className="flex gap-2">
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-8 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="max-h-48">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-3 text-sm text-muted-foreground">
                  Nenhum produto disponível
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{product.name}</span>
                      <span className="text-muted-foreground">
                        {product.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        {" "}
                        <span className="text-xs">({product.quantity} em estoque)</span>
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon"
          onClick={handleAddProduct}
          disabled={!selectedProductId}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          {selectedProducts.map((sp) => (
            <div
              key={sp.product.id}
              className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{sp.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sp.product.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  x {sp.quantity} ={" "}
                  <span className="font-medium">
                    {(sp.product.price * sp.quantity).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleUpdateQuantity(sp.product.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{sp.quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleUpdateQuantity(sp.product.id, 1)}
                  disabled={sp.quantity >= sp.product.quantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleRemoveProduct(sp.product.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-medium">Total Produtos</span>
            <Badge variant="secondary" className="text-sm">
              {totalProducts.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Badge>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum produto cadastrado. Acesse Estoque para adicionar produtos.
        </p>
      )}
    </div>
  );
}
