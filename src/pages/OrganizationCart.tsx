import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";
import { tOrg } from "@/utils/translation";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

const OrganizationCart = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
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
      setLoading(false);
    };

    fetchOrganization();
  }, [slug, navigate]);

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


  if (loading || !organization) {
    return <div className="flex items-center justify-center min-h-screen">{i18n.t('org.loading', { ns: 'nest-egg', defaultValue: 'Loading...' })}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: organization.font_family }}>
      <OrganizationHeader organization={organization} />

      <main className="flex-1 container mx-auto px-4 py-12 mt-16">
        <h1 className="text-4xl font-bold mb-8" style={{ color: organization.primary_color }}>
          {tOrg('org.shoppingCart', 'Shopping Cart', organization.id, organization.slug)}
        </h1>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">{tOrg('org.cartEmpty', 'Your cart is empty', organization.id, organization.slug)}</h2>
            <p className="text-muted-foreground mb-6">
              {tOrg('org.addItemsToStart', 'Add some items from the store to get started', organization.id, organization.slug)}
            </p>
            <Button
              onClick={() => navigate(`/org/${slug}/store`)}
              style={{ backgroundColor: organization.primary_color }}
              className="text-white"
            >
              {tOrg('org.continueShopping', 'Continue Shopping', organization.id, organization.slug)}
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex gap-6">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="px-4 font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold" style={{ color: organization.primary_color }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-6">
                <h2 className="text-2xl font-bold mb-6">{tOrg('org.orderSummary', 'Order Summary', organization.id, organization.slug)}</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tOrg('org.subtotal', 'Subtotal', organization.id, organization.slug)}</span>
                    <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tOrg('org.shipping', 'Shipping', organization.id, organization.slug)}</span>
                    <span className="font-semibold">$10.00</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="text-xl font-bold">{tOrg('org.total', 'Total', organization.id, organization.slug)}</span>
                    <span className="text-xl font-bold" style={{ color: organization.primary_color }}>
                      ${(totalPrice + 10).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full text-white mb-4"
                  size="lg"
                  style={{ backgroundColor: organization.primary_color }}
                  disabled
                >
                  {tOrg('org.checkoutComingSoon', 'Checkout Coming Soon', organization.id, organization.slug)}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/org/${slug}/store`)}
                >
                  {tOrg('org.continueShopping', 'Continue Shopping', organization.id, organization.slug)}
                </Button>
              </Card>
            </div>
          </div>
        )}
      </main>

      <OrganizationFooter primaryColor={organization.primary_color} />
    </div>
  );
};

export default OrganizationCart;
