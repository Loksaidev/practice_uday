import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/drop_your_mail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

// Assuming these paths are correct
import boardGameImg from "@/assets/products/board-game.jpg";
import tShirtImg from "@/assets/products/t-shirt.jpg";
import cardDeckImg from "@/assets/products/card-deck.jpg";
import mugImg from "@/assets/products/mug.jpg";

// Import custom font
import annieFont from "@/assets/fonts/AnnieUseYourTelescope-Regular.ttf";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  rating: number;
  category: string;
  stock: number;
  featured: boolean;
  weight_kg?: number;
}

// Map product names to imported images
const productImages: Record<string, string> = {
  "Knowsy Board Game": boardGameImg,
  "Knowsy T-Shirt": tShirtImg,
  "Knowsy Card Deck": cardDeckImg,
  "Knowsy Mug": mugImg,
};

// --- START: KnowsyProductCard Component ---

interface ProductCardProps {
  product: Product;
  productImage: string;
  handleAddToCart: (product: Product) => void;
}

const KnowsyProductCard: React.FC<ProductCardProps> = ({ product, productImage, handleAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const { t } = useTranslation();
  
  // Determine the stock badge - Adjusted for Top-Left floating style
  let stockBadge = null;
  if (product.stock > 0 && product.stock <= 20) {
    stockBadge = (
      <div
        className="absolute -top-3 -left-6 z-20 px-4 py-1 rounded-full text-sm shadow-md"
        style={{
          backgroundColor: '#ED908A',
          color: 'black',
          fontFamily: 'Avenir Next, sans-serif',
          fontWeight: 400,
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        {t("store.onlyLeft", { count: product.stock })}
      </div>
    );
  }

  let priceElement = (
      <div className="flex flex-col h-12 justify-start">
          <span className="text-2xl font-extrabold text-gray-900 leading-none" style={{ fontFamily: 'Slackey, cursive' }}>
              ${Number(product.price).toFixed(2)}
          </span>
          <span className="text-sm opacity-0 leading-none" style={{ fontFamily: 'Slackey, cursive' }}>
              $00.00
          </span>
      </div>
  );

  if (product.name.includes("Couples Expansion") || product.name.includes("Christmas Expansion")) {
    priceElement = (
        <div className="flex flex-col h-12 justify-start">
            <span className="text-2xl font-extrabold text-black leading-none" style={{ fontFamily: 'Slackey, cursive' }}>
                ${Number(product.price).toFixed(2)}
            </span>
            <span className="text-sm line-through ml-4" style={{ color: '#ED908A', fontFamily: 'Slackey, cursive' }}>
              $24.99
            </span>
        </div>
    );
  }

  return (
    <div className="relative"> {/* Wrapper for floating badge positioning */}
        {stockBadge}
        <Link to={`/store/${product.id}`} className="block"> 
            <Card className="rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-none bg-white">
                
                {/* Product Image Section */}
                <div className="relative">
                    <div className="aspect-[1.5/1.2] flex items-center justify-center overflow-hidden">
                        <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            style={{ transform: 'scale(1.1) translateX(-5%)' }}
                        />
                    </div>
                </div>

                {/* Card Content (Details) */}
                <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <Badge className="text-xs px-3 py-1 rounded-full border-none" style={{ backgroundColor: '#ffdd22', color: 'black', fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}>
                          Game
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#000000' }}>
                            <Star className="w-4 h-4" style={{ fill: '#FCC804', color: '#FCC804' }} />
                            {product.rating}
                        </div>
                    </div>

                    <CardTitle className="text-xl font-bold text-black leading-tight" style={{ fontFamily: 'Slackey, cursive' }}>
                        {product.name}
                    </CardTitle>
                    <p className="text-base line-clamp-2" style={{ height: '40px', fontFamily: 'AnnieUseYourTelescope', color: '#000000' }}>
                        {product.description || `Buy the official ${product.name}`}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                        {priceElement}

                        <div className="flex items-center rounded-3xl overflow-hidden p-1" style={{ backgroundColor: '#D9D9D9' }}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-black rounded-xl"
                                style={{ fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }}
                                disabled={quantity <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-6 text-center text-sm text-black" style={{ fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}>
                                {quantity}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-black rounded-xl"
                                style={{ fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuantity(q => Math.min(product.stock || 99, q + 1)); }}
                                disabled={quantity >= product.stock}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>

                <div className="p-5 pt-0 pb-8 flex justify-center">
                    <Button
                        className="w-full h-11 rounded-full text-lg font-bold text-black transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: '#FCC804', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontFamily: 'Slackey, cursive' }}
                    >
                        {product.stock === 0 ? t("store.outOfStock") : t("store.viewProduct")}
                    </Button>
                </div>
            </Card>
        </Link>
    </div>
  );
};

// --- Store Component ---

const Store = () => {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("store_items")
        .select("*")
        .order("featured", { ascending: false });

      if (error) throw error;

      const processedData = (data || []).map(p => ({
          ...p,
          stock: p.name.includes("Christmas") ? 10 : p.stock,
          rating: p.name.includes("Knowsy Game") ? 4.9 : (p.name.includes("Christmas") ? 4.3 : 4.5),
      }));
      setProducts(processedData);

    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const productImage = productImages[product.name] || product.image_url;
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      image: productImage,
      weight_kg: product.weight_kg,
    });
    toast({
      title: t("store.addedToCartTitle"),
      description: t("store.addedToCartDescription", { name: product.name }),
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <style>
        {`
          @font-face {
            font-family: 'AnnieUseYourTelescope';
            src: url(${annieFont}) format('truetype');
          }
        `}
      </style>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 mt-16">
            <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-10 tracking-tight" style={{
              fontFamily: 'Slackey, cursive',
              color: '#2C5272'
            }} dangerouslySetInnerHTML={{ __html: t("store.header") }}>
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("store.loading")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
              {products.map((product) => (
                <KnowsyProductCard
                  key={product.id}
                  product={product}
                  productImage={productImages[product.name] || product.image_url}
                  handleAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Store;