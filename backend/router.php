<?php

declare(strict_types=1);

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
$documentRoot = __DIR__;
$target = realpath($documentRoot . $path);

if ($target !== false && str_starts_with($target, $documentRoot) && is_file($target)) {
    return false;
}

require __DIR__ . '/index.php';
