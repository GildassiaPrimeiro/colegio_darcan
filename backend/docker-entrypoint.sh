#!/bin/sh
set -eu

APACHE_PORT="${PORT:-80}"

sed -ri "s/^Listen 80$/Listen ${APACHE_PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \\*:80>/<VirtualHost *:${APACHE_PORT}>/" /etc/apache2/sites-available/000-default.conf

if ! grep -q '^ServerName ' /etc/apache2/apache2.conf; then
    printf '\nServerName localhost\n' >> /etc/apache2/apache2.conf
fi

exec apache2-foreground
