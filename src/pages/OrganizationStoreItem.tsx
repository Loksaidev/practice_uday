import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { loadOrgTranslations } from "@/i18n/config";
import { tOrg } from "@/utils/translation";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

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
}

const OrganizationStoreItem = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .single();

      if (orgError || !orgData) {
        navigate("/");
        return;
      }

      setOrganization(orgData);

      // Load organization-specific translations
      await loadOrgTranslations(orgData.id, orgData.slug, i18n.language);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("org_store_items")
        .select("*")
        .eq("id", id)
        .eq("organization_id", orgData.id)
        .single();

      if (productError || !productData) {
        navigate(`/org/${slug}/store`);
        return;
      }

      setProduct(productData);
      setLoading(false);
    };

    fetchData();
  }, [slug, id, navigate]);

  useEffect(() => {
    // Load custom Google Font if specified
    if (organization?.font_family && organization.font_family !== 'Roboto') {
      const fontName = organization.font_family.replace(/\s+/g, '+');
      const linkId = `google-font-${fontName}`;
      let link = document.getElementById(linkId) as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;700&display=swap`;
        document.head.appendChild(link);
      }
    }

    // Set CSS variables
    if (organization?.primary_color) {
      document.documentElement.style.setProperty('--org-primary', organization.primary_color);
    }
    if (organization?.secondary_color) {
      document.documentElement.style.setProperty('--org-secondary', organization.secondary_color);
    }
    if (organization?.font_family) {
      document.documentElement.style.setProperty('--org-font', organization.font_family);
    }
  }, [organization]);


  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image_url,
      });
    }
    
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
  };

  if (loading || !organization || !product) {
    return <div className="flex items-center justify-center min-h-screen">Loading product...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: organization.font_family }}>
      <OrganizationHeader organization={organization} />

      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <Button
          variant="ghost"
          onClick={() => navigate(`/org/${slug}/store`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square relative overflow-hidden rounded-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{tOrg(`services.${product.id}.title`, product.name, organization.id, organization.slug)}</h1>
              <p className="text-sm text-muted-foreground mb-4">{product.category}</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.rating} rating)
                </span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{tOrg(`services.${product.id}.description`, product.description, organization.id, organization.slug)}</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold" style={{ color: organization.primary_color }}>
                  ${product.price}
                </span>
                <span className={`text-lg ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-6 font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 text-white"
                  style={{ backgroundColor: organization.primary_color }}
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Product Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• High-quality materials</li>
                <li>• Official {organization.name} merchandise</li>
                <li>• Fast shipping</li>
                <li>• 30-day return policy</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>

      <OrganizationFooter primaryColor={organization.primary_color} />
    </div>
  );
};

export default OrganizationStoreItem;
