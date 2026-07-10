// Public privacy policy (no login) — required for the Meta App Review.
// URL: https://trg-socialmedia.netlify.app/privacy
const UPDATED = "July 10, 2026";
const CONTACT = "kevin@toastrestaurantgroup.com";

function LegalShell({ title, children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-8">
          <p className="text-accent-500 font-semibold tracking-widest text-xs uppercase">
            Toast Restaurant Group
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Last updated: {UPDATED}</p>
        </div>
        <div className="space-y-6 text-sm leading-relaxed text-zinc-300">
          {children}
        </div>
        <div className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          Toast Restaurant Group · Contact:{" "}
          <a href={`mailto:${CONTACT}`} className="text-accent-500">
            {CONTACT}
          </a>
        </div>
      </div>
    </div>
  );
}

function H2({ children }) {
  return <h2 className="text-lg font-semibold text-white pt-2">{children}</h2>;
}

export default function Privacy() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        This Privacy Policy explains how Toast Restaurant Group (&ldquo;TRG&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects
        information in connection with the TRG Social internal application
        (the &ldquo;App&rdquo;). The App is a private, internal tool used only by
        authorized TRG staff to manage the social media presence, reviews, and
        customer messages of our restaurant locations. It is not offered to the
        public and has no consumer sign-ups.
      </p>

      <H2>Information we access</H2>
      <p>
        With the permission of the account owner, the App connects to our own
        Facebook Pages and Instagram Business accounts through the Meta APIs and
        may access:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Page and Instagram account details (name, ID, follower and insight metrics).</li>
        <li>Comments and reviews left on our Pages and posts.</li>
        <li>
          Direct messages (Facebook Messenger and Instagram Direct) sent to our
          Pages, including the message content and the sender&rsquo;s public
          name and profile identifier, so our team can read and reply.
        </li>
        <li>Content we publish or schedule from the App to our own accounts.</li>
      </ul>
      <p>
        We only access accounts that TRG owns and is authorized to manage. We do
        not access the private profiles, friend lists, or personal data of any
        person beyond what they voluntarily send to our Pages.
      </p>

      <H2>How we use the information</H2>
      <ul className="list-disc pl-6 space-y-1">
        <li>To display incoming reviews, comments, and messages in one internal dashboard.</li>
        <li>To let authorized staff reply to customers in a timely, consistent way.</li>
        <li>To publish and schedule posts to our own accounts.</li>
        <li>To show aggregate performance metrics (followers, reach, ratings) to our team.</li>
      </ul>
      <p>
        We do not sell, rent, or share this information with third parties, and
        we do not use it for advertising or profiling. Data is used solely to
        operate our own restaurant accounts.
      </p>

      <H2>Storage and security</H2>
      <p>
        Access tokens are stored securely on the server side (environment
        variables and a restricted database table) and are never exposed to the
        browser or shared. Application data is hosted on Supabase and Netlify.
        Access to the App is limited to authenticated TRG staff.
      </p>

      <H2>Data retention</H2>
      <p>
        Messages, comments, and reviews are retrieved live from Meta for display
        and are cached only briefly to improve performance. We keep only what is
        needed to operate the App and remove data that is no longer required.
      </p>

      <H2>Data deletion</H2>
      <p>
        To request deletion of any data associated with your interactions with
        our Pages, email{" "}
        <a href={`mailto:${CONTACT}`} className="text-accent-500">{CONTACT}</a>{" "}
        or see our{" "}
        <a href="/data-deletion" className="text-accent-500">
          Data Deletion Instructions
        </a>
        . We will process the request promptly.
      </p>

      <H2>Changes</H2>
      <p>
        We may update this policy from time to time. The &ldquo;Last updated&rdquo;
        date above reflects the latest revision.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about this policy or your data can be sent to{" "}
        <a href={`mailto:${CONTACT}`} className="text-accent-500">{CONTACT}</a>.
      </p>
    </LegalShell>
  );
}
