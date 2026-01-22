import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, ShoppingCart } from "lucide-react";
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

const OrganizationStore = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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

      // Fetch products
      const { data: productsData } = await supabase
        .from("org_store_items")
        .select("*")
        .eq("organization_id", orgData.id)
        .order("featured", { ascending: false });

      setProducts(productsData || []);
      setLoading(false);
    };

    fetchData();
  }, [slug, navigate, i18n.language]);

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


  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image_url,
    });
    toast({
      title: tOrg('org.addedToCart', 'Added to cart', organization.id, organization.slug),
      description: `${product.name} ${tOrg('org.hasBeenAddedToCart', 'has been added to your cart.', organization.id, organization.slug)}`,
    });
  };

  if (loading || !organization) {
    return <div className="flex items-center justify-center min-h-screen">{i18n.t('org.loading', { ns: 'nest-egg', defaultValue: 'Loading...' })}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: organization.font_family }}>
      <OrganizationHeader organization={organization} />

      <main className="flex-1 container mx-auto px-4 py-12 mt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: organization.primary_color }}>
            {tOrg('org.name', organization.name, organization.id, organization.slug)} {tOrg('org.store', 'Store', organization.id, organization.slug)}
          </h1>
          <p className="text-muted-foreground text-lg">
            {tOrg('org.officialMerchandise', 'Official merchandise and game products', organization.id, organization.slug)}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">{tOrg('org.noProductsAvailable', 'No products available yet', organization.id, organization.slug)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/org/${slug}/store/${product.id}`)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.featured && (
                    <span className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {tOrg('org.featured', 'Featured', organization.id, organization.slug)}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-xl mb-2">{tOrg(`services.${product.id}.title`, product.name, organization.id, organization.slug)}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {tOrg(`services.${product.id}.description`, product.description, organization.id, organization.slug)}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold" style={{ color: organization.primary_color }}>
                      ${product.price}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} ${tOrg('org.inStock', 'in stock', organization.id, organization.slug)}` : tOrg('org.outOfStock', 'Out of stock', organization.id, organization.slug)}
                    </span>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock === 0}
                      style={{ backgroundColor: organization.primary_color }}
                      className="text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {tOrg('org.addToCart', 'Add to Cart', organization.id, organization.slug)}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <OrganizationFooter primaryColor={organization.primary_color} />
    </div>
  );
};

export default OrganizationStore;
