# Security

Report suspected vulnerabilities privately to a Harvard University RP maintainer through an established project contact. Include the affected version, impact and reproduction steps with synthetic data and redacted credentials.

Treat Vite environment values as public. Keep tokens, private keys and personal data out of source, browser storage, fixtures and logs. Local environment files are ignored by Git. The site stores the user's theme preference in browser storage.

The current API integration only checks liveness and sends requests without credentials. The service validates the response and returns safe error messages with an optional request ID. Authentication and authorization require their own reviewed design before connecting any user data.
