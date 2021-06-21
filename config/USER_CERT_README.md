# Client Certificate by **INTERMEDIATE_NAME**

Hello **CLIENT_NAME** (CLIENT_EMAIL)

* This documentation is **SECRET classified**.
* This document generate by **PROVIDER_NAME** for you.
* You must trust **PROVIDER_NAME** root certificate authority. for accept this chain of trust.

## Installation

Please follow these steps:

1. Install root ca

    * Import `root-ca.pem` into your browser. _(This step is require once if you're already imported root certificate there is no need for import it again._

    * Import `root-ca.crt` into your operating system. _(This step is require once if you're already imported root certificate there is no need for import it again.)_

        On Debian/Ubuntu run **install.sh**.

        On Microsoft windows right click on **install.ps1** or **install.bat** and click **Run As Administrator**

1. Install client certificate `client.p12` into your browser and type password. _(This step is require every time you get new certificate for your service.)_

## Files

This is list of files you will need to use **PROVIDER_NAME** services.

| File            |                                  Description |
| :-------------- | -------------------------------------------: |
| root-ca.pem     |        Root certificate of **PROVIDER_NAME** |
| root-ca.cer     |        Root certificate of **PROVIDER_NAME** |
| client.p12      |                 Your certificate bundle file |
| client-key.pem  |                 Your certificate private key |
| client.pem      |                  Your certificate public key |
| client.csr      |                     Your certificate request |
| csr-client.json |                Your certificate request JSON |
| README.md       |                              Markdown readme |
| README.pdf      |                                   PDF readme |
| client.info.txt |                      Certificate information |
| install.ps1     | Powershell installation for Root certificate |
| install.bat     |      Batch installation for Root certificate |
| install.sh      |      Shell installation for Root certificate |

For just basic usage just use **client.p12** and import into your browser.

## Change default password

Your default password generate is `PASSWORD`

You must generate new pkcs12 key using this command:

```txt
openssl pkcs12 -export -out client.p12 -in client.pem -inkey client-key.pem
```

You can import `client.p12` file into your browser.

Also you can generate multiple bundle for any users that you want with above command.

## Attention

* This files is for you and only you, keep these files in secure place and don't share with any one.
* You certificate will be expire on **EXPIRE_DATE**. before that request for new certificate.

## Notes

This document generate by **[PROVIDER_NAME](PROVIDER_WEBSITE)** on **DATE** for **CLIENT_NAME**.

* [PROVIDER_WEBSITE](PROVIDER_WEBSITE)
* [PROVIDER_TEL](tel:PROVIDER_TEL)
* [PROVIDER_EMAIL](mailto:PROVIDER_EMAIL)
