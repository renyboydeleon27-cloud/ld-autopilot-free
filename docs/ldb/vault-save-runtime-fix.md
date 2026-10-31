# Vault save runtime fix — 2026-10-31

User consent reached VAULT_SAVE but credentials were not persisted. Isolated Cloudflare probe v1 reproduced ERR_INVALID_ARG_VALUE during encryption: cipher.update received a string without inputEncoding. Local Node defaults did not reproduce this runtime behavior.

Fix commit 2baa452c008620aaf2134b67d08a51a70b5eab2e passes explicit UTF-8 Buffer bytes into AES-256-GCM. Ciphertext format and keys are unchanged. Regression test confirms Unicode round-trip and compatibility with existing ciphertext. 32 related Node tests passed.

Cloud probe v2 successfully encrypted, decrypted, saved and reread synthetic credentials in its own Durable Object; synthetic data was deleted on success and probe runtime access secret removed. No real Google credential was used in either probe.

Reviewed code updated ner-ldb-google-vault-quality while preserving all secret/plain bindings and its exact existing namespace. Live authenticated status returned googleConnected=false; fresh user consent is still required.

Evidence: https://ld-autopilot-free-c0e0yi8v6-renyboydeleon-5731.vercel.app/vault-fix.json (deployment dpl_FwHQ5D8PAj7QTqaNRGcwgWfFQxTN).

Stable preview alias restored to application deployment dpl_6G176AN2qaPbzNDajZqSrFPecJnc, which calls the patched vault. Sign-in endpoint verified HTTP302 to Google with stable callback. No Google Cloud URI or client secret change required. Production main app not merged or deployed; no Drive upload or Gmail send performed.
