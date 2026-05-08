#!/bin/sh
set -eu

PORT_VALUE="${PORT:-10000}"

exec php -d variables_order=EGPCS -S "0.0.0.0:${PORT_VALUE}" -t /var/www/html /var/www/html/router.php
