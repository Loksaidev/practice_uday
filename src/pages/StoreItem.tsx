import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/drop_your_mail";
import { useTranslation } from "react-i18next";

// Import custom fonts
import slackeyFont from "@/assets/fonts/Slackey-Regular.ttf";
import annieFont from "@/assets/fonts/AnnieUseYourTelescope-Regular.ttf";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
// Updated icons to match the design's collapsible sections
import { Star, ArrowLeft, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import HeartIcon from "@/assets/shop/Heart.png";
import ShareIcon from "@/assets/shop/Share.png";
import TruckIcon from "@/assets/shop/Truck.png";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

// --- Custom Constants for Styling ---
const ACTION_PANEL_COLOR = '#E1F1FF';
const PRIMARY_YELLOW = '#FCC804';
const BOLD_TEXT_CLASS = 'font-black';
const BUTTON_SHADOW_COLOR = '#444444';
const BUTTON_SHADOW = `shadow-[4px_4px_0px_0px_${BUTTON_SHADOW_COLOR}] hover:shadow-[2px_2px_0px_0px_${BUTTON_SHADOW_COLOR}] transition-all`;

// --- Product Data Interfaces ---
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

// --- START: KnowsyRelatedProductCard Component (Used for Related Products) ---
interface ProductCardProps {
    product: Product;
    productImage: string;
}

const KnowsyRelatedProductCard: React.FC<ProductCardProps> = ({ product, productImage }) => {
    
    // --- Custom logic to match the two specific cards in the screenshot ---
    let cardBgColor = 'bg-gray-200';
    let stockBadge = null;
    let priceDisplay;

    if (product.name.includes("Christmas Expansion")) {
      cardBgColor = 'bg-yellow-400';
      // Badge logic for "only 10 left" (assuming stock is 10 for visual match)
      if (product.stock <= 10 && product.stock > 0) {
          stockBadge = (
              <div className="absolute -top-2 -left-4 z-30 px-4 py-1 rounded-full text-sm shadow-md" style={{ backgroundColor: '#ED908A', color: 'black', fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}>
                only {product.stock} left
              </div>
            );
      }
      priceDisplay = (
          <div className="flex flex-col items-end h-12 justify-start">
              <span className="text-xl leading-none" style={{ fontFamily: 'Slackey, cursive', color: '#000000', fontWeight: 'normal' }}>
                  ${Number(product.price).toFixed(2)}
              </span>
              <span className="text-sm line-through" style={{ color: '#ED908A' }}>
                  $24.99
              </span>
          </div>
      );
    } else if (product.name.includes("Couples Expansion")) {
      cardBgColor = 'bg-green-300';
      priceDisplay = (
          <div className="flex flex-col items-end h-12 justify-start">
              <span className="text-xl leading-none" style={{ fontFamily: 'Slackey, cursive', color: '#000000', fontWeight: 'normal' }}>
                  ${Number(product.price).toFixed(2)}
              </span>
              <span className="text-sm line-through" style={{ color: '#ED908A' }}>
                  $24.99
              </span>
          </div>
      );
    } else {
        priceDisplay = (
            <div className="flex flex-col items-end h-12 justify-start">
                <span className="text-xl leading-none" style={{ fontFamily: 'Slackey, cursive', color: '#000000', fontWeight: 'normal' }}>
                    ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-sm opacity-0 leading-none" style={{ fontFamily: 'Slackey, cursive' }}>
                    $00.00
                </span>
            </div>
        );
    }

    return (
        <Link to={`/store/${product.id}`} className="block relative">
            <Card className="rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-80">

                {/* Product Image Section */}
                <div>
                    <div className="aspect-[1.2/1] flex items-center justify-center rounded-3xl">
                        <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            style={{ transform: 'scale(1.1) translateX(-5%)' }}
                        />
                    </div>
                </div>

                {/* Card Content (Details) */}
                <div className="p-4">

                    <div className="flex">
                         <div className="flex-1">
                             <CardTitle className="text-lg leading-tight" style={{ fontFamily: 'Slackey, cursive', color: '#000000', fontWeight: 'normal' }}>
                                 {product.name}
                             </CardTitle>
                         </div>

                         <div className="flex-1 text-right">
                             {priceDisplay}
                         </div>
                     </div>
                </div>
            </Card>
            {stockBadge}
        </Link>
    );
};
// --- END: KnowsyRelatedProductCard Component ---

const StoreItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { t } = useTranslation();
  
  // State for the collapsible sections
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);


  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchRelatedProducts(id);
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("store_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Ensure necessary fields for the main product view
      const processedProduct = {
          ...data,
          name: data?.name || 'Knowsy Game',
          rating: data?.rating || 4.9,
          category: data?.category || 'Game',
          price: data?.price || 49.99,
          description: data?.description || 'Buy the official Knowsy Board Game',
      } as Product;
      setProduct(processedProduct);
    } catch (error) {
      console.error("Error fetching main product:", error);
      navigate("/store");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentId: string) => {
    try {
        const { data, error } = await supabase
            .from("store_items")
            .select("*")
            .neq("id", currentId)
            .limit(2); 

        if (error) throw error;
        
        // --- Process data to show actual related products ---
        const processedRelated = (data || []).slice(0, 2);

        setRelatedProducts(processedRelated);

    } catch (error) {
        console.error("Error fetching related products:", error);
        // Fail silently if related products don't load
    }
  };


  const handleAddToCart = () => {
    if (!product) return;

    const productImage = product.image_url;
    
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        image: productImage,
        weight_kg: product.weight_kg,
      });
    }

    toast({
      title: "Added to cart!",
      description: `${quantity} × ${product.name} added to your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ededed' }}>
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <p className="text-center text-muted-foreground">{t("storeItem.loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const productImage = product.image_url;
  const isAvailable = product.stock > 0;
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff', fontFamily: 'Slackey, cursive' }}>
      <style>
        {`
          @font-face {
            font-family: 'Slackey';
            src: url(${slackeyFont}) format('truetype');
          }
          @font-face {
            font-family: 'AnnieUseYourTelescope';
            src: url(${annieFont}) format('truetype');
          }
        `}
      </style>
      <Header />

      <main className="flex-1 pt-16 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Custom Header Text (Top of page) */}
          <div className="text-center mb-20 mt-16">
            <h1 className="text-xl md:text-4xl font-extrabold text-center tracking-tight" style={{
              fontFamily: 'Slackey, cursive',
              color: '#2C5272'
            }}>
              Get the official Knowsy game,<br />
              merchandise and game accessories
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mx-auto items-start">

            {/* 1. Product Image Column (Left) */}
            <div className="order-1 lg:order-1 lg:col-span-2">
              <div className="aspect-[4/3] flex items-start justify-center rounded-3xl overflow-hidden">
                <img
                  src={productImage} // Dynamic image source
                  alt={product.name}
                  className="w-full h-full object-cover rounded-3xl"
                  style={{ transform: 'scale(1.1) translateX(-5%)' }}
                />
              </div>
            </div>

            {/* 2. Product Details & Action Panel (Right) */}
            <div className="order-2 lg:order-2 space-y-4 pt-4 sm:pt-8">
              
              {/* Product Title and Description */}
              <div className="space-y-1">
                {/* Category Badge and Rating on mobile */}
                <div className="flex justify-between items-center sm:hidden">
                  <Badge className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ffdd22', color: 'black', fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}>
                    Game
                  </Badge>
                  <div className="flex items-center gap-1 text-base font-bold" style={{ fontFamily: 'Avenir Next', fontWeight: 400, color: '#000000' }}>
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span>{product.rating}</span>
                  </div>
                </div>

                {/* Category Badge on larger screens */}
                <div className="hidden sm:block">
                  <Badge className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ffdd22', color: 'black', fontFamily: 'Avenir Next, sans-serif', fontWeight: 400 }}>
                    Game
                  </Badge>
                </div>

                {/* Product Name */}
                <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'Slackey', fontWeight: 400, color: '#000000' }}>
                  {product.name}
                </h2>

                {/* Rating on larger screens */}
                <div className="hidden sm:flex items-center gap-1 text-base font-bold pb-2" style={{ fontFamily: 'Avenir Next', fontWeight: 400, color: '#000000' }}>
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span>{product.rating}</span>
                </div>
                
                {/* Short Description */}
                <p className="text-base" style={{ fontFamily: 'AnnieUseYourTelescope', fontWeight: 400, color: '#000000' }}>
                  {product.description}
                </p>
              </div>

              {/* --- Action Panel (Price, Quantity, Add to Cart) --- */}
              <div className="p-5 rounded-2xl space-y-4 bg-[#E1F1FF]">

                {/* Mobile: Price and Quantity in row */}
                <div className="flex justify-between items-center sm:hidden">
                  <div className="text-2xl font-extrabold text-gray-900 mt-2 mb-2" style={{ fontFamily: 'Slackey, cursive' }}>
                    ${product.price.toFixed(2)}
                  </div>
                  <div
                    className="flex items-center px-4 py-2 rounded-2xl"
                    style={{ backgroundColor: '#D9D9D9' }}
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-3xl bg-white">
                      <button
                        className="text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'Slackey, cursive', fontWeight: 400, color: '#000000' }}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                
                      <span className="text-base" style={{ fontFamily: 'Slackey, cursive', fontWeight: 400, color: '#000000' }}>{quantity}</span>
                
                      <button
                        className="text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'Slackey, cursive', fontWeight: 400, color: '#000000' }}
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button for mobile */}
                <div className="sm:hidden mt-4">
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-3xl text-lg font-bold text-black transition-all"
                    style={{ backgroundColor: '#FCC804', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', fontFamily: 'Slackey, cursive' }}
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                  >
                    {isAvailable ? t("storeItem.addToCart") : t("storeItem.outOfStock")}
                  </Button>
                </div>

                {/* Quantity Selector & Add to Cart for larger screens */}
                <div className="hidden sm:flex sm:flex-col sm:gap-4">

                  {/* Price */}
                  <div className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Slackey, cursive' }}>
                    ${product.price.toFixed(2)}
                  </div>

{/* Quantity Selector Container */}
<div className="flex items-center w-full max-w-[280px]">
  <div 
    className="flex items-center w-full overflow-hidden" // overflow-hidden ensures the white part clips to the pill shape
    style={{
      backgroundColor: "#D9D9D9", // The grey color from your image
      borderRadius: "100px", // High value for perfect semi-circles
      height: "60px" // Fixed height to match the proportion
    }}
  >
    {/* LEFT SIDE - "Quantity" Label */}
    <div className="flex-1 px-8">
      <span 
        className="text-2xl" // Large size for the handwritten font
        style={{ 
          fontFamily: "'Annie Use Your Telescope', cursive", 
          color: "#000000" 
        }}
      >
        Quantity
      </span>
    </div>

    {/* RIGHT SIDE - The White Counter Section */}
    <div
      className="flex items-center justify-center gap-x-6 bg-white h-full px-8"
      style={{
        width: "50%", // Takes up exactly half the container
        borderTopLeftRadius: "100px", // The rounded curve on the inner left side
        borderBottomLeftRadius: "100px",
      }}
    >
      <button
        className="text-xl cursor-pointer hover:opacity-60 transition-opacity"
        style={{ fontFamily: 'Slackey, cursive', color: '#000000' }}
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
      >
        —
      </button>

      <span 
        className="text-xl" 
        style={{ fontFamily: 'Slackey, cursive', color: '#000000' }}
      >
        {quantity}
      </span>

      <button
        className="text-xl cursor-pointer hover:opacity-60 transition-opacity"
        style={{ fontFamily: 'Slackey, cursive', color: '#000000' }}
        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
        disabled={quantity >= product.stock}
      >
        +
      </button>
    </div>
  </div>
</div>

                  {/* Add to Cart Button */}
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-3xl text-lg font-bold text-black transition-all"
                    style={{ backgroundColor: '#FCC804', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', fontFamily: 'Slackey, cursive' }}
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                  >
                    {isAvailable ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>

              </div>
              {/* --- End Action Panel --- */}

              {/* Collapsible Sections */}
              <div className="mt-6">
                <div className="border-t border-gray-400">
                  <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        className="w-full flex justify-between py-3 text-lg"
                        style={{ fontFamily: 'Annie Use Your Telescope, cursive', color: '#000000' }}
                      >
                        <div className="flex items-center gap-2">
                          <img src={HeartIcon} className="w-5 h-5" />
                          <span>{t("storeItem.productDetails")}</span>
                        </div>
                        {isDetailsOpen ? <Minus /> : <Plus />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <p className="text-gray-600 pb-3 pt-2" style={{ fontFamily: 'Annie Use Your Telescope, cursive', color: '#000000' }}>{product.description}</p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="border-t border-gray-400">
                  <Collapsible open={isShippingOpen} onOpenChange={setIsShippingOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        className="w-full flex justify-between py-3 text-lg"
                        style={{ fontFamily: 'Annie Use Your Telescope, cursive', color: '#000000' }}
                      >
                        <div className="flex items-center gap-2">
                          <img src={TruckIcon} className="w-5 h-5" />
                          <span>{t("storeItem.shipping")}</span>
                        </div>
                        {isShippingOpen ? <Minus /> : <Plus />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <p className="text-gray-600 text-sm pb-3 pt-2" style={{ fontFamily: 'Annie Use Your Telescope, cursive', color: '#000000' }}>{t("storeItem.shipping")}</p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="border-t border-b border-gray-400 mb-8">
                  <button className="w-full flex items-center text-gray-600 gap-2 py-3" style={{ fontFamily: 'Annie Use Your Telescope, cursive', color: '#000000' }}>
                    <img src={ShareIcon} className="w-5" /> Share
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* --- Related Products Section (Dynamically Loaded) --- */}
          <div className="mt-12 sm:mt-8">
            <h2 className={`text-2xl sm:text-3xl ${BOLD_TEXT_CLASS} mb-10 text-center`} style={{ color: '#2C5272' }}>
              Related Products
            </h2>
            {/* Horizontal scrolling on mobile/tablet, grid on larger screens */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:justify-center lg:max-w-xl lg:mx-auto flex flex-row overflow-x-auto gap-4 lg:pb-0 pt-4">
              {relatedProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-64 lg:w-auto">
                  <KnowsyRelatedProductCard
                    product={product}
                    productImage={product.image_url}
                  />
                </div>
              ))}
            </div>
            {relatedProducts.length === 0 && !loading && (
              <p className="text-center text-gray-500 mt-4">No related products found.</p>
            )}
          </div>
          {/* --- End Related Products Section --- */}

        </div>
      </main>

      <NewsletterSection />

      <Footer />
    </div>
  );
};

export default StoreItem;