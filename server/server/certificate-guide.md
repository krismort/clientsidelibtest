# Import security certificate (Chrome on MacOS)

1. Go to [Chrome Settings][1]
2. (Search for and) click **Manage Certificates...**
3. Click **System** to highlight it
4. Click **+**
5. Choose and add **server/keys/certificate.pem** (will probably require Mac password)
6. Test: Make sure the mock server is running and go to [https://localhost:8443/][2]

[1]: chrome://settings/ "Chrome Settings"
[2]: https://localhost:8443/ "https://localhost:8443/"

# Create security certificate (MacOS)

1. Open terminal and run:
2. *openssl genrsa 1024 > private.key*
3. *openssl req -new -key private.key -out cert.csr*
4. *openssl x509 -req -in cert.csr -signkey private.key -out certificate.pem*
