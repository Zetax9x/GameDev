/**
 * Personal settings shown on the public site.
 * Set a link to null to hide it.
 */
export const SITE_CONFIG = {
  author: 'Yuri Squarcia',
  links: {
    github: null as string | null, // e.g. 'https://github.com/username'
    itch: null as string | null, // e.g. 'https://username.itch.io'
    linkedin: null as string | null, // e.g. 'https://www.linkedin.com/in/username'
  },
  /**
   * Public contact email, split in two parts so it never appears as plain text in the HTML
   * (it's reassembled on click). Leave null to hide it.
   */
  contactEmail: null as { user: string; domain: string } | null,
  /** Mention the 118 job on the About page (open question for Yuri). */
  showJob: false,
  /** Path of the English CV in /public, when available (e.g. '/cv-yuri-squarcia.pdf'). */
  cvPath: null as string | null,
};
