<?php
$dsn = "pgsql:host=127.0.0.1;port=5432;dbname=reniec_asistencia";
$user = "postgres";
$pass = "postgres";
try {
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuario_sistema' ORDER BY ordinal_position");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($cols)) {
        echo "TABLE_NOT_FOUND\n";
    } else {
        foreach ($cols as $c) echo $c . "\n";
    }
} catch (Exception $e) {
    echo 'ERR: ' . $e->getMessage() . "\n";
}
?>