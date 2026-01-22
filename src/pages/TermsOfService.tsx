import { X } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading">Terms of Service</h1>
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
            <h2 className="text-xl font-heading text-foreground mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Knowsy platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">2. Use License</h2>
            <p className="mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on Knowsy for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>Violate any applicable laws or regulations related to access to or use of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">3. Disclaimer</h2>
            <p>
              The materials on Knowsy are provided on an 'as is' basis. Knowsy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">4. Limitations</h2>
            <p>
              In no event shall Knowsy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Knowsy, even if Knowsy or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Knowsy could include technical, typographical, or photographic errors. Knowsy does not warrant that any of the materials on its website are accurate, complete, or current. Knowsy may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">6. Links</h2>
            <p>
              Knowsy has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Knowsy of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">7. Modifications</h2>
            <p>
              Knowsy may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Knowsy operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">9. User Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Harass, abuse, or threaten other users</li>
              <li>Post or transmit obscene, profane, or abusive content</li>
              <li>Engage in any form of cheating or exploitation of the Service</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the normal operation of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading text-foreground mb-3">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:support.knowsy@luverly.shop" className="text-primary hover:underline">support.knowsy@luverly.shop</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;