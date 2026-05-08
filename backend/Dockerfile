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
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chown -R www-data:www-data /var/www/html
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
