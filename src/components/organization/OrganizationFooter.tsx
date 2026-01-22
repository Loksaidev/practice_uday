import knowsyLogo from "@/assets/knowsy-logo.png";
import { useTranslation } from "react-i18next";

interface OrganizationFooterProps {
  primaryColor?: string;
}

const OrganizationFooter = ({ primaryColor }: OrganizationFooterProps) => {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-muted/30 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>{t('footer.poweredBy', { ns: 'organization' })}</span>
          <a
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={knowsyLogo} alt="Knowsy" className="h-6 w-auto" />
            <span
              className="font-semibold"
              style={{ color: primaryColor || 'hsl(var(--knowsy-blue))' }}
            >
              Knowsy
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default OrganizationFooter;
