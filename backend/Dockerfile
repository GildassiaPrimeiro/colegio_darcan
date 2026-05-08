FROM php:8.2-apache

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends $PHPIZE_DEPS ca-certificates \
    && pecl install redis \
    && docker-php-ext-install pdo pdo_mysql mysqli opcache \
    && docker-php-ext-enable redis opcache \
    && a2enmod rewrite \
    && apt-get purge -y --auto-remove $PHPIZE_DEPS \
    && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html/
COPY php/conf.d/ /usr/local/etc/php/conf.d/

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
