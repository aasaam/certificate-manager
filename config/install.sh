#!/bin/bash
sudo mkdir /usr/share/ca-certificates/extra
sudo cp root-ca.crt /usr/local/share/ca-certificates/PROVIDER_NAME.crt
sudo update-ca-certificates
