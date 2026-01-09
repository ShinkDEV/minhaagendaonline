import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import {
  useProducts,
  useLowStockProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductMovements,
  useCreateProductMovement,
  Product,
} from "@/hooks/useProducts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Estoque() {
  const [search, setSearch] = useState("");
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showMovementSheet, setShowMovementSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minQuantity, setMinQuantity] = useState("5");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState(true);

  // Movement form states
  const [movementType, setMovementType] = useState<"in" | "out">("in");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementNotes, setMovementNotes] = useState("");

  const { data: products = [], isLoading } = useProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const { data: movements = [] } = useProductMovements();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createMovement = useCreateProductMovement();

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSku("");
    setPrice("");
    setCostPrice("");
    setQuantity("");
    setMinQuantity("5");
    setCategory("");
    setActive(true);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setSku(product.sku || "");
    setPrice(product.price.toString());
    setCostPrice(product.cost_price?.toString() || "");
    setQuantity(product.quantity.toString());
    setMinQuantity(product.min_quantity?.toString() || "5");
    setCategory(product.category || "");
    setActive(product.active);
    setShowProductSheet(true);
  };

  const handleSubmitProduct = async () => {
    if (!name || !price) return;

    const productData = {
      name,
      description: description || null,
      sku: sku || null,
      price: parseFloat(price),
      cost_price: costPrice ? parseFloat(costPrice) : null,
      quantity: parseInt(quantity) || 0,
      min_quantity: parseInt(minQuantity) || 5,
      category: category || null,
      active,
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
    } else {
      await createProduct.mutateAsync(productData);
    }

    setShowProductSheet(false);
    resetForm();
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    await deleteProduct.mutateAsync(deleteProductId);
    setDeleteProductId(null);
  };

  const handleOpenMovement = (product: Product) => {
    setSelectedProduct(product);
    setMovementType("in");
    setMovementQuantity("");
    setMovementReason("");
    setMovementNotes("");
    setShowMovementSheet(true);
  };

  const handleSubmitMovement = async () => {
    if (!selectedProduct || !movementQuantity) return;

    await createMovement.mutateAsync({
      product_id: selectedProduct.id,
      type: movementType,
      quantity: parseInt(movementQuantity),
      reason: movementReason || null,
      notes: movementNotes || null,
    });

    setShowMovementSheet(false);
    setSelectedProduct(null);
  };

  const getStockBadge = (product: Product) => {
    const minQty = product.min_quantity || 5;
    if (product.quantity === 0) {
      return <Badge variant="destructive">Sem estoque</Badge>;
    }
    if (product.quantity <= minQty) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Estoque baixo</Badge>;
    }
    return <Badge variant="secondary">Em estoque</Badge>;
  };

  return (
    <AppLayout title="Estoque">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Itens em Estoque
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor em Estoque
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </CardContent>
          </Card>

          <Card className={lowStockProducts.length > 0 ? "border-amber-500" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque Baixo
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${lowStockProducts.length > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockProducts.length > 0 ? "text-amber-600" : ""}`}>
                {lowStockProducts.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <Badge key={p.id} variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                    {p.name} ({p.quantity})
                  </Badge>
                ))}
                {lowStockProducts.length > 5 && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                    +{lowStockProducts.length - 5} mais
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="movements">Movimentações</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Sheet open={showProductSheet} onOpenChange={(open) => {
                setShowProductSheet(open);
                if (!open) resetForm();
              }}>
                <SheetTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo Produto</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      {editingProduct ? "Editar Produto" : "Novo Produto"}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do produto"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descrição do produto"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>SKU / Código</Label>
                        <Input
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="SKU001"
                        />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Input
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Ex: Shampoo"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Preço de Venda *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Preço de Custo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantidade Inicial</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          disabled={!!editingProduct}
                        />
                        {editingProduct && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Use movimentações para alterar
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Qtd. Mínima</Label>
                        <Input
                          type="number"
                          value={minQuantity}
                          onChange={(e) => setMinQuantity(e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Produto Ativo</Label>
                      <Switch checked={active} onCheckedChange={setActive} />
                    </div>
                    <Button
                      onClick={handleSubmitProduct}
                      className="w-full"
                      disabled={!name || !price || createProduct.isPending || updateProduct.isPending}
                    >
                      {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <TabsContent value="products">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="hidden sm:table-cell">SKU</TableHead>
                          <TableHead className="hidden md:table-cell">Categoria</TableHead>
                          <TableHead className="text-right">Preço</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className={!product.active ? "opacity-50" : ""}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {product.sku || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {product.category || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.price.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {product.quantity}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStockBadge(product)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenMovement(product)}
                                  title="Movimentar estoque"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteProductId(product.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardContent className="p-0">
                {movements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <p>Nenhuma movimentação registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Tipo</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="hidden sm:table-cell">Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>
                              {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>
                              {(movement.product as Product)?.name || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {movement.type === "in" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                                  Entrada
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                                  Saída
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {movement.type === "in" ? "+" : "-"}{movement.quantity}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {movement.reason || movement.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Movement Sheet */}
        <Sheet open={showMovementSheet} onOpenChange={setShowMovementSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Movimentar Estoque</SheetTitle>
            </SheetHeader>
            {selectedProduct && (
              <div className="space-y-4 mt-6">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: <span className="font-medium">{selectedProduct.quantity}</span>
                  </p>
                </div>

                <div>
                  <Label>Tipo de Movimentação</Label>
                  <Select value={movementType} onValueChange={(v) => setMovementType(v as "in" | "out")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                          Entrada
                        </div>
                      </SelectItem>
                      <SelectItem value="out">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="h-4 w-4 text-red-500" />
                          Saída
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    value={movementQuantity}
                    onChange={(e) => setMovementQuantity(e.target.value)}
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div>
                  <Label>Motivo</Label>
                  <Select value={movementReason} onValueChange={setMovementReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {movementType === "in" ? (
                        <>
                          <SelectItem value="purchase">Compra</SelectItem>
                          <SelectItem value="adjustment">Ajuste de inventário</SelectItem>
                          <SelectItem value="return">Devolução</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="sale">Venda</SelectItem>
                          <SelectItem value="appointment">Uso em atendimento</SelectItem>
                          <SelectItem value="loss">Perda/Quebra</SelectItem>
                          <SelectItem value="adjustment">Ajuste de inventário</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={movementNotes}
                    onChange={(e) => setMovementNotes(e.target.value)}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <Button
                  onClick={handleSubmitMovement}
                  className="w-full"
                  disabled={!movementQuantity || createMovement.isPending}
                >
                  Registrar Movimentação
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita e todas as movimentações relacionadas também serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
