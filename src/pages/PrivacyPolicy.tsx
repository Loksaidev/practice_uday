import { X } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading">Privacy Policy</h1>
          <Link
            to="/"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </Link>
        </div>

        {/* Content */}
        <div className="font-body text-sm space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">1. Introduction</h2>
            <p>
              Welcome to Knowsy ("we," "us," "our," or "Company"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you provide directly.</li>
              <li><strong>Account Information:</strong> Username, password, profile information, and preferences.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our services, including game statistics, playtime, and preferences.</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, and IP address.</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar tracking technologies to enhance your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">3. Use of Your Information</h2>
            <p className="mb-3">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the site to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Create and manage your account</li>
              <li>Process your transactions and send related information</li>
              <li>Email you regarding your account or order</li>
              <li>Fulfill and manage purchases, orders, payments, and other transactions related to our services</li>
              <li>Generate a personal profile about you so that future visits to our site will be personalized</li>
              <li>Increase the efficiency and operation of our site</li>
              <li>Monitor and analyze usage and trends to improve your experience with our site</li>
              <li>Notify you of updates to our services</li>
              <li>Offer new products, services, and/or recommendations to you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">4. Disclosure of Your Information</h2>
            <p className="mb-3">We may share information we have collected about you in certain situations:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information is necessary to comply with the law.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">5. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to protect your personal information. However, perfect security does not exist on the Internet. You are responsible for maintaining the confidentiality of your account information and password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">6. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline">support.knowsy@luverly.shop</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">7. Changes to This Privacy Policy</h2>
            <p>
              We reserve the right to modify this privacy policy at any time. Changes and clarifications will take effect immediately upon their posting to the website. If we make material changes to this policy, we will notify you here that it has been updated, so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;