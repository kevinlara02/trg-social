// Public data-deletion instructions (no login) — required for Meta App Review.
// URL: https://trg-socialmedia.netlify.app/data-deletion
const CONTACT = "kevin@toastrestaurantgroup.com";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-accent-500 font-semibold tracking-widest text-xs uppercase">
          Toast Restaurant Group
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Data Deletion Instructions
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
          <p>
            The TRG Social application is an internal tool that TRG uses to manage
            its own Facebook Pages and Instagram accounts. We do not create
            consumer accounts and we store only the data needed to read and reply
            to messages, comments, and reviews on our own accounts.
          </p>
          <p>
            If you have contacted one of our restaurant Pages and would like the
            data associated with that interaction deleted from our systems, you
            can request it in one of two ways:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Email{" "}
              <a href={`mailto:${CONTACT}`} className="text-accent-500">
                {CONTACT}
              </a>{" "}
              with the subject &ldquo;Data Deletion Request&rdquo; and include the
              Facebook or Instagram name/handle you used to contact us.
            </li>
            <li>
              Send a message to the restaurant Page you contacted asking us to
              delete your data.
            </li>
          </ol>
          <p>
            We will verify the request and delete the associated cached message,
            comment, or review data from our systems, typically within 30 days.
            Note that the original message may still exist within Facebook or
            Instagram themselves; those can be removed through Meta&rsquo;s own
            settings.
          </p>
          <div className="border-t border-zinc-800 pt-6 text-xs text-zinc-500">
            Contact:{" "}
            <a href={`mailto:${CONTACT}`} className="text-accent-500">
              {CONTACT}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
