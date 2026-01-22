import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Link as LinkIcon, Palette, Type } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  background_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  require_login: boolean;
  status: string;
  custom_content: string | null;
  enable_popup: boolean;
  popup_description: string | null;
}

interface OrganizationOverviewProps {
  organization: Organization;
}

const OrganizationOverview = ({ organization }: OrganizationOverviewProps) => {
  const orgUrl = `${window.location.origin}/org/${organization.slug}`;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-lg font-medium">{organization.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p>{organization.description || "No description provided"}</p>
          </div>

          {/* <div>
            <p className="text-sm text-muted-foreground">Custom Content</p>
            <p>{organization.custom_content || "No custom content provided"}</p>
          </div> */}

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              variant={
                organization.status === "approved"
                  ? "default"
                  : organization.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {organization.status}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Organization URL
            </p>
            <a
              href={orgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {orgUrl}
            </a>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Require Login</p>
            <Badge variant={organization.require_login ? "default" : "secondary"}>
              {organization.require_login ? "Yes" : "No"}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Enable Pop-up</p>
            <Badge variant={organization.enable_popup ? "default" : "secondary"}>
              {organization.enable_popup ? "Yes" : "No"}
            </Badge>
          </div>

          {organization.enable_popup && organization.popup_description && (
            <div>
              <p className="text-sm text-muted-foreground">Pop-up Message</p>
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: organization.popup_description }} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Current Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {organization.logo_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Logo</p>
              <img
                src={organization.logo_url}
                alt={`${organization.name} logo`}
                className="h-16 object-contain"
              />
            </div>
          )}

          {organization.background_image_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Background Image</p>
              <img
                src={organization.background_image_url}
                alt={`${organization.name} background`}
                className="h-48 w-full object-contain rounded border"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Primary Color</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border"
                  style={{ backgroundColor: organization.primary_color }}
                />
                <span className="font-mono text-sm">{organization.primary_color}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Secondary Color</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border"
                  style={{ backgroundColor: organization.secondary_color }}
                />
                <span className="font-mono text-sm">{organization.secondary_color}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Family
            </p>
            <p className="text-lg" style={{ fontFamily: organization.font_family }}>
              {organization.font_family}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationOverview;