FROM php:8.2-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql
RUN a2enmod rewrite
RUN printf '%s\n' \
    '<Directory /var/www/html>' \
    '    AllowOverride All' \
    '    Require all granted' \
    '</Directory>' \
    'DirectoryIndex index.php' \
    > /etc/apache2/conf-available/darcan.conf \
    && a2enconf darcan

COPY . /var/www/html/
